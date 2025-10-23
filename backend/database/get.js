const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'get.js' }); // scoped logger

// naming can be changed 
// get each element from database , such as score, name , status
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password
// this should be what is being returned
/**
 * 		const mockProfile = {
				username: "PlayerOne",
				avatarFile: "avatars/avatar1.png",
				twoFactor: false,
				rank: 5,
				score: 1200,
				victories: 15,
				losses: 7,
				totalMatches: 22,
				friends: [
					{ id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
					{ id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
				],
				matchHistory: [
					{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
					{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
				],
			};
this could be managed by routes calling 3 fucntions     const player = await db.getPlayerById(playerId);
    const friends = await db.getFriendsForPlayer(playerId);
    const matchHistory = await db.getMatchHistory(playerId);
 */

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
				    matches.user_id AS matchID,
				    matches.result AS result,
				    matches.score AS score,
				    matches.timestamp AS timestamp, 
				    CASE 
				        WHEN matches.opponent_type = 'human' THEN users.username
				        WHEN matches.opponent_type = 'guest' THEN 'Guest'
				        WHEN matches.opponent_type = 'AI' THEN 'AI Bot'
				    END AS opponentName
				FROM matches
				LEFT JOIN users ON matches.opponent_id = users.id
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

      // TEMP: plain text password check for testing only
      if (row.password !== password) {
        return reject({ error: 'Invalid password' });
      }
      // Return minimal info — no profile data
	  flog.info({ function: 'miniLogin', userId: row.id}, 'mini login success ');
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