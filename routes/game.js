// all these should be swapped for context files, either or
// 2 different approaches
const {
	miniLogin
} = require('@database/get.js');

const {
	getUserIdFromToken,
	generateWsToken
} = require('@security');

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
 * 				players: (map of player details) key = playerId 
 * 												values = {
 * 															type (guest/login/ai)
 * 														    ws (the websocket)
 * 															role (player1/player2)
 * 															alias (game nickname)
 * 																 			
 * 														}
 * 				}
 */

function generateRandomId() {
  return Math.random().toString(36).substring(2, 10);
}

function createGameMap(owner, mode, type) {
	const gameId = 1;// 1 for testing now //crypto.randomUUID(); // or generateRandomId()
	games.set(gameId, { 
		owner,
		type,
		mode,
		state: {},
		loop: undefined,
		phase: "setup",
		players: new Map()});
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
  if (!game) throw new Error('Game not found');

  game.players.set(playerId, playerData);
}


async function createGame(fastify, options) {
 		const {secure} = options;
		fastify.post(API_PROTOCOL.START_GAME.path), {
  	}, async (request, reply) => {
    
	const {type, mode} = request.body;

    try { 
		
		const token = request.cookies.auth_token;
		// this also verifies the token
		const user1 = secure.getUserIdFromToken(token); //this should throw bad session or something
      // Create game session
//      	const gameId = createGameSession(); // this is database?
		// local or remote should be type, mode is vs or tournament
		const gameId = createGameMap(user1, "local", "vs");
		addPlayer(gameId, user1, {type: "login", ws: undefined, role: "player1", alias: undefined});
      reply.send({ status: 'game created' , gameId});
    } catch (err) {
      reply.code(400).send({ error: 'Game initialization failed' });
    }
  };
}

async function joinGame(fastify, options) {
 		const {secure} = options;
		fastify.post(API_PROTOCOL.JOIN_GAME.path), {
  	}, async (request, reply) => {
	//type: guest/login/ai
	//mode:local/remote
		const {gameId, type, mode, username, password, player_count} = request.body;
		const userId;
		// should be a try catch
		try {
			if (mode == "remote"){
				const token = request.cookies.auth_token;
			// this also verifies the token
				userId = secure.getUserIdFromToken(token);
				addPlayer(gameId, userId, {type: "login", ws: undefined, role: "player"+player_count, alias: undefined});
			}
			else {

				const token = request.cookies.auth_token;
			// this also verifies the token
				userId = secure.getUserIdFromToken(token);

				if (type = "login") {
					userId = miniLogin(username, password);

					// if fails tell user can not register here
				}
				else if (type = "guest") {
			        userId = 'Guest_' + generateRandomId();

				}
				else if (type = "ai") {
			        userId = 'AI' + generateRandomId();
				}

				addPlayer(gameId, userId, {type: type, ws: undefined, role: "player"+player_count, alias: undefined});

			}
				reply.send({ player: "player"+player_count, status: 'ready', });
	  		} catch (err) {
	  		  reply.code(400).send({ error: 'player can not be added' });
  		}

	
	};
}

async function startGame(fastify, options) {
 		const {secure} = options;
		fastify.post(API_PROTOCOL.START_GAME.path), {
  	}, async (request, reply) => {
    
	const {gameId} = request.body;

    try { 

		//const { gameId } = req.body;
    	const userId = secure.getUserIdFromToken(req.cookies.auth_token);

    	const game = games.get(gameId);
    	if (!game) return reply.code(404).send({ error: 'Game not found' });

    	if (game.owner !== userId) {
    	  return reply.code(403).send({ error: 'Only the owner can start the game' });
    	}

    	// Check players, if multiplayer this must be compared to player count
    	if (game.players.size < 2) {
    	  return reply.code(400).send({ error: 'Not enough players to start' });
    	}

    	// Generate WS tokens for each player unless ai?
    	const playerTokens = {};
    	for (const [playerId, playerData] of game.players) {
    	  playerTokens[playerId] = secure.generateWsToken(playerId, gameId);
    	}

    	game.phase = 'starting';
		// do i need to also send type and mode of the game 
    	reply.send({ status: 'ready', gameId, playerTokens });
  		} catch (err) {
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

  };
}

async function gameRoutes(fastify, options) {
	await startGame(fastify, options);
	await joinGame(fastify, options);
	//await updateProfile(fastify, options);
}
module.exports = {startGame, joinGame};

//front end connects to websocket like so 
/**
 * const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'init',
    gameId: 'abc123',
    wsToken: 'secureTokenHere'
  }));
};

 */

