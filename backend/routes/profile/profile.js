const { API_PROTOCOL } = require('@sharedApi');
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
		console.log('Cookies in get User:', request.cookies);

		const userId = secure.getUserIdFromToken(token);
		console.log("-------- is the id valid", userId);
		console.log("debug :: after get userid from");

		const mockProfile = {
				username: "PlayerOne",
				avatarFile: undefined,
				mfa_enabled: false,
				rank: 5,
				score: 1200,
				victories: 15,
				losses: 7,
				totalMatches: 22,
				friends: [
					{ id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
					{ id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
				],
				matchHistory: [
					{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
					{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
				],
			};

		//const userId = request.params.id;
		console.log('Fetching user with ID:', userId, 'with type', typeof userId);
		try {
			console.log("debug :: inside try block");
			//const test = userId.id;//parseInt(userId, 10); //base of 10, make sure its a number
			//console.log('Checking value of test:', test, 'with type', typeof test);
			
			const profile = await DBget.fetchUser({userId});
			const friends = await DBget.getFriendsForPlayer({userId});
			const matchHistory = await DBget.getMatchHistory({userId});
			console.log("the user we should be returning is :", profile);
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
			//console.log("show mock profile", safeUser);
			
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

//export interface ChangePasswordPayload {
//	current_password: string;
//	new_password: string;
//}
//
//export interface ChangePasswordResponse {
//	status: 'UPDATED' | 'ERROR';
//	error?: string;
//}

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


//async function updateProfile (fastify, options) {
//	const { ?, ? } = options;
//	fastify.get(API_PROTOCOL.UPDATE_PROFILE.path,{
//		}, async (request, reply) => {
//		const token = request.cookies.auth_token;
//		console.log('Fetching user with ID:', userId);
//		//break down body , grab type 
//		switch type {
//			case 'username':
//				// change username
//			// so forth 
//		}
//		try {
//			const result = await DBget.fetchUser({userId});
//			console.log("the user we should be returning is :", result);
//			reply.send(mockProfile);
//		} catch (err) {
//			reply.code(500).send(err);
//		}
//	});
//}
//


async function profileRoutes(fastify, options) {
	await getUser(fastify, options);
	await updateUsername(fastify, options);
	await updatePassword(fastify, options);
	//await updateProfile(fastify, options);
}
module.exports = profileRoutes