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
		const token = request.cookies.auth_token;

		console.log('Cookies in get User:', request.cookies);

		const userId = secure.getUserIdFromToken(token);

		const mockProfile = {
				username: "PlayerOne",
				avatarFile: "avatars/avatar1.png",
				twoFactor: false,
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
		console.log('Fetching user with ID:', userId);
		try {
			const result = await DBget.fetchUser({userId});
			console.log("the user we should be returning is :", result);
			reply.send(mockProfile);
		} catch (err) {
			reply.code(500).send(err);
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
	//await updateProfile(fastify, options);
}
module.exports = profileRoutes