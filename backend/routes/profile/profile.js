const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'profile.js' }); // scoped logger
/**
 * 
    const player = await db.getPlayerById(playerId);
    const friends = await db.getFriendsForPlayer(playerId);
    const matchHistory = await db.getMatchHistory(playerId);

    const profile = {
      username: player.username,
      avatarFile: player.avatarFile,
      twoFactor: player.twoFactor,
      rank: player.rank,
      score: player.score,
      victories: player.victories,
      losses: player.losses,
      totalMatches: player.totalMatches,
      friends,
      matchHistory
    };
 */
// this should be getProfile
async function getUser(fastify, options) {
	const { DBget, secure } = options;
	fastify.get(API_PROTOCOL.GET_PROFILE.path,{
	}, async (request, reply) => {
		// just for testing check no fail after remove


		const token = request.cookies.auth_token;
		//if (!token.user.id) {
		//  console.warn("Unauthorized access to /api/profile — no valid user ID");
		//  reply.code(401).send({ error: "Unauthorized" });
		//  return;
		//}

		const userId = secure.getUserIdFromToken(token);
		const mockProfile = {
				username: "PlayerOne",
				avatarFile: undefined,
				mfa_enabled: false,
				rank: 5,
				score: 1200,
				victories: 15,
				losses: 7,
				totalMatches: 22,
				friends: [],
				matchHistory: [
					{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
					{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
				],
			};
		console.log('Fetching user with ID:', userId, 'with type', typeof userId);
		try {
			const profile = await DBget.fetchUser({userId});
			const friends = await DBget.getFriendsForPlayer(userId.id);
			flog.info({function: 'getUser', friends}, 'checking friend object');
			const matchHistory = await DBget.getMatchHistory({userId});
			//const { password, ...safeUser } = profile;
			mockProfile.username = profile.username;
			mockProfile.avatarFile = profile.avatar_file;
			mockProfile.mfa_enabled = profile.mfa_enabled === 1; // convert to boolean
			mockProfile.rank = profile.rank;
			mockProfile.score = profile.score;
			mockProfile.wins = profile.victories;
			mockProfile.losses = profile.losses;
			mockProfile.total_games = profile.totalMatches;
			mockProfile.friends = friends || [];
			mockProfile.matchHistory = matchHistory || [];
			//mockP
			console.log("show mock profile", mockProfile);
			
			//reply.send(safeUser);
			reply.send(mockProfile);
		} catch (err) {
			reply.code(500).send(err);
		}
	});
}

async function updateUsername(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_USERNAME.method,
		url: API_PROTOCOL.CHANGE_USERNAME.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.ChangeUsername }, dosnt exist yet 
		const { username } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBget.checkUsernameAvailable(username);
				console.log('checking check', check)
				if (check.taken) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'username not available'
					})
				}	
				const res = await DBupdate.updateUsername(username, userId.id);
				console.log('checking res', res);
			}

			const profile = await DBget.fetchUser({userId});
			if (!profile) {
				console.log('error in fetching user id or profile ');
				reply.code(404).send({
					status: 'ERROR',
					error: 'no such user'
				})
			}

			reply.code(200).send({
				status: 'UPDATED',
				profile: profile,
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updatePassword(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_PASSWORD.method,
		url: API_PROTOCOL.CHANGE_PASSWORD.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.ChangeUsername }, dosnt exist yet 
		const { current_password, new_password } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBget.checkPasswordMatch(current_password);
				console.log('checking check', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'current password does not match'
					})
				}
				//update password after checks valid
				const res = await DBupdate.updatePassword(new_password, userId.id);
				console.log('checking res', res);
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updateAvatar(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_AVATAR.method,
		url: API_PROTOCOL.CHANGE_AVATAR.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateAvatar }, dosnt exist yet 
		const { avatar } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBupdate.changeAvatar(avatar, userId.id);
				console.log('checking check', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid avatar?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during avatar change:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updateLanguage(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_LANGUAGE.method,
		url: API_PROTOCOL.CHANGE_LANGUAGE.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateLanguage }, dosnt exist yet 
		const { language } = request.body;
		try {

			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			if (userId){
				const check = await DBupdate.changeLanguage(language, userId.id);
				console.log('checking check Language', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid Language?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during Language change:', err));
			reply.code(500).send(err);
		}
	}
	});
}

async function updateTwoFactor(fastify, options) {
	const { DBupdate, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_2FA.method,
		url: API_PROTOCOL.CHANGE_2FA.path,
		handler: async (request, reply) => {
		//schema: { body: schemas.updateTwoFactor }, dosnt exist yet 
		const { twoFactor } = request.body;
		flog.debug({ function: 'updateTwoFactor', body: request.body }, 'Toggling Two Factor Authentication , inc body');
		try {
			
			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);	
			if (userId){
				const check = await DBupdate.update2fa(userId.id);
				console.log('checking check Two Factor', check)
				//might need more in depth error handling
				if (check.error) {
					//update the username
					reply.code(400).send({
						status: 'ERROR',
						error: 'not valid Two Factor?'// other errors?
					})
				}
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		}
		catch (err) {
			console.log(('Error during Two Factor change:', err));
			reply.code(500).send(err);
		}
	}
	});
}	

async function profileRoutes(fastify, options) {
	await getUser(fastify, options);
	await updateUsername(fastify, options);
	await updatePassword(fastify, options);
	await updateAvatar(fastify, options);
	await updateLanguage(fastify, options);
	await updateTwoFactor(fastify, options);
}
module.exports = profileRoutes