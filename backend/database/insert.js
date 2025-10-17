'use strict';
const db = require('./initDB.js');
const bcrypt = require('bcryptjs');

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

module.exports = {insertUser};
