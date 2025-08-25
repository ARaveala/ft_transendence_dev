
require('module-alias/register'); // enables aliases
// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

//const WebSocket = require('ws');

const fastify = require('fastify')({ logger: true });
// open a connection to the SQLite database

// use stict mode for better error handling
'use strict';
const db = require('@db/initDB.js');
// Attach WebSocket server to Fastify's internal server

// api path determines the route for user specific operations
// this does not yet validate the input!
const userRoutes = require('@routes/user.js');
const setUpWebSockets = require('@Wbs/startUp.js');
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



const start = async () => {

	try {
		
	//await fastify.register(require('@fastify/cors'), {
    //  		origin: '*', // Allow all origins (for testing only)
    //});
    await fastify.listen({ port: 3000 });
	setUpWebSockets(fastify.server);
    console.log('WebSocket server is running');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();



//fastify.server.on('upgrade', (req, socket, head) => {
//  console.log('Upgrade request received:', req.url);
//  wss.handleUpgrade(req, socket, head, (ws) => {
//    console.log('WebSocket handshake successful');
//    wss.emit('connection', ws, req);
//  });
//});


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