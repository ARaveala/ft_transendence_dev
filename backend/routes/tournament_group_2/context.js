const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js');
const DBupdate = require('@db/update.js');
const secure = require('@security');
const DBtour = require('@db/tournament.js');

// const game = require('@Rgame');
module.exports = {
	db,
	DBinsert,
	secure,
	DBget,
	DBupdate,
	DBtour,
	// game,
};