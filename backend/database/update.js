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
module.exports = { updateUserScore,
	updateUsername,
	updatePassword,
};