require('module-alias/register');
require('dotenv').config();

'use strict';

const path = require('path');
const Fastify = require('fastify');

const cookie = require('@fastify/cookie');
const cors = require('@fastify/cors');
const fastifyStatic = require('@fastify/static');

const { log } = require('@logger');
const errorCodes = require('@sharedEcode');
const formatError = require('@errors');

// Routes and contexts
const userRoutes = require('@routes/user.js');
const context = require('@context');

const authRoutes = require('@Rauth/auth.js');
const authContext = require('@Rauth/context.js');

const profileRoutes = require('@Rprofile/profile.js');
const profileContext = require('@Rprofile/context.js');

const gameRoutes = require('@Rgame');

const setUpWebSockets = require('@Wbs/startUp.js');

// Create server
const fastify = Fastify({ logger: true });

/* ----------------------------- Core plugins ----------------------------- */
// Register cookies and CORS BEFORE any routes so request.cookies actually exists
fastify.register(cookie);

const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

fastify.register(cors, {
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

/* ----------------------------- Debug logging ---------------------------- */
fastify.addHook('onRequest', async (request, _reply) => {
  // Minimal but useful request log including parsed cookies
  request.log.info({
    method: request.method,
    url: request.url,
    headers: request.headers,
    cookies: request.cookies
  }, 'incoming request');
});

/* ------------------------------ Healthcheck ----------------------------- */
fastify.get('/', async () => ({ hello: 'world' }));
fastify.get('/status', async () => ({ status: 'API is online!' }));

/* ----------------------------- Static hosting --------------------------- */
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'test_harness'),
  prefix: '/test_harness/',
  index: false
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'pong_game'),
  prefix: '/pong_game/',
  index: false,
  decorateReply: false
});

/* -------------------------------- Routes -------------------------------- */
fastify.register(userRoutes, context);
fastify.register(authRoutes, authContext);
fastify.register(profileRoutes, profileContext);
fastify.register(gameRoutes, context);

/* ----------------------------- Error handling --------------------------- */
fastify.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    const { code, msg } = errorCodes.VALIDATION_FAILED;
    const formatted = formatError.formatValidationError(error, msg);
    return reply.code(code).send({ error: 'VALIDATION_FAILED', formatted });
  }
  request.log.error({ err: error }, 'Server error in server.js');
  reply.code(500).send({ error: 'SERVER_ERROR', message: error.message });
});

/* ------------------------------- Start up -------------------------------- */
fastify.ready(err => {
  if (err) throw err;
  console.log('\n=== Registered routes ===');
  console.log(fastify.printRoutes());
  console.log('=========================\n');
});

const start = async () => {
  try {
    log('STARTING SERVER', '---------------------------------------------');
    fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      fastify.log.info('Server listening on port 3000');

      // Attach WebSocket server after HTTP server is up
      setUpWebSockets(fastify.server);
      console.log('WebSocket server is running');
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();






// require('module-alias/register'); // enables aliases
// // env file
// require('dotenv').config();
// // Import the Fastify framework
// // Create a Fastify instance
// // logger is enabled for debugging purposes

// 'use strict';
// const { logger, log } = require('@logger');
// const fastify = require('fastify')({ logger });
// fastify.addHook('onRequest', (req, _reply, done) => {
//   // temporary debug. do NOT keep in prod.
//   console.log('[DBG]', req.method, req.url, 'CookieHdr=', req.headers.cookie, 'Parsed=', req.cookies);
//   done();
// });

// fastify.get('/api/__auth_probe', (req, reply) => {
//   const token = req.cookies?.auth_token;
//   let parsed = null, err = null;
//   try { parsed = token ? secure.getUserIdFromToken(token) : null; }
//   catch (e) { err = String(e && e.message || e); }
//   reply.send({
//     hasCookieHeader: !!req.headers.cookie,
//     hasParsedCookie: !!req.cookies?.auth_token,
//     tokenPresent: !!token,
//     tokenDecoded: !!parsed && parsed.id ? { id: parsed.id } : null,
//     tokenError: err
//   });
// });
// const path = require('path');
// const cookie = require('@fastify/cookie');
// fastify.register(cookie);

// const app = fastify;

// // set up fucntion userRoutes , require from user.js
// //this will be split later into multiple files we can use this now as the tetsing ground
// const userRoutes = require('@routes/user.js');
// const friendRoutes = require('@routes/friends.js');
// const friendContext = require('@routes/context.js');


// const tournamentRoutes = require('@routes/tournament_group_2/tournament.js');
// const tournamentContext = require('@routes/tournament_group_2/context.js');
// // set up context, require from context.js 
// // there will be multiple index or context.txt for each file ....
// const context = require('@context');
// const {db, secure} = context;
// // attatch context to fucntion options 
// fastify.register(userRoutes, context);
// fastify.register(tournamentRoutes, tournamentContext)
// fastify.register(friendRoutes, context);

// // Register the multipart plugin (Mandatory for request.file() to work)
// fastify.register(require('@fastify/multipart'), {
// 	limits: {
// 		fileSize: 1024 * 1024 * 2, // Example limit: 2MB
// 	}
// });

// const fastifyStatic = require('@fastify/static'); 

// // We are pointing the root directly to the physical 'avatars' folder inside 'public'.
// const AVATAR_DIR = path.join(__dirname, 'public', 'avatars'); 

// // --- Static File Registration for Avatars ---
// // This configuration specifically maps the URL prefix '/api/avatars' 
// // to the physical directory where the files are stored.
// fastify.register(fastifyStatic, {
// 	// 1. The physical directory on disk: .../backend/public/avatars
// 	root: AVATAR_DIR,
	
// 	// 2. The URL prefix: Requests starting with /api/avatars/ will now look inside AVATAR_DIR.
// 	// Request URL: /api/avatars/6_...png 
// 	// -> Maps to: AVATAR_DIR/6_...png 
// 	prefix: '/api/avatars', 
	
// 	// Enable serving files
// 	serve: true,
	
// 	// Disable decorating reply if not needed, simpler setup
// 	decorateReply: false 
// });


// fastify.register(fastifyStatic, {
// 	root: path.join(__dirname, 'pong_game'),
// 	prefix: '/pong_game/',
// 	index: false,
// 	decorateReply: false // prevents re-adding sendFile
// });

// // set up auth routes with context
// const authRoutes = require('@Rauth/auth.js');
// const authcontext = require('@Rauth/context.js');
// fastify.register(authRoutes, authcontext);


// const profileRoutes = require('@Rprofile/profile.js');
// const profilecontext = require('@Rprofile/context.js');
// fastify.register(profileRoutes, profilecontext);


// // Attach WebSocket server to Fastify's internal server
// const setUpWebSockets = require('@Wbs/startUp.js');

// const errorCodes = require('@sharedEcode');
// const formatError = require("@errors");

// const gameRoutes = require('@routes/game.js');
// fastify.register(gameRoutes, context);



// // websocket handlers
// //const WBhandlers = require ('Webscoket/');

// // utalizes api routing from  routes/user.js

// //	const tournamentRoutes = require('./routes/tournament/tournament');
// //	fastify.register(tournamentRoutes, { db, secure });

// // These are for easy testing
// fastify.get('/', async (request, reply) => {
// return { hello: 'world' };
// });
// fastify.get('/status', async (request, reply) => {
// 	const status = {"status": "API is online!"};
// 	return status;

// });



// // TEST:: docker does not seem to need this 
// //fastify.register(require('@fastify/cors'), {
// //  origin: 'http://localhost:5173', // your frontend dev server 5173 front end dev
// //  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //  allowedHeaders: ['Content-Type', 'Authorization'], // include any custom headers you use
// //  credentials: true // if you're sending cookies or auth headers
// //});
// // Global error handler
// fastify.setErrorHandler((error, request, reply) => {
// if (error.validation) {
// 	console.log('Validation error:', error.validation);
// 	const {code, msg} = errorCodes.VALIDATION_FAILED;
// 	const formatted = formatError.formatValidationError(error, msg);
// 	//reply.code(400).send({ error: 'VALIDATION_FAILED', details: error.validation });
	
// reply.code(code).send({ error: 'VALIDATION_FAILED', formatted});
	
// } else {
// 	console.log('Server error in srver.js:', error);
// 	reply.code(500).send({ error: 'SERVER_ERROR', message: error.message });
// }
// });
// // Log all incoming requests for testing and debugging
// fastify.addHook('onRequest', async (request, reply) => {
// 	logger.trace({ function: 'onRequest', method: request.method, url: request.url, headers: request.headers, body: request.body }, 'Incoming request');
// 	//console.log(`[${request.method}] ${request.url}`);
// 	//console.log('Headers:', request.headers);
// 	//if (request.body) {
// 	//  console.log('Body:', request.body);
// 	//}
// });
// const start = async () => {

// 	try {
// 		log('STARTING SERVER', '---------------------------------------------');
// 	//await fastify.register(require('@fastify/cors'), {
// 	//  		origin: '*', // Allow all origins (for testing only)
// 	//});
// //    await fastify.listen({ port: 3000 });
// 	// have added for testing a local host binding to test docker ability to connect to browser
// 	fastify.listen({ port: 3000, host: '0.0.0.0' }, err => {
// 	if (err) {
// 		fastify.log.error(err)
// 		process.exit(1)
// 	}
// 	fastify.log.info('Server listening on port 3000')
// 	});
// 	setUpWebSockets(fastify.server);
// 	console.log('WebSocket server is running');
// } catch (err) {
// 	fastify.log.error(err);
// 	process.exit(1);
// }
// };
// fastify.ready(err => {
// 	if (err) throw err;
// 	console.log('\n=== Registered routes ===');
// 	console.log(fastify.printRoutes());
// 	console.log('=========================\n');
// });
// start();



// //fastify.server.on('upgrade', (req, socket, head) => {
// //  console.log('Upgrade request received:', req.url);
// //  wss.handleUpgrade(req, socket, head, (ws) => {
// //    console.log('WebSocket handshake successful');
// //    wss.emit('connection', ws, req);
// //  });
// //});


// // just an example of returning a different type of data
// //function getAllUsers() {
// //    return new Promise((resolve, reject) => {
// //        db.all(`SELECT id, username, avatar FROM users`, [], (err, rows) => {
// //            if (err) reject(err);
// //            else resolve(rows); // rows is an array of user objects
// //        });
// //    });
// //}
// //SELECT id, username FROM users WHERE score > 100