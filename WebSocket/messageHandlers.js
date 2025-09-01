
const {
  handleGreet,
  //handleMove,
  //handleConnection,
  //handlePing
} = require('./handlers.js');
// we should rename this to message deligation?

function handleMessage(ws, data) {

	switch (data.type) {
		case 'greet':
			handleGreet(ws, data);
			//console.log('Received greeting:', data.message);
			//ws.send('Hello back!');
			break;
		case 'ping':
			ws.send(JSON.stringify({ type: 'pong', payload: 'Pong!' }));
			break;
		case 'move':
			console.log('Received move data:', data.payload);
			// Process movement data here (e.g., update game state)
			// send something back to acknowledge
			ws.send(JSON.stringify({ type: 'move-ack', payload: 'Move received' }));
			break;
		case 'init':
			//send to connect game logic
			ws.send(JSON.stringify({type: 'connect', payload: 'temp'}));
			break;
		default:
			console.error('Unknown message type:', data.type);
			ws.send(JSON.stringify({ error: 'Unknown message type' }));
			break;
	}

	//ws.on('message', (msg) => {
	//	  try {
	//	    const data = JSON.parse(msg);
	//	    if (data.type === 'greet') {
	//	      console.log('Received greeting:', data.message);
	//	      ws.send('Hello back!');
	//	    }
	//	  } catch (err) {
	//	    console.error('Invalid JSON:', msg);
	//	    ws.send('Error: Invalid format');
	//	  }
	//	});
     // ws.on('message', (message) => {
     //   console.log('Received:', message);
     //   ws.send(`Echo: ${message}`);
     // });
}

module.exports = { handleMessage };