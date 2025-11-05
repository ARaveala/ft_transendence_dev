const { API_PROTOCOL } = require('@sharedApi');
const {logger} = require('@logger');
const { saveAndGetAvatarUrl, deleteOldAvatar } = require('./save_avatar.js'); // <-- Note the new import
const flog = logger.child({ fileContext: 'profile.js' }); // scoped logger

const {
	getTournamentState,
} = require('@Rtour/tournament.js');
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
  const { DBget, secure, DBtour } = options;

  const roleToString = (n) => `player${Number(n) || 1}`;
  const toFriend = (r) => ({
    user_id: r.friendID,
    username: r.username,
    avatar: r.avatar || undefined,
    online_status: r.status === 'online'
  });

  // Turn a raw tournament_players row into a TournamentPlayer
  const toTournamentPlayer = (p, currentUserId) => ({
    username: p.username || '',
    alias: p.alias,
    status: p.verified ? 'ready' : 'waiting',
    avatar: undefined,
    score: undefined,
    isSelf: p.user_id === currentUserId,
    isVerified: !!p.verified,
    role: roleToString(p.role)
  });

  // Build a Match object from a games row + joined usernames/aliases
  const toMatch = (g) => {
    const p1 = {
      username: g.p1_username || '',
      alias: g.p1_alias || g.p1_username || '',
      status: g.status === 'finished' ? 'finished'
            : g.status === 'ongoing'  ? 'playing'
            : 'ready',
      avatar: undefined,
      score: g.p1_score ?? undefined,
      isSelf: undefined,
      isVerified: undefined,
      role: 'player1'
    };
    const p2 = {
      username: g.p2_username || '',
      alias: g.p2_alias || g.p2_username || '',
      status: g.status === 'finished' ? 'finished'
            : g.status === 'ongoing'  ? 'playing'
            : 'ready',
      avatar: undefined,
      score: g.p2_score ?? undefined,
      isSelf: undefined,
      isVerified: undefined,
      role: 'player2'
    };
    return {
      match_id: String(g.id),
      player1: p1,
      player2: p2,
      winner: g.winner_username || undefined,
      score: { player1: g.p1_score ?? 0, player2: g.p2_score ?? 0 },
      status: g.status // 'pending' | 'ongoing' | 'finished'
    };
  };

  async function buildTournamentState(tournamentId, currentUserId) {
    try {
      const statusRow = await DBtour.getActiveTournamentStatus(tournamentId); // { status }
      if (!statusRow) throw new Error('no such tournament');

      const playersDB = await DBtour.getTournamentPlayersWithUsernames(tournamentId);
      const players = playersDB.map((p) => toTournamentPlayer(p, currentUserId));

      // owner = role 1 (schema doesn’t store “owner”)
      const ownerP = playersDB.find(p => Number(p.role) === 1);
      const owner = ownerP?.username || ownerP?.alias || '';

      // can_start = four players and all verified
      const assigned = playersDB.length;
      const pending = Math.max(0, 4 - assigned);
      const canStart = assigned === 4 && playersDB.every(p => p.verified === 1);

      // bracket from games table
      const flatGames = await DBtour.getBrackets(tournamentId); // rows with round, bracket_pos, joined names
      const roundsMap = new Map();
      for (const g of flatGames) {
        const m = toMatch(g);
        const r = Number(g.round) || 1;
        if (!roundsMap.has(r)) roundsMap.set(r, []);
        roundsMap.get(r).push({ pos: Number(g.bracket_pos) || 0, match: m });
      }
      // sort each round by bracket_pos and strip helpers
      const bracket = Array.from(roundsMap.keys())
        .sort((a, b) => a - b)
        .map(r => roundsMap.get(r).sort((a, b) => a.pos - b.pos).map(x => x.match));

      // currentMatch = first ongoing else first pending
      const current = flatGames.find(g => g.status === 'ongoing')
                    || flatGames.find(g => g.status === 'pending');
      const currentMatch = current ? toMatch(current) : undefined;

      return {
        tournament_id: String(tournamentId),
        status: statusRow.status,                 // 'waiting' | 'ongoing' | 'finished'
        owner,
        players,
        currentMatch,
        bracket,
        winner: undefined,
        createdAt: undefined,
        lastUpdated: undefined,
        can_start: canStart,
        pending_players: pending
      };
    } catch {
      // No tournament for user
      return {
        tournament_id: '',
        status: 'waiting',
        owner: '',
        players: [],
        bracket: [],
        winner: undefined,
        createdAt: undefined,
        lastUpdated: undefined,
        can_start: false,
        pending_players: 0
      };
    }
  }

  fastify.get(API_PROTOCOL.GET_PROFILE.path, {}, async (request, reply) => {
    const token = request.cookies.auth_token;
    if (!token) return reply.code(401).send({ error: 'Unauthorized' });

    const userId = secure.getUserIdFromToken(token);
    if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

    try {
      // 1) user row
      const profile = await DBget.fetchUser({ userId });

      // 2) friends + history (from games)
      const [friendsRows, historyRows] = await Promise.all([
        DBget.getFriendsForPlayer(userId),
        DBget.getMatchHistory({ userId })
      ]);

      // 3) tournament state (optional)
      const tid = profile.active_tournament_id ?? 0; // if you add this later, it will start working
      const tournament = tid
        ? await buildTournamentState(tid, userId)
        : {
            tournament_id: '',
            status: 'waiting',
            owner: '',
            players: [],
            bracket: [],
            winner: undefined,
            createdAt: undefined,
            lastUpdated: undefined,
            can_start: false,
            pending_players: 0
          };

      // 4) final payload
      const payload = {
        user_id: userId,
        username: profile.username,
        avatarFile: profile.avatar_file || undefined,
        twoFactor: !!profile.mfa_enabled,
        rank: profile.rank ?? 0,
        score: profile.score ?? 0,
        victories: profile.wins ?? 0,
        losses: profile.losses ?? 0,
        totalMatches: profile.total_games ?? 0,
        tournamentWins: undefined, // not in schema
        friends: friendsRows.map(toFriend),
        matchHistory: historyRows.map(toMatch),
        tournament,
        language: profile.language || 'en'
      };

      return reply.code(200).send(payload);
    } catch (err) {
      flog.error({ function: 'getUser', err }, 'Failed to build profile');
      return reply.code(500).send({ error: 'Failed to fetch profile' });
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
				const token = request.cookies.auth_token;
				const userId = secure.getUserIdFromToken(token);

				if (!userId) {
					reply.code(401).send({ status: 'ERROR', error: 'Unauthorized' });
					return;
				}

				// 1. Fetch current user data to get the old avatar URL for later deletion
				const currentUserData = await DBget.fetchUser({ userId });
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
				newAvatarUrl = await saveAndGetAvatarUrl(data, userId.id);

				// 3. Update the user's database entry with the new URL
				const updateCheck = await DBupdate.changeAvatar(newAvatarUrl, userId.id);

				if (updateCheck.error) {
					flog.error({ error: updateCheck.error }, 'Failed to update database with new avatar URL. Attempting file rollback.');
					
					// Delete the newly uploaded file if DB update fails
					await deleteOldAvatar(newAvatarUrl); 
					
					reply.code(500).send({ status: 'ERROR', error: 'Database update failed' });
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
				reply.code(500).send({ status: 'ERROR', error: 'Server error during upload' });
			}
		},
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
	await uploadAvatarFileRoute(fastify, options); // POST for file upload
	await updateLanguage(fastify, options);
	await updateTwoFactor(fastify, options);
}
module.exports = profileRoutes