const db = require('./initDB');
// const updateScoreSchema = require('@schemas/updateScore.js');

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
module.exports = { updateUserScore , updateUsername};