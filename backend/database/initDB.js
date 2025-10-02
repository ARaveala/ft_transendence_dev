// db.js
// 'use strict';
// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');
// const fs = require('fs');

// const DB_DIR  = process.env.DB_DIR  || '/app/data'; //'/data/database.sqlite';
// const DB_FILE = process.env.DB_FILE || 'app.sqlite'; //'database.sqlite';
// const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE); //path.join(DB_DIR, DB_FILE);
// const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');

// // 1) Ensure parent directory exists (and is writable)
// fs.mkdirSync(DB_DIR, { recursive: true });

// // Track whether this is a first-time init
// const isFirstRun = !fs.existsSync(DB_PATH);

// // 2) Open (creates file if missing)
// const db = new sqlite3.Database(
//   DB_PATH,
//   sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
//   (err) => {
//     if (err) {
//       console.error('Failed to open SQLite DB:', err.message);
//       return;
//     }

//     console.log(`SQLite DB ready at: ${DB_PATH}`);

//     // 3) Sensible defaults
//     db.serialize(() => {
//       db.run('PRAGMA journal_mode=WAL;', (e) => {
//         if (e) console.error('PRAGMA journal_mode failed:', e.message);
//       });
//       db.run('PRAGMA foreign_keys = ON;', (e) => {
//         if (e) console.error('PRAGMA foreign_keys failed:', e.message);
//       });
//     });

//     // 4) Run init.sql only on first run (if present)
//     if (isFirstRun && fs.existsSync(INIT_SQL_PATH)) {
//       try {
//         const initSql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
//         db.exec('BEGIN;' + initSql + ';COMMIT;', (e) => {
//           if (e) {
//             console.error('Error running init.sql:', e.message);
//             db.exec('ROLLBACK;');
//           } else {
//             console.log('Database initialized from init.sql');
//           }
//         });
//       } catch (readErr) {
//         console.error('Could not read init.sql:', readErr.message);
//       }
//     }
//   }
// );

// module.exports = db;

'use strict';
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
// changed the DB_DIR to relative path for local testing from app/data to data/
// changed the DB_FILE from app.sqlite to new.sqlite for local testing
const DB_DIR  = process.env.DB_DIR  || 'data/';
const DB_FILE = process.env.DB_FILE || 'new.sqlite';
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE);
const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');
const FORCE_INIT = process.env.INIT_FORCE === '1';

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, async (err) => {
  if (err) return console.error('Failed to open SQLite DB:', err.message);
  console.log(`SQLite DB ready at: ${DB_PATH}`);
  db.serialize(() => {
    db.run('PRAGMA journal_mode=WAL;');
    db.run('PRAGMA foreign_keys = ON;');
  });
  try {
    if (FORCE_INIT || (await needsInit(db))) {
      const sql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
      await exec(db, 'BEGIN;'); await exec(db, sql); await exec(db, 'COMMIT;');
      console.log('Schema ensured from init.sql');
    } else {
      console.log('Schema already present; skipping init.');
    }
  } catch (e) {
    console.error('Schema init failed:', e.message);
    try { await exec(db, 'ROLLBACK;'); } catch {}
  }
});

function exec(db, sql) { return new Promise((res, rej) => db.exec(sql, e => e ? rej(e) : res())); }
function needsInit(db) {
  return new Promise((res, rej) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
      (e, rows) => e ? rej(e) : res(!rows.map(r=>r.name).includes('users') || !rows.map(r=>r.name).includes('games')));
  });
}

module.exports = db;
//'use strict';
//const sqlite3 = require('sqlite3').verbose();
//const path = require('path');
//const fs = require('fs');
//
//// Configurable paths
//const DB_DIR  = process.env.DB_DIR  || 'data/';
//const DB_FILE = process.env.DB_FILE || 'new.sqlite';
//const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, DB_FILE);
//const INIT_SQL_PATH = process.env.INIT_SQL || path.join(__dirname, 'init.sql');
//const FORCE_INIT = process.env.INIT_FORCE === '1';
//
//// Ensure DB directory exists
//fs.mkdirSync(DB_DIR, { recursive: true });
//
//// Create and serialize DB instance
//const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
//  if (err) return console.error('Failed to open SQLite DB:', err.message);
//  console.log(`SQLite DB ready at: ${DB_PATH}`);
//});
//
//// Apply serialization globally
//db.serialize();
//
//// Apply PRAGMAs and initialize schema
//(async () => {
//  try {
//    db.run('PRAGMA journal_mode=WAL;');
//    db.run('PRAGMA foreign_keys = ON;');
//
//    if (FORCE_INIT || (await needsInit(db))) {
//      const sql = fs.readFileSync(INIT_SQL_PATH, 'utf8');
//      await exec(db, 'BEGIN;');
//      await exec(db, sql);
//      await exec(db, 'COMMIT;');
//      console.log('Schema ensured from init.sql');
//    } else {
//      console.log('Schema already present; skipping init.');
//    }
//  } catch (e) {
//    console.error('Schema init failed:', e.message);
//    try { await exec(db, 'ROLLBACK;'); } catch {}
//  }
//})();
//
//// Utility: exec wrapper
//function exec(db, sql) {
//  return new Promise((res, rej) => db.exec(sql, e => e ? rej(e) : res()));
//}
//
//// Utility: check if schema needs init
//function needsInit(db) {
//  return new Promise((res, rej) => {
//    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';",
//      (e, rows) => e ? rej(e) : res(!rows.map(r => r.name).includes('users') || !rows.map(r => r.name).includes('games')));
//  });
//}
//
//// Export shared DB instance
//module.exports = db;
