const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js');
const DBupdate = require('@db/update.js');
const secure = require('@security');

module.exports = {
	db,
	DBinsert,
	secure,
	DBget,
	DBupdate
};