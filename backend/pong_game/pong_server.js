
function createGameState() {
  return {
	// dont change unless change also in frontend
	fps: 60,
	// overwrite these with values from client
	height: 1,
	width: 1,
	ballSize: 1,
	paddleHeight: 1,
	paddleWidth: 1,
	paddleOffset: 1,

	// get overwritten by routes/game.js
	paddleSpeed: 0,
	ballSpeed: 0,

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
	state.paddleHeight = settings.paddleHeight;
	state.paddleWidth = settings.paddleWidth;
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

function updateGame(state, player1, player2) {
	if (!state.gameRunning) return;

	// Move paddles
	if (state.keysDown[0]) state.positions[state.leftPaddleI] -= state.paddleSpeed;
	if (state.keysDown[1]) state.positions[state.leftPaddleI] += state.paddleSpeed;
	if (state.keysDown[2]) state.positions[state.rightPaddleI] -= state.paddleSpeed;
	if (state.keysDown[3]) state.positions[state.rightPaddleI] += state.paddleSpeed;

	// keep inside bounds by clamping
	// subtract paddleHeight to keep the bottom inside window
	state.positions[state.leftPaddleI] = Math.max(0, Math.min(state.height - state.paddleHeight, state.positions[state.leftPaddleI]));
	state.positions[state.rightPaddleI] = Math.max(0, Math.min(state.height - state.paddleHeight, state.positions[state.rightPaddleI]));

	// move ball
	state.positions[state.ballYI] += state.ball.dy * state.ballSpeed;
	state.positions[state.ballXI] += state.ball.dx * state.ballSpeed;

	// check bounds and make it bounce
	// add ballSize to get the balls right side
	if (state.positions[state.ballYI] <= 0 || state.positions[state.ballYI] + state.ballSize >= state.height)
		state.ball.dy = -state.ball.dy;

	if (state.positions[state.ballXI] <= 0)
	{
		player2.score++;
		state.gameRunning = false;
		return 1;
	}
	if (state.positions[state.ballXI] + state.ballSize >= state.width)
	{
		player1.score++;
		state.gameRunning = false;
		return 1;
	}

	if (ballHitsPaddle(state, state.leftPaddleI))
		bounceBallOffPaddle(state, state.leftPaddleI);
	if (ballHitsPaddle(state, state.rightPaddleI))
		bounceBallOffPaddle(state, state.rightPaddleI);

	return 0;
}

function ballHitsPaddle(state, paddleIndex) {
	const { positions, paddleOffset, width, paddleHeight, paddleWidth, ballSize } = state;

	const ballCenterY = positions[state.ballYI] + ballSize / 2;
	const ballCenterX = positions[state.ballXI] + ballSize / 2;

	const paddleY = positions[paddleIndex];
	const paddleX = paddleIndex === state.leftPaddleI
					? paddleOffset
					: width - paddleOffset - paddleWidth;

	// clamp ball coordinates with paddle coordinates to find closest point
	const closestY = Math.max(paddleY, Math.min(ballCenterY, paddleY + paddleHeight));
	const closestX = Math.max(paddleX, Math.min(ballCenterX, paddleX + paddleWidth));

	// calculate distance from ball center to closest point
	// if it is shorter than ball radius, it is a collision
	const dy = ballCenterY - closestY;
	const dx = ballCenterX - closestX;
	const r = ballSize / 2;
	return (dx * dx + dy * dy) < (r * r); // no sqrt needed if using squared on both sides
}

function bounceBallOffPaddle(state, paddleIndex) {
	const ballCenterY = state.positions[state.ballYI] + state.ballSize / 2;

	const relativeY = (ballCenterY - (state.positions[paddleIndex] + state.paddleHeight / 2)) / (state.paddleHeight / 2);
	const maxBounceAngle = Math.PI / 4;

	// Current speed of the ball
	const speed = Math.sqrt(state.ball.dx * state.ball.dx + state.ball.dy * state.ball.dy);

	// Flip horizontal velocity
	// isnt good if ball hits top or bottom of paddle
	state.ball.dx = -state.ball.dx;

	// Adjust vertical velocity based on hit position
	state.ball.dy = speed * Math.sin(relativeY * maxBounceAngle);

	// Adjust horizontal velocity to maintain total speed
	state.ball.dx = Math.sign(state.ball.dx) * Math.sqrt(speed * speed - state.ball.dy * state.ball.dy);
}

module.exports = {
	createGameState,
	initGame,
	updateKeys,
	updateGame
};
