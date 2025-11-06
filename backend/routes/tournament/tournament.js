
const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'tournamnet.js' });
const tournamentSchema = require('@schemas/tournamentSchema.js');
//this is so i can utalize as a utility function from outside this file scope
const  {
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
	return fullPlayerList;
}

/**
 * This fucntion takes from database relevent details required for front end and restructures
 * the data for front end.
 *  
 * It fetches the details and compensates for empty values during the tounamnet building phase
 * 
 * @param {*} tournamentId 
 * @returns 
 */
async function getTournamentState(tournamentId) {
	const players = await getTournamentPlayersWithUsernames(tournamentId);
	const tournamentStatus = await getActiveTournamentStatus(tournamentId)
	const full_list = buildTournamentPlayerList(players);
	const brackets = await getBrackets(tournamentId);
	let fullBracket = []; 

	if (brackets.length > 0){
		if (Array.isArray(brackets) && brackets.length >= 3) {
			fullBracket = [
				[brackets[0][0], brackets[1][0]], // extract game1 and game2
				[brackets[2][0]]                  // extract game3
			];
		}
	}

	const tournamentState = {
		tournament_id: tournamentId,
		status: tournamentStatus,
		players: full_list,
		currentMatch: undefined, //not in use?
		bracket: fullBracket,
		winner: undefined,
		createdAt: undefined,
		lastUpdated: undefined
	};
// flog.debug({function: 'getTournamentState', tournamentState: tournamentState}, 'tournament state built +++++++++');
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
 	const {secure, DBtour, DBupdate} = options;
 	fastify.route({
 		method: API_PROTOCOL.CREATE_TOURNAMENT.method,
 		url: API_PROTOCOL.CREATE_TOURNAMENT.path,
 		handler: async (request, reply) => {
// 			flog.debug({ function: 'createTournament', body: request.body }, 'request body:');
 			try{
				const userId = request.userId;
				const tournamentId = await DBtour.createTournament();
				currentTournamentId = tournamentId; // set global variable to current tournament id
				await DBtour.createTournamentPlayer(tournamentId, userId, "", 1, "player1", true, true);
				const tournamentState = await getTournamentState(tournamentId);
				await DBupdate.applyTournamentId(userId, tournamentId);				
 				reply.code(200).send({status: 'OK', tournament: tournamentState});
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error ::", err);
				reply.code(500).send({status: 'ERROR', message: "error in create tournament"});
 			}
 		}
 	});
}

/**
 * Players are verified during their log in for tournamnet
 * @param {*} fastify 
 * @param {*} options 
 */
async function verifyPlayer(fastify, options){
 	const {DBget, DBtour} = options;
 	fastify.route({
		method: API_PROTOCOL.VERIFY_PLAYER.method,
		url: API_PROTOCOL.VERIFY_PLAYER.path,
        schema: tournamentSchema,
 		handler: async (request, reply) => {
 			flog.debug({ function: 'verifyPlayer', body: request.body }, 'request body:');
 			const {role, username, password, alias} = request.body;
			try {
				const userId = request.userId;				
				let tournamentState = undefined;
				if (role === 'player1'){
					await DBtour.updateAlias(currentTournamentId, userId, alias);
					await DBtour.updatePlayerReadyStatus(currentTournamentId, userId, 'ready');
					tournamentState = await getTournamentState(currentTournamentId);
				} else {
					const otherUserId = await DBget.miniLogin(username, password);
					if (otherUserId) {
						await DBtour.createTournamentPlayer(currentTournamentId, otherUserId.id, alias, Number(role.replace('player','')), role, true, false);
						await DBtour.updatePlayerReadyStatus(currentTournamentId, otherUserId.id, 'ready');

						const checkFull = await DBtour.getTournamentPlayers(currentTournamentId);
						if (checkFull && checkFull.length === 4) {
							await DBtour.updateTournamentStatus(currentTournamentId, 'ongoing');
						}
						tournamentState = await getTournamentState(currentTournamentId);
						if (checkFull && checkFull.length  === 4){
							tournamentState.can_start = true;
						}
					}
				}
 				reply.code(200).send({status: 'OK', tournament: tournamentState}); //wrong
 			}
 			catch (err){
 				flog.error({fucntion: 'createTournament'}, "error :: in verify player", err); //wrong
				reply.code(500).send({ status: 'ERROR', error: 'Verification failed?' });
			}
 		}
 	});
}
async function createMatchWithBracket(DBtour, game, tournamentId, playerA, playerB, round) {
	const gameId = game.createGameCore(
		playerA ? { id: playerA.user_id } : undefined,
		'tournament',
		'local',
		playerA?.alias
	);

	const gameObj = game.getGame(gameId);
	gameObj.tid = tournamentId;

	if (playerB) {
		game.addPlayer(gameId, playerB.user_id, {
			type: 'login',
			ws: undefined,
			role: 'player2',
			alias: playerB.alias,
			ready: false,
			disconnectedAt: undefined,
			pauseTimeout: undefined,
			score: playerB.player_score
		});
	}

	const bracket = await DBtour.buildBracket(
		tournamentId,
		playerA?.user_id,
		playerB?.user_id,
		gameId,
		round,
		'pending'
	);
	return createMatches(playerA, playerB, bracket);
}

async function createMatches(player1, player2, bracket){
//same is logic as buildfulllist? 
//flog.warn({function: 'createMatches'}, 'entering create matches');
//flog.warn({function: 'createMatches', bracket: bracket}, 'entering create matches');
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


async function startTournament(fastify, options){
	const {DBtour, game} = options;
 	fastify.route({
		method: API_PROTOCOL.START_TOURNAMENT.method,
		url: API_PROTOCOL.START_TOURNAMENT.path,
 		handler: async (request, reply) => {
			try {
				const players = await DBtour.getTournamentPlayers(currentTournamentId);
		// Round 1: seed 1 vs seed 4
				
				const match1 = await createMatchWithBracket(DBtour, game, currentTournamentId, players[0], players[3], 1);
				const match2 = await createMatchWithBracket(DBtour, game, currentTournamentId, players[1], players[2], 2);
				const match3 = await createMatchWithBracket(DBtour, game, currentTournamentId, null, null, 3);		
		
				let tournamentState = await getTournamentState(currentTournamentId);
					//flog.debug({function: 'startTournament', tournamentState: tournamentState}, "showing state before adding extra bits");
				tournamentState.currentMatch = match1;
				tournamentState.bracket = [[match1, match2], [match3]];
				reply.code(200).send({status: 'OK', tournament: tournamentState});
			} catch (err) {
			//	flog.error({fucntion: 'startTournament', errStack: err.stack, errMessage: err.message}, "error :: in start tournament"); //wrong
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
			//flog.debug({function: "removeUserFRomTournamnet", body:request.body}, "looking at incoming body")
			const {tournament_id, role} = request.body;
			try {
				await DBtour.removePlayer(tournament_id, role);
				const tournamentState = await getTournamentState(tournament_id);
				reply.code(200).send({status: 'OK', tournament: tournamentState});
			}
			catch (err) {
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
			const {tournament_id} = request.body;
			try {
				const userId = request.userId;
				await DBtour.cancelTournament(tournament_id);
				await DBupdate.applyTournamentId(userId, 0);
				reply.code(200).send({status: 'OK'});

			}
			catch(err) {
				//flog.error({function: "cancelTournament", errmsg: err.message}, "errorerror")
				reply.code(500).send({status: 'ERROR', error: "error canceling tournamnet"});
			}
		}
	})
}


async function tournamentRoutes(fastify, options) {
	await createTournament(fastify, options);
	await verifyPlayer(fastify, options);
	await startTournament(fastify, options);
	await removeUserFromTournament(fastify, options);
	await cancelTournament(fastify, options);
}
tournamentRoutes.getTournamentState = getTournamentState;

module.exports = tournamentRoutes;