// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

// use stict mode for better error handling


const fastify = require('fastify')({ logger: true });
// open a connection to the SQLite database
// verbose mode provides detailed error messages
const sqlite3 = require('sqlite3').verbose();
'use strict';



const db = new sqlite3.Database('./database.sqlite', (err) => {
	if (err) {
		console.error('Error connecting to the database:', err.message);
	}
	else {
		// if the database is connected create a table for users
		// this is where you would define the schema for ur users 
		console.log('Connected to the SQLite database.');
		db.run(
			`CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				username TEXT NOT NULL,
				score INTEGER DEFAULT 0,
				status TEXT DEFAULT 'offline'
				password TEXT NOT NULL)`
		);
	}

});

// Declare a rget route for the homepage '/'
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Declare a route for a user's profile
// This is your first "dish" for the frontend
fastify.get('/user/:id', async (request, reply) => {
	const userId = request.params.id;

	return new Promise((resolve, reject) => {
		db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) =>{
			if (err || !row) {
				reject({ error: 'User not found' });
			} else {
				resolve(row || { error: 'User not found' });
			}
		});
	});
});

fastify.get('/status', async (request, reply) => {
	const status = {"status": "API is online!"};
	return status;

});

// adds new user to database
// This is your second "dish" for the frontend
// It allows you to add a new user with a username, score, and status
// this should send a JSON response with a message and the new user's ID
fastify.post('/add-user', async (request, reply) => {
	const {username, score, status} = request.body;
	return new Promise((resolve, reject) => {
		db.run(
			`INSERT INTO users (username, score, status) VALUES (?, ?, ?)`,
			[username, score, status],
			function (err) {
				if (err) {
					reject({ error: 'Failed to add user', details: err});
				} else {
					resolve({ message: 'User added yay!', userId: this.lastID });
				}
			}
		);
	});
});

// testing how do adjust and parse scores with schemas i assume these all go to the top of file
const updateScoreSchema = require('../schemas/updateScore.js');


fastify.post('/update-score/:id', {
	schema: updateScoreSchema,
	handler: async (request, reply) => {
	const userId = request.params.id;
	const { score } = request.body;

	return new Promise((resolve, reject) => {
		db.run(
			`UPDATE users SET score = ? WHERE id = ?`,
			[score, userId],
			function (err) {
				if (err) {
					reject({ error: 'Failed to update the score', details: err});
				} else if (this.changes === 0) {
					reject({ error: 'User not found , no changes made' });
				} else {
					resolve({ message: 'Score updated', userId: userId, newScore: score});
				}
			}
		);
	});
}
});


// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();