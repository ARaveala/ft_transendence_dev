const PowerUp = require('./powerup.js');
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
	state.ballSpeed = settings.ballSpeed;
	state.paddleSpeed = settings.paddleSpeed;
	state.powerUp = settings.powerUp;
	// else is now case = keys in websockets messagehandler
}

function updateKeys(state, keys) {
	state.keysDown = keys;
}

function updateGame(state, player1, player2) {

	// Move paddles
	if (state.keysDown[0]) state.positions[state.leftPaddleI] -= state.paddleSpeed;
	if (state.keysDown[1]) state.positions[state.leftPaddleI] += state.paddleSpeed;
	if (state.keysDown[2]) state.positions[state.rightPaddleI] -= state.paddleSpeed;
	if (state.keysDown[3]) state.positions[state.rightPaddleI] += state.paddleSpeed;

	// keep paddles inside bounds by clamping
	state.positions[state.leftPaddleI] =    Math.max(0, 
                                            Math.min(state.height - state.paddleHeight, 
                                            state.positions[state.leftPaddleI]));
	state.positions[state.rightPaddleI] =   Math.max(0, 
                                            Math.min(state.height - state.paddleHeight, 
                                            state.positions[state.rightPaddleI]));

	// moving paddles is always possible
	if (!state.gameRunning) return;
	
	// Moving ball. state.speedUp is updated when a powerup starts and ends. Default is 1.
	state.positions[state.ballYI] += state.ball.dy * (state.ballSpeed * state.ballSpeedUp);
	state.positions[state.ballXI] += state.ball.dx * (state.ballSpeed * state.ballSpeedUp);

	// check bounds and make it bounce
	if (state.positions[state.ballYI] <= 0 // is top of ball hitting top wall
        || state.positions[state.ballYI] + state.ballSize >= state.height) // is bottom of ball (top + size) hitting bottom wall
	{
		// bounce
		state.ball.dy = -state.ball.dy;

		// if goes through top or bot wall, move it to prevent it getting stuck
		state.positions[state.ballYI] = state.positions[state.ballYI] <= 0 ? 0 : state.height - state.ballSize;
	}

	// Check win conditions
	if (state.positions[state.ballXI] <= 0) // is left side of ball hitting left wall
	{
		player2.score++;
		state.gameRunning = false;
        state.activePowerups.length = 0;
        state.visiblePowerups.length = 0;
        state.ballSpeedUp = 1;
		return 1;
	}
	if (state.positions[state.ballXI] + state.ballSize >= state.width) // is right side of ball (left side + size) hitting left wall
	{
		player1.score++;
		state.gameRunning = false;
        state.activePowerups.length = 0;
        state.visiblePowerups.length = 0;
        state.ballSpeedUp = 1;
		return 1;
	}

	// Check ball-paddle collisions
	if (ballHitsPaddle(state, state.leftPaddleI))
	{
		bounceBallOffPaddle(state, state.leftPaddleI);

		// prevent ball getting stuck
		// ball cannot change direction towards left
		// the ball could enter the paddle from top or bottom, bouncing there like crazy
		// this fix is not perfect, it can look weird when it hits the top or bottom in a certain angle
		if (state.ball.dx < 0)
			state.ball.dx = -state.ball.dx;
	}
	if (ballHitsPaddle(state, state.rightPaddleI))
	{
		bounceBallOffPaddle(state, state.rightPaddleI);

		// keep ball outside of paddle, preventing it getting stuck
		// ball cannot change direction towards right
		if (state.ball.dx > 0)
			state.ball.dx = -state.ball.dx;
	}

    if (!state.powerups)
        return 0;

    // Spawn a powerup
    const powerUpPerSec = 0.2; // on average
    if (Math.random() < powerUpPerSec / 60)
    {
        state.visiblePowerups.push(new PowerUp(
            "speed", // when activated, speed gains +1 to multiplier (change multiplier in powerup class)
            2, // seconds until temporary speed multiplier decrements
            Math.random() * state.height,
            state.paddleOffset * 2 + Math.random() * (state.width - state.paddleOffset * 4), // Doesnt spawn behind paddles
            state.ballSize / 2 // use some relative size like this
        )); 
    }

	// Check powerup collisions
	for (let powerup of state.visiblePowerups)
	{
		if (powerup.collision(state))
        {
            console.log("Powerup collision.", powerup);
			powerup.enable(state);
        }
	}

    // Check powerup expiration
    for (let powerup of state.activePowerups)
    {
        if (powerup.isExpired())
            powerup.disable(state);
    }

	return 0;
}

function ballHitsPaddle(state, paddleIndex) {
	const { positions, paddleOffset, width, paddleHeight, paddleWidth, ballSize } = state;

	const ballCenterY = positions[state.ballYI] + ballSize / 2;
	const ballCenterX = positions[state.ballXI] + ballSize / 2;

	const paddleY = positions[paddleIndex];
	const paddleX = paddleIndex === state.leftPaddleI
					? paddleOffset // left paddles right side
					: width - paddleOffset - paddleWidth; // right paddles left side

	// clamp ball coordinates with paddle coordinates to find closest point
	const closestY = Math.max(paddleY, Math.min(ballCenterY, paddleY + paddleHeight));
	const closestX = Math.max(paddleX, Math.min(ballCenterX, paddleX + paddleWidth));

	// calculate distance from ball center to closest point
	// if it is shorter than ball radius, it is a collision
	const dy = ballCenterY - closestY;
	const dx = ballCenterX - closestX;
	const r = ballSize / 2;
	const distance_squared = dx * dx + dy * dy;
	if (distance_squared > r * r) // distance is squared so square radius, no sqrt needed
		return false;

	return true;
}

function bounceBallOffPaddle(state, paddleIndex) {
	const ballCenterY = state.positions[state.ballYI] + state.ballSize / 2;

	const relativeY = (ballCenterY - (state.positions[paddleIndex] + state.paddleHeight / 2)) / (state.paddleHeight / 2);
	const maxBounceAngle = Math.PI / 4;

	// Current speed of the ball
	const speed = Math.sqrt(state.ball.dx * state.ball.dx + state.ball.dy * state.ball.dy);

	// Flip direction
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
