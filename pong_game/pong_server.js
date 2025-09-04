///**
// * araveala notes of thinsg changed. 
// * Moved init into its own fucntion so its callabled from websocket message handler
// */
//
//// server.js (ES module)
//
//import { WebSocketServer } from "ws";
//
//// Create a WebSocket server on port 8080
//const wss = new WebSocketServer({ port: 8080 });
//
//// dont change unless change also in frontend
//const fps = 60;
//
//// overwrite these with values from client
//let height = 1;
//let width = 1;
//let ballSize = 1;
//let paddleSize = 1; // this is the height of paddle. width will not affect anything
//let paddleOffset = 1; // how far are paddles from window edges.
//
//// these can be changed
//const paddleSpeed = 10;
//const ballSpeed = 3;
//
//// indices in positions array for easier reading
//const leftPaddleI = 0;
//const rightPaddleI = 1;
//const ballYI = 2;
//const ballXI = 3;
//
//// positions = [paddle1, paddle2, ballY, ballX]
//// get overwritten depending on browser window size
//let positions = [100, 100, 100, 100];
//
//// ball direction
//const ball = {
//	dx: 3,
//	dy: 1
//}
//
//let gameRunning = false;
//let keysDown = [false, false, false, false];
//
//let lastUpdate = Date.now();
//
//wss.on("connection", (ws) => {
//	console.log("Client connected!");
//
//	ws.on("message", (message) => {
//		const data = JSON.parse(message.toString());
//		if (data.type == "init") {
//			// get settings from frontend
//			height = data.height;
//			width = data.width;
//			ballSize = data.ballSize;
//			paddleSize = data.paddleSize;
//			paddleOffset = data.paddleOffset;
//			positions = [paddleOffset, width - paddleOffset, height / 2, width / 2];
//			gameRunning = true;
//		} else {
//			keysDown = data;
//		}
//	});
//
//	ws.on("close", () => {
//		console.log("Client disconnected");
//	});
//
//	ws.on("error", (err) => {
//		console.error("WebSocket error:", err);
//	});
//
//	setInterval(() => {
//		if (gameRunning == false)
//			return;
//
//		// calculate delta for smooth rendering
//		const now = Date.now();
//		const delta = (now - lastUpdate) / 1000;
//		lastUpdate = now;
//
//		// move paddles
//		if (keysDown[0] == true) positions[leftPaddleI] -= paddleSpeed;
//		if (keysDown[1] == true) positions[leftPaddleI] += paddleSpeed;
//		if (keysDown[2] == true) positions[rightPaddleI] -= paddleSpeed;
//		if (keysDown[3] == true) positions[rightPaddleI] += paddleSpeed;
//
//		// keep inside bounds
//		// subtract paddleSize to keep the bottom inside window
//		positions[leftPaddleI] = Math.max(0, Math.min(height - paddleSize, positions[leftPaddleI]));
//		positions[rightPaddleI] = Math.max(0, Math.min(height - paddleSize, positions[rightPaddleI]));
//
//		// move ball
//		positions[ballYI] += ball.dy * ballSpeed;
//		positions[ballXI] += ball.dx * ballSpeed;
//
//		// check bounds and make it bounce
//		// add ballSize to get the balls right side
//		if (positions[ballYI] <= 0 || positions[ballYI] + ballSize >= height)
//			ball.dy = -ball.dy;
//		if (positions[ballXI] <= 0 || positions[ballXI] + ballSize >= width)
//			gameRunning = false; // somebody won
//		if (ballHitsPaddle(leftPaddleI) || ballHitsPaddle(rightPaddleI)) {
//			console.log("Ball hits paddle!");
//			ball.dx = -ball.dx;
//		}
//
//		console.log(`${positions}`);
//
//		ws.send(JSON.stringify(positions));
//	}, 1000 / fps);
//
//	function ballHitsPaddle(paddle) {
//		// horizontal checks
//		if (positions[ballXI] > paddleOffset && // left side of ball is not left enough to hit
//			positions[ballXI] + ballSize < width - paddleOffset) // right side of ball is not right enough to hit
//			return false;
//
//		// vertical checks
//		if (positions[ballYI] > positions[paddle] + paddleSize || // top of ball goes under paddles bottom
//			positions[ballYI] + ballSize < positions[paddle]) // bottom of ball goes over top of paddle
//			return false;
//
//		return true;
//	}
//});


function createGameState() {
  return {
	// dont change unless change also in frontend
	fps: 60,
	// overwrite these with values from client
	height: 1,
	width: 1,
	ballSize: 1,
	paddleSize: 1,
	paddleOffset: 1,

	// these can be changed
	paddleSpeed: 10,
	ballSpeed: 2,

	// indices in positions array for easier reading
	leftPaddleI: 0,
	rightPaddleI: 1,
	ballYI: 2,
	ballXI: 3,


	// positions = [paddle1, paddle2, ballY, ballX]
	// get overwritten depending on browser window size
	positions: [100, 100, 100, 100],

	// ball direction
	ball: { dx: 3, dy: 1 },
	gameRunning: false,
	keysDown: [false, false, false, false],
	lastUpdate: Date.now()
  };
}

function initGame(state, settings) {
	// get settings from frontend
	state.height = settings.height;
	state.width = settings.width;
	state.ballSize = settings.ballSize;
	state.paddleSize = settings.paddleSize;
	state.paddleOffset = settings.paddleOffset;
	state.positions = [
		state.paddleOffset,
		state.width - state.paddleOffset,
		state.height / 2,
		state.width / 2
	];
	state.gameRunning = true;
	state.lastUpdate = Date.now();
	// else is now case = keys in websockets messagehandler
}

function updateKeys(state, keys) {
  state.keysDown = keys;
}

function updateGame(state) {
	if (!state.gameRunning) return;

	// calculate delta for smooth rendering
	const now = Date.now();
	const delta = (now - state.lastUpdate) / 1000;
	state.lastUpdate = now;
	//console.log('keys', state.keysDown, 'p1', state.positions[0], 'p2', state.positions[1]);

	const speedFactor = delta * state.fps; // tried to slow down ball
	// Move paddles
	if (state.keysDown[0]) state.positions[state.leftPaddleI] -= state.paddleSpeed;// * speedFactor;
	if (state.keysDown[1]) state.positions[state.leftPaddleI] += state.paddleSpeed;// * speedFactor;
	if (state.keysDown[2]) state.positions[state.rightPaddleI] -= state.paddleSpeed;// * speedFactor;
	if (state.keysDown[3]) state.positions[state.rightPaddleI] += state.paddleSpeed;// * speedFactor;

	// keep inside bounds
	// subtract paddleSize to keep the bottom inside window
	state.positions[state.leftPaddleI] = Math.max(0, Math.min(state.height - state.paddleSize, state.positions[state.leftPaddleI]));
	state.positions[state.rightPaddleI] = Math.max(0, Math.min(state.height - state.paddleSize, state.positions[state.rightPaddleI]));

	// move ball
	state.positions[state.ballYI] += state.ball.dy * state.ballSpeed;//  * speedFactor;
	state.positions[state.ballXI] += state.ball.dx * state.ballSpeed;//  * speedFactor;

	// check bounds and make it bounce
	// add ballSize to get the balls right side
	if (state.positions[state.ballYI] <= 0 || state.positions[state.ballYI] + state.ballSize >= state.height)
		state.ball.dy = -state.ball.dy;

	if (state.positions[state.ballXI] <= 0 || state.positions[state.ballXI] + state.ballSize >= state.width)
		state.gameRunning = false; // somebody won

	if (ballHitsPaddle(state, state.leftPaddleI) || ballHitsPaddle(state, state.rightPaddleI))
		state.ball.dx = -state.ball.dx;
}

function ballHitsPaddle(state, paddleIndex) {
	const { positions, paddleOffset, width, paddleSize, ballSize } = state;

	// Horizontal check
	if (positions[state.ballXI] > paddleOffset && // left side of ball is not left enough to hit
		positions[state.ballXI] + ballSize < width - paddleOffset)  // right side of ball is not right enough to hit
		return false;

	// Vertical check
	if (positions[state.ballYI] > positions[paddleIndex] + paddleSize || // top of ball goes under paddles bottom
		positions[state.ballYI] + ballSize < positions[paddleIndex]) // bottom of ball goes over top of paddle
			return false;

	return true;
}


module.exports = {
	createGameState,
	initGame,
	updateKeys,
	updateGame
};