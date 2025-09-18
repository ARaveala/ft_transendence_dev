const db = require('./db');
const updateScoreSchema = require('@schemas/updateScore.js');

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


module.exports = { updateUserScore };