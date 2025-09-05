
require('module-alias/register'); // enables aliases
// env file
require('dotenv').config();
// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

//const WebSocket = require('ws');

const fastify = require('fastify')({ logger: true });
// open a connection to the SQLite database

// use stict mode for better error handling
'use strict';
// set up fucntion userRoutes , require from user.js
//this will be split later into multiple files we can use this now as the tetsing ground
const userRoutes = require('@routes/user.js');
// set up context, require from context.js 
// there will be multiple index or context.txt for each file ....
const context = require('@context');
// attatch context to fucntion options 
fastify.register(userRoutes, context);

// set up auth routes with context
const authRoutes = require('@Rauth/auth.js');
const authcontext = require('@Rauth/context.js');
fastify.register(authRoutes, authcontext);

const profileRoutes = require('@Rprofile/profile.js');
const profilecontext = require('@Rprofile/context.js');
fastify.register(profileRoutes, profilecontext);

// Attach WebSocket server to Fastify's internal server
const setUpWebSockets = require('@Wbs/startUp.js');

const errorCodes = require('@sharedEcode');
const formatError = require("@errors");
const { format } = require('path');

// websocket handlers
//const WBhandlers = require ('Webscoket/');
const cookie = require('@fastify/cookie');
// utalizes api routing from  routes/user.js


fastify.register(cookie);
// no i need to register all of above? not just user routes


// These are for easy testing
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});
fastify.get('/status', async (request, reply) => {
	const status = {"status": "API is online!"};
	return status;

});

fastify.register(require('@fastify/cors'), {
  origin: 'http://localhost:5173', // your frontend dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // include any custom headers you use
  credentials: true // if you're sending cookies or auth headers
});
// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
	console.log('Validation error:', error.validation);
    const {code, msg} = errorCodes.VALIDATION_FAILED;
	const formatted = formatError.formatValidationError(error, msg);
	//reply.code(400).send({ error: 'VALIDATION_FAILED', details: error.validation });
	
   reply.code(code).send({ error: 'VALIDATION_FAILED', formatted});
	
  } else {
	console.log('Server error in srver.js:', error);
    reply.code(500).send({ error: 'SERVER_ERROR', message: error.message });
  }
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