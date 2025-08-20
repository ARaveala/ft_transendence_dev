const sqlite3 = require('sqlite3').verbose();
const path = require('path');
// yet to discover full potential of strict?
'use strict';
// logger is enabled for debugging purposes
// use strict mode for better error handling
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
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
				password TEXT NOT NULL,
				score INTEGER DEFAULT 0,
				status TEXT DEFAULT 'offline'
				)`
		);
	}
});

// password  text not null is a security risk, hashing should be added later

// this is where you would define the schema for ur users
// this makes db and exportable so we can use it in other files
module.exports = db;