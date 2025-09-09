const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js') //testing minilogin
const secure = require('@security');
//const game = require('@Rgame'); // testing
module.exports = {
	db,
	DBinsert,
	DBget,
	secure,
};