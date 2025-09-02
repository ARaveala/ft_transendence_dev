

'use strict';
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');
const INIT_SQL =path.join(__dirname, 'init.sql');

const db = new sqlite3.Database(path.join(DB_PATH), (err) => {
	if (err) {
		console.error('Error connecting to the database:', err.message);
	}
	console.log('Connected to the SQLite database.');
	db.serialize(() => {
		db.exec('PRAGMA foreign_keys = ON;');
		const schema = fs.readFileSync(INIT_SQL, 'utf8');
		db.exec(schema, (e) => {
			if (e) console.error('Schema init error:', e.message);
		});
	});
});

module.exports = db;