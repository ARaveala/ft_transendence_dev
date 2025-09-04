const WebSocket = require('ws');
const handleMessage = require('./messageHandlers.js').handleMessage;
//const handlers = require('./handlers.js');

function setUpWebSockets(server) {

	// this allows http and websocket to share same port
	const wss = new WebSocket.Server({ noServer: true});

		// WebSocket server setup AFTER Fastify is listening
		server.on('upgrade', (req, socket, head) => {

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

			ws.on('message', (msg, isBinary) => {
				try {
					const text = isBinary ? msg.toString() : msg.toString('utf8');
					const data = JSON.parse(text);
					handleMessage(ws, data);
					} catch (err) {
					console.error('Invalid JSON:', msg);
					ws.send('Error: Invalid format');
				}
			});

			ws.on("close", () => {
				console.log("Client disconnected");
			});
		
			ws.on("error", (err) => {
				console.error("WebSocket error:", err);
			});
			ws.send('Welcome to the WebSocket server!');
		});


}

module.exports = setUpWebSockets; // not exporting as an object 