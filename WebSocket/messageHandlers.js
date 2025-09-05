
const {
	createGameState, initGame, updateKeys, updateGame
} = require('../pong_game/pong_server.js');

const {
  handleGreet,
  startLoop,
  //handleMove,
  //handleConnection,
  //handlePing
} = require('./handlers.js');

const {
	games
} = require("@Rgame");
// we should rename this to message deligation?

//const games = new Map(); // matchId -> gameState
// let state = games.get(matchId);

// guarding send calls
//if (webSocket.readyState === WebSocket.OPEN) {
//  webSocket.send(JSON.stringify(keysDown));
//}

//let gameState;
let currentWs;
let paused = false;
let reconnect = false;

function handleMessage(ws, data) {
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
			if (initPlayer(currentWs, data));
			// send status data.player ready, gameid?, 
			// update a player init, wait for second before full true
			break;
		}
//		case 'remotePlayerReady':
		case 'init': {
			console.log("game init is activated ", data.payload);

			const gameState = games.get(data.gameId);
			createGameState();
//games.get(data.gameId);

			initGame(gameState, data.payload); // payload = { height, width, ballSize, paddleSize, paddleOffset }
			games.set(data.gameId, gameState);
			
			startLoop(currentWs, gameState);
			//currentWs.send(JSON.stringify(gameState.positions));
			//	gameState.loop = setInterval(() => {
			//		updateGame(gameState);
			//		currentWs.send(JSON.stringify(gameState.positions));
			//	}, 1000 / gameState.fps);
			
		}
			break;
		case 'keys':
			updateKeys(gameState, data.payload); // update keys in game state
			break;
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
			//currentWs.send(JSON.stringify({ type: "resume-game" }));
		//	const player = players.get(data.playerId);
		//	if (player) {
		//		clearTimeout(player.pauseTimeout);
		//		player.ws = ws;
		//		// Resume game logic
		//		console.log(`Player ${data.playerId} reconnected`);
		//	} else {
		//		// new player
		//	}
			break;
		}		
		default:
			console.error('Unknown message type:', data.type);
			currentWs.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}
}

module.exports = { handleMessage };

