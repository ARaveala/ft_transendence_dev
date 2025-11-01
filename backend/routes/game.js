const {logger} = require('@logger');
//const { createTournamentPlayer, getTournamentPlayerById } = require('../../database/tournament');
const flog = logger.child({ fileContext: 'game.js' });
// all these should be swapped for context files, either or
// 2 different approaches
const {
	miniLogin
} = require('@db/get.js');

const {log} = require('@logger');
//const {
//	getUserIdFromToken,
//	generateWsToken
//} = require('@security');

const { API_PROTOCOL } = require('@sharedApi');


const games = new Map(); // gameId -> { owner, players, state, loop }
// this fucntion maybe should handle 1 user at a Time,
// this insinuates cookie is sent, remember to include on front end

/**
 *
 * @param {*} gameId the game session identifier
 * @param {*} owner user who created the game
 *
 * @map key = gameId (the game session identifier)
 * 	values = {
 * 				owner (userId who created the game)
 * 				type (vs/tournament)
 * 				mode (local/remote)
 * 				state (gamestate ) createGameState()
 * 				loop (game loop)
 * 				phase (setup/play/pause/end) need more?
 * 				tid (tournament_id) // this may be undefined or only added on tournamnet creation 
 * 				players: (map of player details) key = playerId
 * 												values = {
 * 															type (guest/login/ai)
 * 														    ws (the websocket)
 * 															role (player1/player2)
 * 															alias (game nickname)
 * 															ready (boolean)
 * 															disconnectedAt (timestamp or undefined)
 * 															pauseTimeout (timeout handle or undefined)
 *
 * 														}
 * 				}
 */

function generateRandomId() {
  return Math.random().toString(36).substring(2, 10);
}

function createGameMap(owner, mode, type) {
	const gameId = generateRandomId();// may need to stringyfy
	games.set(gameId, {
		owner,
		type,
		mode,
		state: {},
		loop: undefined,
		phase: "setup",
		players: new Map(),
		payload: {
			fps: 60,
			height: 1,
    		width: 1,
    		ballSize: 1,
    		paddleHeight: 1,
			paddleWidth: 1,
    		paddleOffset: 1,
			paddleSpeed: 0,
			ballSpeed: 0,
            ballSpeedUp: 1,
			leftPaddleI: 0,
			rightPaddleI: 1,
			ballYI: 2,
			ballXI: 3,
			positions: [100, 100, 100, 100],
			ball: { dx: 3, dy: 1 },
			gameRunning: false,
			keysDown: [false, false, false, false],
			lastUpdate: undefined,
            powerups: false,
            visiblePowerups: new Array(),
            activePowerups: new Array(),
            firstHit: false
		}});
	return gameId;
}


function getGame(gameId) {
	log('GETGAME', 'geting game called');
	return games.get(gameId);
}

//function getPlayers(players, playerId) {
//	return
//}
function deleteGame(gameId) {
  games.delete(gameId);
}


function addPlayer(gameId, playerId, playerData) {
//	log('ADD_PLAYER',`addPlayer called with:${gameId}, ${JSON.stringify(playerId)}, ${JSON.stringify(playerData)}`);
//	console.log('Type of game.players:', game.players instanceof Map);

	flog.debug({function: "addplayer"}, 'checking add player initilized');
	const game = games.get(gameId);
	if (!game) {
		flog.error({fucntion: "addplayer"}, 'error game not found');
		throw new Error('Game not found');
	}
	console.log('Before adding:', Array.from(game.players.entries()));
	game.players.set(playerId, playerData);
	flog.debug({function :"addplayer", players: Array.from(game.players.entries())}, 'After adding:');
}
//player role also send
function createGameCore(userId, type, mode, alias) {
	try{
//		flog.debug({function : "createGameCore"});

		flog.warn({function: "createGameCore"}, "CREATEGAMECORE HAS BEEN INITIATED");
		//if (userId === undefined)
		//{
		//	if undefined no owner 
		//}
		//flog.debug({function: 'createGameCore', id: userId, type: type, mode: mode, alias: alias}, "entering the fucntion now ");
		const gameId = createGameMap(userId, type, mode);
		//flog.debug({function : "createGameCore", gameid: gameId}, 'did game id get made');
		//flog.debug({function: 'createGameCore', gameId}, 'game id should be created')
		if (userId)
			addPlayer(gameId, userId.id, {type: "login", ws: undefined, role: "player1", alias: alias, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
		return gameId;

	} catch {
		flog.error({ function: 'createGameCore', userId: userId, type: type, mode: mode, errormsg: err.message, errtpe: err.stack}, 'Error creating game core');
		throw new Error('Game initialization failed');
	}
}

async function createGame(fastify, options) {
		const {secure} = options;
		fastify.post(API_PROTOCOL.CREATE_GAME.path, {
		},	async (request, reply) => {
		const {type, mode} = request.body;

	   try {

		const token = request.cookies.auth_token;
		//log('CREATE_GAME', `checking token ${token}`);
		// this also verifies the token
		const user1 = secure.getUserIdFromToken(token); //this should throw bad session or something
	    flog.warn({function: 'CREATE_GAME', userid: user1}, `checking id `);
		const gameId = createGameCore(user1, type, mode, undefined)
	//    flog.warn({function: 'CREATE_GAME', userid: gameId}, `checking gameid `);

		// local or remote should be type, mode is vs or tournament
		//const gameId = createGameMap(user1, type, mode);
		//addPlayer(gameId, user1.id, {type: "login", ws: undefined, role: "player1", alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
		//log('CREATE_GAME', `creat game results of game sessions ${JSON.stringify(getGame(gameId))}`);
		reply.send({ status: 'game created' , gameId});
	   } catch (err) {
	     reply.code(400).send({ error: 'Game initialization failed' });
	   }
	 });
}

async function joinGame(fastify, options) {
		const {secure} = options;
		fastify.post(API_PROTOCOL.JOIN_GAME.path, {
	}, async (request, reply) => {
	//type: guest/login/ai
	//mode:local/remote
		const {gameId, type, mode, username, password, player_count} = request.body;
		try {
			if (mode === "remote"){
				const token = request.cookies.auth_token;
			// this also verifies the token
				const userId = secure.getUserIdFromToken(token);
				addPlayer(gameId, userId.id, {type: "login", ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
			}
			else {

				const token = request.cookies.auth_token;
			// this also verifies the token
				const verifyUser = secure.getUserIdFromToken(token);
				console.log('justi usgage', verifyUser);
				let userId;
				if (type === "login") {
					const idObj = await miniLogin(username, password);
					userId = idObj.id;

					// if fails tell user can not register here
				}
				else if (type === "guest") {
					userId = 'Guest_' + generateRandomId();

				}
				else if (type === "ai") {
					userId = 'AI' + generateRandomId();
				}

				addPlayer(gameId, userId, {type: type, ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
				log('JOIN_GAME', `added player ${JSON.stringify(getGame(gameId))}`);
			}
				reply.send({ player: "player"+player_count, status: 'ready', });
				} catch (err) {
				reply.code(400).send({ error: 'player can not be added' });
		}


	});
}


function startGameCore(secure, gameId) {
		const game = getGame(gameId);
		flog.warn({function: 'startGameCore', game: game, gameid: gameId}, 'checking that game exists ????????');
		if (!game) return reply.code(404).send({ error: 'Game not found' });
				if (game.players.size < 2) {
			log('START_GAME',`not enough players to start`);
			return reply.code(400).send({ error: 'Not enough players to start' });
		}
		//log('START_GAME',`debug1`);
    	// Generate WS tokens for each player unless ai?
		const playerTokens = {};
		for (const [playerId, playerData] of game.players) {
			const role = playerData.role;
			playerTokens[role] = secure.generateWsToken(playerId, gameId);
		}
//		log('START_GAME',`debug2`);
		if (Object.keys(playerTokens).length < 2){
			log("player tokens is not the size of 2-----------------------------------");
		}
		game.phase = 'starting';
		return playerTokens;
		// do i need to also send type and mode of the game
		//console.log("show me the tokens ", JSON.stringify(playerTokens[0], JSON.stringify(playerTokens[1])));


}

async function startGame(fastify, options) {
		const {secure} = options;
		fastify.post(API_PROTOCOL.START_GAME.path, {
	}, async (request, reply) => {

	const {gameId} = request.body;
	log('START_GAME',`starting game`);
    try {
//		log('START_GAME',`debug1`);
		const token = request.cookies.auth_token;
		const userId = secure.getUserIdFromToken(token);

		const playerTokens = startGameCore(secure, gameId);
		//flog.warn({fucntion: "startgame", playerTokens, playerTokens},"checking tokens valid ");
		reply.send({ status: 'ready', gameId, playerTokens });
		// if remote playe we would send each player seperatley to their own game.html, they would not go through the test harness anymore
		} catch (err) {
			flog.error({function: "startGame", errormsg: err.message, errorstack: err.stack}, "what error");
			reply.code(400).send({ error: 'Game initialization failed' });
		}


//		const token = request.cookies.auth_token;
//		// this also verifies the token
//		const user1 = secure.getUserIdFromToken(token);
//		//verify user1 is the owner of the gameid
//		//Checks that all required players are present in games.get(gameId).players.
//		// so if mode is vs check there are 2 players
//
//
//
//    	// Create game session
//		const user1Token = generateWsToken(user1, gameId);
//		const user2Token = generateWsToken(user2, gameId);


	  /** example on how these tokens might be created
	   * const player1Token = jwt.sign(
  { playerId: user1.id, gameId: gameId, role: 'player1' },
  secretKey,
  { expiresIn: '15m' }
);
	   */

      // Return gameId and WebSocket token
	  // geneateWstoken is short lived and used once only to validate on game init.
	  // these can inlcude also game session id . remeber to apply reasonably experation
      //reply.send({ status: 'ready', gameId, player1: user1Token, player2: user2Token });

  });
}

async function gameRoutes(fastify, options) {
	await createGame(fastify, options);
	await startGame(fastify, options);
	await joinGame(fastify, options);
	getGame();
	generateRandomId();

	//await updateProfile(fastify, options);
}
//module.exports = gameRoutes;

module.exports = {gameRoutes, startGame, joinGame, createGame, getGame, generateRandomId,
	createGameCore, addPlayer, startGameCore,
};

//front end connects to websocket like so
/**async function gameRoutes(fastify, options) {
  await createGame(fastify, options);
  await startGame(fastify, options);
  await joinGame(fastify, options);
}
 * const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'init',
    gameId: 'abc123',
    wsToken: 'secureTokenHere'
  }));
};

 */

