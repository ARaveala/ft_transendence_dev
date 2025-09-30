const db = require('./initDB.js');

'use strict';
// dont include db as a prameter, we include it as a require, if you must include it
// as a parameter , ({db, id}) must be passed as a part of an object
/**
 * Delete a user by numeric id.
 * Returns the number of rows deleted (0 or 1).
 * Requires PRAGMA foreign_keys=ON (your init already does this).
 */
function deleteUserById(id) {
  return new Promise((resolve, reject) => {
    // defensive: ensure integer
	console.log('checking id', id);
	const userId = id;
	// const userId = Number(id);
	console.log('db function delete check id', userId, 'type', typeof userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return reject(new Error('Invalid user id'));
    }

    db.run(
      'DELETE FROM users WHERE id = ?',
      [userId],
      function onDone(err) {
        if (err) return reject(err);
        // this.changes is provided by sqlite3 and tells how many rows were affected
        resolve(this.changes);
      }
    );
  });
}

/**
 * Optional convenience: delete by username (unique).
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

module.exports = { deleteUserById, deleteUserByUsername };