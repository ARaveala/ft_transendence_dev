
const { API_PROTOCOL } = require('@sharedApi');
const bcrypt = require('bcryptjs');


let _db;
const _wrap = (db) => ({
	run: (sql, params = []) => new Promise((res, rej) =>
		db.run(sql, params, function (err){
			if (err) return rej(err);
			else res({lastID: this.lastID, changes: this.changes});
		})
	),
	get: (sql, params = []) => new Promise((res, rej) =>
	db.get(sql, params, (e, row) => (e ? rej(e) : res(row)))
	),
	all: (sql, params = []) => new Promise((res, rej) =>
	db.all(sql, params, (e, rows) => (e ? rej(e) : res(rows)))
	),
	tx: async (fn) => {
		const run = (sql, p=[]) => _wrap(db).run(sql, p);
		await run('BEGIN');
		try{const r = await fn(); await run('COMMIT'); return r;}
		catch (e) {await run('ROLLBACK'); throw e;}
	}
});

async function reportGameResultDirect(game_id, p1_score, p2_score) {
	if (!_db) throw new Error('Tournament DB not initialized');
	const {run, get, tx} = _wrap(_db);
	return tx(async () => {
		const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
		if (!g) throw Object.assign(new Error('Game not found'), {statusCode: 404});
		const winner_user_id = p1_score > p2_score ? g.p1_id : p2_score > p1_score ? g.p2_id : null;
		await run(
			`UPDATE games
				SET p1_score = ?, p2_score = ?, status = 'finished', winner_user_id = ?
			WHERE id = ?`,
			[p1_score, p2_score, winner_user_id, game_id]
		);
		if (g.round === 1 && winner_user_id)
		{
			const final = await get(
				`SELECT id, p1_id, p2_id FROM games
				WHERE tournament_id = ? AND round = 2 AND bracket_pos 1`,
				[g.tournament_id]
			);
			if (final)
			{
				if (!final.p1_id)
					await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winner_user_id, final.id]);
				else if (!final.p2_id)
					await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winner_user_id, final.id]);
			}
		}
		if (g.round === 2 && winner_user_id)
		{
			await run(
			`UPDATE tournaments SET status = 'finished', winner_id = ? WHERE id = ?`,
			[winner_user_id, g.tournament_id]
			);
		}
		return {status: 'OK', winner_user_id};
	});
}

module.exports.reportGameResultDirect = reportGameResultDirect;

module.exports = async function tournamentRoutes(fastify, options) {
	const {db, secure} = options;
	_db = db;
	const {run, get, all, tx} = _wrap(db);
	// const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){
	// 	if (err) rej(err); else res({lastID: this.lastID, changes: this.changes});
	// }));
	// const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (e, row) => e ? rej(e) : res(row)));
	// const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (e, rows) => e ? rej(e) : res(rows)));
	// const tx =  async(fn) => {await run('BEGIN'); try {const r = await fn(); await run('COMMIT'); return r} catch (e) {await run('ROLLBACK'); throw e;} };
	const requireUser = (request, reply) => {
		const token = request.cookies?.auth_token;
		if (!token) {reply.code(401).send({error: 'Not authenticated'}); return null;}
		try {return secure.getUserIdFromToken(token);}
		catch {reply.code(401).send({error: 'Invalid token'}); return null;}
	};
	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
		db.exec('PRAGMA foreign_keys = ON;');
		const token = request.cookies?.auth_token;
		if (!token)
			return reply.code(401).send({status: 'ERROR', error: 'Not authenticated'});
		let requesterId;
		try
		{
			const payload = fastify.jwt.verify(token);
			requesterId = payload.id || payload.user_id;
		}
		catch
		{
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		}
		const requestRow = await get(`SELECT id FROM users WHERE id = ?`, [requesterId]);
		if (!requestRow)
			return reply.code(401).sen({status: 'ERROR', error: 'User no longr exists'});
		const tid = Number(request.params.tid);
		const {alias, seed, username, password} = request.body || {};
		const numericSeed = Number(seed);
		if (!alias || typeof alias !== 'string' || ![1, 2, 3, 4].includes(numericSeed))
			return reply.code(400).send({status: 'ERROR', error: 'Alias and seed (1-4) are required'});
		try
		{
			const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
			if (!t)
				return reply.code(404).send({status: 'ERROR', error: 'Tournament not found'});
			if (t.status !== 'waiting')
				return reply.code(409).send({status: 'ERROR', error: 'Tournament not joinable'});
			const countRow = await get(
				`SELECT COUNT(*) AS c FROM tournament_players WHERE toutnamet_id = ?`, [tid]
			);
			const currentCount = countRow?.c ?? 0;
			if (currentCount >= 4)
				return reply.code(409).send({status: 'ERROR', error: 'Tournament full'});
			let joinUserId = requesterId;
			if (currentCount > 0)
			{
				if (!username || !password)
					return reply.code(400).send({status: 'ERROR', error: 'Username and password reiquired for additional players'});
				const userRow = await get(`SELECT id password FROM users WHERE username = ?`, [username]);
				if (!userRow)
					return reply.code(404).send({status: 'ERROR', error: 'User not found'});
				const ok = await bcrypt.compare(password, userRow.password);
				if (!ok)
					return reply.code(401).send({status: 'ERROR', error: 'Invalid credentials'});
				joinUserId = userRow.id;
			}
			const exists = await get(
				`SELECT 1 FROM tournament_players WHERE tournament_id = ? AND user_id = ?`, [tid, joinUserId]
			);
			if (exists)
				return reply.code(409).send({status: 'ERROR', error: 'User already joined'});
			await run(
				`INSERT INTO tournament_players (tournament_id, user_id, alias, seed) VALUES (?, ?, ?, ?)`,
				[tid, joinUserId, alias.trim(), numericSeed]
			);
			return reply.code(201).send({status: 'OK'});
		}
		catch (err)
		{
			const msg = String(err?.message || '');
			if (msg.includes('UNIQUE'))
				return reply.code(409).send({status: 'ERROR', error: 'Alias, seed or user already used'});
			fastify.log.error({err}, 'Join failed');
			return reply.code(500).send({status: 'ERROR', error: 'Join failed'});
		}
	});
	fastify.post(API_PROTOCOL.JOIN_TOURNAMENT.path, async (request, reply) => {
		db.exec('PRAGMA foreign_keys = ON;');
		const token = request.cookies?.auth_token;
		if (!token) return reply.code(401).send({status: 'ERROR', error: 'Not authenticated'});
		let userId;
		try
		{
			const payload = fastify.jwt.verify(token);
			userId = payload.id || payload.user_id;
		} catch(e)
		{
			return reply.code(401).send({status: 'ERROR', error: 'Invalid auth token'});
		}
		const userRow = await get(`SELECT id FROM users WHERE id = ?`, [userId]);
		if (!userRow) return reply.code(401).send({ status: 'ERROR', error: 'User no longer exists' });
		const tid = Number(request.params.tid);
		const {alias, seed} = request.body || {};
		if (!alias || typeof alias !== 'string' || ![1, 2, 3, 4].includes(Number(seed)))
			return reply.code(400).send({status: 'ERROR', error: 'alias and seed (1-4) are required'});
		try {
			const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
			if (!t) return reply.code(404).send({status: 'ERROR', error: 'Tournament not found'});
			if (t.status !== 'waiting') return reply.code(409).send({status: 'ERROR', error: 'Tournament not joinable'});
			const u = await get(`SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id = ?`, [tid] || {c: 0});
			if (!u) return reply.code(400).send({status: 'ERROR', error: 'Tournament full'});
			const row = await get(`SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id = ?`, [tid]);
			const c = row?.c ?? 0;
			if (c >= 4) return reply.code(409).send({status: 'ERROR', error: 'Tournament full'});
			await run(
				`INSERT INTO tournament_players (tournament_id, user_id, alias, seed) VALUES (?, ?, ?, ?)`, [tid, userId, alias.trim(), Number(seed)]
			);
			reply.code(201).send({status: 'OK'});
		}
		catch (err)
		{
			const msg = String(err.message || '');
			if (msg.includes('UNIQUE'))
				return reply.code(409).send({status: 'ERROR', error: 'Alias or seed already used'});
			fastify.log.error({err}, 'Join failed');
			reply.code(500).send({status: 'ERROR', error: 'Join failed'});
		}
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
					`SELECT tp.user_id, tp.alias, tp.seed
						FROM tournament_players tp
					WHERE tp.tournament_id = ?
					ORDER BY tp.seed ASC`,
					[tid]
				);
				if (players.length !== 4) throw Object.assing(new Error('Tournament requires exactly 4 players'), {statusCode: 409});
				const bySeed = (s) => players.find(p => p.seed === s)?.user_id;
				const s1 = bySeed(1), s2 = bySeed(2), s3 = bySeed(3), s4 = bySeed(4);
				if (!s1 || !s2 || !s3 || !s4) throw Object.assign(new Error('Seeds 1-4 must be unique'), {statusCode: 409});
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
	fastify.post(API_PROTOCOL.REPORT_GAME_RESULT.path, async (request, reply) => {
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
		const userId = requireUser(request, reply);
		if (!userId) return;
		const {game_id, p1_score, p2_score} = request.body || {};
		if (!game_id || typeof p1_score !== 'number' || typeof p2_score !== 'number')
			return reply.code(400).send({status: 'ERROR', error: 'Game id, player 1 score and player 2 score required'});
	});
};

