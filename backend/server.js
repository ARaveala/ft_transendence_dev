
	require('module-alias/register'); // enables aliases
	require('dotenv').config();

	const cookie = require('@fastify/cookie');

	'use strict';
	const { logger, log } = require('@logger');
	const fastify = require('fastify')({ logger,   disableHeadRoute: false // This enables automatic HEAD handling
 	});
	const path = require('path');
	
	const authHooks = require('@hooks/authHooks.js');
	const authHookContext = require('@hooks/authContext.js');

	const friendRoutes = require('@routes/friends.js');
	const friendContext = require('@routes/context.js');
	
	
	const tournamentRoutes = require('@routes/tournament/tournament.js');
	const tournamentContext = require('@routes/tournament/context.js');
	// set up context, require from context.js 
	// there will be multiple index or context.txt for each file ....
	const context = require('@context');
	// Register the multipart plugin (Mandatory for request.file() to work)
	fastify.register(require('@fastify/multipart'), {
		limits: {
			fileSize: 1024 * 1024 * 2, // Example limit: 2MB
		}
	});
	// for cli pipeline
	fastify.get('/', async (req, reply) => {
  		reply.send({ status: 'ok' });
	});
	// set up auth routes with context
	const authRoutes = require('@Rauth/auth.js');
	const authcontext = require('@Rauth/context.js');
	

	const profileRoutes = require('@Rprofile/profile.js');
	const profilecontext = require('@Rprofile/context.js');

	// Attach WebSocket server to Fastify's internal server
	const setUpWebSockets = require('@Wbs/startUp.js');

	const errorCodes = require('@sharedEcode');
	const formatError = require("@errors");

	const {gameRoutes} = require('@Rgame');

	fastify.get('/status', async (request, reply) => {
		const status = {"status": "API is online!"};
		return status;

	});

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

    // Format errors: pass the full validation array
    const formatted = formatError.formatValidationError(error, error.validation);
    console.log("Formatted:", formatted);
    const code = formatted.errorType.code;
    reply.code(code).send({
      error: formatted.errorType.message,
      details: formatted.errorType.message
    });
  } else {
    console.log('Server error:', error);
    reply.code(500).send({ 
      error: 'SERVER_ERROR', 
      message: error.message 
    });
  }
});

	// Log all incoming requests for testing and debugging
	fastify.addHook('onRequest', async (request, reply) => {
		logger.trace({ function: 'onRequest', method: request.method, url: request.url, headers: request.headers, body: request.body }, 'Incoming request');

	});
	const start = async () => {

	try {
		console.log('STARTING SERVER', '---------------------------------------------');
		await fastify.register(cookie);
    	await fastify.register(authHooks, authHookContext);
		await fastify.register(authRoutes, authcontext);
    	await fastify.register(tournamentRoutes, tournamentContext);
    	await fastify.register(friendRoutes, context);
		await fastify.register(profileRoutes, profilecontext);
		await fastify.register(gameRoutes, context);

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

		await fastify.listen({ port: 3000, host: '0.0.0.0' });//, err => {
		fastify.log.info('Server listening on port 3000')
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

