const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBdelete = require('@db/delete.js');
const DBupdate = require('@db/update.js');
const DBget = require('@db/get.js') //testing minilogin
const secure = require('@security');

const { API_PROTOCOL } = require('@sharedApi');
const schemas = require('@sharedSchemas');
module.exports = {
	db,
	DBinsert,
	DBget,
	DBdelete,
	DBupdate,
	secure,
	API_PROTOCOL,
	schemas
};