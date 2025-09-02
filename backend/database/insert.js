'use strict';
const db = require('./db');
const bcrypt = require('bcrypt');
async function insertUser({ username, password, score = 0, status = 'offline'}) {
    const pasword_hash = await bcrypt.hash(password, 123);
    return new Promise((resolve, reject) => {
        const sql = `
        INSERT INTO users (username, password_hash, score) VALUES (?, ?, ?)
        `;
    db.run(sql, [username, password_hash, score], function (err){
        if (err){
            if (err.message.includes('UNIQUE constraint failed users.username')){
                return reject({ error: 'Username already taken'});
            }
            return reject({ error: 'Failed to add user', details: err.message });
        }
        resolve({ message: 'User added!', userId: this.lastID });
    });
    });
}
module.exports = { insertUser };