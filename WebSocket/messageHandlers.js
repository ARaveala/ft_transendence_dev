
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

function handleMessage(ws, data) {
	
	const context = getGameContext(ws, data, playerinit);
	const {game, gameState} = context || {};

	currentWs = ws;
	switch (data.type) {
		case 'greet':
			handleGreet(currentWs, data);
			//console.log('Received greeting:', data.message);
			//ws.send('Hello back!');
			break;
		case 'ping':
			currentWs.send(JSON.stringify({ type: 'pong', payload: 'Pong!' }));
			break;
		case "pause": {
			if (gameState.loop) {
				clearInterval(gameState.loop);
				gameState.loop = undefined; // mark as stopped
				gameState.gameRunning = false; // optional flag
				paused = true;
				console.log("Game paused");
			}
			break;
		}
		case 'initPlayer':{
			// this fucntion dosnt care about if remote or local
//			initPlayer(currentWs, data);
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
//		case 'remotePlayerReady':
		case 'init': {
			initGame(gameState, data.payload); // payload = { height, width, ballSize, paddleSize, paddleOffset }
			currentWs.send(JSON.stringify({type: 'init_ack', message: 'game init success' }));
		}
			break;
		case 'keys':{
			//console.log("keys is triggering");
			updateKeys(gameState, data.payload); // update keys in game state
			break;
		}
		case "start_loop":{
			startLoop(currentWs, gameState);
			break;
		}
		case "reconnect": {
			paused = false; // may have future use
			reconnect = true; // may have future use
			currentWs.send(JSON.stringify(gameState.positions));
			if (!gameState.loop) {
				gameState.gameRunning = true;
				startLoop(currentWs, gameState);
				//gameState.loop = setInterval(() => {
				//	updateGame(gameState);
				//	currentWs.send(JSON.stringify(gameState.positions));
				//}, 1000 / gameState.fps);
				console.log("Game resumed");
				
			}
			break;
		}		
		default:
			console.error('Unknown message type:', data.type);
			currentWs.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}
}

module.exports = { handleMessage };

