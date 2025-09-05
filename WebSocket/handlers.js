const {
	createGameState, initGame, updateKeys, updateGame
} = require('../pong_game/pong_server.js');

const {
	games
} = require('@Rgame');


function handleGreet(ws, data){
		console.log('Received greeting:', data.message);
		ws.send('Hello back!');
}

function startLoop(ws, gameState) {
	ws.send(JSON.stringify(gameState.positions));
	gameState.loop = setInterval(() => {
		updateGame(gameState);
		ws.send(JSON.stringify(gameState.positions));
	}, 1000 / gameState.fps);
			
}

/**
 * reminder of how the token may look
const player1Token = jwt.sign(
  { playerId: user1.id, gameId: gameId, role: 'player1' },
  secretKey,
  { expiresIn: '15m' }
);
 */

// each player must send their own init 
function initPlayer(ws, data) {
  const { token, gameId } = data;
  const session = validateWsToken(token, gameId);
  if (!session) {
    ws.send(JSON.stringify({ error: 'Invalid session' }));
    ws.close();
    return;
  }

  attachPlayerToGame(ws, session);
  ws.send(JSON.stringify({ status: 'connected ', playerId: session.playerId }));
}
//once both players have connected front end sends yes and we start the game 


//this attatches the ws object to the ingame memeory 
function attachPlayerToGame(ws, session) {
	const game = games.get(session.gameId);
	if (!game) return false;
	if (session.role === 'player1') {
	  game.player1.ws = ws;
	} else if (session.role === 'player2') {
	  game.player2.ws = ws;
	}	
	return true;
}
module.exposrts = {handleGreet, startLoop, initPlayer}

/** example of an active game body
 * activeGames.get('abc123') === {
  player1: {
    id: 'user123',
    alias: 'PlayerOne',
    ws: WebSocketObject // now attached
  },
  player2: {
    id: 'user456',
    alias: 'PlayerTwo',
    ws: null // until they connect
  },
  state: {
    score: { player1: 0, player2: 0 },
    ballPosition: { x: 100, y: 200 },
    status: 'waiting'
  }
}
 */

// and send like this game.player1.ws.send(JSON.stringify({ type: 'opponentMove', direction: 'left' }));
