
const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
//const { createTournamentPlayer, getTournamentPlayerById } = require('../../database/tournament');
const flog = logger.child({ fileContext: 'tournamnet.js' });

//this is so i can utalize as a utility function from outside this file scope
const  {
//const {DBtour} = options;
	getTournamentPlayersWithUsernames,
	getActiveTournamentStatus,
	getBrackets,
 
} = require('@db/tournament.js');


let currentTournamentId = null; // global variable to track current tournament id
/**
 * consideration bank 
 * 
 * for when we need tournamnet id , now we use global variable to track current tournamnet id
 * function getCurrentTournamentId(req) {
  return req.session.tournamentId || null;
}

 */
/**
 * 
 * @param {*} players player object containing all existing players from db
 * @returns all players inside db tournament player object , filling empty slots with placeholders, player
 * object has been cleaned , so that eg, no user ids are sent to front end
 */
function buildTournamentPlayerList(players) {
	const fullPlayerList = [];
//	flog.debug({function: 'buildTournamentPlayerList', players: players}, 'building full player list ');
	for (let i = 1; i <= 4; i++) {
		const player = players.find(p => p.player_role === `player${i}`);

	if (player) {
		//flog.debug({function: 'buildTournamentPlayerList', playerrole: player.role}, `////checking ownership////// `);

		fullPlayerList.push({
			username:  player.username || "", // fallback if user not assigned,
			alias: player.alias,
			role: player.player_role,
			status: player.player_status,
			score: player.player_score,
			isSelf: player.is_owner,
			isVerified: player.verified
	});
	} else {
		fullPlayerList.push({
			username: "",
			alias: "",
			role: `player${i}`,
			status: "waiting",
			score: 0,
			isSelf: false,
			isVerified: false
		});
	 }
	}
//	flog.debug({function: 'buildTournamentPlayerList', fullPlayerList: fullPlayerList}, 'full player list built ');
	return fullPlayerList;
}


async function getTournamentState(tournamentId) {
	//const {DBtour} = options;
	const players = await getTournamentPlayersWithUsernames(tournamentId);
	const tournamentStatus = await getActiveTournamentStatus(tournamentId)
//	flog.debug({function: 'getTournamentState', players: players, tid: tournamentId, status: tournamentStatus}, '####trying to see if db functions work inside here########################## ');
	const full_list = buildTournamentPlayerList(players);
//	flog.debug({function: 'getTournamentState', full_list: full_list}, 'tournament state data fetched ');

	//const brackets = await getBrackets(tournamentId);
	//flog.warn({function: 'get tournamnet state', bracket1: brackets[0], bracket2: brackets[1]}, "----00-0-0-0-0 looking into brackets ");
	//let matchSetup = await DBtour.buildBracket(
//				  currentTournamentId,
//				  players[1].user_id,
//				  players[2].user_id,
//				  gameId2,
//				  2, // round
//				  'pending'
//				);
//				const match2 = await createMatches(players[1], players[2], matchSetup);
//	const bracket1 = brackets[0][1];
//	const bracket2 = brackets[2];
//	const fulBracket = [bracket1, bracket2] == ;
	const tournamentState = {
	tournament_id: tournamentId,
	status: tournamentStatus,
	players: full_list,
	currentMatch: undefined,
	bracket: [],
	winner: undefined,
	createdAt: undefined,
	lastUpdated: undefined
  };
 flog.debug({function: 'getTournamentState', tournamentState: tournamentState}, 'tournament state built +++++++++');
  return tournamentState;
//	console.log("tid is ----- ", tournamentId);
}
/**
 * 
 * @param {*} fastify fastify instance
 * @param {*} options see context.js for available options
 * 
 * creates a baisc tournament object with creating user as player1.
 */
async function createTournament(fastify, options){
 	const {secure, game, DBtour, DBupdate} = options;
 	fastify.route({
 		method: API_PROTOCOL.CREATE_TOURNAMENT.method,
 		url: API_PROTOCOL.CREATE_TOURNAMENT.path,
 		handler: async (request, reply) => {
 			const max_players = request.body;
 			//flog.debug({ function: 'createTournament', body: request.body }, 'request body:');
 			//flog.debug({function: 'createTournament', mxp: max_players}, 'checking max player body');
 			try{
 				const token = request.cookies.auth_token;
 				const userId = secure.getUserIdFromToken(token)
				// check verified user
 				//flog.debug({function: 'createTournament', userId}, 'user id is ');
 				//useridcheck
				const tournamentId = await DBtour.createTournament();
				currentTournamentId = tournamentId; // set global variable to current tournament id

				//flog.debug({function: 'createTournament', tournamentId}, 'tournament id created ');
				// check id valid didnt fail, catch will also catch
				const tournamentStatus = await DBtour.getActiveTournamentStatus(tournamentId);


				// check status valid didnt fail, catch will also catch
				//flog.debug({function: 'createTournament', tournamentId: tournamentId, status: tournamentStatus}, 'tournament id created ');
				await DBtour.createTournamentPlayer(tournamentId, userId.id, "", 1, "player1", true, true);
				//flog.debug({function: 'createTournament', tournamentId: tournamentId, userId: userId.id}, 'tournament player created ');
				
			//	const players = await DBtour.getTournamentPlayersWithUsernames(tournamentId)
			//	flog.debug({function: 'createTournament', players: players}, 'tournament players ');
			//	const tournamentState = await getTournamentState(players, tournamentId, tournamentStatus);
				const tournamentState = await getTournamentState(tournamentId);

				//console.log("show me the ids are clear-----", userId.id, tournamentId);
				await DBupdate.applyTournamentId(userId.id, tournamentId);
				
 				reply.code(200).send({status: 'OK', tournament: tournamentState});
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error ::", err);
 			}
 		}
 	});
 }

async function verifyPlayer(fastify, options){
 	const {secure, DBget, DBtour} = options;
 	fastify.route({
		method: API_PROTOCOL.VERIFY_PLAYER.method,
		url: API_PROTOCOL.VERIFY_PLAYER.path,
 		handler: async (request, reply) => {
 			//flog.debug({ function: 'verifyPlayer', body: request.body }, 'request body:');
 			const {role, username, password, alias} = request.body;
			try{
 				const token = request.cookies.auth_token;
 				const userId = secure.getUserIdFromToken(token)
				let tournamentState = undefined;
				if (role === 'player1'){
					//flog.debug({function: 'verifyPlayer', tid: currentTournamentId, userId: userId.id, alias: alias}, 'updating alias for player 1 ');
					await DBtour.updateAlias(currentTournamentId, userId.id, alias);
					await DBtour.updatePlayerReadyStatus(currentTournamentId, userId.id, 'ready');
					flog.debug({function: 'verifyPlayer', tid: currentTournamentId, userId: userId.id, alias: alias}, 'gettin tournament status !!!second!!!time for player1 ');

					tournamentState = await getTournamentState(currentTournamentId);
//					tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(currentTournamentId),
//						currentTournamentId, await DBtour.getActiveTournamentStatus(currentTournamentId));
			//		flog.debug({function: 'verifyPlayer', tournamnetState: tournamentState}, '!!!!!!player 1 alias updated ');
				} else {
					const otherUserId = await DBget.miniLogin(username, password);
			//		flog.debug({function: 'verifyPlayer', tid: currentTournamentId}, 'showing we have tournamnetid ');
					if (otherUserId) {
						// is this the right way to handle role swap ?
			//			flog.debug({function: 'verifyPlayer', otherUserId: otherUserId.id, role: role}, 'verified player id and role ');
						await DBtour.createTournamentPlayer(currentTournamentId, otherUserId.id, alias, Number(role.replace('player','')), role, true, false);
						await DBtour.updatePlayerReadyStatus(currentTournamentId, otherUserId.id, 'ready');

			//			flog.debug({function: 'verifyPlayer'}, '!!!!!!player verified and added to tournament ');
						const checkFull = await DBtour.getTournamentPlayers(currentTournamentId);
			//			flog.debug({function: 'verifyPlayer', checkFull: checkFull}, '!!!!!!checking if tournament full ');
//						if (checkFull.full === true){
						if (checkFull && checkFull.length === 4) {
			//				flog.debug({function: 'verifyPlayer'}, '!!!!!!all players verified setting tournament to ready ');
							await DBtour.updateTournamentStatus(currentTournamentId, 'ongoing');

						}
						tournamentState = await getTournamentState(currentTournamentId);
//						tournamentState = await getTournamentState(await DBtour.getTournamentPlayersWithUsernames(currentTournamentId), 
//						currentTournamentId, await DBtour.getActiveTournamentStatus(currentTournamentId), false);
						if (checkFull && checkFull.length  === 4){
							tournamentState.can_start = true;
						}

					}


				}
			//	flog.debug({function: 'verifyPlayer', tournamentState: tournamentState}, '!!!!!!final tournamnet state ');
				// check verified user
 				reply.code(200).send({status: 'OK', tournament: tournamentState}); //wrong
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error :: in verify player", err); //wrong
				reply.code(500).send({ status: 'ERROR', error: 'Verification failed?' });
			}
 		}
 	});
}
/**
 * 
 * id INTEGER PRIMARY KEY AUTOINCREMENT,
	tournament_id INTEGER,
	p1_id INTEGER,
	p2_id INTEGER,
	p1_score INTEGER NOT NULL DEFAULT 0,
	p2_score INTEGER NOT NULL DEFAULT 0,
	winner_id INTEGER,
	round INTEGER,
	bracket_pos INTEGER,
	game_uid TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'waiting'
		CHECK (status IN ('waiting', 'pending', 'ongoing', 'finished')),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
	FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);
 */
async function createMatches(player1, player2, bracket){
//same is logic as buildfulllist? 
flog.warn({function: 'createMatches'}, 'entering create matches');
flog.warn({function: 'createMatches', bracket: bracket}, 'entering create matches');
	if (player1 === null && player2 === null) {

		player1 = {
			username: "TBD",
			alias: "TBD",
			status: "waiting",
			score: 0,
			isSelf: false,
		}
		player2 = {
			username: "TBD",
			alias: "TBD",
			status: "waiting",
			score: 0,
			isSelf: false,
		}
	}
const ret = {
		match_id: bracket.game_uid,
		player1: player1,
		player2: player2,
		status: "pending",
		score: { player1: player1.score, player2: player2.score },
	}
	return ret;
}

/**
 * expected full return 
 * export interface Match {
  match_id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: TournamentPlayer;
  score?: {
	player1: number;
	player2: number;
  };
  status: 'pending' | 'ongoing' | 'finished';
  //lastUpdated: Date;
  //gameState?: any;
}
 */



async function startTournament(fastify, options){
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.START_TOURNAMENT.method,
		url: API_PROTOCOL.START_TOURNAMENT.path,
 		handler: async (request, reply) => {
			try {
	 			const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				const players = await DBtour.getTournamentPlayers(currentTournamentId);
				flog.debug({function : 'startTournament'}, 'players fetched');
				//this will sort into order highest to lowest ERROR here 
				//players.sort((a, b) => a.seed - b.seed);
				//memeba to do this 


//addPlayer(gameId, userId, {type: type, ws: undefined, role: "player"+player_count, alias: undefined, ready: false, disconnectedAt: undefined, pauseTimeout: undefined, score: 0});
				//flog.debug({function : 'startTournament', players: players}, 'players sorted by seed');
				flog.debug({function : 'startTournament', player: players[0]}, 'players sorted by seed');

				// Round 1: seed 1 vs seed 4
				const gameId1 = game.createGameCore({id: players[0].user_id }, 'tournament', 'local', players[0].alias);
				game.getGame(gameId1).tid = currentTournamentId;
				flog.debug({function : 'startTournament', gameId1}, 'game 1 is created');

				game.addPlayer(gameId1, players[3].user_id, {
					type: 'login',
					ws: undefined,
					role: 'player2',
					alias: players[3].alias,
					ready: false,
					disconnectedAt: undefined,
					pauseTimeout: undefined,
					score: players[3].player_score
				})
				let matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  players[0].user_id,
				  players[3].user_id,
				  gameId1,
				  1, // round
				  'pending'
				);
				
				const match1 = await createMatches(players[0], players[3], matchSetup);
				flog.debug({function :'startTournament', match1: match1}, '!!!!!!!!!!!!!!!!!!!!!show me if match was creaqted for gods sake im gonna shoot someone"""""""""""');
				// Round 2
				const gameId2 = game.createGameCore({id: players[1].user_id}, 'tournament', 'local', players[1].alias);
				flog.debug({function : 'startTournament'}, 'game 2 is created');
				game.getGame(gameId2).tid = currentTournamentId;
				game.addPlayer(gameId2, players[2].user_id, {
					type: 'login',
					ws: undefined,
					role: 'player2',
					alias: players[2].alias,
					ready: false,
					disconnectedAt: undefined,
					pauseTimeout: undefined,
					score: players[2].player_score
				})
				matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  players[1].user_id,
				  players[2].user_id,
				  gameId2,
				  2, // round
				  'pending'
				);
				const match2 = await createMatches(players[1], players[2], matchSetup);
				const gameId3 = game.createGameCore(undefined, 'tournament', 'local');
				flog.debug({function : 'startTournament'}, 'game 3 is created');
				game.getGame(gameId3).tid = currentTournamentId;
				matchSetup = await DBtour.buildBracket(
				  currentTournamentId,
				  undefined,
				  undefined,
				  //players[0].user_id,
				  //players[3].user_id,
				  gameId3,
				  3, // round
				  'pending'
				);
				flog.debug({function: 'startTournament', matchSetup: matchSetup}, 'on 3-------------------------show me the bakcet before sending ');

				const match3 = await createMatches(null, null, matchSetup);
				//const status = await DBtour.getActiveTournamentStatus(currentTournamentId);
				let tournamentState = await getTournamentState(currentTournamentId);
				flog.debug({function: 'startTournament', tournamentState: tournamentState}, "showing state before adding extra bits");
				tournamentState.currentMatch = match1;
				tournamentState.bracket = [[match1, match2], [match3]];

				flog.debug({function: 'startTournament', tid: currentTournamentId, userId: userId.id}, 'starting tournament ');
				
				flog.debug({function: 'startTournament', tournamnetState: tournamentState}, 'FINAL GAME STATE ');
				reply.code(200).send({status: 'OK', tournament: tournamentState});
			} catch (err) {
				flog.error({fucntion: 'startTournament', errStack: err.stack, errMessage: err.message}, "error :: in start tournament"); //wrong
				reply.code(500).send({ status: 'ERROR', error: 'Start tournament failed?' });//wrong	
			}
		}
		
	});
}

async function removeUserFromTournament(fastify, options) {
	const {secure, DBget, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.method,
		url: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "removeUserFRomTournamnet", body:request.body}, "looking at incoming body")
			const {tournament_id, role} = request.body;
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.removePlayer(tournament_id, role);
				//const current_gamegame
			//	await DBtour.cancelTournament(tournamnetId);
				const tournamentState = await getTournamentState(tournament_id);

				reply.code(200).send({status: 'OK', tournament: tournamentState});
			}
			catch (err) {
				flog.error({function: "removeUserFromTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error removing from tournamnet"});
			}
		}
	})
}

async function cancelTournament(fastify, options) {
	const {secure, DBupdate, DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
		url: API_PROTOCOL.CANCEL_TOURNAMENT.path,
 		handler: async (request, reply) => {
			flog.debug({function: "cancleTournamnet", body: request.body}, "looking at incoming body")
			const {tournament_id} = request.body;
			flog.debug({function: "cancleTournamnet", tid: tournament_id}, 'checking tid');
			try {
				const token = request.cookies.auth_token;
	 			const userId = secure.getUserIdFromToken(token);
				await DBtour.cancelTournament(tournament_id);
				await DBupdate.applyTournamentId(userId.id, 0);
				reply.code(200).send({status: 'OK'});

			}
			catch(err) {
				flog.error({function: "cancelTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error canceling tournamnet"});
			}
		}
	})
}

//async function startTournamentMatch(fastify, options){
//	const {secure, DBget, DBtour, game} = options;
// 	fastify.route({
//		method: API_PROTOCOL.START_TOURNAMENT_MATCH.method,
//		url: API_PROTOCOL.START_TOURNAMENT_MATCH.path,
// 		handler: async (request, reply) => {
//			const match_id = request.body;
//
//			
//			try{
//				flog.info({function: 'startTournamentMatch', body: request.body}, 'starting match , showing body');
//			}catch{
//				flog.error({function: 'startTournamentMatch'});
//			}
//		}
//	})
//}


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



async function tournamentRoutes(fastify, options) {
	await createTournament(fastify, options);
	await verifyPlayer(fastify, options);
	await startTournament(fastify, options);
	await removeUserFromTournament(fastify, options);
	await cancelTournament(fastify, options);
}
tournamentRoutes.getTournamentState = getTournamentState;

module.exports = tournamentRoutes;