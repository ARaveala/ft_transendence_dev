
const { API_PROTOCOL } = require('@sharedApi');
const bcrypt = require('bcryptjs');
const { getUserIdFromToken } = require('../../security/security');
const { fetchUserByUsername } = require('../../database/get');

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

// async function reportGameResultDirect(game_id, p1_score, p2_score) {
// 	if (!_db) throw new Error('Tournament DB not initialized');
// 	const {run, get, tx} = _wrap(_db);
// 	return tx(async () => {
// 		const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
// 		if (!g) throw Object.assign(new Error('Game not found'), {statusCode: 404});
// 		const winner_user_id = p1_score > p2_score ? g.p1_id : p2_score > p1_score ? g.p2_id : null;
// 		await run(
// 			`UPDATE games
// 				SET p1_score = ?, p2_score = ?, status = 'finished', winner_user_id = ?
// 			WHERE id = ?`,
// 			[p1_score, p2_score, winner_user_id, game_id]
// 		);
// 		if (g.round === 1 && winner_user_id)
// 		{
// 			const final = await get(
// 				`SELECT id, p1_id, p2_id FROM games
// 				WHERE tournament_id = ? AND round = 2 AND bracket_pos 1`,
// 				[g.tournament_id]
// 			);
// 			if (final)
// 			{
// 				if (!final.p1_id)
// 					await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winner_user_id, final.id]);
// 				else if (!final.p2_id)
// 					await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winner_user_id, final.id]);
// 			}
// 		}
// 		if (g.round === 2 && winner_user_id)
// 		{
// 			await run(
// 			`UPDATE tournaments SET status = 'finished', winner_id = ? WHERE id = ?`,
// 			[winner_user_id, g.tournament_id]
// 			);
// 		}
// 		return {status: 'OK', winner_user_id};
// 	});
// }

// module.exports.reportGameResultDirect = reportGameResultDirect;

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
	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
		const {db} = options;
		const {run, get, all, tx} = _wrap(db);
		db.exec('PRAGMA foreing_keys = ON;');
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
					`INSERT INTO tournament_players (tournament_id, user_id, alias, role)
					 VALUES (?, ?, 'alias', 1)`,
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
		const tid = Number(request.params.tid);
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
		const tid = Number(request.params.tid);
		try
		{
			await tx(async () => {
				const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
				if (!t) throw Object.assign(new Error('Tournament not found'), { statusCode: 404 });
				if (t.status !== 'waiting') throw Object.assign(new Error('Tournament already started'), {statusCode: 409});
				const players = await all(
					`SELECT tp.user_id, tp.alias, tp.role
						FROM tournament_players tp
					WHERE tp.tournament_id = ?
					ORDER BY tp.role ASC`,
					[tid]
				);
				if (players.length !== 4) throw Object.assing(new Error('Tournament requires exactly 4 players'), {statusCode: 409});
				const byRole = (s) => players.find(p => p.role === s)?.user_id;
				const s1 = byRole(1), s2 = byRole(2), s3 = byRole(3), s4 = byRole(4);
				if (!s1 || !s2 || !s3 || !s4) throw Object.assign(new Error('Roles 1-4 must be unique'), {statusCode: 409});
				// Semifinals
				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
							VALUES (?, 1, 1, ?, ?, 'waiting')`, [tid, s1, s4]);
				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
							VALUES (?, 1, 2, ?, ?, 'waiting')`, [tid, s2, s3]);
				// Final
				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
							VALUES (?, 2, 1, NULL, NULL, 'waiting')`, [tid]);
				await run(`UPDATE tournaments SET status = 'ongoing' WHERE id = ?`, [tid]);
			});
			reply.send({status: 'OK'});
		}
		catch (err)
		{
			const code = err.code && Number.isInteger(err.code) ? err.code : 500;
			reply.code(code).send({status: 'ERROR', error: err.message || 'Failed to start tournament'});
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

