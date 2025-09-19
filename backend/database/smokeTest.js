// database/smokeTest.js
const db = require('./initDB'); // this should create the file and run init.sql
const { insertUser, loginUser } = require('./insert');
const { fetchUser } = require('./get');
const { updateUserScore } = require('./update');

(async () => {
  try {
    // 1) Insert a user
    const u = await insertUser({ username: 'alice', password: 'pass123', score: 10});
    console.log('Inserted:', u);

    // 2) Read it back
    const row = await fetchUser({ userId: u.userId });
    console.log('Fetched:', row);

    // 3) Update score
    const upd = await updateUserScore({ userId: u.userId, score: 42 });
    console.log('Updated:', upd);

    // 4) Read again
    const row2 = await fetchUser({ userId: u.userId });
    console.log('Fetched after update:', row2);

    // 5) Try your “miniLogin” (plaintext check; dev only)
    const { miniLogin } = require('./get');
    const login = await miniLogin('alice', 'pass123');
    console.log('miniLogin:', login);

    // Optional: demonstrate the broken “login inserts user” function so you remember to fix it later
    // const devLogin = await loginUser({ username: 'bob', password: 'x' });
    // console.log('devLogin inserted:', devLogin);
  } catch (e) {
    console.error('Smoke test failed:', e);
  } finally {
    // Close DB cleanly
    db.close?.();
  }
})();
