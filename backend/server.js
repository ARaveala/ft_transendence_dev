const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.SQLITE_PATH || './database.sqlite';

const db = require('./initDB');

// const db = new sqlite3.Database(DB_PATH, (err) => {
//   if (err) {
//     console.error('SQLite error:', err.message);
//   } else {
//     console.log('Connected to SQLite at', DB_PATH);
//     db.run(`CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       username TEXT NOT NULL,
//       password TEXT NOT NULL,
//       score INTEGER DEFAULT 0,
//       status TEXT DEFAULT 'offline'
//     )`);
//   }
// });

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${PORT}`);
});
