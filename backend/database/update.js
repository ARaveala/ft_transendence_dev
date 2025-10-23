const db = require('./initDB');
// const updateScoreSchema = require('@schemas/updateScore.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DB/update.js' }); // scoped logger

function updateUserScore({userId, score}) {
	console.log('updating score for user:', { userId, score });

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`,
			[score, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the score', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'Score updated', userId: userId, newScore: score});
				}
			}
		);
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
					resolve({ message: 'player game stats updated', userId: id, winner: winner, score: score});
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
module.exports = { updateUserScore,
	updateUsername,
	updatePassword,
	changeAvatar,
	changeLanguage,
	update2fa,
	updatePlayerGameStats,
//	updateMatchHistory
};