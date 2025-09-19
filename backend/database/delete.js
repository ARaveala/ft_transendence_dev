
'use strict';

/**
 * Delete a user by numeric id.
 * Returns the number of rows deleted (0 or 1).
 * Requires PRAGMA foreign_keys=ON (your init already does this).
 */
function deleteUserById(db, id) {
  return new Promise((resolve, reject) => {
    // defensive: ensure integer
    const userId = Number(id);
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
function deleteUserByUsername(db, username) {
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