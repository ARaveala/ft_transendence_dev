const {
	createGameState, initGame, updateKeys, updateGame
} = require('../pong_game/pong_server.js');

const {
	games,
	getGame
} = require('@Rgame');

const {
	verifyToken
} = require('@security');

function handleGreet(ws, data){
		console.log('Received greeting:', data.message);
		ws.send('Hello back!');
}

function startLoop(ws, gameState) {
	ws.send(JSON.stringify({type: "update_game", data: gameState.positions}));
	gameState.loop = setInterval(() => {
		//const test = gameState.keysDown;
		//for (const [key, value] of Object.entries(test)) {
		//  if (value === true) {
		//    console.log(`${key} turned true in gameState`);
		//  }
		//}
		//console.log("Keys at loop tick:", gameState.keysDown);

		updateGame(gameState);
		ws.send(JSON.stringify({type: "update_game", data: gameState.positions}));
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
function initPlayer(ws, token) {
  //const { token} = data;
  //console.log("CHEKCING:: initplayer is getting players", Array.from(players.entries()));
  const session = verifyToken(token)//n(token, gameId); own fucntion here 
	console.log("whats in session", session);
  if (!session) {
    ws.send(JSON.stringify({ error: 'Invalid session' }));
    ws.close();
    return;
  }

  attachPlayerToGame(ws, session);
  console.log("player inited");
//  ws.send(JSON.stringify({ status: 'connected ', playerId: session.playerId }));
}
//once both players have connected front end sends yes and we start the game 

function attachPlayerToGame(ws, session) {
	//const game = getGame(session.gameId);
	ws.playerId = session.id;
	ws.gameId = session.gameId;

	const game = getGame(ws.gameId);
	//if (!game) return false;
    const player = game.players.get(ws.playerId);
	if (!player) {
		ws.send(JSON.stringify({ error: 'Player not found in game' }));
		ws.close();
		return;
	}
	player.ws = ws;	
	//console.log("CHEKCING:: initplayer after updating", Array.from(players.entries()));
	return true;
}

function getGameContext(ws, data, playerinit) {
    if (!playerinit) return undefined;

    const gameId = ws.gameId || Number(data.gameId); // i would like to remove the need for this at all for saftey 
    const game = getGame(gameId);
    if (!game) return undefined;

    return {
        game,
        gameState: game.payload
    };
}
module.exports = {handleGreet, startLoop, initPlayer, getGameContext}

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
