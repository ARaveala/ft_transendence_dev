// this does not re initialize the database , just connects to it
const db = require('./initDB.js');

// function to insert a new user into database, validation should happen elsewhere (where) 
// the assumption here is that the data is clean and valid 

// reject will throw and error if insert fails , tthere should always be a try
// catch block in the calling function (where?)

// promise is used to handle asynchronous operations, await is used to wait
// for the promise to resolve or reject
// this is a common pattern in Node.js for database operations
function insertUser({ username, password, score, status }) {
    console.log('Incoming user data:', { username, password, score, status });

    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (username, password, score, status) VALUES (?, ?, ?, ?)`,
            [username, password, score, status],
            function (err) {
                if (err) {
                    reject({ error: 'Failed to add user', details: err });
                } else {
                    resolve({ message: 'User added yay!', userId: this.lastID });
                }
            }
        );
    });
}


module.exports = { insertUser };


