//  CREATE_TOURNAMENT: {
//    path:'/tournament',
//    method: 'POST',
//  },
//
//  JOIN_TOURNAMENT: {
//    path:'/tournament/:id/join',
//    method: 'POST',
//  },
//
//  START_TOURNAMENT: {
//    path:'/tournament/:id/start',
//    method: 'POST',
//  },
//
//  TOURNAMENT_STATE: {
//    path: '/tournament/:id/state',
//    method: 'POST',
//  }


async function createTournament(fastify, options) {
	const {secure, ?} = options;
	fastify.method(API_PROTOCOL.WAHT), {
	//schema: updateScoreSchema??,
	
		try {
			// one user creates the tournament? 
			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			// how many slots 
			// where does aliases go? connected t original name or do we make new cookie?
			// can cookie be deleted? 
			const result = await DBupdate.createTournamentTable({userId, score});
			reply.send(result); // result is tabled filled with names?
		} catch (err) {
			reply.code(500).send(err);
		}
	}
	//});
}