// this does not re initialize the database , just connects to it
const db = require('./initDB.js');

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

// this fucntion has to look inside database and confirm if username and password match
// dev style right now just utalizes simple create a new user logic 
function loginUser({ username, password}) {
    console.log('Incoming user data:', { username, password});
	const score = 0; // this is only dev !!
	const status = "online"; // status should be changed to online after verificiation
	// this would be easiest with a change status function that i call from apiroute.
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO users (username, password, score, status) VALUES (?, ?, ?, ?)`,
            [username, password, score, status],
            function (err) {
                if (err) {
                    reject({ error: 'Failed to add user', details: err });
                } else {
                    resolve({userId: this.lastID, user: username });
                }
            }
        );
    });
}
// change status fucntion 

module.exports = {
	insertUser, 
	loginUser
};

