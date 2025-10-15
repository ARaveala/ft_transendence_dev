
const { API_PROTOCOL } = require('@sharedApi');

module.exports = async function tournamentRoutes(fastify, options) {
	const {db, secure} = options;
	
	const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){
		if (err) rej(err); else res({lastID: this.lastID, changes: this.changes});
	}));
	const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (e, row) => e ? rej(e) : res(row)));
	const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (e, rows) => e ? rej(e) : res(rows)));
	const tx =  async(fn) => {await run('BEGIN'); try {const r = await fn(); await run('COMMIT'); return r} catch (e) {await run('ROLLBACK'); throw e;} };
	const requireUser = (request, reply) => {
		const token = request.cookies?.auth_token;
		if (!token) {reply.code(401).send({error: 'Not authenticated'}); return null;}
		try {return secure.getUserIdFromToken(token);}
		catch {reply.code(401).send({error: 'Invalid token'}); return null;}
	};
	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
		const userId = requireUser(request, reply);
		if (!userId) return;
		try
		{
			const {lastID} = await run(`INSERT INTO tournaments(status) VALUES ('waiting')`);
			reply.code(201).send({
				status: 'OK',
				tournament: {
					tournament_id: String(lastID),
					status: waiting,
					players: [],
					bracket: [],
				}
			});
		}
		catch (err)
		{
			fastify.log.error({err}, 'Failed to create tournament');
			reply.code(500).send({status: 'Error', error: 'Failed to create tournament'});
		}
	});
	fastify.post(API_PROTOCOL.JOIN_TOURNAMENT.path, async (request, reply) => {
		db.exec('PRAGMA foreign_keys = ON;');
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
		const userId = requireUser(request, reply);
		if (!userId) return;

		const { game_id, p1_score, p2_score } = request.body || {};
		if (!game_id || typeof p1_score !== 'number' || typeof p2_score !== 'number') {
		return reply.code(400).send({ status: 'ERROR', error: 'game_id, p1_score, p2_score required' });
		}

		try {
		await tx(async () => {
			const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
			if (!g) throw Object.assign(new Error('Game not found'), { statusCode: 404 });
			// store result
			const winner = p1_score > p2_score ? g.p1_id : p2_score > p1_score ? g.p2_id : null;
			await run(`UPDATE games
						SET p1_score = ?, p2_score = ?, status = 'completed', winner_user_id = ?
						WHERE id = ?`,
					[p1_score, p2_score, winner, game_id]);
			// if it was a semi, slot winner into final
			if (g.round === 1) {
			const final = await get(
				`SELECT id, p1_id, p2_id FROM games WHERE tournament_id = ? AND round = 2 AND bracket_pos = 1`,
				[g.tournament_id]
			);
			if (final) {
				if (!final.p1_id) await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winner, final.id]);
				else if (!final.p2_id) await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winner, final.id]);
			}
			}

			if (g.round === 2)
				await run(`UPDATE tournaments SET status = 'completed', winner_id = NULL WHERE id = ?`, [g.tournament_id]);

		});

		reply.send({ status: 'OK' });
		} catch (err) {
		const code = err.code && Number.isInteger(err.code) ? err.code : 500;
		reply.code(code).send({ status: 'ERROR', error: err.message || 'Failed to report result' });
		}
	});
};
/**
 * 1.create tournament receiveing only max numbers?
 * (look at api calls)
 * readies the tournament object 
 * createds a tournament id
 * adds the creating user to the tournament as player 1
 * sends response (look at payloads)
 * @param {*} fastify 
 * @param {*} options 
 * @return export interface TournamentStateResponse {
						  status: 'OK' | 'ERROR';
						  error?: string;
						  tournament: 
						   tournament_id: string; this will be updated
						  status: 'waiting' this will be status         | 'ongoing' | 'finished';
						  players: TournamentPlayer[]; remove username and password ffrom response
						  currentMatch?: Match;
						  bracket: Match[][];
						  winner?: TournamentPlayer;
						  createdAt?: Date;               // not sure if this is needed
						  lastUpdated?: Date              // not sure if this is needed 
						}
}
						export interface CreateTournamentPayload {
  max_players?: number;
}

export interface TournamentStateResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}
 */
//async function createTournamentObject(){
//
//}

// async function createTournament(fastify, options){
// 	const {secure, game} = options;
// 	fastify.route({
// 		method: API_PROTOCOL.CREATE_TOURNAMENT.method,
// 		url: API_PROTOCOL.CREATE_TOURNAMENT.path,
// 		handler: async (request, reply) => {
// 			const max_players = request.body;
// 			flog.debug({ function: 'createTournament' }, 'request body:', request.body);

// 			flog.debug({function: 'createTournament'}, 'checking max player body', max_players);
// 			try{
// 				const token = request.cookies.auth_token;
// 				const userId = secure.getUserIdFromToken(token)
// 				flog.debug({function: 'createTournament'}, 'user id is ', userId);
// 				//useridcheck
// 				let tournamentStatus = {
// 					tournament_id: game.generateRandomId(),
// 					status: 'waiting',
// 					players: [],
// 					currentMatch: [],//,undefined, //Match,
// 					bracket: [], //Match[][]
// 					winner: undefined,
// 					createdAt: undefined,
// 					lastUpdated: undefined
// 				}
// 				reply.code(200).send({status: 'OK', tournament: tournamentStatus});
// 			}
// 			catch (err){
// 				flog.error({fucntion: 'createTournament'}, "error ::", err);
// 			}
// 		}
// 	});
// }

/**
 * 2. maybe request all registered players
 * find all registered players, return them , risky if there are 1000's , 
 * if someone 
 * tested our work by writing a script to add 1000 players will this be an issue.
 * @param {*} fastify 
 * @param {*} options
 * @return export interface PlayerSearchResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  players: TournamentPlayer[]; // filtered list of players filtered by what ????
}
 */

/**
 * 3,4,5 are front end only?
 */
/**
 * recive player role: username password
 * 6.0 verify each player individually
 * add verified player with id  to the tournament object, label as verified and label role
 * send response for each verified player (look at payloads)
 * if max players reached set tournament to ready send all players ready
 * front end validates some input
* @param {*} fastify 
 * @param {*} options
 * @return export interface VerifyPlayerResponse {
  valid: boolean;
  error?: string;
}
 */
/**
 * add alias function simple player role , gets this alias
 * 
 */
// 7 front end
/**
 * 

 * 8. remove player from tournament
 * if player wishes to remove themselves , recive request , request should state player role 
 * such as player2, player will be removed from object
 * if tournament was ready it will be set to not ready
 * send response (look at payloads) should inform how many players are left
 * @param {*} fastify 
 * @param {*} options 
 * @return updated tournament states 
 */

//9 front end

/**
 * 
 * ABOSLUTE NONO
 * export interface StartTournamentPayload {
  tournament_id: string; //also not potentially required , as the user , with cookie, 
  is determined as tournament owner , this way we will know which tournamnet is in progress
  players: {
    username: string; why do u need this 
    alias: string;
    password?: string; //NEVER
    isSelf?: boolean;
  }[];
}
 * 10 starttorunament

 * set up prepared brackets for round1 round2, logic is low rank high rank else randomize 
 * 
 * @param {*} fastify 
 * @param {*} options
 * @return export interface StartTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}
 */

/**
 * 11?12. what is needed from me here ? when a game is started , a new token generation needs to happen
 * this is sent to websocket to verify , since we cant use cookies to verify with websockets , it
 * must be manually sent. 
 * @param {*} fastify 
 * @param {*} options 
 */
//async function createTournament(fastify, options) {
//	const {secure, ?} = options;
//	fastify.method(API_PROTOCOL.WAHT), {
//	//schema: updateScoreSchema??,
//	
//		try {
//			// one user creates the tournament? 
//			const token = request.cookies.auth_token;
//			const userId = secure.getUserIdFromToken(token);
//			// how many slots 
//			// where does aliases go? connected t original name or do we make new cookie?
//			// can cookie be deleted? 
//			const result = await DBupdate.createTournamentTable({userId, score});
//			reply.send(result); // result is tabled filled with names?
//		} catch (err) {
//			reply.code(500).send(err);
//		}
//	}
//	//});
//}
