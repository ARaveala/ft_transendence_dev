'use strict'
const {API_PROTOCOL} = require('@sharedApi');
const {log} = require('@logger');

function wrap(db) {
	return {
		run: (sql, params = []) =>
			new Promise((res, rej) =>
			db.run(sql, params, function (err) {
				if (err) rej(err);
				else res({lastID: this.lastID, changes: this.changes});
			})
		),
		get: (sql, params = []) =>
			new Promise((res, rej) =>
				db.get(sql, params, (e, row) => (e ? rej(e): res(row)))
		),
		all: (sql, params = []) =>
			new Promise((res, rej) =>
			db.all(sql, params, (e, rows) => (e ? rej(e) : res(rows)))
		),
		tx: async (fn) => {
			await new Promise((res, rej) => db.run('BEGIN', (e) => (e ? rej(e) : res())));
			try
			{
				const out = await fn();
				await new Promise((res, rej) => db.run('COMMIT', (e) => (e ? rej(e) : res())));
				return out;
			}
			catch (e)
			{
				await new Promise((res, rej) => db.run('ROLLBACK', (er) => (er ? rej(er) : res())));
				throw e;
			}
		},
	};
}

function toPlayer(row)
{
	if (!row) return null;
	return {
		id: row.id,
		username: row.username,
		avatar: row.avatar_file || null,
		score: row.score ?? 0,
		rank: row.rank ?? 0,
	};
}

function validScore(n) { return Number.isInteger(n) && n >= 0 && n <= 1000; }

module.exports = async function gameRoutes(fastify, options)
{
	const {db, secure} = options;
	const {run, get, all, tx} = wrap(db);
	const requireUser = (request, reply) =>
	{
		const token = request.cookies?.auth_token;
		if (!token)
		{
			reply.code(401).send({status: 'ERROR', error: 'Not authenticated'});
			return null;
		}
		try
		{
			return secure.getUserIdFromToken(token);
		}
		catch
		{
			reply.code(401).send({status: 'ERROR', error: 'Invalid token'});
			return null;
		}
	};

	// POST /api/create-game
	fastify.post(API_PROTOCOL.CREATE_GAME.path, async (request, reply) =>{
		const uid = requireUser(request, reply);
		if (!uid) return;
		await run(
			`INSERT INTO games (tournament_id, p1_id, p2_id, p1_score, p2_score, winner_id, round, bracket_pos, status)
			 VALUES (NULL, ?, NULL, 0, 0, NULL, NULL, NULL, 'waiting')`,
			[uid]
		);
		const g = await get(`SELECT * FROM games WHERE id = last_insert_rowid()`);
		reply.send({
			status: 'OK',
			game: {
				id: g.id,
				status: g.status,
				p1_id: g.p1_id;
				p2_id: g.p2_id
			}
		});
	});

	// POST /api/join-game
	fastify.post(API_PROTOCOL.JOIN_GAME.path, async (request, reply) => {
		const uid = requireUser(request, reply);
		if (!uid) return;
		const {game_id} = request.body || {};
		if (Number.isInteger(game_id))
			return reply.code(400).send({status: 'ERROR', error: 'game_id is required'});
		const g = await get(`SELECT * FROM games WHERE id =?`, [game_id]);
		if (!g) return reply.code(409).send({status: 'ERROR', error: 'Game not found'});
		if (g.status !== 'awaiting')
			return reply.code(409).send({status: 'ERROR', error: 'Game is not open to join'});
		if (g.p1_id === uid)
			return reply.code(400).send({status: 'ERROR', error: 'You are already in this game'});
		if (g.p2_id && g.p2_id !== uid)
			return reply.code(409).send({status: 'ERROR', error: 'Game already has two players'});
		await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [uid, game_id]);
		const gg = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
		reply.send({
			status: 'OK',
			game: {
				id: gg.id,
				status: gg.status,
				p1_id: gg.p1_id,
				p2_id: gg.p2_id
			}
		});
	});

	// POST /api/start-game
	fastify.post(API_PROTOCOL.STRAT_GAME.path, async (request, reply) => {
		const uid = requireUser(request, reply);
		if (!uid) return;
		const {game_id} = request.body || {};
		if (!Number.isInteger(game_id))
			return reply.code(400).send({status: 'ERROR', error: 'Game ID is required'});
		const g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
		if (!g) return reply.code(404).send({status: 'ERROR', error: 'Game not found'});
		if (uid !== g.p1_id && uid !== g.p2_id)
			return reply.code(403).send({status: 'ERROR', error: 'Not a participant'});
		if (!g.p1_id || !g.p2_id)
			return reply.code(409).send({status: 'ERROR', error: 'Need two players to start'});
		if (g.status === 'ongoing')
			return reply.code(409).send({status: 'ERROR', error: 'Already started'});
		if (g.status === 'finished')
			return reply.code(409).send({status: 'ERROR', error: 'Already finished'});
		await run(`UPDATE games SET status = 'ongoing' WHERE id = ?`, [game_id]);
		const gg = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
		reply.send({
			status: 'OK',
			game: {
				id: gg.id,
				status: gg.status,
				p1_id: gg.p1_id,
				p2_id: gg.p2_id
			}
		});
	});


	// GET /api/player?ids=1,2,3
	fastify.get(API_PROTOCOL.GET_PLAYER.path, async (request, reply) => {
		const idsParam = request.query?.ids;
		let ids = [];
		if (idsParam && typeof idsParam === 'string')
		{
			ids = idsParam.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((s) => Number(s))
				.filter((n) => Number.isInteger(n) && n > 0);
			if (ids.length === 0) return reply.send([]);
		}
		if (ids.length === 0)
		{
			const uid = requireUser(request, reply);
			if (!uid) return;
			ids = [uid];
		}
		const placeholders = ids.map(() => '?').join(',');
		const row = await all(
			`SELECT id, username, avatar_file, score, rank
			FROM users
			WHERE id IN (${placeholders})`,
			ids
		);
	});
	// POST /api/games/result

	fastify.post(API_PROTOCOL.REPORT_GAME_RESULT.path, async (request, reply) => {
		const userId = requireUser(request, reply);
		if (!userId) return;
		const {game_id, p1_id, p2_id, p1_score, p2_score} = request.body || {};
		if (!validScore(p1_score) || !validScore(p2_score))
		{
			return reply.code(400).send({
				status: 'ERROR',
				error: 'Player 1 and player 2 score must be integers 0-1000'});
		}
		if (p1_score === p2_score)
			return reply.code(400).send({status: 'ERROR', error: 'Ties are not allowed'});
		try
		{
			const resultPayload = await tx(async () => {
				let g;
				if (game_id)
				{
					g = await get(`SELECT * FROM games WHERE id = ?`, [game_id]);
					if (!g)
						throw Object.assign(new Error('Game not found'), {statusCode: 404});
					if (g.status === 'finished')
						throw Object.assign(new Error('Game already finished', {statusCode: 409}));
					if (userId !== g.p1_id && userId !== g.p2_id)
						throw Object.assign(new Error('Only a participating player can report this result'), {statusCode: 403}); 
				}
				else
				{
					if (!Number.isInteger(p1_id) || !Number.isInteger(p2_id))
						throw Object.assign(new Error('Player 1 ID and player 2 ID are required when game ID is not provided'), {statusCode: 400});
					if (p1_id === p2_id)
						throw Object.assign(new Error('Players must different'), {statusCode: 400});
					p1 = await get(`SE:ECT id FROM users WHERE id = ?`, [p1_id]);
					p2 = await get(`SE:ECT id FROM users WHERE id = ?`, [p2_id]);
					if (!p1 || !p2)
						throw Object.assign(new Error('One or both players do not exist'), {statusCode: 404});
					const winnerId = p1_score > p2_score ? p1_id : p2_id;
					await run(
						`INSERT INTO games (tournament_id, p1_id, p2_id, p1_score, p2_score, winner_id, round, bracket_pos, status) 
						VALUES (NULL, ?, ?, ?, ?, ?, NULL, NULL, 'finished')`,
						[p1_id, p2_id, p1_score, p2_score, winnerId]
					);
					g = await get(`SELECT * FROM games WHERE id = last_insert_rowid()`);
				}
				const winnerId = p1_score > p2_score ? g.p1_id : g.p2_id;
				const loserId = winnerId === g.p1_id ? g.p2_id : g.p1_id;
				if (game_id)
				{
					await run(
						`UPDATE games
							SET p1_score = ?, p2_score = ?, winner_id = ?, status = 'finished'
						WHERE id = ?`,
						[p1_score, p2_score, winnerId, g.id]
					);
				}
				await run(
					`UPDATE users SET wins = wins + 1, total_games + 1, WHERE id = ?`,
					[winnerId]
				);
				await run(
					`UPDATE users SET losses = losses + 1, total_games + 1, WHERE id = ?`,
					[loserId]
				);
				if (g.tournament_id)
				{
					if (g.round === 1)
					{
						const final = await get(
							`SELECT id p1_id, p2_id
								FROM games
							WHERE tournament_id =? AND round = 2 AND bracket_pos = 1`,
							[g.tournament_id]
						);
						if (final)
						{
							if (!final.p1_id)
								await run(`UPDATE games SET p1_id = ? WHERE id = ?`, [winnerId, final.id]);
							else if (!final.p2_id)
								await run(`UPDATE games SET p2_id = ? WHERE id = ?`, [winnerId, final.id]);
						}
					}
					if (g.round === 2)
					{
						await run(`
							UPDATE tournaments SET status = 'finished', winner_id = ? WHERE id = ?`,
							[winnerId, g.tournament_id]
						);
					}
				}
				const saved = await get(`SELECT * FROM games WHERE id = ?`, [g.id]);
				const pRows = await all(
					`SELECT id, username, avatarfile, score, rank FROM users WHERE id IN (?, ?)`,
					[saved.p1_id, saved.p2_id]
				);
				const players = pRows.map(toPlayer);
				return {
					status: 'OK',
					game: {
						id: saved.id,
						tournament_id: saved.tournament_id,
						round: saved.round,
						bracket_pos: saved.bracket_pos,
						p1_id: saved.p1_id,
						p2_id: saved.p2_id,
						p1_score: saved.p1_score,
						p2_score: saved.p2_score,
						winner_id: saved.winner_id,
						status: saved.status,
					},
					players
				};
			});
			return reply.send(resultPayload);
		}
		catch (err)
		{
			const code = err.statusCode || 500;
			log('REPORT_GAME_RESULT', err.message || err);
			return reply.code(code).send({
				status: 'ERROR',
				error: err.message || 'Failed to save game result'});
		}
	});
};



// // all these should be swapped for context files, either or
// // 2 different approaches
// const {
// 	miniLogin
// } = require('@db/get.js');

// const {log} = require('@logger');
// //const {
// //	getUserIdFromToken,
// //	generateWsToken
// //} = require('@security');

// const { API_PROTOCOL } = require('@sharedApi');

// const games = new Map(); // gameId -> { owner, players, state, loop }


// function generateRandomId() {
//   return Math.random().toString(36).substring(2, 10);
// }

// function createGameMap(owner, mode, type, forceGameId) {
// 	const gameId = forceGameId ?? 1;
// 	games.set(gameId, {
// 		id: gameId,
// 		owner,
// 		type,
// 		mode,
// 		state: {},
// 		loop: undefined,
// 		phase: "setup",
// 		players: new Map(),
// 		payload: {
// 			fps: 60,
// 			height: 1,
//     		width: 1,
//     		ballSize: 1,
//     		paddleHeight: 1,
// 			paddleWidth: 1,
//     		paddleOffset: 1,
// 			paddleSpeed: 10,
// 			ballSpeed: 3,
// 			leftPaddleI: 0,
// 			rightPaddleI: 1,
// 			ballYI: 2,
// 			ballXI: 3,
// 			positions: [100, 100, 100, 100],
// 			ball: { dx: 3, dy: 1 },
// 			gameRunning: false,
// 			keysDown: [false, false, false, false],
// 			lastUpdate: undefined
// 		}});
// 	return gameId;
// }


// function getGame(gameId) {
// 	log('GETGAME', 'geting game called');
// 	return games.get(gameId);
// }

// //function getPlayers(players, playerId) {
// //	return
// //}
// function deleteGame(gameId) {
//   games.delete(gameId);
// }


// function addPlayer(gameId, playerId, playerData) {
// //	log('ADD_PLAYER',`addPlayer called with:${gameId}, ${JSON.stringify(playerId)}, ${JSON.stringify(playerData)}`);
// //	console.log('Type of game.players:', game.players instanceof Map);

// 	const game = games.get(gameId);
// 	if (!game) throw new Error('Game not found');
// 	console.log('Before adding:', Array.from(game.players.entries()));
// 	game.players.set(playerId, playerData);
// 	console.log('After adding:', Array.from(game.players.entries()));
// }


// async function createGame(fastify, options) {
// 		const {secure} = options;
// 		fastify.post(API_PROTOCOL.CREATE_GAME.path, {
// 		},	async (request, reply) => {
// 		const {type, mode} = request.body;

// 	   try {

// 		const token = request.cookies.auth_token;
// 		log('CREATE_GAME', `checking token ${token}`);
// 		// this also verifies the token
// 		const user1 = secure.getUserIdFromToken(token); //this should throw bad session or something
// 	    log('CREATE_GAME', `checking id ${user1}`);
// 		// local or remote should be type, mode is vs or tournament
// 		const gameId = createGameMap(user1, type, mode);
// 		addPlayer(gameId, user1.id, {type: "login", ws: undefined, role: "player1", alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
// 		log('CREATE_GAME', `creat game results of game sessions ${JSON.stringify(getGame(gameId))}`);
// 		reply.send({ status: 'game created' , gameId});
// 	   } catch (err) {
// 	     reply.code(400).send({ error: 'Game initialization failed' });
// 	   }
// 	 });
// }

// async function joinGame(fastify, options) {
// 		const {secure} = options;
// 		fastify.post(API_PROTOCOL.JOIN_GAME.path, {
// 	}, async (request, reply) => {
// 	//type: guest/login/ai
// 	//mode:local/remote
// 		const {gameId, type, mode, username, password, player_count} = request.body;
// 		try {
// 			if (mode === "remote"){
// 				const token = request.cookies.auth_token;
// 			// this also verifies the token
// 				const userId = secure.getUserIdFromToken(token);
// 				addPlayer(gameId, userId.id, {type: "login", ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
// 			}
// 			else {

// 				const token = request.cookies.auth_token;
// 			// this also verifies the token
// 				const verifyUser = secure.getUserIdFromToken(token);
// 				console.log('justi usgage', verifyUser);
// 				let userId;
// 				if (type === "login") {
// 					userId = miniLogin(username, password);

// 					// if fails tell user can not register here
// 				}
// 				else if (type === "guest") {
// 					userId = 'Guest_' + generateRandomId();

// 				}
// 				else if (type === "ai") {
// 					userId = 'AI' + generateRandomId();
// 				}

// 				addPlayer(gameId, userId.id, {type: type, ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
// 				log('JOIN_GAME', `added player ${JSON.stringify(getGame(gameId))}`);
// 			}
// 				reply.send({ player: "player"+player_count, status: 'ready', });
// 				} catch (err) {
// 				reply.code(400).send({ error: 'player can not be added' });
// 		}


// 	});
// }

// async function startGame(fastify, options) {
// 		const {secure} = options;
// 		fastify.post(API_PROTOCOL.START_GAME.path, {
// 	}, async (request, reply) => {

// 	const {gameId} = request.body;
// 	log('START_GAME',`starting game`);
//     try {
// //		log('START_GAME',`debug1`);
// 		const token = request.cookies.auth_token;
// 		log('STAR_GAME', `checking tokn ${token}`);
// 		const userId = secure.getUserIdFromToken(token);
// 		log('START_GAME',`checking userId ${JSON.stringify(userId)}`);
// 		const game = getGame(gameId);
// 		log('START_GAME',`checking whats in game ${JSON.stringify(game)}`);
// 		if (!game) return reply.code(404).send({ error: 'Game not found' });
// 		log('START_GAME', `checking comparison game.owner and id ${JSON.stringify(game.owner)} ${JSON.stringify(userId)}`);
// 		if (game.owner.id !== userId.id) {
// 			log('START_GAME',`not owner of game`);
// 			return reply.code(403).send({ error: 'Only the owner can start the game' });
// 		}
// 		log('START_GAME',`debug0`);
//     	// Check players, if multiplayer this must be compared to player count
// 		if (game.players.size < 2) {
// 			log('START_GAME',`not enough players to start`);
// 			return reply.code(400).send({ error: 'Not enough players to start' });
// 		}
// 		log('START_GAME',`debug1`);
//     	// Generate WS tokens for each player unless ai?
// 		const playerTokens = {};
// 		for (const [playerId, playerData] of game.players) {
// 			const role = playerData.role;
// 			playerTokens[role] = secure.generateWsToken(playerId, gameId);
// 		}
// 		log('START_GAME',`debug2`);
// 		if (Object.keys(playerTokens).length < 2){
// 			log("player tokens is not the size of 2-----------------------------------");
// 		}
// 		game.phase = 'starting';
// 		// do i need to also send type and mode of the game
// 		//console.log("show me the tokens ", JSON.stringify(playerTokens[0], JSON.stringify(playerTokens[1])));
// 		reply.send({ status: 'ready', gameId, playerTokens });
// 		// if remote playe we would send each player seperatley to their own game.html, they would not go through the test harness anymore
// 		} catch (err) {
// 			reply.code(400).send({ error: 'Game initialization failed' });
// 		}


// //		const token = request.cookies.auth_token;
// //		// this also verifies the token
// //		const user1 = secure.getUserIdFromToken(token);
// //		//verify user1 is the owner of the gameid
// //		//Checks that all required players are present in games.get(gameId).players.
// //		// so if mode is vs check there are 2 players
// //
// //
// //
// //    	// Create game session
// //		const user1Token = generateWsToken(user1, gameId);
// //		const user2Token = generateWsToken(user2, gameId);


// 	  /** example on how these tokens might be created
// 	   * const player1Token = jwt.sign(
//   { playerId: user1.id, gameId: gameId, role: 'player1' },
//   secretKey,
//   { expiresIn: '15m' }
// );
// 	   */

//       // Return gameId and WebSocket token
// 	  // geneateWstoken is short lived and used once only to validate on game init.
// 	  // these can inlcude also game session id . remeber to apply reasonably experation
//       //reply.send({ status: 'ready', gameId, player1: user1Token, player2: user2Token });

//   });
// }

// async function gameRoutes(fastify, options) {
// 	await createGame(fastify, options);
// 	await startGame(fastify, options);
// 	await joinGame(fastify, options);
// 	getGame();
// 	generateRandomId();

// 	//await updateProfile(fastify, options);
// }


// module.exports = {gameRoutes, startGame, joinGame, createGame, getGame, generateRandomId};

// //front end connects to websocket like so
// /**async function gameRoutes(fastify, options) {
//   await createGame(fastify, options);
//   await startGame(fastify, options);
//   await joinGame(fastify, options);
// }
//  * const ws = new WebSocket('ws://localhost:3000/ws');

// ws.onopen = () => {
//   ws.send(JSON.stringify({
//     type: 'init',
//     gameId: 'abc123',
//     wsToken: 'secureTokenHere'
//   }));
// };

//  */

