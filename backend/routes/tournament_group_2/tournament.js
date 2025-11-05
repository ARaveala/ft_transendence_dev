const { API_PROTOCOL } = require('@sharedApi');
const bcrypt = require('bcryptjs');
const { getUserIdFromToken } = require('../../security/security');


let _db;
const _wrap = (db) => ({
	run: (sql, params = []) => new Promise((res, rej) =>
		db.run(sql, params, function (err){
			if (err) return rej(err);
			else res({lastID: this.lastID, changes: this.changes});
		})
	),
	get: (sql, params = []) => new Promise((res, rej) =>
	db.get(sql, params, (e, row) => (e ? rej(e) : res(row || null)))
	),
	all: (sql, params = []) => new Promise((res, rej) =>
	db.all(sql, params, (e, rows) => (e ? rej(e) : res(rows || [])))
	),
	tx: async (fn) => {
		const run = (sql, p=[]) => _wrap(db).run(sql, p);
		await run('BEGIN');
		try{const r = await fn(); await run('COMMIT'); return r;}
		catch (e) {await run('ROLLBACK'); throw e;}
	}
});

module.exports = async function tournamentRoutes(fastify, options) {
	const {db, secure} = options;
	_db = db;
	const {run, get, all, tx} = _wrap(db);
	async function _fetchTournamentState(all, get, tid)
	{
		const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
		const players = await all(
			`SELECT tp.user_id AS userId, u.username, tp.alias, tp.role
				FROM tournament_players tp
				JOIN users u ON u.id = tp.user_id
			WHERE tp.tournament_id = ?
			ORDER BY tp.role ASC`,
			[tid]
		);
		return {id: t.id, status: t.status, players};
	}
	const requireUser = (request, reply) => {
		const token = request.cookies?.auth_token;
		if (!token) {reply.code(401).send({error: 'Not authenticated'}); return null;}
		try {return secure.getUserIdFromToken(token);}
		catch {reply.code(401).send({error: 'Invalid token'}); return null;}
	};
	fastify.get(API_PROTOCOL.GET_ACTIVE_TOURNAMENT.path, async (request, reply) => {
		const { db } = options;
		const { get, all } = _wrap(db);

		// auth cookie
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({ status: 'ERROR', error: 'Not authenticated' });

		let userId;
		try {
			userId = getUserIdFromToken(token); // returns a string id (UUID) per security.js
			if (!userId) throw new Error('Invalid token');
		} catch {
			return reply.code(401).send({ status: 'ERROR', error: 'Invalid auth token' });
		}

		// Find the most recent tournament the user is in (waiting or ongoing)
		const t = await get(
			`
			SELECT t.id, t.status
			FROM tournaments t
			JOIN tournament_players tp ON tp.tournament_id = t.id
			WHERE tp.user_id = ?
			AND t.status IN ('waiting','ongoing')
			ORDER BY t.id DESC
			LIMIT 1
			`,
			[userId]
		);

		// No active tournament
		if (!t) return reply.send({ status: 'OK', tournament: null });

		// Build a minimal state expected by the frontend
		const players = await all(
			`
			SELECT tp.user_id, tp.alias, tp.role, tp.verified,
				u.username, u.avatar_file AS avatar
			FROM tournament_players tp
			JOIN users u ON u.id = tp.user_id
			WHERE tp.tournament_id = ?
			ORDER BY tp.role ASC
			`,
			[t.id]
		);

		// Games double as bracket; order by round and position
		const games = await all(
			`
			SELECT id AS game_id, p1_id, p2_id, p1_score, p2_score, winner_id,
				round, bracket_pos, status
			FROM games
			WHERE tournament_id = ?
			ORDER BY round ASC, bracket_pos ASC
			`,
			[t.id]
		);

		// Coerce into the TournamentState shape the UI expects (compact but sufficient)
		const playersOut = players.map(p => ({
			username: p.username || '',
			alias: p.alias,
			status: t.status === 'waiting' ? (p.verified ? 'ready' : 'waiting') : 'playing',
			avatar: p.avatar || undefined,
			isSelf: p.user_id === userId,
			isVerified: !!p.verified,
			role: String(p.role),
		}));

		// Optional: basic bracket mapping
		const rounds = Math.max(0, ...games.map(g => g.round || 0));
		const bracket = rounds
			? Array.from({ length: rounds }, (_, r) =>
				games.filter(g => g.round === r + 1).map(g => ({
				match_id: String(g.game_id),
				player1: playersOut.find(p => p.role === '1' && p.username && p.username.length > 0) || playersOut[0] || null,
				player2: playersOut.find(p => p.role === '2' && p.username && p.username.length > 0) || playersOut[1] || null,
				winner:
					g.winner_id
					? players.find(p => p.user_id === g.winner_id)?.username || undefined
					: undefined,
				status: g.status,
				scorePlayer1: g.p1_score ?? 0,
				scorePlayer2: g.p2_score ?? 0,
				}))
			)
			: [];

		const response = {
			status: 'OK',
			tournament: {
			tournament_id: String(t.id),
			status: t.status,
			owner: players.find(p => p.role === 1)?.username || '',
			players: playersOut,
			bracket: bracket.length ? bracket : undefined,
			can_start: playersOut.length === 4 && playersOut.every(p => p.isVerified),
			pending_players: playersOut.filter(p => !p.isVerified).length,
			}
		};

		return reply.send(response);
		});
	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
		const {db} = options;
		const {run, get, all, tx} = _wrap(db);
		db.exec('PRAGMA foreign_keys = ON;');
		const token = request.cookies?.auth_token;
		if (token?.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);
		request.log.info({ hasCookie: !!token, tokenLen: token?.length }, 'pre-verify');
		if (!token) return reply.code(401).send({status: 'ERROR', error: 'Not authenticated'});
		let creatorId;
		try
		{
			creatorId = getUserIdFromToken(token);
		}
		catch (e)
		{
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		}
		const creator = await get(`SELECT id, username FROM users WHERE id = ?`, [creatorId]);
		if (!creator) return reply.code(401).send({status: 'ERROR', error: 'User no longer exists'});
		try
		{
			const result = await tx(async () => {
				const insT = await run(
					`INSERT INTO tournaments (status) VALUES ('waiting')`,
					[]
				);
				const tid = insT.lastID;
				await run(
					`INSERT INTO tournament_players (tournament_id, user_id, alias, role, verified)
					 VALUES (?, ?, 'alias', 1, 1)`,
					[tid, creatorId]
				);
				const t = await get(
					`SELECT id, status FROM tournaments WHERE id = ?`,
					[tid]);
				return {tid, t}; 
			});
			return reply.code(201).send({
				status: 'OK',
				tournament: {
					id: result.tid,
					status: result.t.status
				}
			});
		}
		catch (err)
		{
			const msg = String(err?.message || '');
			if (msg.includes('UNIQUE'))
				return reply.code(409).send({status: 'ERROR', error: 'Role already used'});
			fastify.log.error({err}, 'Create tournament failed');
			return reply.code(500).send({status: 'ERROR', error: 'Create tournament failed'});
		}
	});
	fastify.post(API_PROTOCOL.VERIFY_PLAYER.path, async (request, reply) => {
		db.exec('PRAGMA foreign_keys = ON;');
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({status: 'ERROR', error: 'Not authenticated'});
		let requesterId;
		try { requesterId = getUserIdFromToken(token); }
		catch { return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});}
		const tid = Number(request.params.id);
		const {alias, role, username, password} = request.body || {};
		const numericRole = Number(role);
		if (!Number.isFinite(tid))
			return reply.code(400).send({status: 'ERROR', error: 'Tournament ID is required'});
		if (!alias || typeof alias !== 'string')
			return reply.code(400).send({status: 'ERROR', error: 'Alias is required'});
		if (role == null)
			return reply.code(400).send({status: 'ERROR', error: 'Invalid role'});
		const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
		if (!t) return reply.code(404).send({status: 'ERROR', error: 'Tournament not found'});
		if (t.status !== 'waiting')
			return reply.code(400).send({status: 'ERROR', error: 'Tournament not joinable'});
		const host = await get(
			`SELECT user_id AS userId, alias FROM tournament_players WHERE tournament_id = ? AND role = 1`,
			[tid]
		);
		if (!host)
			return reply.code(409).send({status: 'ERROR', error: 'Tournament not initialized correctly'});
		const addOther = Boolean(password);
		if (!addOther)
		{
			if (role !== 1)
				return reply.code(400).send({status: 'ERROR', error: 'Host must be role must be 1'});
			if (requesterId !== host.userId)
				return reply.code(403).send({status: 'ERROR', error: 'Only host can update role 1 alias'});
			await run(
				`UPDATE tournament_players SET alias = ? WHERE tournament_id = ? AND role = 1`,
				[alias.trim(), tid]
			);
			const state = await _fetchTournamentState(all, get, tid);
			return reply.send({status: 'OK', tournament: state});
		}
		if (![2, 3, 4].includes(role))
			return reply.code(400).send({status: 'ERROR', error: 'Role must be 2-4'});
		if (!username)
			return reply.code(400).send({error: 'ERROR', error: 'Username is required'});
		const userRow = await get(
			`SELECT id, username, password FROM users WHERE username = ?`,
			[username]
		);
		if (!userRow) return reply.code(404).send({status: 'ERROR', error: 'User not found'});
		const ok = await bcrypt.compare(password, userRow.password);
		if (!ok) return reply.code(401).send({status: 'ERROR', error: 'Invalid credentials'});
		const dupe = await get(
			`SELECT 1 FROM tournament_players WHERE tournament_id = ? AND user_id = ?`,
			[tid, userRow.id]
		);
		if (dupe) return reply.code(409).send({status: 'ERROR', error: 'User already joined'});
		const usedRole = await get(
			`SELECT 1 FROM tournament_players WHERE tournament_id = ? AND role = ?`,
			[tid, role]
		);
		if (usedRole) return reply.code(409).send({status: 'ERROR', error: 'Role already taken'});
		const countRow = await get(
			`SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id = ?`,
			[tid]
		);
		if ((countRow?.c ?? 0) >= 4)
			return reply.code(409).send({status: 'ERROR', error: 'Tournament full'});
		await run(
			`INSERT INTO tournament_players (tournament_id, user_id, alias, role)
			 VALUES(?, ?, ?, ?)`,
			[tid, userRow.id, alias.trim(), role]
		);
		const state = await _fetchTournamentState(all, get, tid);
		return reply.code(200).send({status: 'OK', tournament: state});
	});

	fastify.post(API_PROTOCOL.START_TOURNAMENT.path, async (request, reply) => {
		const userId = requireUser(request, reply);
		if (!userId) return;

		const { db } = options;
		const { run, get, all, tx } = _wrap(db);

		// The path is /api/tournament/:id/start so use params.id
		const tid = Number(request.params.id);
		if (!Number.isInteger(tid)) {
			return reply.code(400).send({ status: 'ERROR', error: 'Invalid tournament id' });
		}

		try {
			await tx(async () => {
			const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
			if (!t) throw Object.assign(new Error('Tournament not found'), { statusCode: 404 });
			if (t.status !== 'waiting') {
				throw Object.assign(new Error('Tournament already started'), { statusCode: 409 });
			}
			const players = await all(
				`SELECT user_id, role FROM tournament_players
				WHERE tournament_id = ?
				ORDER BY role ASC`,
				[tid]
			);
			if (players.length !== 4) {
				throw Object.assign(new Error('Tournament requires exactly 4 players'), { statusCode: 409 });
			}

			const byRole = r => players.find(p => p.role === r)?.user_id;
			const s1 = byRole(1), s2 = byRole(2), s3 = byRole(3), s4 = byRole(4);
			if (!s1 || !s2 || !s3 || !s4) {
				throw Object.assign(new Error('Roles 1-4 must be unique'), { statusCode: 409 });
			}
			await run(
				`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
				VALUES (?, 1, 1, ?, ?, 'pending')`,
				[tid, s1, s4]
			);
			await run(
				`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
				VALUES (?, 1, 2, ?, ?, 'pending')`,
				[tid, s2, s3]
			);
			await run(
				`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
				VALUES (?, 2, 1, NULL, NULL, 'pending')`,
				[tid]
			);
			await run(`UPDATE tournaments SET status = 'ongoing' WHERE id = ?`, [tid]);
			});

			reply.send({ status: 'OK' });
		} catch (err) {
			reply.code(err.statusCode || 500).send({
			status: 'ERROR',
			error: err.message || 'Failed to start tournament'
			});
		}
	});
	// fastify.post(API_PROTOCOL.REPORT_GAME_RESULT.path, async (request, reply) => {
		// const userId = requireUser(request, reply);
		// if (!userId) return;

		// const { game_id, p1_score, p2_score } = request.body || {};
		// if (!game_id || typeof p1_score !== 'number' || typeof p2_score !== 'number') {
		// return reply.code(400).send({ status: 'ERROR', error: 'game_id, p1_score, p2_score required' });
		// }

		// try {
		// await tx(async () => {
		// 	const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
		// 	if (!g) throw Object.assign(new Error('Game not found'), { statusCode: 404 });
		// 	// store result
		// 	const winner = p1_score > p2_score ? g.p1_id : p2_score > p1_score ? g.p2_id : null;
		// 	await run(`UPDATE games
		// 				SET p1_score = ?, p2_score = ?, status = 'completed', winner_user_id = ?
		// 				WHERE id = ?`,
		// 			[p1_score, p2_score, winner, game_id]);
		// 	// if it was a semi, slot winner into final
		// 	if (g.round === 1) {
		// 	const final = await get(
		// 		`SELECT id, p1_id, p2_id FROM games WHERE tournament_id = ? AND round = 2 AND bracket_pos = 1`,
		// 		[g.tournament_id]
		// 	);
		// 	if (final) {
		// 		if (!final.p1_id) await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winner, final.id]);
		// 		else if (!final.p2_id) await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winner, final.id]);
		// 	}
		// 	}

		// 	if (g.round === 2)
		// 		await run(`UPDATE tournaments SET status = 'completed', winner_id = NULL WHERE id = ?`, [g.tournament_id]);

		// });

		// reply.send({ status: 'OK' });
		// } catch (err) {
		// const code = err.code && Number.isInteger(err.code) ? err.code : 500;
		// reply.code(code).send({ status: 'ERROR', error: err.message || 'Failed to report result' });
		// }
	// 	const userId = requireUser(request, reply);
	// 	if (!userId) return;
	// 	const {game_id, p1_score, p2_score} = request.body || {};
	// 	if (!game_id || typeof p1_score !== 'number' || typeof p2_score !== 'number')
	// 		return reply.code(400).send({status: 'ERROR', error: 'Game id, player 1 score and player 2 score required'});
	// });
};

function buildTournamentPlayerList(rows)
{
	const roles = ['player1', 'player2', 'player3', 'player4'];
	const byRole = Object.fromEntries((rows || []).map(r => [r.role, r]));
	return roles.map(role =>{
		const r = byRole[role];
		if (!r)
		{
			return {
				username: '',
				alias: '',
				avatar: undefined,
				score: 0,
				isSelf: false,
				isVerified: false,
				role
			};
		}
		return {
			username: r.username || '',
			alias: r.alias || '',
			avatar: r.avatarFile || r.avatar || undefined,
			score: typeof r.player_score === 'number' ? r.player_score : 0,
			isSelf: r.role === 1 ? true : false || false,
			isVerified: false,
			role
		};
	});
}

function rowToMatch(row)
{
	if (!row) return null;
	const p1 = {
		username: row.p1_username,
		alias: row.alias,
		avatar: row.avatarFile || indefined,
    	score: 0,
    score: typeof row.score_p1 === 'number' ? row.score_p1 : undefined,
    isSelf: false,
    isVerified: false,
    role: 'player1'
  };

  const p2 = {
    username: row.p2_username || '',
    alias: row.p2_alias || '',
    status: 'waiting',
    avatar: row.p2_avatar || undefined,
    score: typeof row.score_p2 === 'number' ? row.score_p2 : undefined,
    isSelf: false,
    isVerified: false,
    role: 'player2'
  };

  const score = (typeof row.score_p1 === 'number' || typeof row.score_p2 === 'number')
    ? { player1: row.score_p1 ?? 0, player2: row.score_p2 ?? 0 }
    : undefined;

  return {
    match_id: String(row.match_id ?? row.id ?? ''),
    player1: p1,
    player2: p2,
    winner: row.winner || undefined,
    score,
    status: coerceMatchStatus(row.status)
  };
}

function mapBrackets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(round =>
    Array.isArray(round)
      ? round.map(row => rowToMatch(row)).map(m => m || {
          match_id: '',
          player1: { username: '', alias: '', status: 'waiting', role: 'player1' },
          player2: { username: '', alias: '', status: 'waiting', role: 'player2' },
          status: 'pending'
        })
      : []
  );
}

// Build the 4 lobby slots. We base player status on tournament status + live games.
function buildTournamentPlayerList(playersRows, tourStatus, gameRows) {
  const roles = [1, 2, 3, 4];
  const byRole = Object.fromEntries((playersRows || []).map(r => [r.role, r]));

  // quick set for ongoing players
  const ongoingSet = new Set();
  for (const g of gameRows || []) {
    if (String(g.status).toLowerCase() === 'ongoing') {
      if (g.p1_id) ongoingSet.add(g.p1_id);
      if (g.p2_id) ongoingSet.add(g.p2_id);
    }
  }

  return roles.map(n => {
    const r = byRole[n];
    if (!r) {
      return {
        username: '',
        alias: '',
        status: 'waiting',
        avatar: undefined,
        score: 0,
        isSelf: false,
        isVerified: false,
        role: `player${n}`
      };
    }

    let status = 'waiting';
    const t = coerceTournamentStatus(tourStatus);
    if (t === 'waiting') status = 'ready';
    if (t === 'ongoing' && ongoingSet.has(r.user_id)) status = 'playing';
    if (t === 'finished') status = 'finished';

    return {
      username: r.username || '',
      alias: r.alias || '',
      status,
      avatar: r.avatar || undefined,
      score: 0,
      isSelf: n === 1,                // owner = role 1 in this schema
      isVerified: !!r.verified,
      role: `player${n}`
    };
  });
}

async function getTournamentState(tournamentId) {
  if (!tournamentId) return null;

  const [meta, players, bracketsRaw] = await Promise.all([
    DBtour.getActiveTournamentStatus(tournamentId).catch(() => null),
    DBtour.getTournamentPlayersWithUsernames(tournamentId).catch(() => []),
    DBtour.getBrackets(tournamentId).catch(() => [])
  ]);

  const tournamentStatus = coerceTournamentStatus(meta?.status || 'waiting');
  const playersList = buildTournamentPlayerList(players, tournamentStatus, bracketsRaw.flat());
  const pending = playersList.filter(p => !p.username).length;

  const state = {
    tournament_id: String(tournamentId),
    status: tournamentStatus,
    owner: players.find(p => p.role === 1)?.username || players.find(p => p.role === 'player1')?.username || '',
    players: playersList,
    can_start: pending === 0,               // with this schema, presence of 4 players is enough
    pending_players: pending
  };

  const bracket = mapBrackets(bracketsRaw);
  if (bracket.length) state.bracket = bracket;

  const current = bracket.flat().find(m => m.status === 'ongoing') || null;
  if (current) state.currentMatch = current;

  if (state.status === 'finished' && meta?.winner) {
    state.winner = meta.winner;
  }

  return state;
}

// attach to plugin export if this file primarily exports the fastify plugin function
module.exports.getTournamentState = getTournamentState;