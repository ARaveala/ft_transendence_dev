// this fucntion maybe should handle 1 user at a Time, 
//

async function startGame(fastify, options) {
 		const {?, ?} = options;
		fastify.post(API_PROTOCOL.START_GAME.path), {
  	}, async (request, reply) => {
    
	const { user1, user2, isUser2Guest } = request.body;

    try {
      // Validate player1 from cookie/session
      const user1 = await verifyUser(request.cookies.user1Token);

      let user2;//what this do 
      if (!isUser2Guest) {
        user2 = await verifyUser(request.cookies.user2Token);
      } else {
        user2 = { alias: user2.alias || 'Guest_' + generateRandomId() };
      }

      // Create game session
      const gameId = createGameSession(user1, user2); // this is database?
	  const user1Token = generateWsToken(user1, gameId);
	  const user2Token = generateWsToken(user2, gameId);
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
      reply.send({ status: 'ready', gameId, player1: user1Token, player2: user2Token });
    } catch (err) {
      reply.code(400).send({ error: 'Game initialization failed' });
    }
  });
}

 


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

