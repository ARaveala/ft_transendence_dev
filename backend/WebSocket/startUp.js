const WebSocket = require('ws');
const handleMessage = require('./messageHandlers.js').handleMessage;

const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'websockets/startUp.js' }); // scoped logger


//if (req.url === '/ws' || req.url === '/wss') {


// naming can be changed 
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
			if (req.url === '/ws' || req.url === '/wss') {
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
				let data;				
					try {
						const text = Buffer.isBuffer(msg) ? msg.toString() : msg;
						data = JSON.parse(text);
						} catch (err) {
							console.error('Failed to parse JSON:', msg.toString());
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
			// grace period dosnt need token verification
			// if we want user to be able to reconnect outside grace period 
			// we will need to establish a token verification through apis 
			ws.on("close", () => {
				console.log("Client disconnected");
				// some kind of pause logic here 
				const player = ws.player;//players.get(playerId);
				if (player) {
					
					player.disconnectedAt = Date.now();
					player.ws = null;
					handleMessage(undefined, { type: "pause", playerId: ws.playerId, gameId: ws.gameId });
					
					player.pauseTimeout = setTimeout(() => {
						// If still disconnected after 10s, end game or remove player
					console.log("client died, bury them ");
					}, 10000);
				}
				reconnect = true;
			});
		
			ws.on("error", (err) => {
				console.error("WebSocket error:", err);
			});
			ws.send(JSON.stringify({type: 'welcome', msg: 'Welcome to the WebSocket server!'}));
		});

}

module.exports = setUpWebSockets; // not exporting as an object 
