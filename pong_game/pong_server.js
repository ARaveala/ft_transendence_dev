// server.js (ES module)

import { WebSocketServer } from "ws";

// Create a WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });

// dont change unless change also in frontend
const fps = 60;

// overwrite these with values from client
let height = 1;
let width = 1;
let ballSize = 1;
let paddleSize = 1; // this is the height of paddle. width will not affect anything
let paddleOffset = 1; // how far are paddles from window edges.

// these can be changed
const paddleSpeed = 10;
const ballSpeed = 3;

// indices in positions array for easier reading
const leftPaddleI = 0;
const rightPaddleI = 1;
const ballYI = 2;
const ballXI = 3;

// positions = [paddle1, paddle2, ballY, ballX]
// get overwritten depending on browser window size
let positions = [100, 100, 100, 100];

// ball direction
const ball = {
	dx: 3,
	dy: 1
}

let gameRunning = false;
let keysDown = [false, false, false, false];

let lastUpdate = Date.now();

wss.on("connection", (ws) => {
	console.log("Client connected!");

	ws.on("message", (message) => {
		const data = JSON.parse(message.toString());
		if (data.type == "init") {
			// get settings from frontend
			height = data.height;
			width = data.width;
			ballSize = data.ballSize;
			paddleSize = data.paddleSize;
			paddleOffset = data.paddleOffset;
			positions = [paddleOffset, width - paddleOffset, height / 2, width / 2];
			gameRunning = true;
		} else {
			keysDown = data;
		}
	});

	ws.on("close", () => {
		console.log("Client disconnected");
	});

	ws.on("error", (err) => {
		console.error("WebSocket error:", err);
	});

	setInterval(() => {
		if (gameRunning == false)
			return;

		// calculate delta for smooth rendering
		const now = Date.now();
		const delta = (now - lastUpdate) / 1000;
		lastUpdate = now;

		// move paddles
		if (keysDown[0] == true) positions[leftPaddleI] -= paddleSpeed;
		if (keysDown[1] == true) positions[leftPaddleI] += paddleSpeed;
		if (keysDown[2] == true) positions[rightPaddleI] -= paddleSpeed;
		if (keysDown[3] == true) positions[rightPaddleI] += paddleSpeed;

		// keep inside bounds
		// subtract paddleSize to keep the bottom inside window
		positions[leftPaddleI] = Math.max(0, Math.min(height - paddleSize, positions[leftPaddleI]));
		positions[rightPaddleI] = Math.max(0, Math.min(height - paddleSize, positions[rightPaddleI]));

		// move ball
		positions[ballYI] += ball.dy * ballSpeed;
		positions[ballXI] += ball.dx * ballSpeed;

		// check bounds and make it bounce
		// add ballSize to get the balls right side
		if (positions[ballYI] <= 0 || positions[ballYI] + ballSize >= height)
			ball.dy = -ball.dy;
		if (positions[ballXI] <= 0 || positions[ballXI] + ballSize >= width)
			gameRunning = false; // somebody won
		if (ballHitsPaddle(leftPaddleI) || ballHitsPaddle(rightPaddleI)) {
			console.log("Ball hits paddle!");
			ball.dx = -ball.dx;
		}

		console.log(`${positions}`);

		ws.send(JSON.stringify(positions));
	}, 1000 / fps);

	function ballHitsPaddle(paddle) {
		// horizontal checks
		if (positions[ballXI] > paddleOffset && // left side of ball is not left enough to hit
			positions[ballXI] + ballSize < width - paddleOffset) // right side of ball is not right enough to hit
			return false;

		// vertical checks
		if (positions[ballYI] > positions[paddle] + paddleSize || // top of ball goes under paddles bottom
			positions[ballYI] + ballSize < positions[paddle]) // bottom of ball goes over top of paddle
			return false;

		return true;
	}
});

console.log("WebSocket server running on ws://localhost:8080");

