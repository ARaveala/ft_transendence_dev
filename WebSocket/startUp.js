const WebSocket = require('ws');
const handleMessage = require('./messageHandlers.js').handleMessage;
//const handlers = require('./handlers.js');
let reconnect = false;
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
				let data;				
				//try {
				//if (reconnect) {
				//		handleMessage(ws, {type: "reconnect"}); // actual player detials needed
				//		reconnect = false;
				//		return;
				//	}
				//	console.log('Raw WebSocket message:', msg);
				//	const text = Buffer.isBuffer(msg) ? msg.toString() : msg;
//
				//	console.log('Text version is ------', text);
				//	//const text = isBinary ? msg.toString() : msg.toString('utf8');
				//	const data = JSON.parse(text);
				//	handleMessage(ws, data);
				//	} catch (err) {
				//	console.error('Invalid JSON:', msg);
				//	ws.send('Error: Invalid format');
				//}
					try {
					  const text = Buffer.isBuffer(msg) ? msg.toString() : msg;
					  data = JSON.parse(text);
					} catch (err) {
					  console.error('Failed to parse JSON:', msg.toString());
					  console.error('Parse error:', err.message);
					  ws.send('Error: Invalid format');
					  return;
					}
					
					try {
						//console.log('CHECKING THE GAME ID BEFORE MESSAGE HANLDER', JSON.stringify(data));
					  handleMessage(ws, data);
					} catch (err) {
					  console.error('Error in handleMessage:', err.message);
					}	
			});

			ws.on("close", () => {
				console.log("Client disconnected");
				// some kind of pause logic here 
				const player = 666;//players.get(playerId);
				if (player) {
					player.disconnectedAt = Date.now();
				//	player.ws = null;
					handleMessage(undefined, { type: "pause"});
					
				//	// Pause game logic if needed
				player.pauseTimeout = setTimeout(() => {
				//		// If still disconnected after 10s, end game or remove player
				//		players.delete(playerId);
					console.log("client died, bury them ");
					}, 10000);
				}
				reconnect = true;
			});
		
			ws.on("error", (err) => {
				console.error("WebSocket error:", err);
			});
			ws.send('Welcome to the WebSocket server!');
		});


}

module.exports = setUpWebSockets; // not exporting as an object 