const db = require('./initDB');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DB/update.js' }); // scoped logger

function updateUserScoreByDelta({userId, delta})
{
	console.log('updating score for user:', { userId, delta });

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`,
			[delta, userId],
			function (err) {
				if (err) reject({ error: 'Failed to update the score', details: err});
				if (this.changes === 0) reject({ error: 'User not found , no changes made' });
				resolve({ message: 'Score updated', userId: userId, newScore: score});
			}
		);
	});
}

function setUserScore({userId, score})
{
	flog.debug({fn: 'setUSerScore', userId, score});
	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`,
			[score, userId],
			function (err)
			{
				if (err) return reject({error: 'Failed to set score', details: err});
				if (this.changes === 0) return reject({error: 'User not found'});
				resolve({ok: true, changes: this.changes});
			}
		);
	})
}

function finalizeGameAndUpdateScores({gameId, p1Score, p2Score, winnerScoreDelta = 10, loserScoreDelta = 0})
{
	flog.info({fn: 'finalizeGameAndUpdateScores', gameId, p1Score, p2Score});
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			const rollback = (payload) => db.run('ROLLBACK', () => reject(payload));
			db.run('BEGIN');
			db.get(
				`SELECT id, p1_id, p2_id, status FROM games WHERE id = ?`,
				[gameId],
				(err, game) => {
					if (err) return rollback({error: 'DB read failed', details: err});
					if (!game) return rollback({error: 'Game not found'});
					if (game.status === 'finished')
						return rollback({error: 'Game already finished'});
					if (typeof p1Score !== 'number' || typeof p2Score !== 'number')
						return rollback({error: 'Invalid scores'});
					if (p1Score === p2Score)
						return rollback({error: 'Draws are not supported'});
					const winnerId = p1Score > p2Score ? game.p1_id : game.p2_id;
					const loserId = p1Score > p2Score ? game.p2_id : game.p1_id;
					db.run(
						`UPDATE games
							SET p1_score = ?, p2_score = ?, winner_id = ?, status = 'finished'
						WHERE id = ?`,
						[p1Score, p2Score, winnerId, gameId],
						function (err) {
							if (err) return rollback({error: 'Failed to update game', details: err});
							db.run(
								`UPDATE users
									SET wins = wins + 1,
										total_games = total_games + 1,
										score = score + ?
								WHERE id = ?`,
								[winnerScoreDelta, winnerId],
								function (err) {
									if (err) return rollback({error: 'Failed to update winner', details: err});
									if (this.changes === 0) return rollback({error: 'Winner user not found'});
									db.run(
										`UPDATE users
											SET losses = losses + 1,
												total_games = total_games + 1,
												score = score + ?
										WHERE id = ?`,
										[loserScoreDelta, loserId],
										function (err) {
											if (err) return rollback({error: 'Failed to update loser', details: err});
											if (this.changes === 0) return rollback({error: 'Loser user not found'});
											db.run('COMMIT', (err) => {
												if (err) return reject({error: 'Commit failed', details: err});
												resolve({ok: true, winnerId, loserId});
											});
										}
									);
								}
							);
						}
					);
				}
			);
		});
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
module.exports = {
	// updateUserScore,
	finalizeGameAndUpdateScores,
	updateUsername,
	updatePassword,
	changeAvatar,
	changeLanguage,
	update2fa,
	// updatePlayerGameStats,
//	updateMatchHistory
};