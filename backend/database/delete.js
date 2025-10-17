'use strict';
const db = require('./initDB.js');

function deleteUserById(userId) {
  return new Promise((resolve, reject) => {
    if (userId == null)
      return reject({status: 400, error: 'Missing user id'});
    db.run('DELETE FROM users WHERE id =?', [userId], function (err){
      if (err)
      {
        console.error('[DB deleteUserById] failed:', err);
        if (err.code === 'SQLITE_CONSTRAINT') 
        {
          return reject({
            status: 409,
            error: 'Cannot delete user: related records exist (FK).',
            details: err.message
          });
        }
        return reject({status: 500, error: 'DB delete failed', details: err.message});
      }
      console.log('[DB deleteUserById] userId=%s changes=%s', userId, this.changes);
      resolve(this.changes);
    });
  });
}

module.exports = { deleteUserById};