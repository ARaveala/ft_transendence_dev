const db = require('./initDB');
const bcrypt = require('bcryptjs');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DB/update.js' });

function updateUserScore({userId, score}) {
	flog.info({ function: 'updatePassword', userId }, 'updating password');
	return new Promise(async (resolve, reject) => {
		try
		{
			const hash = await bcrypt.hash(newPassword, 10);
			db.run(
				`UPDATE users SET password = ? WHERE id = ?`,
				[hash, userId],
				function (err)
				{
					if (err) return reject({error: 'Failed to update password', details: err});
					if (this.changes === 0) return reject({error: 'User not found, no changes made'});
					resolve({message: 'Password updated', userId});
				}
			);
		}
		catch (e) { reject({error: 'Hashing failed', details: e}); }
	});
}

function updateUsername(username, userId) {
	console.log('updating username for user:', { username, userId});

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET username = ? WHERE id = ?`,
			[username, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the username', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'username updated', userId: userId, newUsername: username});
				}
			}
		);
	});
}

function updatePassword(password, userId) {
	console.log('updating username for user:', { password, userId});

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET password = ? WHERE id = ?`,
			[password, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the password', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'password updated', userId: userId, newPassword: password});
				}
			}
		);
	});
}

function changeAvatar(avatar, userId) {
	console.log('updating avatar for user:', userId);

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET  avatar_file = ? WHERE id = ?`,
			[avatar, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the avatar', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'password updated', userId: userId, newAvatar: avatar});
				}
			}
		);
	});
}

function changeLanguage(language, userId) {
	console.log('updating language for user:', userId);

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET  language = ? WHERE id = ?`,
			[language, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the language', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'language updated', userId: userId, newLanguage: language});
				}
			}
		);
	});
}

async function update2fa(enabled, userId, secret) {
	flog.debug({ function: 'update2fa', userId: userId, enabled: enabled }, 'Updating 2FA settings for user');

	return new Promise((resolve, reject) => {
		db.run(
			'UPDATE users SET mfa_enabled = ?, mfa_secret = ? WHERE id = ?',
			[enabled ? 1 : 0, secret || null, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update 2fa', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: '2fa updated', userId: userId, enabled: enabled});
				}
			}
		);
	});
	
}
/**
 * 
 * @param {*} winner bool if winner or not 
 * @param {*} id player id
 * @param {*} score score to update
 */
async function updatePlayerGameStats(winner, id, score) {
	flog.debug({ function: 'updateGameStats', userId: id, winner: winner, score: score }, 'Updating game stats for user');

	return new Promise((resolve, reject) => {
		db.run(
			'UPDATE users SET  wins = wins + ?, losses = losses + ?, score = score + ?, total_games = total_games + 1 WHERE id = ?',
			[winner ? 1 : 0, winner ? 0 : 1, score, id],
			function (err) {
				if (err) {
					flog.error({ function: 'updateGameStats', error: err }, 'Error updating player game stats');
					reject({ error: 'Failed to update player game stats ', details: err});
				} else if (this.changes === 0) {
					flog.error({ function: 'updateGameStats' }, 'No changes made, user not found');
					reject({ error: 'User not found , no changes made' });
				} else {
         db.get(
            'SELECT wins, losses, score, total_games FROM users WHERE id = ?',
            [id],
            (err, row) => {
              if (err) {
                reject({ error: 'Failed to fetch updated stats', details: err });
              } else {
				flog.debug({function: "updategamestats", ...row}, "show me the stats");
                resolve({ message: 'player game stats updated', userId: id, ...row });
              }
            }
          );
        }
      }
    );
  });
}

async function applyTournamentId(userId, tournamentId){
	return new Promise ((resolve, reject) =>{
		db.run(
			'UPDATE users SET active_tournament_id = ? WHERE id = ?',
			[tournamentId, userId],
			function (err) {
				if (err) {
					flog.error({ function: 'applyTournamentId', error: err }, 'Error updating player game stats');
					reject({ error: 'Failed to update player game stats ', details: err});
				} else if (this.changes === 0) {
					flog.error({ function: 'applyTournamentId' }, 'No changes made, user not found');
					reject({ error: 'User not found , no changes made' });
				} else {
					return resolve({ messgae: 'active touramnet set', tid: tournamentId})
				}
			}
		)
	})
}
//
//async function updateMatchHistory(userId, matchData) {
//	flog.debug({ function: 'updateMatchHistory', userId: userId, matchData: matchData }, 'Updating match history for user');
//
//	return new Promise((resolve, reject) => {
//		// Assuming match_history is stored as a JSON string in the database
//		db.run(
//			'UPDATE users SET match_history = ? WHERE id = ?',
//			[JSON.stringify(matchData), userId],
//			function (err) {
//				if (err) {
//					reject({ error: 'Failed to update match history', details: err});
//				} else if (this.changes === 0) {
//					reject({ error: 'User not found , no changes made' });
//				} else {
//					resolve({ message: 'match history updated', userId: userId});
//				}
//			}
//		);
//	});
//}	
//	
module.exports = { updateUserScore,
	updateUsername,
	updatePassword,
	changeAvatar,
	changeLanguage,
	update2fa,
	updatePlayerGameStats,
	applyTournamentId,
//	updateMatchHistory
};