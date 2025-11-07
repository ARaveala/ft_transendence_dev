const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'insert.js' }); // scoped logger

'use strict';
// dont include db as a prameter, we include it as a require, if you must include it
// as a parameter , ({db, id}) must be passed as a part of an object
/**
 * Delete a user by numeric id.
 * Returns the number of rows deleted (0 or 1).
 * Requires PRAGMA foreign_keys=ON (your init already does this).
 */
//function deleteUserById(id) {
//  return new Promise((resolve, reject) => {
//    // defensive: ensure integer
//	console.log('checking id', id);
//	const userId = id;
//	// const userId = Number(id);
//	console.log('db function delete check id', userId, 'type', typeof userId);
//    if (!Number.isInteger(userId) || userId <= 0) {
//      return reject(new Error('Invalid user id'));
//    }
//
//    db.run(
//      'DELETE FROM users WHERE id = ?',
//      [userId],
//      function onDone(err) {
//        if (err) return reject(err);
//        // this.changes is provided by sqlite3 and tells how many rows were affected
//        resolve(this.changes);
//      }
//    );
//  });
//}
function deleteUserById(id) {
  return new Promise((resolve, reject) => {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return reject(new Error('Invalid user ID'));
    }

    db.serialize(() => {
      db.all(
        'SELECT tournament_id FROM tournament_players WHERE user_id = ?',
        [userId],
        (err, tournaments) => {
          if (err) return reject(err);
          if (!tournaments || tournaments.length === 0) return deleteUser();

          let pending = tournaments.length;

          tournaments.forEach(({ tournament_id }) => {
            db.get(
              `SELECT COUNT(*) AS finished_matches
               FROM game
               WHERE tournament_id = ? AND round = 3 AND status = 'finished'`,
              [tournament_id],
              (err, result) => {
                if (err) return reject(err);

                if (result.finished_matches > 0) {
                  // Step 1: Find owner
                  db.get(
                    `SELECT user_id FROM tournament_players
                     WHERE tournament_id = ? AND is_owner = 1`,
                    [tournament_id],
                    (err, ownerRow) => {
                      if (err) return reject(err);

                      if (ownerRow?.user_id) {
                        db.run(
                          `UPDATE users SET active_tournament_id = 0 WHERE id = ?`,
                          [ownerRow.user_id],
                          (err) => {
                            if (err) return reject(err);
                            console.log(`Cleared active_tournament_id for owner ${ownerRow.user_id}`);
                          }
                        );
                      }

                      // Step 2: Delete tournament
                      db.run(
                        'DELETE FROM tournaments WHERE id = ?',
                        [tournament_id],
                        (err) => {
                          if (err) return reject(err);
                          console.log(`Deleted tournament ${tournament_id}`);
                          checkDone();
                        }
                      );
                    }
                  );
                } else {
                  checkDone();
                }
              }
            );
          });

          function checkDone() {
            pending--;
            if (pending === 0) {
              deleteUser();
            }
          }

          function deleteUser() {
            db.run(
              'DELETE FROM users WHERE id = ?',
              [userId],
              function (err) {
                if (err) return reject(err);
                console.log(`User ${userId} deleted`);
                resolve(this.changes);
              }
            );
          }
        }
      );
    });
  });
}


function deleteFriendById(userId, friendId) {
  return new Promise((resolve, reject) => {
	flog.debug({fucntion: 'deleteFreindById', user: userId, friend: friendId}, 'checking id');
    db.run(
      'DELETE FROM friends WHERE user_id = ? AND friend_id = ?',
      [userId,friendId],
      function onDone(err) {
        if (err) return reject(err);
        // this.changes is provided by sqlite3 and tells how many rows were affected
        resolve(this.changes);
      }
    );
  });
}


/**
 * Optional convenience: delete by username (unique). may be not needed
 */
function deleteUserByUsername(username) {
  return new Promise((resolve, reject) => {
    if (!username || typeof username !== 'string') {
      return reject(new Error('Invalid username'));
    }
    db.run(
      'DELETE FROM users WHERE username = ?',
      [username],
      function onDone(err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

module.exports = {
	deleteUserById,
	deleteUserByUsername,
	deleteFriendById,
};