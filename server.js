
require('module-alias/register'); // enables aliases
// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

const fastify = require('fastify')({ logger: true });
// open a connection to the SQLite database

// use stict mode for better error handling
'use strict';
const db = require('@db/initDB.js');

// api path determines the route for user specific operations
// this does not yet validate the input!
const userRoutes = require('@routes/user.js');

// utalizes api routing from  routes/user.js
fastify.register(userRoutes);

// These are for easy testing
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});
fastify.get('/status', async (request, reply) => {
	const status = {"status": "API is online!"};
	return status;

});



//// testing how do adjust and parse scores with schemas i assume these all go to the top of file
//const updateScoreSchema = require('@schemas/updateScore.js');
//
//
//fastify.patch('/update-score/:id', {
//	schema: updateScoreSchema,
//	handler: async (request, reply) => {
//	const userId = request.params.id;
//	const { score } = request.body;
//
//	return new Promise((resolve, reject) => {
//		db.run(
//			`UPDATE users SET score = ? WHERE id = ?`,
//			[score, userId],
//			function (err) {
//				if (err) {
//					reject({ error: 'Failed to update the score', details: err});
//				} else if (this.changes === 0) {
//					reject({ error: 'User not found , no changes made' });
//				} else {
//					resolve({ message: 'Score updated', userId: userId, newScore: score});
//				}
//			}
//		);
//	});
//}
//});
//
// would we want to preload map of users and their ids, saftey concerns but also makes databse more free?

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();


// just an example of returning a different type of data
//function getAllUsers() {
//    return new Promise((resolve, reject) => {
//        db.all(`SELECT id, username, avatar FROM users`, [], (err, rows) => {
//            if (err) reject(err);
//            else resolve(rows); // rows is an array of user objects
//        });
//    });
//}
//SELECT id, username FROM users WHERE score > 100