const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const { saveAndGetAvatarUrl, deleteOldAvatar } = require('./save_avatar.js');
const flog = logger.child({ fileContext: 'profile.js' }); // scoped logger
const usernameSchema = require('@schemas/usernameSchema.js');
const passwordSchema = require('@schemas/passwordSchema.js');
const {
	getTournamentState,
} = require('@Rtour/tournament.js');

const bcrypt = require('bcrypt');
const saltRounds = 10;

async function getFriendProfile(fastify, options) {
	const { DBget } = options;
	fastify.get(API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.path,{ //get friend profile
	}, async (request, reply) => {

		const targetUserId =  Number(request.query.user_id);
		if (isNaN(targetUserId)) {
			console.warn("Invalid or missing target user_id in query:", request.query.user_id);
			return reply.code(400).send({ error: "Missing target user_id" });
		}
		
		const mockProfile = {
				username: "PlayerOne",
				avatarFile: undefined,
				rank: 5,
				score: 1200,
				victories: 20,
				losses: 7,
				matches: 22,
				matchHistory: [],
			};
		try {
			const profile = await DBget.fetchUser( targetUserId ); 
			if (!profile) {
				console.warn("User not found in DB:", targetUserId);
				return reply.code(404).send({ error: "User not found" });
			}
			
			const matchHistory = await DBget.getMatchHistory(targetUserId);
	
			mockProfile.username = profile.username;
			mockProfile.avatarFile = profile.avatar_file;
			mockProfile.rank = profile.rank;
			mockProfile.score = profile.score;
			mockProfile.victories = profile.wins;
			mockProfile.losses = profile.losses;
			mockProfile.totalMatches = profile.total_games;
			mockProfile.matchHistory = matchHistory || [];
			console.log("show mock profile", mockProfile);

			flog.warn({finalMockProfile: mockProfile}, "FULL OTHER USER PROFILE SENT TO FRONTEND");
			reply.send(mockProfile);
		} catch (err) {
			flog.error({fucntion: "get freind profile", err: err.stack}, "AAAAAAAAAAAAaaAAAA erro stack ");
			reply.code(418).send(err);
		}
	});
}


// this should be getProfile
async function getUser(fastify, options) {
	const { DBget, secure, DBtour, DBupdate } = options;
	fastify.get(API_PROTOCOL.GET_PROFILE.path,{
	}, async (request, reply) => {
		// just for testing check no fail after remove
		userId = request.userId;

		const mockProfile = {
				username: "PlayerOne",
				avatarFile: undefined,
				mfa_enabled: false,
				rank: 5,
				score: 1200,
				victories: 20,
				losses: 7,
				matches: 22,
				friends: [],
				matchHistory: [
					{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
					{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
				],
				tournament: undefined
			};
		console.log('Fetching user with ID:', userId, 'with type', typeof userId);
		try {
			const profile = await DBget.fetchUser(userId);
			console.log("WHAT IS TID :", profile.active_tournament_id);

			//flog.warn({function: "getProfile", totalGames: profile.total_games}, "can we see total matches updated and recived==============================");
			const friends = await DBget.getFriendsForPlayer(userId);
			flog.info({function: 'getUser', friends: friends}, 'checking friend object');
			const matchHistory = await DBget.getMatchHistory(userId);
			
			mockProfile.username = profile.username;
			mockProfile.avatarFile = profile.avatar_file;
			mockProfile.mfa_enabled = profile.mfa_enabled === 1; // convert to boolean
			mockProfile.rank = profile.rank;
			mockProfile.score = profile.score;
			mockProfile.victories = profile.wins;
			mockProfile.losses = profile.losses;
			mockProfile.totalMatches = profile.total_games;
			mockProfile.friends = friends || [];
			mockProfile.matchHistory = matchHistory || [];

//			console.log("show mock profile", mockProfile);
			mockProfile.tournament = profile.active_tournament_id === 0 ? null : await getTournamentState(profile.active_tournament_id);
			if (profile.active_tournament_id &&   mockProfile.tournament?.brackets?.length === 0){
				await DBupdate.applyTournamentId(userId, 0);
				console.log("testing theory that now bracket is empty in purpose");

			}
//			flog.warn({finalMockProfile: mockProfile}, "FULL PROFILE SENT TO FRONTEND");
			reply.send(mockProfile);
		} catch (err) {
			reply.code(418).send(err);
		}
	});
}

async function updateUsername(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_USERNAME.method,
		url: API_PROTOCOL.CHANGE_USERNAME.path,
		schema: usernameSchema, 
		handler: async (request, reply) => {
		const { username } = request.body;
		try {

			const userId = request.userId;
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
				const res = await DBupdate.updateUsername(username, userId);
				console.log('checking res', res);
			}

			const profile = await DBget.fetchUser(userId);
			if (!profile) {
				console.log('error in fetching user id or profile ');
				reply.code(404).send({
					status: 'ERROR',
					error: 'no such user'
				})
			}
			reply.code(200).send({
				status: 'UPDATED',
				//profile: profile,
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(418).send(err);
		}
	}
	});
}

async function updatePassword(fastify, options) {
	const { DBupdate, DBget, secure } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_PASSWORD.method,
		url: API_PROTOCOL.CHANGE_PASSWORD.path,
		schema: passwordSchema, 
		handler: async (request, reply) => {
		const { current_password, new_password } = request.body;
		try {

			const userId = request.userId;
			if (userId){
				const check = await DBget.checkPasswordMatch(userId, current_password);
				console.log('checking check', check)
				//might need more in depth error handling
				if (check.error) {
					reply.code(400).send({
						status: 'ERROR',
						error: 'current password does not match'
					})
				}
				//update password after checks valid
				const hashedPassword = await bcrypt.hash(new_password, saltRounds);
				const res = await DBupdate.updatePassword(hashedPassword, userId);
//				console.log('checking res', res);
			}
			reply.code(200).send({
				status: 'UPDATED',
			});
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(418).send(err);
		}
	}
	});
}

// Route for file upload (POST) 
async function uploadAvatarFileRoute(fastify, options) {
	const { DBupdate, DBget, secure } = options; 
	fastify.route({
		method: API_PROTOCOL.UPLOAD_AVATAR.method, // POST
		url: API_PROTOCOL.UPLOAD_AVATAR.path,     // /api/profile/avatar
		
		handler: async (request, reply) => {
			flog.info({ function: 'uploadAvatarFileRoute' }, 'Attempting avatar file upload');
			
			let newAvatarUrl = null; // Initialize to track the newly saved file
			
			try {
				const userId = request.userId;
				// 1. Fetch current user data to get the old avatar URL for later deletion
				const currentUserData = await DBget.fetchUser( userId );
				const oldAvatarUrl = currentUserData ? currentUserData.avatar_file : null;

				// Parse the file data from the multipart request
				const data = await request.file();
				if (!data || data.fieldname !== 'file') {
					reply.code(400).send({ status: 'ERROR', error: 'No file received or wrong field name' });
					return;
				}
				
				// Validate file type (basic check)
				const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
				if (!allowedMimes.includes(data.mimetype)) {
					// Optionally log this attempt
					reply.code(400).send({ status: 'ERROR', error: 'Invalid file type. Only JPEG, PNG, and GIF allowed.' });
					return;
}

				// 2. Save the new file and get its public URL
				newAvatarUrl = await saveAndGetAvatarUrl(data, userId);

				// 3. Update the user's database entry with the new URL
				const updateCheck = await DBupdate.changeAvatar(newAvatarUrl, userId);

				if (updateCheck.error) {
					flog.error({ error: updateCheck.error }, 'Failed to update database with new avatar URL. Attempting file rollback.');
					
					// Delete the newly uploaded file if DB update fails
					await deleteOldAvatar(newAvatarUrl); 
					
					reply.code(418).send({ status: 'ERROR', error: 'Database update failed' });
					return;
				}

				// 4. Delete the old file from disk (only if DB update succeeded)
				await deleteOldAvatar(oldAvatarUrl);
				
				// Success response, returning the URL the frontend needs
				reply.code(200).send({
					status: 'UPLOADED',
					url: newAvatarUrl, // The public URL the frontend will use
				});

			} catch (err) {
				// If a file was saved but an error occurred outside of the DB check (e.g., file saving failed)
				// we should attempt to clean up if newAvatarUrl was set.
				if (newAvatarUrl) {
					await deleteOldAvatar(newAvatarUrl); // Clean up temp file
				}
				flog.error({ err }, 'Error during avatar file upload (includes file system errors)');
				reply.code(418).send({ status: 'ERROR', error: 'Server error during upload' });
			}
		},
	});
}


// async function updateAvatar(fastify, options) {
// 	const { DBupdate, secure } = options;
// 	fastify.route({
// 		method: API_PROTOCOL.CHANGE_AVATAR.method,
// 		url: API_PROTOCOL.CHANGE_AVATAR.path,
// 		handler: async (request, reply) => {
// 		//schema: { body: schemas.updateAvatar }, dosnt exist yet 
// 		const { avatar } = request.body;
// 		try {

// 			const userId = request.userId;
// 			if (userId){
// 				const check = await DBupdate.changeAvatar(avatar, userId);
// 				console.log('checking check', check)
// 				//might need more in depth error handling
// 				if (check.error) {
// 					reply.code(400).send({
// 						status: 'ERROR',
// 						error: 'not valid avatar?'// other errors?
// 					})
// 				}
// 			}
// 			reply.code(200).send({
// 				status: 'UPDATED',
// 			});
// 		} catch (err) {
// 			console.log(('Error during avatar change:', err));
// 			reply.code(418).send(err);
// 		}
// 	}
// 	});
// }
async function updateAvatar(fastify, options) {
	const { DBupdate, DBget } = options;
	fastify.route({
		method: API_PROTOCOL.CHANGE_AVATAR.method,
		url: API_PROTOCOL.CHANGE_AVATAR.path,
		handler: async (request, reply) => {
			const { avatar } = request.body;
			const userId = request.userId;

			try {
				// 1. Fetch old avatar
				const user = await DBget.fetchUser(userId);
				const oldAvatarUrl = user ? user.avatar_file : null;

				// 2. Update DB
				const check = await DBupdate.changeAvatar(avatar, userId);
				if (check.error) {
					reply.code(400).send({
						status: 'ERROR',
						error: check.error,
					});
					return;
				}

				// 3. If switching from uploaded → default, delete old file
				const wasUploaded = oldAvatarUrl && oldAvatarUrl.startsWith('/api/avatars/');
				const nowDefault = avatar && avatar.includes('/assets/avatars/');

				if (wasUploaded && nowDefault) {
					await deleteOldAvatar(oldAvatarUrl);
				}

				reply.code(200).send({ status: 'UPDATED' });

			} catch (err) {
				console.error('Error during avatar change:', err);
				reply.code(418).send({ status: 'ERROR', error: 'Server error during avatar update' });
			}
		},
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
			const userId = request.uiserId;
			if (userId){
				const check = await DBupdate.changeLanguage(language, userId);
				console.log('checking check Language', check)
				//might need more in depth error handling
				if (check.error) {
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
			reply.code(418).send(err);
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
			const userId = request.userId;
			if (userId){
				const check = await DBupdate.update2fa(userId);
				console.log('checking check Two Factor', check)
				//might need more in depth error handling
				if (check.error) {
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
			reply.code(418).send(err);
		}
	}
	});
}	

async function profileRoutes(fastify, options) {
	await getUser(fastify, options);
	await updateUsername(fastify, options);
	await updatePassword(fastify, options);
	await updateAvatar(fastify, options);
	await uploadAvatarFileRoute(fastify, options); // POST for file upload
	await updateLanguage(fastify, options);
	await updateTwoFactor(fastify, options);
	await getFriendProfile(fastify, options);
}
module.exports = profileRoutes