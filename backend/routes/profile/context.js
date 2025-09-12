const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js');
const DBupdate = require('@db/update.js');
const secure = require('@security');

// for this file the queastion is , will i need get.js , insert.js or will there be more indeoth file structure

module.exports = {
	db,
	DBinsert, // eg this isnserts into db
	secure,
	DBget,
	DBupdate
};