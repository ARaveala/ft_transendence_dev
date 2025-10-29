
const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
//const { createTournamentPlayer, getTournamentPlayerById } = require('../../database/tournament');
const flog = logger.child({ fileContext: 'tournamnet.js' });


//module.exports = async function tournamentRoutes(fastify, options) {
//	const {db, secure} = options;
//	console.log('CHECKING FUNCTION ACCESS CREATE TOURNAMNET111 ');
//	const run = (sql, params=[]) => new Promise((res, rej) => db.run(sql, params, function(err){
//		if (err) rej(err); else res({lastID: this.lastID, changes: this.changes});
//	}));
//	const get = (sql, params=[]) => new Promise((res, rej) => db.get(sql, params, (e, row) => e ? rej(e) : res(row)));
//	const all = (sql, params=[]) => new Promise((res, rej) => db.all(sql, params, (e, rows) => e ? rej(e) : res(rows)));
//	const tx =  async(fn) => {await run('BEGIN'); try {const r = await fn(); await run('COMMIT'); return r} catch (e) {await run('ROLLBACK'); throw e;} };
//	const requireUser = (request, reply) => {
//		const token = request.cookies?.auth_token;
//		if (!token) {reply.code(401).send({error: 'Not authenticated'}); return null;}
//		try {return secure.getUserIdFromToken(token);}
//		catch {reply.code(401).send({error: 'Invalid token'}); return null;}
//	};
//	fastify.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async (request, reply) => {
//		//flog('CHECKING FUNCTION ACCESS CREATE TOURNAMNET ');
//
//		const userId = requireUser(request, reply);
//		if (!userId) return;
//		try
//		{
//			const {lastID} = await run(`INSERT INTO tournaments(status) VALUES ('waiting')`);
//			reply.code(201).send({
//				status: 'OK',
//				tournament: {
//					tournament_id: String(lastID),
//					status: 'waiting',
//					players: [],
//					bracket: [],
//				}
//			});
//		}
//		catch (err)
//		{
//			fastify.log.error({err}, 'Failed to create tournament');
//			reply.code(500).send({status: 'Error', error: 'Failed to create tournament'});
//		}
//	});
//	fastify.post(API_PROTOCOL.JOIN_TOURNAMENT.path, async (request, reply) => {
//		db.exec('PRAGMA foreign_keys = ON;');
//
//		const userRow = await get(`SELECT id FROM users WHERE id = ?`, [userId]);
//		if (!userRow) return reply.code(401).send({ status: 'ERROR', error: 'User no longer exists' });
//		const tid = Number(request.params.tid);
//		const {alias, seed} = request.body || {};
//		if (!alias || typeof alias !== 'string' || ![1, 2, 3, 4].includes(Number(seed)))
//			return reply.code(400).send({status: 'ERROR', error: 'alias and seed (1-4) are required'});
//		try {
//			const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
//			if (!t) return reply.code(404).send({status: 'ERROR', error: 'Tournament not found'});
//			if (t.status !== 'waiting') return reply.code(409).send({status: 'ERROR', error: 'Tournament not joinable'});
//			const u = await get(`SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id = ?`, [tid] || {c: 0});
//			if (!u) return reply.code(400).send({status: 'ERROR', error: 'Tournament full'});
//			const row = await get(`SELECT COUNT(*) AS c FROM tournament_players WHERE tournament_id = ?`, [tid]);
//			const c = row?.c ?? 0;
//			if (c >= 4) return reply.code(409).send({status: 'ERROR', error: 'Tournament full'});
//			await run(
//				`INSERT INTO tournament_players (tournament_id, user_id, alias, seed) VALUES (?, ?, ?, ?)`, [tid, userId, alias.trim(), Number(seed)]
//			);
//			reply.code(201).send({status: 'OK'});
//		}
//		catch (err)
//		{
//			const msg = String(err.message || '');
//			if (msg.includes('UNIQUE'))
//				return reply.code(409).send({status: 'ERROR', error: 'Alias or seed already used'});
//			fastify.log.error({err}, 'Join failed');
//			reply.code(500).send({status: 'ERROR', error: 'Join failed'});
//		}
//	});
//	fastify.post(API_PROTOCOL.START_TOURNAMENT.path, async (request, reply) => {
//		const userId = requireUser(request, reply);
//		if (!userId) return;
//		const tid = Number(request.params.tid);
//		try
//		{
//			await tx(async () => {
//				const t = await get(`SELECT id, status FROM tournaments WHERE id = ?`, [tid]);
//				if (!t) throw Object.assign(new Error('Tournament not found'), { statusCode: 404 });
//				if (t.status !== 'waiting') throw Object.assign(new Error('Tournament already started'), {statusCode: 409});
//				const players = await all(
//					`SELECT tp.user_id, tp.alias, tp.seed
//						FROM tournament_players tp
//					WHERE tp.tournament_id = ?
//					ORDER BY tp.seed ASC`,
//					[tid]
//				);
//				if (players.length !== 4) throw Object.assing(new Error('Tournament requires exactly 4 players'), {statusCode: 409});
//				const bySeed = (s) => players.find(p => p.seed === s)?.user_id;
//				const s1 = bySeed(1), s2 = bySeed(2), s3 = bySeed(3), s4 = bySeed(4);
//				if (!s1 || !s2 || !s3 || !s4) throw Object.assign(new Error('Seeds 1-4 must be unique'), {statusCode: 409});
//				// Semifinals
//				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
//							VALUES (?, 1, 1, ?, ?, 'waiting')`, [tid, s1, s4]);
//				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
//							VALUES (?, 1, 2, ?, ?, 'waiting')`, [tid, s2, s3]);
//				// Final
//				await run(`INSERT INTO games (tournament_id, round, bracket_pos, p1_id, p2_id, status)
//							VALUES (?, 2, 1, NULL, NULL, 'waiting')`, [tid]);
//				await run(`UPDATE tournaments SET status = 'ongoing' WHERE id = ?`, [tid]);
//			});
//			reply.send({status: 'OK'});
//		}
//		catch (err)
//		{
//			const code = err.code && Number.isInteger(err.code) ? err.code : 500;
//			reply.code(code).send({status: 'ERROR', error: err.message || 'Failed to start tournament'});
//		}
//	});
//	fastify.post(API_PROTOCOL.REPORT_GAME_RESULT.path, async (request, reply) => {
//		const userId = requireUser(request, reply);
//		if (!userId) return;
//
//		const { game_id, p1_score, p2_score } = request.body || {};
//		if (!game_id || typeof p1_score !== 'number' || typeof p2_score !== 'number') {
//		return reply.code(400).send({ status: 'ERROR', error: 'game_id, p1_score, p2_score required' });
//		}
//
//		try {
//		await tx(async () => {
//			const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
//			if (!g) throw Object.assign(new Error('Game not found'), { statusCode: 404 });
//			// store result
//			const winner = p1_score > p2_score ? g.p1_id : p2_score > p1_score ? g.p2_id : null;
//			await run(`UPDATE games
//						SET p1_score = ?, p2_score = ?, status = 'completed', winner_user_id = ?
//						WHERE id = ?`,
//					[p1_score, p2_score, winner, game_id]);
//			// if it was a semi, slot winner into final
//			if (g.round === 1) {
//			const final = await get(
//				`SELECT id, p1_id, p2_id FROM games WHERE tournament_id = ? AND round = 2 AND bracket_pos = 1`,
//				[g.tournament_id]
//			);
//			if (final) {
//				if (!final.p1_id) await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winner, final.id]);
//				else if (!final.p2_id) await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winner, final.id]);
//			}
//			}
//
//			if (g.round === 2)
//				await run(`UPDATE tournaments SET status = 'completed', winner_id = NULL WHERE id = ?`, [g.tournament_id]);
//
//		});
//
//		reply.send({ status: 'OK' });
//		} catch (err) {
//		const code = err.code && Number.isInteger(err.code) ? err.code : 500;
//		reply.code(code).send({ status: 'ERROR', error: err.message || 'Failed to report result' });
//		}
//	});
//};
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

//async function getActiveTournament(fastify, options){
// 	const {secure, game} = options;
// 	fastify.route({
//		path: API_PROTOCOL.GET_ACTIVE_TOURNAMENT.path, 
//        method: API_PROTOCOL.GET_ACTIVE_TOURNAMENT.method,
// 		handler: async (request, reply) => {
// 			//const max_players = request.body;
// 			//flog.debug({ function: 'createTournament' }, 'request body:', request.body);
// 			//flog.debug({function: 'createTournament'}, 'checking max player body', max_players);
// 			try{
// 				const token = request.cookies.auth_token;
// 				const userId = secure.getUserIdFromToken(token)
// 				flog.debug({function: 'createTournament'}, 'user id is ', userId);
// 				//useridcheck
//				const Match[][] = [];
// 				let tournamentState = {
//					tournament_id: game.generateRandomId(),
//					status: 'waiting',
// 					players: [],
// 					currentMatch: [],//,undefined, //Match,
// 					bracket: Match[][], //Match[][]
// 					winner: undefined,
// 					createdAt: undefined,
// 					lastUpdated: undefined
// 				}
// 				reply.code(200).send({status: 'OK', tournament: tournamentState});
// 			}
// 			catch (err){
// 				flog.error({fucntion: 'createTournament'}, "error ::", err);
// 			}
// 		}
// 	});
// }
//
let currentTournamentId = null; // global variable to track current tournament id
/**
 * consideration bank 
 * 
 * for when we need tournamnet id , now we use global variable to track current tournamnet id
 * function getCurrentTournamentId(req) {
  return req.session.tournamentId || null;
}

 */
/**
 * 
 * @param {*} players player object containing all existing players from db
 * @returns all players inside db tournament player object , filling empty slots with placeholders, player
 * object has been cleaned , so that eg, no user ids are sent to front end
 */
function buildTournamentPlayerList(players) {
	const fullPlayerList = [];
//	flog.debug({function: 'buildTournamentPlayerList', players: players}, 'building full player list ');
	for (let i = 1; i <= 4; i++) {
		const player = players.find(p => p.player_role === `player${i}`);

	if (player) {
		//flog.debug({function: 'buildTournamentPlayerList', playerrole: player.role}, `////checking ownership////// `);

		fullPlayerList.push({
			username:  player.username || "", // fallback if user not assigned,
			alias: player.alias,
			role: player.player_role,
			status: player.player_status,
			score: player.player_score,
			isSelf: player.is_owner,
			isVerified: player.verified
	});
	} else {
		fullPlayerList.push({
			username: "",
			alias: "",
			role: `player${i}`,
			status: "waiting",
			score: 0,
			isVerified: false
		});
	 }
	}
//	flog.debug({function: 'buildTournamentPlayerList', fullPlayerList: fullPlayerList}, 'full player list built ');
	return fullPlayerList;
}


async function getTournamentState(players, tournamentId, tournamentStatus) {
	//flog.debug({function: 'getTournamentState', players: players, tid: tournamentId, status: tournamentStatus}, 'creating the tournamnet state ');
	const full_list = buildTournamentPlayerList(players);
	//flog.debug({function: 'getTournamentState', full_list: full_list}, 'tournament state data fetched ');
//	let status = tournamentStatus;
//	if (typeof tournamentStatus === 'object') {
//		status = tournamentStatus.status;
//	}
  const tournamentState = {
	tournament_id: tournamentId,
	status: tournamentStatus,
	players: full_list,
	currentMatch: undefined,
	bracket: [],
	winner: undefined,
	createdAt: undefined,
	lastUpdated: undefined
  };
 // flog.debug({function: 'getTournamentState', tournamentState: tournamentState}, 'tournament state built +++++++++');
  return tournamentState;
}
/**
 * 
 * @param {*} fastify fastify instance
 * @param {*} options see context.js for available options
 * 
 * creates a baisc tournament object with creating user as player1.
 */
async function createTournament(fastify, options){
 	const {secure, game, DBtour} = options;
 	fastify.route({
 		method: API_PROTOCOL.CREATE_TOURNAMENT.method,
 		url: API_PROTOCOL.CREATE_TOURNAMENT.path,
 		handler: async (request, reply) => {
 			const max_players = request.body;
 			flog.debug({ function: 'createTournament', body: request.body }, 'request body:');
 			//flog.debug({function: 'createTournament', mxp: max_players}, 'checking max player body');
 			try{
 				const token = request.cookies.auth_token;
 				const userId = secure.getUserIdFromToken(token)
				// check verified user
 				//flog.debug({function: 'createTournament', userId}, 'user id is ');
 				//useridcheck
				const tournamentId = await DBtour.createTournament();
				currentTournamentId = tournamentId; // set global variable to current tournament id

				//flog.debug({function: 'createTournament', tournamentId}, 'tournament id created ');
				// check id valid didnt fail, catch will also catch
				const tournamentStatus = await DBtour.getActiveTournamentStatus(tournamentId);


				// check status valid didnt fail, catch will also catch
				//flog.debug({function: 'createTournament', tournamentId: tournamentId, status: tournamentStatus}, 'tournament id created ');
				await DBtour.createTournamentPlayer(tournamentId, userId.id, "", 1, "player1", true, true);
				flog.debug({function: 'createTournament', tournamentId: tournamentId, userId: userId.id}, 'tournament player created ');
				
				const players = await DBtour.getTournamentPlayersWithUsernames(tournamentId)
				flog.debug({function: 'createTournament', players: players}, 'tournament players ');
				const tournamentState = await getTournamentState(players, tournamentId, tournamentStatus);
				
 				reply.code(200).send({status: 'OK', tournament: tournamentState});
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error ::", err);
 			}
 		}
 	});
 }

async function verifyPlayer(fastify, options){
 	const {secure, DBget, DBtour} = options;
 	fastify.route({
		method: API_PROTOCOL.VERIFY_PLAYER.method,
		url: API_PROTOCOL.VERIFY_PLAYER.path,
 		handler: async (request, reply) => {
 			flog.debug({ function: 'verifyPlayer', body: request.body }, 'request body:');
 			const {role, username, password, alias} = request.body;
			try{
 				const token = request.cookies.auth_token;
 				const userId = secure.getUserIdFromToken(token)
				let tournamentState = undefined;
				if (role === 'player1'){
					//flog.debug({function: 'verifyPlayer', tid: currentTournamentId, userId: userId.id, alias: alias}, 'updating alias for player 1 ');
					await DBtour.updateAlias(currentTournamentId, userId.id, alias);
					await DBtour.updatePlayerReadyStatus(currentTournamentId, userId.id, 'ready');
					flog.debug({function: 'verifyPlayer', tid: currentTournamentId, userId: userId.id, alias: alias}, 'gettin tournament status !!!second!!!time for player1 ');

					tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(currentTournamentId),
						currentTournamentId, await DBtour.getActiveTournamentStatus(currentTournamentId));
					flog.debug({function: 'verifyPlayer', tournamnetState: tournamentState}, '!!!!!!player 1 alias updated ');
				} else {
					const otherUserId = await DBget.miniLogin(username, password);
					flog.debug({function: 'verifyPlayer', tid: currentTournamentId}, 'showing we have tournamnetid ');
					if (otherUserId) {
						// is this the right way to handle role swap ?
						flog.debug({function: 'verifyPlayer', otherUserId: otherUserId.id, role: role}, 'verified player id and role ');
						await DBtour.createTournamentPlayer(currentTournamentId, otherUserId.id, alias, Number(role.replace('player','')), role, true, false);
						await DBtour.updatePlayerReadyStatus(currentTournamentId, otherUserId.id, 'ready');

						flog.debug({function: 'verifyPlayer'}, '!!!!!!player verified and added to tournament ');
						const checkFull = await DBtour.getTournamentPlayers(currentTournamentId);
						flog.debug({function: 'verifyPlayer', checkFull: checkFull}, '!!!!!!checking if tournament full ');
//						if (checkFull.full === true){
						if (checkFull && checkFull.length === 4) {
							flog.debug({function: 'verifyPlayer'}, '!!!!!!all players verified setting tournament to ready ');
							await DBtour.updateTournamentStatus(currentTournamentId, 'ongoing');

						}
						tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(currentTournamentId), 
						currentTournamentId, await DBtour.getActiveTournamentStatus(currentTournamentId), false);
						if (checkFull && checkFull.length  === 4){
							tournamentState.can_start = true;
						}

					}


				}
				flog.debug({function: 'verifyPlayer', tournamentState: tournamentState}, '!!!!!!final tournamnet state ');
				// check verified user
 				reply.code(200).send({status: 'OK', tournament: tournamentState}); //wrong
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error :: in verify player", err); //wrong
				reply.code(500).send({ status: 'ERROR', error: 'Verification failed?' });
			}
 		}
 	});
}
/**
 * 
 * id INTEGER PRIMARY KEY AUTOINCREMENT,
	tournament_id INTEGER,
	p1_id INTEGER,
	p2_id INTEGER,
	p1_score INTEGER NOT NULL DEFAULT 0,
	p2_score INTEGER NOT NULL DEFAULT 0,
	winner_id INTEGER,
	round INTEGER,
	bracket_pos INTEGER,
	game_uid TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'waiting'
		CHECK (status IN ('waiting', 'pending', 'ongoing', 'finished')),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
	FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);
 */
async function createMatches(player1, player2, bracket){
//same is logic as buildfulllist? 
flog.warn({function: 'createMatches'}, 'entering create matches');
flog.warn({function: 'createMatches', bracket: bracket}, 'entering create matches');
	if (player1 === null && player2 === null) {

		player1 = {
			username: "TBD",
			alias: "TBD",
			status: "waiting",
			score: 0,
			isSelf: false,
		}
		player2 = {
			username: "TBD",
			alias: "TBD",
			status: "waiting",
			score: 0,
			isSelf: false,
		}
	}
const ret = {
		match_id: bracket.game_uid,
		player1: player1,
		player2: player2,
		status: "pending",
		score: { player1: player1.score, player2: player2.score },
	}
	return ret;
}

/**
 * expected full return 
 * export interface Match {
  match_id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: TournamentPlayer;
  score?: {
	player1: number;
	player2: number;
  };
  status: 'pending' | 'ongoing' | 'finished';
  //lastUpdated: Date;
  //gameState?: any;
}
 */



async function startTournament(fastify, options){
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.START_TOURNAMENT.method,
		url: API_PROTOCOL.START_TOURNAMENT.path,
 		handler: async (request, reply) => {
			try {
	 			const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);

				const players = await DBtour.getTournamentPlayers(currentTournamentId);
				flog.debug({function : 'startTournament'}, 'players fetched');
				//this will sort into order highest to lowest ERROR here 
				//players.sort((a, b) => a.seed - b.seed);
				//memeba to do this 


//addPlayer(gameId, userId, {type: type, ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
				//flog.debug({function : 'startTournament', players: players}, 'players sorted by seed');
				flog.debug({function : 'startTournament', player: players[0]}, 'players sorted by seed');

				// Round 1: seed 1 vs seed 4
				const gameId1 = game.createGameCore({id: players[0].user_id }, 'tournament', 'local', players[0].alias);
				game.getGame(gameId1).tid = currentTournamentId;
				flog.debug({function : 'startTournament', gameId1}, 'game 1 is created');

				game.addPlayer(gameId1, players[3].user_id, {
					type: 'login',
					ws: undefined,
					role: 'player2',
					alias: players[3].alias,
					ready: false,
					disconnectedAt: undefined,
					pauseTimeout: undefined,
					score: players[3].player_score
				})
				let matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  players[0].user_id,
				  players[3].user_id,
				  gameId1,
				  1, // round
				  'pending'
				);
				
				const match1 = await createMatches(players[0], players[3], matchSetup);
				flog.debug({function :'startTournament', match1: match1}, '!!!!!!!!!!!!!!!!!!!!!show me if match was creaqted for gods sake im gonna shoot someone"""""""""""');
				// Round 2
				const gameId2 = game.createGameCore({id: players[1].user_id}, 'tournament', 'local', players[1].alias);
				flog.debug({function : 'startTournament'}, 'game 2 is created');
				game.getGame(gameId2).tid = currentTournamentId;
				game.addPlayer(gameId2, players[2].user_id, {
					type: 'login',
					ws: undefined,
					role: 'player2',
					alias: players[2].alias,
					ready: false,
					disconnectedAt: undefined,
					pauseTimeout: undefined,
					score: players[2].player_score
				})
				matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  players[1].user_id,
				  players[2].user_id,
				  gameId2,
				  2, // round
				  'pending'
				);
				const match2 = await createMatches(players[1], players[2], matchSetup);
				const gameId3 = game.createGameCore(undefined, 'tournament', 'local');
				flog.debug({function : 'startTournament'}, 'game 3 is created');
				game.getGame(gameId3).tid = currentTournamentId;
				matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  undefined,
				  undefined,
				  //players[0].user_id,
				  //players[3].user_id,
				  gameId3,
				  3, // round
				  'pending'
				);
				flog.debug({function: 'startTournament', matchSetup: matchSetup}, 'on 3-------------------------show me the bakcet before sending ');

				const match3 = await createMatches(null, null, matchSetup);
				const status = await DBtour.getActiveTournamentStatus(currentTournamentId);
				let tournamentState = await getTournamentState(players, currentTournamentId, status.status);
				flog.debug({function: 'startTournament', tournamentState: tournamentState}, "showing state before adding extra bits");
				tournamentState.currentMatch = match1;
				tournamentState.bracket = [[match1, match2], [match3]];

				flog.debug({function: 'startTournament', tid: currentTournamentId, userId: userId.id}, 'starting tournament ');
				
				flog.debug({function: 'startTournament', tournamnetState: tournamentState}, 'FINAL GAME STATE ');
				reply.code(200).send({status: 'OK', tournament: tournamentState});
			} catch (err) {
				flog.error({fucntion: 'startTournament', errStack: err.stack, errMessage: err.message}, "error :: in start tournament"); //wrong
				reply.code(500).send({ status: 'ERROR', error: 'Start tournament failed?' });//wrong	
			}
		}
		
	});
}

async function removeUserFromTournament(fastify, options) {
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.method,
		url: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "removeUserFRomTournamnet", body:request.body}, "looking at incoming body")
			const {tournament_id, role} = request.body;
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.removePlayer(tournament_id, role);
				//const current_gamegame
			//	await DBtour.cancelTournament(tournamnetId);
				const tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(tournament_id), 
				tournament_id, await DBtour.getActiveTournamentStatus(tournament_id), false);

				reply.code(200).send({status: 'OK', tournament: tournamentState});
			}
			catch (err) {
				flog.error({function: "removeUserFromTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error removing from tournamnet"});
			}
		}
	})
}

async function cancelTournament(fastify, options) {
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
		url: API_PROTOCOL.CANCEL_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "cancleTournamnet", body: request.body}, "looking at incoming body")
			const {tournament_id} = request.body;
			flog.debug({function: "cancleTournamnet", tid: tournament_id}, 'checking tid');
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.cancelTournament(tournament_id);
				reply.code(200).send({status: 'OK'});

			}
			catch(err) {
				flog.error({function: "cancelTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error canceling tournamnet"});
			}
		}
	})
}

//async function startTournamentMatch(fastify, options){
//	const {secure, DBget, DBtour, game} = options;
// 	fastify.route({
//		method: API_PROTOCOL.START_TOURNAMENT_MATCH.method,
//		url: API_PROTOCOL.START_TOURNAMENT_MATCH.path,
// 		handler: async (request, reply) => {
//			const match_id = request.body;
//
//			
//			try{
//				flog.info({function: 'startTournamentMatch', body: request.body}, 'starting match , showing body');
//			}catch{
//				flog.error({function: 'startTournamentMatch'});
//			}
//		}
//	})
//}

async function removeUserFromTournament(fastify, options) {
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.method,
		url: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "removeUserFRomTournamnet", body:request.body}, "looking at incoming body")
			const {tournament_id, role} = request.body;
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.removePlayer(tournament_id, role);
				//const current_gamegame
			//	await DBtour.cancelTournament(tournamnetId);
				const tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(tournament_id), 
				tournament_id, await DBtour.getActiveTournamentStatus(tournament_id), false);

				reply.code(200).send({status: 'OK', tournament: tournamentState});
			}
			catch (err) {
				flog.error({function: "removeUserFromTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error removing from tournamnet"});
			}
		}
	})
}

async function cancelTournament(fastify, options) {
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
		url: API_PROTOCOL.CANCEL_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "cancleTournamnet", body: request.body}, "looking at incoming body")
			const {tournament_id} = request.body;
			flog.debug({function: "cancleTournamnet", tid: tournament_id}, 'checking tid');
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.cancelTournament(tournament_id);
				reply.code(200).send({status: 'OK'});

			}
			catch(err) {
				flog.error({function: "cancelTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error canceling tournamnet"});
			}
		}
	})
}
//    const fullPlayers = currentTournament?.players || [];
//
//    // First round matches
//    const firstRound: Match[] = [
//      {
//        match_id: "round1match1",
//        player1: fullPlayers[0],
//        player2: fullPlayers[1],
//        winner: TBD_PLAYER,
//        status: "pending",
//        score: { player1: 0, player2: 0 },
//      },
//      {
//        match_id: "round1match2",
//        player1: fullPlayers[2],
//        player2: fullPlayers[3],
//        winner: TBD_PLAYER,
//        status: "pending",
//        score: { player1: 0, player2: 0 },
//      },
//    ];
//
//    const final: Match = {
//      match_id: "finalmatch",
//      player1: { ...TBD_PLAYER },
//      player2: { ...TBD_PLAYER },
//      winner: { ...TBD_PLAYER },
//      status: "pending",
//      score: { player1: 0, player2: 0 },
//    };
//

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

 * set up prepared game for round1 round2, logic is low rank high rank else randomize 
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

async function tournamentRoutes(fastify, options) {
	await createTournament(fastify, options);
	await verifyPlayer(fastify, options);
	await startTournament(fastify, options);
	await removeUserFromTournament(fastify, options);
	//await startTournamentMatch(fastify, options);
	await cancelTournament(fastify, options);
	//await getTournamentState(tournamentId, userId, token);
}


module.exports = tournamentRoutes;