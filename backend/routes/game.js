const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'game.js' });
// all these should be swapped for context files, either or
// 2 different approaches
const { miniLogin } = require('@db/get.js');
const signSchema = require('@schemas/signSchema.js');
const {log} = require('@logger');
//const {
//	getUserIdFromToken,
//	generateWsToken
//} = require('@security');

const { API_PROTOCOL } = require('@sharedApi');


const games = new Map(); // gameId -> { owner, players, state, loop }

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

/**
 * Creates a map for game object 
 * 
 * @param {*} owner who srated the game
 * @param {*} mode was prep for if remote play , not really required anymore , but left open for potential usage
 * @param {*} type type of player 2 , logged in, guest or ai
 * @returns new generated id used as key for game map , 
 */
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
	return games.get(gameId);
}

function deleteGame(gameId) {
  games.delete(gameId);
}


function addPlayer(gameId, playerId, playerData) {
	const game = games.get(gameId);
	if (!game) {
		flog.error({fucntion: "addplayer"}, 'error game not found');
		throw new Error('Game not found');
	}
	game.players.set(playerId, playerData);
//	flog.debug({function :"addplayer", players: Array.from(game.players.entries())}, 'After adding:');
}

function createGameCore(userId, type, mode, alias) {
	try{
		const gameId = createGameMap(userId, type, mode);
		if (userId)
			addPlayer(gameId, userId, {type: "login", ws: undefined, role: "player1", alias: alias, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
		return gameId;

	} catch {
		flog.error({ function: 'createGameCore', userId: userId, type: type, mode: mode, errormsg: err.message, errtpe: err.stack}, 'Error creating game core');
		throw new Error('Game initialization failed');
	}
}

/**
 * Creates a game and applies current user as player , should remote play be attempted must make sure to check who is owner of game , 
 * so second player can be added using join game instead.
 * @param {*} fastify 
 * @param {*} options 
 */
async function createGame(fastify, options) {
		const {secure} = options;
		fastify.post(API_PROTOCOL.CREATE_GAME.path, {
		},	async (request, reply) => {
		const {type, mode} = request.body;

	   try {

		const userId = request.userId;
		const gameId = createGameCore(userId, type, mode, undefined)
		reply.send({ status: 'game created' , gameId});
	   } catch (err) {
	     reply.code(400).send({ error: 'Game initialization failed' });
	   }
	 });
}

/**
 * checks player 2 relevent data , provides a token for player 2, if guest token will have word guest infront , if ai , token will have ai in front.
 * 
 * Second player is then added to game object and verification is sent to front end, 
 * 
 * This function is skipped in tournament logic.
 * @param {*} fastify 
 * @param {*} options 
 */
async function joinGame(fastify, options) {
		const {secure} = options;
        schema: signSchema,
		fastify.post(API_PROTOCOL.JOIN_GAME.path, {
	}, async (request, reply) => {
		const {gameId, type, mode, username, password, player_count} = request.body;
		try {
//			const verifyUser = request.userId;
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
			reply.send({ player: "player"+player_count, status: 'ready', });
			} catch (err) {
			reply.code(400).send({ error: 'player can not be added' });
		}


	});
}

/**
 * Checks game is existing and that both players have been loaded in, creates websoket tokens, 
 * which are shorted lived , these tokens will be used once , then the opened websocket is attahced to players.
 * 
 * 2 tokens are not necisarily needed, especially without remote play , this could be tweaked or utalized better
 * 
 * @param {*} reply from start game so function can send reply as it dosnt have fastify parameter
 * @param {*} secure from contex.js because parameters do not have option
 * @param {*} gameId id of the game we are starting , that has already loaded data
 * @returns 
 */
function startGameCore(reply, secure, gameId) {
		const game = getGame(gameId);
//		flog.warn({function: 'startGameCore', game: game, gameid: gameId}, 'checking that game exists ????????');
		if (!game) {
			return reply.code(404).send({ error: 'Game not found' });
		}
		if (game.players.size < 2) {
			return reply.code(400).send({ error: 'Not enough players to start' });
		}
		const playerTokens = {};
		for (const [playerId, playerData] of game.players) {
			const role = playerData.role;
			playerTokens[role] = secure.generateWsToken(playerId, gameId);
		}
//		log('START_GAME',`debug2`);
// this is for remot eplay but how is fronte end handling it 
		if (Object.keys(playerTokens).length < 2){
			flog.warn({function: "start game core"}, "player tokens is not the size of 2-----------------------------------");
		}
		game.phase = 'starting';
		return playerTokens;
}

/**
 * Opens and verifies game, sends websocket tokens to front end with relevant game id
 * @param {*} fastify 
 * @param {*} options check relevent contex.js
 */
async function startGame(fastify, options) {
		const {secure} = options;
		fastify.post(API_PROTOCOL.START_GAME.path, {
	}, async (request, reply) => {

	const {gameId} = request.body;
    try {
		const playerTokens = startGameCore(reply, secure, gameId);
		if (!playerTokens){
			return;
		}
		return reply.send({ status: 'ready', gameId, playerTokens });
		} catch (err) {
			flog.error({function: "startGame", errormsg: err.message, errorstack: err.stack}, "what error");
			return reply.code(400).send({ error: 'Game initialization failed' });
		}
  });
}

async function gameRoutes(fastify, options) {
	await createGame(fastify, options);
	await startGame(fastify, options);
	await joinGame(fastify, options);
	getGame();
	generateRandomId();
}


module.exports = {gameRoutes, startGame, joinGame, createGame, getGame, generateRandomId,
	createGameCore, addPlayer, startGameCore,
};


