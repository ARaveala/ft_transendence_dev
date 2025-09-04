
const {
	createGameState, initGame, updateKeys, updateGame
} = require('../pong_game/pong_server.js');

const {
  handleGreet,
  //handleMove,
  //handleConnection,
  //handlePing
} = require('./handlers.js');
// we should rename this to message deligation?

//const games = new Map(); // matchId -> gameState
// let state = games.get(matchId);

// guarding send calls
//if (webSocket.readyState === WebSocket.OPEN) {
//  webSocket.send(JSON.stringify(keysDown));
//}

let gameState;

function handleMessage(ws, data) {

	switch (data.type) {
		case 'greet':
			handleGreet(ws, data);
			//console.log('Received greeting:', data.message);
			//ws.send('Hello back!');
			break;
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong', payload: 'Pong!' }));
			break;
		
		case 'init': {
			console.log("game init is activated ", data.payload);
			gameState = createGameState();
			initGame(gameState, data.payload); // payload = { height, width, ballSize, paddleSize, paddleOffset }
			ws.send(JSON.stringify(gameState.positions));
			gameState.loop = setInterval(() => {
				updateGame(gameState);
				ws.send(JSON.stringify(gameState.positions));
			}, 1000 / gameState.fps);

		}
			break;
		case 'keys':
			updateKeys(gameState, data.payload); // update keys in game state
			break;
		default:
			console.error('Unknown message type:', data.type);
			ws.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}
}

module.exports = { handleMessage };