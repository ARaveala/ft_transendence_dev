const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const secure = require('@security');

module.exports = {
	db,
	DBinsert,
	secure,
};