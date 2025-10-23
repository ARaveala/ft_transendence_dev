'use strict';
const db = require('./initDB.js');

const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger
const bcrypt = require('bcryptjs');

// function to insert a new user into database, validation should happen elsewhere (where) 
// the assumption here is that the data is clean and valid 

// reject will throw and error if insert fails , tthere should always be a try
// catch block in the calling function (where?)

// promise is used to handle asynchronous operations, await is used to wait
// for the promise to resolve or reject
// this is a common pattern in Node.js for database operations

// player profile defaults 
/**
 * 
avatarFile: "avatars/avatar1.png",
				twoFactor: false,
				rank: 0,
				score: 0,
				victories: 0,
				losses: 0,
				totalMatches: 0,
				friends: 0 (format unknown)
				matchHistory: 0 (format unknown)
 */
function insertUser({ username, password, score = 0, status = 'online'}) {
    console.log('Incoming user data:', { username, password});
    return new Promise(async (resolve, reject) => {
        try
        {
            const hash = await bcrypt.hash(password, 10);
            // const avatarFile = 'frontend/src/assets/avatars/avatar1.png';
            db.run(
                `INSERT INTO users (username, password, status, score)
                 VALUES(?, ?, ?, ?)`,
                [username, hash, status, score],
                function (err) {
                    if (err)
                    {
                        if (err.code === 'SQL_CONSTRAINT') {
                            return reject({status: 409, error: 'Username already taken'});   
                        }
                        return reject({status: 500, error: 'DB insert failed', details: err});
                    }
                    resolve(this.lastID);
                }
            );
        }
        catch(e)
        {
            reject({status: 500, error: 'Hashing failed', details: e});
        }
    });
}


function insertFriend(friendId, userId) {
	flog.info({ function: 'insertFRiend' }, 'inserting friend');
	flog.debug({ function: 'insertFRiend', friend: friendId, user: userId }, 'checking ids');

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(
        `INSERT INTO friends (user_id, friend_id) VALUES (?, ?)`,
        [userId, friendId],
        function (err) {
          if (err) {
			flog.warn({ function: 'insertFRiend', error: err }, 'what error');

            reject({ error: 'Failed to add friend', details: err });
          } else {
				flog.debug({ function: 'insertFRiend', friend: friendId, user: userId }, 'what went in ');
                db.all(
              `SELECT * FROM friends WHERE user_id = ?`,
              [userId],
              (err2, rows) => {
                if (err2) {
                  flog.error({ function: 'insertFriend', error: err2 }, 'Error fetching friends after insert');
                } else {
                  flog.info({ function: 'insertFriend', friends: rows }, 'Current friends for user');
                }
				resolve({ message: 'friend added' }); // Now safe to use in registerUser
              }
            );
          }
        }
      );
    });
  });
}


module.exports = {
	insertUser,
	insertFriend,
	// loginUser
};

