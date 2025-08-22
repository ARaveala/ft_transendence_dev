
require('module-alias/register'); // enables aliases
// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

const WebSocket = require('ws');

const fastify = require('fastify')({ logger: true });
// open a connection to the SQLite database

// use stict mode for better error handling
'use strict';
const db = require('@db/initDB.js');
// Attach WebSocket server to Fastify's internal server

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



const start = async () => {

	try {
		
	await fastify.register(require('@fastify/cors'), {
      		origin: '*', // Allow all origins (for testing only)
    });
    await fastify.listen({ port: 3000 });
	//const socket = new WebSocket('ws://localhost:3000/ws');


	const wss = new WebSocket.Server({ noServer: true});

    // WebSocket server setup AFTER Fastify is listening
    fastify.server.on('upgrade', (req, socket, head) => {
		//const requestedProtocols = req.headers['sec-websocket-protocol'];
		//console.log('Requested protocols:', protocols);
		//if (requestedProtocols !== 'my-protocol') {
		//  socket.destroy(); // reject connection
		//}
		console.log('🔗 Upgrade request received');
		console.log('🧾 Request URL:', req.url);
  		console.log('📬 Headers:', req.headers);
		if (req.url === '/ws') {
  			  console.log('Upgrade request received at /ws');
  			  wss.handleUpgrade(req, socket, head, (ws) => {
  			    wss.emit('connection', ws, req);
  			  });
  			} else {
  			  console.log('Unknown upgrade path:', req.url);
  			  socket.destroy();
  			}
		});

	
    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
		ws.on('message', (msg) => {
		  try {
		    const data = JSON.parse(msg);
		    if (data.type === 'greet') {
		      console.log('Received greeting:', data.message);
		      ws.send('Hello back!');
		    }
		  } catch (err) {
		    console.error('Invalid JSON:', msg);
		    ws.send('Error: Invalid format');
		  }
		});
     // ws.on('message', (message) => {
     //   console.log('Received:', message);
     //   ws.send(`Echo: ${message}`);
     // });
	  

      ws.send('Welcome to the WebSocket server!');
    });

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

//switch (data.type) {
//      case 'greet':
//        ws.send(JSON.stringify({ type: 'reply', payload: 'Hello Client!' }));
//        break;
//
//      case 'ping':
//        ws.send(JSON.stringify({ type: 'pong', payload: 'Still alive!' }));
//        break;
//
//      case 'chat':
//        // You could broadcast this to other clients later
//        ws.send(JSON.stringify({ type: 'chat-received', payload: data.payload }));
//        break;
//
//      default:
//        ws.send(JSON.stringify({ type: 'error', payload: 'Unknown message type' }));
//    }


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