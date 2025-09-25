const db = require('./initDB.js');

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
	const test = userId.id;//parseInt(userId, 10); //base of 10, make sure its a number
		//db.all("SELECT * FROM users", (err, rows) => {
		//  console.log("All users in DB:", rows);
		//});

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
//				if (err || !row) {
//					reject({ error: 'REJECT in fetch User not found' });
//				} else {
//					resolve(row || { error: 'User not found OR in fetch' });
//				}
			});
		});
}

//async function getUserbyName({ username }) {
//	console.log('Fetching user with username:', username);
//		return new Promise((resolve, reject) => {
//			db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
//				if (err || !row) {
//					reject({ error: 'User not found' });
//				} else {
//					resolve(row || { error: 'User not found' });
//				}
//			});
//		});
//}

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
      resolve({ id: row.id});
    });
  });
}

module.exports = { fetchUser, miniLogin };
//similar logic as below may be required
//async function userRoutes(fastify, options) {
//  await registerUser(fastify, options);
//  await getUser(fastify, options);
//}
//
//module.exports = userRoutes;