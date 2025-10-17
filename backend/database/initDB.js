'use strict';
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, '...', 'data');
const DB_FILE = process.env.DB_FILE || 'app.sqlite';
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE);
const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');

fs.mkdirSync(DB_DIR, { recursive: true });

// const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
//   if (err) return console.error('Failed to open SQLite DB:', err.message);
//   console.log(`SQLite DB ready at: ${DB_PATH}`);
//   db.serialize(() => {
//     db.run('PRAGMA journal_mode=WAL;');
//     db.run('PRAGMA foreign_keys = ON;');
//   });
//   try {
//     if (FORCE_INIT || (await needsInit(db))) {
//       const sql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
//       await exec(db, 'BEGIN;'); await exec(db, sql); await exec(db, 'COMMIT;');
//       console.log('Schema ensured from init.sql');
//     } else {
//       console.log('Schema already present; skipping init.');
//     }
//   } catch (e) {
//     console.error('Schema init failed:', e.message);
//     try { await exec(db, 'ROLLBACK;'); } catch {}
//   }
// });

// function exec(db, sql) { return new Promise((res, rej) => db.exec(sql, e => e ? rej(e) : res())); }
// function needsInit(db) {
//   return new Promise((res, rej) => {
//     db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
//       (e, rows) => e ? rej(e) : res(!rows.map(r=>r.name).includes('users') || !rows.map(r=>r.name).includes('games')));
//   });
// }

const db = new sqlite3.Database(DB_PATH);
function run(sql) {
  return new Promise((res, rej) => db.exec(sql, err => err ? rej(err) : res()));
}
async function ensureSchema() {
  await run('PRAGMA foreing_keys = ON;');
  const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
  await run(initSQL);
}

ensureSchema().catch(e => {
  console.error('[DB INIT] failed: ', e);
  process.exit(1);
})

module.exports = db;
