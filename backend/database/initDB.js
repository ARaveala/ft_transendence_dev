'use strict';
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_DIR  = process.env.DB_DIR  || path.join(__dirname, '..', 'data');
const DB_FILE = process.env.DB_FILE || 'app.sqlite';
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE);
const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err)
    {
      console.error('[DB INIT] Failed to open SQLite DB:', err.message);
      process.exit(1);
    }
    console.log(`[DB INIT] SQLite DB ready at: ${DB_PATH}`);
    db.serialize(() => {
      db.exec('PRAGMA foreing_keys = ON;', (e) =>{
        if (e)
        {
          console.error('[BD INIT] Failed to enable foreing keys:', err.message);
          process.exit(1);
        }
        const initSQL = fs.readFileSync(INIT_SQL_PATH, 'utf8');
        db.exec(initSQL, (e2) =>{
          if (e2)
          {
            console.error('[DB INIT] Schema apply failed:', err.message);
            process.exit(1);
          }
          console.log('[DB INIT] Schema ensured');
        });
      });
    });
  }
);

module.exports = db;
