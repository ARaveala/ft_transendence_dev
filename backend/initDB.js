// db.js
'use strict';
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR  = '/data/database.sqlite';
const DB_FILE = 'database.sqlite';
const DB_PATH = path.join(DB_DIR, DB_FILE);
const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');

// 1) Ensure parent directory exists (and is writable)
fs.mkdirSync(DB_DIR, { recursive: true });

// Track whether this is a first-time init
const isFirstRun = !fs.existsSync(DB_PATH);

// 2) Open (creates file if missing)
const db = new sqlite3.Database(
  DB_PATH,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      console.error('Failed to open SQLite DB:', err.message);
      return;
    }

    console.log(`SQLite DB ready at: ${DB_PATH}`);

    // 3) Sensible defaults
    db.serialize(() => {
      db.run('PRAGMA journal_mode=WAL;');      // better concurrency
      db.run('PRAGMA foreign_keys = ON;');     // enforce FKs
    });

    // 4) Run init.sql only on first run (if present)
    if (isFirstRun && fs.existsSync(INIT_SQL_PATH)) {
      try {
        const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
        db.exec(initSql, (e) => {
          if (e) {
            console.error('Error running init.sql:', e.message);
          } else {
            console.log('Database initialized from init.sql');
          }
        });
      } catch (readErr) {
        console.error('Could not read init.sql:', readErr.message);
      }
    } else if (isFirstRun) {
      console.warn('First run detected, but init.sql not found—DB is empty.');
    }
  }
);

module.exports = db;
