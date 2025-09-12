
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