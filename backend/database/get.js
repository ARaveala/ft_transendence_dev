'use strict'
const { generateWsToken } = require('../security/security.js');
const db = require('./initDB.js');
const bcrypt = require('bcryptjs');

function getUserByUsername(username) {
	return new Promise((resolve, reject) => {
		db.get(`SELECT id, username, password FROM users WHERE username = ?`, [username], (err, row) => {
			if (err) return reject({status: 500, error: 'DB read failed', details: err});
			resolve(row || null);
		});
	});
}

async function miniLogin(username, password) {
	const row = await getUserByUsername(username);
	if (!row)
		throw {status: 401, error: 'Invalid uswername or password'};
	const ok = await bcrypt.compare(password, row.password);
	if (!ok)
		throw {status: 401, error: 'Invalid username or password'};
	return row.id;
}

async function checkUsernameAvailable(username) {
	const row = await getUserByUsername(username);
	return !row;
}

module.exports = {miniLogin, checkUsernameAvailable};

// async function fetchUser({ userId }) {
// 	console.log('Finside db::fetching user with ID:', userId);
// 	const test = userId.id;
// 		return new Promise((resolve, reject) => {
// 			db.get('SELECT * FROM users WHERE id = ?', [test], (err, row) =>{
// 				if (err) {
// 					console.error('DB error:', err);
// 					reject({ error: 'DB error fecth' });
// 				} else if (!row) {
// 					console.warn('User not found for ID:', userId);
// 					reject({ error: 'User not found fecth' });
// 				} else {
// 					console.log('User found:', row);
// 					resolve(row);
// 				}

// 			});
// 		});
// }

// async function getFriendsForPlayer({ userId }) {
// 	console.log('DB::Fetching friends for user ID:', userId);
// 	const test = userId.id;
// 	return new Promise((resolve, reject) => {
// 		db.all(
// 			`SELECT users.id AS friendID,
// 				users.username AS friendName,
// 				users.avatar_file AS friendAvatar,
// 				friends.status AS friendshipstatus
// 			FROM friends
// 			JOIN users ON friends.friend_id = users.id
// 			WHERE friends.user_id = ?`,
// 			[test],
// 			(err, rows) => {
// 				if (err) {
// 					if (!rows) {	
// 						rows = [];
// 						resolve(rows);
// 					}
// 					console.error('DB error fetching friends:', err);
// 					reject({ error: 'DB error fetching friends' });
// 				} else {
// 					console.log(`Found ${rows.length} friends for user ID ${userId}`);
// 					resolve(rows);
// 				}
// 			}
// 		);
// 	});
// }
// // can we have a schema that checks if table empty first?
// async function getMatchHistory({ userId }) {
// 	console			.log('DB::Fetching match history for user ID:', userId);
// 	const test = userId.id;
// 	return new Promise((resolve, reject) => {
// 		db.all(
// 			` 	SELECT 
// 				    matches.user_id AS matchID,
// 				    matches.result AS result,
// 				    matches.score AS score,
// 				    matches.timestamp AS timestamp, 
// 				    CASE 
// 				        WHEN matches.opponent_type = 'human' THEN users.username
// 				        WHEN matches.opponent_type = 'guest' THEN 'Guest'
// 				        WHEN matches.opponent_type = 'AI' THEN 'AI Bot'
// 				    END AS opponentName
// 				FROM matches
// 				LEFT JOIN users ON matches.opponent_id = users.id
// 				WHERE matches.user_id = ?;
// 			`
// 			,[test],
// 			(err, rows) => {
// 				if (err) {
// 					console.error('DB error fetching match history:', err);
// 					if (!rows) {	
// 						rows = [];
// 						resolve(rows);
// 					}	
// 					reject({ error: 'DB error fetching match history' });
// 				} else {
// 					console.log(`Found ${rows.length} matches for user ID ${userId}`);
// 					resolve(rows || []);
// 				}
// 			}
// 		);
// 	});
// }

// //needs some adjustment for clarity
// async function checkUsernameAvailable( username ) {
// 	console.log('Fetching user with username:', username);
// 		return new Promise((resolve, reject) => {
// 			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
// 				if (err || !row) {
// 					resolve({ error: 'Username available' });
// 				} else {
// 					reject({error: 'Username not available'});
// 				}
// 			});
// 		});
// }

// async function checkPasswordMatch( password ) {
// 	console.log('Fetching user with password:', );
// 		return new Promise((resolve, reject) => {
// 			db.get('SELECT * FROM users WHERE password = ?', [password], (err, row) =>{
// 				if (err || !row) {
// 					reject({ error: 'password does not match' });
// 				} else {
// 					resolve({ok: 'password match'});
// 				}
// 			});
// 		});
// }
// // mini example of checking player exists and password matches . 

// async function miniLogin(username, password) {
//   console.log("minilogin activated, no access to profile should be possible");

//   return new Promise((resolve, reject) => {
//     db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
//       if (err) {
//         return reject({ error: 'Database error' });
//       }
//       if (!row) {
//         return reject({ error: 'User not found' });
//       }

//       // TEMP: plain text password check for testing only
//       if (row.password !== password) {
//         return reject({ error: 'Invalid password' });
//       }
//       // Return minimal info — no profile data
//       resolve({ id: row.id});
//     });
//   });
// }

// module.exports = { fetchUser, 
// 	miniLogin, 
// 	getFriendsForPlayer, 
// 	getMatchHistory,
// 	checkUsernameAvailable,
// 	checkPasswordMatch,
// };
