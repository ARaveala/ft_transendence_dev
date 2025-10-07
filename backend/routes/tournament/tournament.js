
const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');

const flog = logger.child({ fileContext: 'tournament.js' }); // scoped logger



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
						  players: TournamentPlayer[]; remove username and password ffrom response
						  currentMatch?: Match;
						  bracket: Match[][];
						  winner?: TournamentPlayer;
						  createdAt?: Date;               // not sure if this is needed
						  lastUpdated?: Date              // not sure if this is needed 
						}
}
						export interface CreateTournamentPayload {
  max_players?: number;
}

export interface TournamentStateResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}
 */
//async function createTournamentObject(){
//
//}

async function createTournament(fastify, options){
	const {secure, game} = options;
	fastify.route({
		method: API_PROTOCOL.CREATE_TOURNAMENT.method,
		url: API_PROTOCOL.CREATE_TOURNAMENT.path,
		handler: async (request, reply) => {
			const max_players = request.body;
			flog.debug({ function: 'createTournament' }, 'request body:', request.body);

			flog.debug({function: 'createTournament'}, 'checking max player body', max_players);
			try{
				const token = request.cookies.auth_token;
				const userId = secure.getUserIdFromToken(token)
				flog.debug({function: 'createTournament'}, 'user id is ', userId);
				//useridcheck
				let tournamentStatus = {
					tournament_id: game.generateRandomId(),
					status: 'waiting',
					players: [],
					currentMatch: [],//,undefined, //Match,
					bracket: [], //Match[][]
					winner: undefined,
					createdAt: undefined,
					lastUpdated: undefined
				}
				reply.code(200).send({status: 'OK', tournament: tournamentStatus});
			}
			catch (err){
				flog.error({fucntion: 'createTournament'}, "error ::", err);
			}
		}
	});
}

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
 * recive player role: username password
 * 6.0 verify each player individually
 * add verified player with id  to the tournament object, label as verified and label role
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
/**
 * add alias function simple player role , gets this alias
 * 
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
 * @return updated tournament states 
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

 * set up prepared brackets for round1 round2, logic is low rank high rank else randomize 
 * 
 * @param {*} fastify 
 * @param {*} options
 * @return export interface StartTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament: TournamentState;
}
 */

/**
 * 11?12. what is needed from me here ? when a game is started , a new token generation needs to happen
 * this is sent to websocket to verify , since we cant use cookies to verify with websockets , it
 * must be manually sent. 
 * @param {*} fastify 
 * @param {*} options 
 */
//async function createTournament(fastify, options) {
//	const {secure, ?} = options;
//	fastify.method(API_PROTOCOL.WAHT), {
//	//schema: updateScoreSchema??,
//	
//		try {
//			// one user creates the tournament? 
//			const token = request.cookies.auth_token;
//			const userId = secure.getUserIdFromToken(token);
//			// how many slots 
//			// where does aliases go? connected t original name or do we make new cookie?
//			// can cookie be deleted? 
//			const result = await DBupdate.createTournamentTable({userId, score});
//			reply.send(result); // result is tabled filled with names?
//		} catch (err) {
//			reply.code(500).send(err);
//		}
//	}
//	//});
//}

async function tournamentRoutes(fastify, options) {
	await createTournament(fastify, options);

}

module.exports = tournamentRoutes;