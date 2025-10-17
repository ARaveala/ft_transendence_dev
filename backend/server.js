	'use strict';
	require('module-alias/register'); // enables aliases
	// env file
	require('dotenv').config();
	// Import the Fastify framework
	// Create a Fastify instance
	// logger is enabled for debugging purposes

	//const WebSocket = require('ws');

	const fastify = require('fastify')({ logger: true });
	const {log} = require('@logger'); //dev
	// use stict mode for better error handling
	const cookie = require('@fastify/cookie');
	fastify.register(cookie);
	const authRoutes = require('@Rauth/auth.js');
	const authcontext = require('@Rauth/context.js');
	fastify.register(authRoutes, authcontext);
	// set up fucntion userRoutes , require from user.js
	//this will be split later into multiple files we can use this now as the tetsing ground
	const userRoutes = require('@routes/user.js');
	// set up context, require from context.js 
	// there will be multiple index or context.txt for each file ....
	const context = require('@context');
	const {db, secure} = context;
	// attatch context to fucntion options 
	fastify.register(userRoutes, context);

	// set up auth routes with context
	// const authRoutes = require('@Rauth/auth.js');
	// const authcontext = require('@Rauth/context.js');
	// fastify.register(authRoutes, authcontext);

	const profileRoutes = require('@Rprofile/profile.js');
	const profilecontext = require('@Rprofile/context.js');
	fastify.register(profileRoutes, profilecontext);

	const setUpWebSockets = require('@Wbs/startUp.js');

	const errorCodes = require('@sharedEcode');
	const formatError = require("@errors");

	const {gameRoutes} = require('@Rgame');
	fastify.register(gameRoutes, context);

	const path = require('path');

	const tournamentRoutes = require('@routes/tournament/tournament');
	fastify.register(tournamentRoutes, { db, secure });

	
	// no i need to register all of above? not just user routes


	// These are for easy testing
	fastify.get('/', async (request, reply) => {
	return { hello: 'world' };
	});
	fastify.get('/status', async (request, reply) => {
		const status = {"status": "API is online!"};
		return status;

	});


	const fastifyStatic = require('@fastify/static');

	fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'test_harness'), // or wherever your HTML lives
	prefix: '/test_harness/', // serve files from root
	index: false // disables auto-redirect to index.html
	});

	fastify.register(fastifyStatic, {
	root: path.join(__dirname, 'pong_game'),
	prefix: '/pong_game/',
	index: false,
	decorateReply: false // prevents re-adding sendFile
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
		console.log('Server error in server.js:', error);
		reply.code(500).send({ error: 'SERVER_ERROR', message: error.message });
	}
	});
	// Log all incoming requests for testing and debugging
	fastify.addHook('onRequest', async (request, reply) => {
		console.log(`[${request.method}] ${request.url}`);
		console.log('Headers:', request.headers);
		if (request.body) {
		  console.log('Body:', request.body);
		}
	});
	const start = async () => {

		try {
			log('STARTING SERVER', '---------------------------------------------');
		//await fastify.register(require('@fastify/cors'), {
		//  		origin: '*', // Allow all origins (for testing only)
		//});
	//    await fastify.listen({ port: 3000 });
		// have added for testing a local host binding to test docker ability to connect to browser
		fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
		if (err) {
			fastify.log.error(err)
			process.exit(1)
		}
		fastify.log.info('Server listening on port 3000')
		});
		setUpWebSockets(fastify.server);
		console.log('WebSocket server is running');
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
	};
	fastify.ready(err => {
	  if (err) throw err;
	  console.log('\n=== Registered routes ===');
	  console.log(fastify.printRoutes());
	  console.log('=========================\n');
	});
	start();
