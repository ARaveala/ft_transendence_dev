'use strict'
const { generateWsToken } = require('../security/security.js');
const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'get.js' }); // scoped logger
const bcrypt = require('bcryptjs');

// function getUserByUsername(username) {
// 	return new Promise((resolve, reject) => {
// 		db.get(`SELECT id, username, password FROM users WHERE username = ?`, [username], (err, row) => {
// 			if (err) return reject({status: 500, error: 'DB read failed', details: err});
// 			resolve(row || null);
// 		});
// 	});
// }

// async function miniLogin(username, password) {
// 	const row = await getUserByUsername(username);
// 	if (!row)
// 		throw {status: 401, error: 'Invalid username or password'};
// 	const ok = await bcrypt.compare(password, row.password);
// 	if (!ok)
// 		throw {status: 401, error: 'Invalid username or password'};
// 	return row.id;
// }

// async function checkUsernameAvailable(username) {
// 	const row = await getUserByUsername(username);
// 	return !row;
// }

// module.exports = {miniLogin, checkUsernameAvailable};

async function fetchUser({ userId }) {
	console.log('Finside db::fetching user with ID:', userId);
	const test = userId.id;
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE id = ?', [test], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					console.warn('User not found for ID:', userId);
					reject({ error: 'User not found fecth' });
				} else {
					console.log('User found:', row);
					resolve(row);
				}

			});
		});
}

// get user by username , ie when adding friend
async function fetchUserByUsername(username) {
	if (username === undefined) {flog.warn({ function: 'fetUserByUsername'}, 'username undefined')}
	flog.info({ function: 'fetUserByUsername', username: username}, 'username: ');
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
				if (err) {
					flog.error({ function: 'fetUserByUsername', err}, 'DB error:');
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					flog.warn({ function: 'fetUserByUsername', username: username}, 'User not found :');
					reject({ error: 'User not found fecth' });
				} else {
					flog.info({ function: 'fetUserByUsername', row}, 'User found:');
					resolve(row.id);
				}

			});
		});
}
// get friends list for userId, take information from users table , as usenames may change
// rename provided results to make data access clearer
// status is pending, accepted, blocked etc. attatched which can be used in front end if wished
async function getFriendsForPlayer( userId ) {
	flog.info({ function: 'getFriendsForPlayer', username: userId}, 'checking id matches  ');
	//const test = userId.id;
	return new Promise((resolve, reject) => {
		db.all(
			`SELECT users.id AS friendID,
				users.username AS username,
				users.avatar_file AS avatar,
				users.status AS status,
				friends.status AS friendshipstatus
			FROM friends
			JOIN users ON friends.friend_id = users.id
			WHERE friends.user_id = ?`,
			[userId],
			(err, rows) => {
				if (err) {
					if (!rows) {	
						rows = [];
						resolve(rows);
					}
					console.error('DB error fetching friends:', err);
					reject({ error: 'DB error fetching friends' });
				} else {
					console.log(`Found ${rows.length} friends for user ID ${userId}`);
					resolve(rows);
				}
			}
		);
	});
}
// can we have a schema that checks if table empty first?
async function getMatchHistory({ userId }) {
	//console			.log('DB::Fetching match history for user ID:', userId);
	const test = userId.id;
	return new Promise((resolve, reject) => {
		db.all(
			` 	SELECT 
				    games.user_id AS matchID,
				    games.result AS result,
				    games.score AS score,
				    games.timestamp AS timestamp, 
				    CASE 
				        WHEN gamess.opponent_type = 'human' THEN users.username
				        WHEN gamess.opponent_type = 'guest' THEN 'Guest'
				        WHEN gamess.opponent_type = 'AI' THEN 'AI Bot'
				    END AS opponentName
				FROM matches
				LEFT JOIN users ON games.opponent_id = users.id
				WHERE matches.user_id = ?;
			`
			,[test],
			(err, rows) => {
				if (err) {
					console.error('DB error fetching match history:', err);
					if (!rows) {	
						rows = [];
						resolve(rows);
					}	
					reject({ error: 'DB error fetching match history' });
				} else {
					console.log(`Found ${rows.length} matches for user ID ${userId}`);
					resolve(rows || []);
				}
			}
		);
	});
}

//needs some adjustment for clarity
async function checkUsernameAvailable( username ) {
	console.log('Fetching user with username:', username);
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
				if (err || !row) {
					resolve({ error: 'Username available' });
				} else {
					reject({error: 'Username not available'});
				}
			});
		});
}

async function checkPasswordMatch( password ) {
	console.log('Fetching user with password:', );
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE password = ?', [password], (err, row) =>{
				if (err || !row) {
					reject({ error: 'password does not match' });
				} else {
					resolve({ok: 'password match'});
				}
			});
		});
}
// mini example of checking player exists and password matches . 

async function miniLogin(username, password) {
  console.log("minilogin activated, no access to profile should be possible");

  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        return reject({ error: 'Database error' });
      }
      if (!row) {
        return reject({ error: 'User not found' });
      }
	const ok = bcrypt.compare(password, row.password);
	if (!ok)
		throw {status: 401, error: 'Invalid username or password'};
      // TEMP: plain text password check for testing only
    //   if (row.password !== password) {
    //     return reject({ error: 'Invalid password' });
    //   }
      // Return minimal info — no profile data
      resolve({ id: row.id});
    });
  });
}

async function get2FaSecret(userId) {
	console.log('DB::Fetching 2FA secret for user ID:', userId);
	const test = userId.id;
		return new Promise((resolve, reject) => {
			db.get('SELECT mfa_secret FROM users WHERE id = ?', [test], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					console.warn('User not found for ID:', userId);
					reject({ error: 'User not found fecth' });
				} else {
					console.log('2FA secret found:', row);
					resolve(row.mfa_secret);
				}

			});
		});
}

async function is2FaEnabled(userId) {
	console.log('DB::Checking if 2FA is enabled for user ID:', userId);
		return new Promise((resolve, reject) => {
			db.get('SELECT mfa_enabled FROM users WHERE id = ?', [userId], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fecth' });
				} else if (!row) {
					console.warn('User not found for ID:', userId);
					reject({ error: 'User not found fecth' });
				} else {
					resolve(Boolean(row.mfa_enabled));
				}

			});
		});
}

module.exports = { fetchUser, 
	miniLogin, 
	getFriendsForPlayer, 
	getMatchHistory,
	checkUsernameAvailable,
	checkPasswordMatch,
	fetchUserByUsername,
	is2FaEnabled,
};
//similar logic as below may be required
//async function userRoutes(fastify, options) {
//  await registerUser(fastify, options);
//  await getUser(fastify, options);
//}
//
//module.exports = userRoutes;