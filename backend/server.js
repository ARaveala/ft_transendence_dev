
	require('module-alias/register'); // enables aliases
	// env file
	require('dotenv').config();
//	console.log('JWT_SECRET:', process.env.JWT_SECRET);
//	const cookie = require('@fastify/cookie');
	console.log('JWT_SECRET:', process.env.JWT_SECRET);
	const cookie = require('@fastify/cookie');
	// Import the Fastify framework
	// Create a Fastify instance
	// logger is enabled for debugging purposes

	'use strict';
	const { logger, log } = require('@logger');
	const fastify = require('fastify')({ logger });
	const path = require('path');
	

//	const app = fastify;
//	const app = fastify;

	// set up fucntion userRoutes , require from user.js
	//this will be split later into multiple files we can use this now as the tetsing ground
	const authHooks = require('@hooks/authHooks.js');
	const authHookContext = require('@hooks/authContext.js');


	//async function registerAuthHook(fastify) {
	//	await fastify.register(authHooks, authHookContext);
	//}
//
	//// ✅ Register the hook early
	//await registerAuthHook(fastify); 
	

//	fastify.register(authHooks, authHookContext);
//	try {
//		await fastify.register(authHooks, authHookContext);
//	} catch {
//		app.warn("SERVER error on registering hook ");
//	}


	//async function registerAuthHook(fastify) {
	//	await fastify.register(authHooks, authHookContext);
	//}
//
	//// ✅ Register the hook early
	//await registerAuthHook(fastify); 
	

//	fastify.register(authHooks, authHookContext);
//	try {
//		await fastify.register(authHooks, authHookContext);
//	} catch {
//		app.warn("SERVER error on registering hook ");
//	}

	const userRoutes = require('@routes/user.js');
	const friendRoutes = require('@routes/friends.js');
	const friendContext = require('@routes/context.js');
	
	
	const tournamentRoutes = require('@routes/tournament/tournament.js');
	const tournamentContext = require('@routes/tournament/context.js');
	// set up context, require from context.js 
	// there will be multiple index or context.txt for each file ....
	const context = require('@context');
//	const {db, secure} = context;
//	const {db, secure} = context;
	// attatch context to fucntion options 
//	fastify.register(userRoutes, context);
//	fastify.register(tournamentRoutes, tournamentContext)
//	fastify.register(friendRoutes, context);
//
//	fastify.register(userRoutes, context);
//	fastify.register(tournamentRoutes, tournamentContext)
//	fastify.register(friendRoutes, context);
//
	// Register the multipart plugin (Mandatory for request.file() to work)
	fastify.register(require('@fastify/multipart'), {
		limits: {
			fileSize: 1024 * 1024 * 2, // Example limit: 2MB
		}
	});

	//const fastifyStatic = require('@fastify/static'); 
	//const fastifyStatic = require('@fastify/static'); 

	// We are pointing the root directly to the physical 'avatars' folder inside 'public'.
	////remove
//	const AVATAR_DIR = path.join(__dirname, 'public', 'avatars'); 
//
//	// --- Static File Registration for Avatars ---
//	// This configuration specifically maps the URL prefix '/api/avatars' 
//	// to the physical directory where the files are stored.
//	///REMOVE
//	fastify.register(fastifyStatic, {
//		// 1. The physical directory on disk: .../backend/public/avatars
//		root: AVATAR_DIR,
//		
//		// 2. The URL prefix: Requests starting with /api/avatars/ will now look inside AVATAR_DIR.
//		// Request URL: /api/avatars/6_...png 
//		// -> Maps to: AVATAR_DIR/6_...png 
//		prefix: '/api/avatars', 
//		
//		// Enable serving files
//		serve: true,
//		
//		// Disable decorating reply if not needed, simpler setup
//		decorateReply: false 
//	});
	////remove
//	const AVATAR_DIR = path.join(__dirname, 'public', 'avatars'); 
//
//	// --- Static File Registration for Avatars ---
//	// This configuration specifically maps the URL prefix '/api/avatars' 
//	// to the physical directory where the files are stored.
//	///REMOVE
//	fastify.register(fastifyStatic, {
//		// 1. The physical directory on disk: .../backend/public/avatars
//		root: AVATAR_DIR,
//		
//		// 2. The URL prefix: Requests starting with /api/avatars/ will now look inside AVATAR_DIR.
//		// Request URL: /api/avatars/6_...png 
//		// -> Maps to: AVATAR_DIR/6_...png 
//		prefix: '/api/avatars', 
//		
//		// Enable serving files
//		serve: true,
//		
//		// Disable decorating reply if not needed, simpler setup
//		decorateReply: false 
//	});

///REMOVE
//	fastify.register(fastifyStatic, {
//		root: path.join(__dirname, 'pong_game'),
//		prefix: '/pong_game/',
//		index: false,
//		decorateReply: false // prevents re-adding sendFile
//	});
///REMOVE
//	fastify.register(fastifyStatic, {
//		root: path.join(__dirname, 'pong_game'),
//		prefix: '/pong_game/',
//		index: false,
//		decorateReply: false // prevents re-adding sendFile
//	});

	// set up auth routes with context
	const authRoutes = require('@Rauth/auth.js');
	const authcontext = require('@Rauth/context.js');
	///REMOVEfastify.register(authRoutes, authcontext);
	///REMOVEfastify.register(authRoutes, authcontext);
	

	const profileRoutes = require('@Rprofile/profile.js');
	const profilecontext = require('@Rprofile/context.js');
	///REMOVEfastify.register(profileRoutes, profilecontext);
	///REMOVEfastify.register(profileRoutes, profilecontext);


	// Attach WebSocket server to Fastify's internal server
	const setUpWebSockets = require('@Wbs/startUp.js');

	const errorCodes = require('@sharedEcode');
	const formatError = require("@errors");

	const {gameRoutes} = require('@Rgame');
	///REMOVEfastify.register(gameRoutes, context);
	///REMOVEfastify.register(gameRoutes, context);

	

	// websocket handlers
	//const WBhandlers = require ('Webscoket/');


	// utalizes api routing from  routes/user.js

//	const tournamentRoutes = require('./routes/tournament/tournament');
//	fastify.register(tournamentRoutes, { db, secure });

	///REMOVEfastify.register(cookie);
	
	
	///REMOVEfastify.register(cookie);
	
	
	// no i need to register all of above? not just user routes


	// These are for easy testing
	//fastify.get('/', async (request, reply) => {
	//return { hello: 'world' };
	//});
	//fastify.get('/status', async (request, reply) => {
	//	const status = {"status": "API is online!"};
	//	return status;
//
	//});
	//fastify.get('/', async (request, reply) => {
	//return { hello: 'world' };
	//});
	//fastify.get('/status', async (request, reply) => {
	//	const status = {"status": "API is online!"};
	//	return status;
//
	//});



	// TEST:: docker does not seem to need this 
	//fastify.register(require('@fastify/cors'), {
	//  origin: 'http://localhost:5173', // your frontend dev server 5173 front end dev
	//  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	//  allowedHeaders: ['Content-Type', 'Authorization'], // include any custom headers you use
	//  credentials: true // if you're sending cookies or auth headers
	//});
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
	// Log all incoming requests for testing and debugging
	fastify.addHook('onRequest', async (request, reply) => {
		logger.trace({ function: 'onRequest', method: request.method, url: request.url, headers: request.headers, body: request.body }, 'Incoming request');
		//console.log(`[${request.method}] ${request.url}`);
		//console.log('Headers:', request.headers);
		//if (request.body) {
		//  console.log('Body:', request.body);
		//}
	});
	const start = async () => {

//		try {
			//console.log('Registering authHook...');
//		await fastify.register(authHooks, authHookContext);
			//console.log('Registerededed authHook...');
		
//} catch {
//			app.warn("SERVER error on registering hook ");
//		}

//		try {
			//console.log('Registering authHook...');
//		await fastify.register(authHooks, authHookContext);
			//console.log('Registerededed authHook...');
		
//} catch {
//			app.warn("SERVER error on registering hook ");
//		}

		try {
			log('STARTING SERVER', '---------------------------------------------');
		//await fastify.register(require('@fastify/cors'), {
		//  		origin: '*', // Allow all origins (for testing only)
		//});
	//    await fastify.listen({ port: 3000 });
	await fastify.register(cookie);
    await fastify.register(authHooks, authHookContext);
	await fastify.register(authRoutes, authcontext);
    await fastify.register(userRoutes, context);
    await fastify.register(tournamentRoutes, tournamentContext);
    await fastify.register(friendRoutes, context);
	await fastify.register(profileRoutes, profilecontext);
	await fastify.register(gameRoutes, context);
    //await fastify.register(require('@fastify/multipart'), {
    //  limits: { fileSize: 1024 * 1024 * 2 }
    //});

    await fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, 'public', 'avatars'),
      prefix: '/api/avatars',
      serve: true,
      decorateReply: false
    });

    await fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, 'pong_game'),
      prefix: '/pong_game/',
      index: false,
      decorateReply: false
    });

//    await fastify.register(authRoutes, authcontext);
//    await fastify.register(profileRoutes, profilecontext);
//    await fastify.register(gameRoutes, context);


		await fastify.listen({ port: 3000, host: '0.0.0.0' });//, err => {
		//if (err) {
		//	fastify.log.error(err)
		//	process.exit(1)
		//}
		fastify.log.info('Server listening on port 3000')
		//});
		//});
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



	//fastify.server.on('upgrade', (req, socket, head) => {
	//  console.log('Upgrade request received:', req.url);
	//  wss.handleUpgrade(req, socket, head, (ws) => {
	//    console.log('WebSocket handshake successful');
	//    wss.emit('connection', ws, req);
	//  });
	//});

