
const {
	createGameState, initGame, updateKeys, updateGame
} = require('../pong_game/pong_server.js');

const {
  handleGreet,
  startLoop,
  initPlayer,
  getGameContext,
  //handleMove,
  //handleConnection,
  //handlePing
} = require('./handlers.js');

const {
	getGame,
} = require("@Rgame");
// we should rename this to message deligation?

const {log} = require('@logger');
//const games = new Map(); // matchId -> gameState
// let state = games.get(matchId);

// guarding send calls
//if (webSocket.readyState === WebSocket.OPEN) {
//  webSocket.send(JSON.stringify(keysDown));
//}

//let gameState;
let currentWs;
let playerinit = false;
let paused = false;
let reconnect = false;
// if remote play , each player should have its own set of keys , that are clearly 
// attatched to the relative paddles 
/**
 * 
gameState.keys = {
  player1: { up: false, down: false },
  player2: { up: false, down: false }
};

 */
function handleMessage(ws, data) {
	
	const context = getGameContext(ws, data, playerinit);
	const {game, gameState} = context || {};

	currentWs = ws; // this will have to be changed for remote play
	switch (data.type) {
		case 'greet':
			handleGreet(currentWs, data);
			break;
		case 'ping':
			currentWs.send(JSON.stringify({ type: 'pong', payload: 'Pong!' }));
			break;
		case "pause": {
				console.log("Game paused");

			if (gameState.loop) {

				clearInterval(gameState.loop);
				gameState.loop = undefined; // mark as stopped
				gameState.gameRunning = false; // optional flag
				paused = true;
			}
			break;
		}
		case 'initPlayer':{
			// this fucntion dosnt care about if remote or local
			console.log("starting player init");
			initPlayer(currentWs, data.token);
			//if (game.type === 'local'){
			//	// just verify player2 . or we can attatch the webscoket but its of no use
			//	//initPlayer();
			//}

			// send status data.player ready, gameid?, 
			// update a player init, wait for second before full true
			log('PLAYER INIT CASE::', "after init ");
			playerinit = true;
			console.log("finnished player init");
			currentWs.send(JSON.stringify({type: 'playerInit_ack', message: 'player init success' }));
			break;
		}
		case 'init': {
			// if remote initgame should only happen for player1
			initGame(gameState, data.payload); // payload = { height, width, ballSize, paddleSize, paddleOffset }
			currentWs.send(JSON.stringify({type: 'init_ack', message: 'game init success' }));
		}
			break;
		case 'keys':{
			// if remote update keys should somehow update keys for both players at the same time
			/**
			 * const playerId = ws.playerId;
				gameState.keys[playerId/orsomething] = payload;

			 */
			updateKeys(gameState, data.payload); // update keys in game state
			break;
		}
		case "start_loop":{
			// if remote this should only start once player 1 and player 2 have initilized and player 1 has initilized the game
			// then this should be updated to startloop for both player websockets
			startLoop(currentWs, gameState);
			break;
		}
		case "reconnect": {
			paused = false; // may have future use, should be stored in game object
			reconnect = true; // may have future use, not sure
			currentWs.send(JSON.stringify(gameState.positions));
			if (!gameState.loop) {
				gameState.gameRunning = true;
				startLoop(currentWs, gameState);
				console.log("Game resumed");
			}
			break;
		}
		// i dont know how this would work , where is the score update coming from 
		// does the internally update it? 
		//case "updateScore": {
		//	// this should be called by the game loop only , not by the client
		//	// if remote this should update both players websockets
		//	if (gameState.gameRunning) {
		//		updateScores(gameState);
		//	}
		//	break;
		//send current scores , front end checks if scores meet win condition?
		//	currentWs.send(JSON.stringify({ type: 'score_update', player1: gameState.players.player1.score, player2: gameState.players.player2.score }));
		//	break;
		//}
		case "end": {
			// do we use game phase === end to detemrine this? or does front end send me it in this case 
			//update scores in database
			// stop game loop
			// send final scores to both players
			// clean up game state
			console.log("Game ended");
			const player1 = Object.values(game.players).find(player => player.role === "player1");
			const player2 = Object.values(game.players).find(player => player.role === "player2");
			//isntead of clearing everything here , send me a game end confrimed message so i can clean up and close the webscokets
			//if (gameState.loop) {
			//	clearInterval(gameState.loop);
			//	gameState.loop = undefined; // mark as stopped
			//	gameState.gameRunning = false; // optional flag
			//	paused = false;
			//	reconnect = false;
			//}
			currentWs.send(JSON.stringify({ type: 'game_end', payload: gameState.positions, player1: player1.score, player2: player2.score }));
			}		
			break;
		case "close": {
			// this should be called when a player closes the webscoket or navigates away
			// stop game loop
			// notify other player
			// clean up game state
			console.log("Game closed by player");
			//if (gameState.loop) {
			//	clearInterval(gameState.loop);
			//	gameState.loop = undefined; // mark as stopped
			//	gameState.gameRunning = false; // optional flag
			//	paused = false;
			//	reconnect = false;
			//}
			currentWs.send(JSON.stringify({ type: 'game_closed', message: 'Game closed by player' }));
		}
			break;
		default:
			console.error('Unknown message type:', data.type);
			currentWs.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}
}

module.exports = { handleMessage };

/** example of how 2 websockets can communicate or get updates at the same time
 * for (const player of game.players.values()) {
  if (player.ws && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify({ type: 'start_game', payload: game.payload }));
  }
}

 */

/** example of looping through players to chekc ready status and open status , to start game loop
 * const allReady = Array.from(game.players.values()).every(p => p.ready);
if (allReady) {
  for (const p of game.players.values()) {
    if (p.ws && p.ws.readyState === WebSocket.OPEN) {
      p.ws.send(JSON.stringify({ type: 'start_game', payload: game.payload }));
    }
  }
 */