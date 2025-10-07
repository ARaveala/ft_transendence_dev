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



/**
 * queastions 
 * 
 * are you storing game states locally in front end? we would then both be doing local stoarge of game 
 * 
 * step 2. u want a drop down of all registered players? this could be a rather large list potentially. 
 * u mention a drop down of all matching users, no user can have the same username ..is this needed?
 * 
 * why does step 5 then need a username section if player is chosen from the list? 
 * 
 * step 10 do what do u need match id for? 
 * 
 * i assumed when all players have readied , tournament bracket is readied, this is aall labaled in the 
 * tournament object , round1 round2 , in theory we maybe only need to wait for winner response , refresh page
 * to show start next tournament ?  
 */
/**
 * 1.create tournament receiveing only max numbers?
 * (look at api calls)
 * readies the tournament object 
 * createds a tournament id
 * adds the creating user to the tournament as player 1
 * sends response (look at payloads)
 * @param {*} fastify 
 * @param {*} options 
 * @return export interface TournamentStateResponse {
						  status: 'OK' | 'ERROR';
						  error?: string;
						  tournament: 
						   tournament_id: string; this will be updated
						  status: 'waiting' this will be status         | 'ongoing' | 'finished';
						  players: TournamentPlayer[];
						  currentMatch?: Match;
						  bracket: Match[][];
						  winner?: TournamentPlayer;
						  createdAt?: Date;               // not sure if this is needed
						  lastUpdated?: Date              // not sure if this is needed 
						}
}
 */

/**
 * 2. maybe request all registered players
 * find all registered players, return them , risky if there are 1000's , 
 * if someone 
 * tested our work by writing a script to add 1000 players will this be an issue.
 * @param {*} fastify 
 * @param {*} options
 * @return export interface PlayerSearchResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  players: TournamentPlayer[]; // filtered list of players filtered by what ????
}
 */

/**
 * 3,4,5 are front end only?
 */
/**
 * 6.0 verify each player individually
 * add verified player with id and alias to the tournament object, label as verified and label role
 * send response for each verified player (look at payloads)
 * if max players reached set tournament to ready send all players ready
 * front end validates some input
* @param {*} fastify 
 * @param {*} options
 * @return export interface VerifyPlayerResponse {
  valid: boolean;
  error?: string;
}
 */

// 7 front end
/**
 * 

 * 8. remove player from tournament
 * if player wishes to remove themselves , recive request , request should state player role 
 * such as player2, player will be removed from object
 * if tournament was ready it will be set to not ready
 * send response (look at payloads) should inform how many players are left
 * @param {*} fastify 
 * @param {*} options 
 */

//9 front end

/**
 * 
 * ABOSLUTE NONO
 * export interface StartTournamentPayload {
  tournament_id: string; //also not potentially required , as the user , with cookie, 
  is determined as tournament owner , this way we will know which tournamnet is in progress
  players: {
    username: string; why do u need this 
    alias: string;
    password?: string; //NEVER
    isSelf?: boolean;
  }[];
}
 * 10 starttorunament
 * i dont understand what u need match id for, user id should not be raw in frontend if at all
 * this could set up prepared brackets for round1 round2, so when play match is pressed 
 * data from here about which round could already be taken .?
 * @param {*} fastify 
 * @param {*} options
 * @return export interface StartTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;//again what does this mean 
}
 */

/**
 * 11?12. what is needed from me here ? when a game is started , a new token generation needs to happen
 * this is sent to websocket to verify , since we cant use cookies to verify with websockets , it
 * must be manually sent. 
 * @param {*} fastify 
 * @param {*} options 
 */
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