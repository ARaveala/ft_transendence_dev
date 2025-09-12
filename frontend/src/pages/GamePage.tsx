
// current game page implementation is harness-like
//1. Log in dev1
//2. Log in dev2
//3. Create game as dev1
//4. Join second player
//5. Start game
//6. Launch iframe with both tokens

import React, { useState } from "react";

const Game: React.FC = () => {
const [gameStarted, setGameStarted] = useState(false);
const [player1Token, setPlayer1Token] = useState<string | null>(null);
const [player2Token, setPlayer2Token] = useState<string | null>(null);
const [gameId, setGameId] = useState<string | null>(null);

const startGame = async () => {
try {
	// 1. Log in dev1
	await fetch('/api/login', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ username: 'dev1', password: 'password' }),
	credentials: 'include'
	});

	// 2. Log in dev2
	await fetch('/api/login', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ username: 'dev2', password: 'password' }),
	credentials: 'include'
	});

	// 3. Create game
	const createRes = await fetch('/api/create-game', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ type: 'local', mode: 'vs' }),
	credentials: 'include'
	});
	const { gameId } = await createRes.json();
	setGameId(gameId);

	// 4. Join second player
	await fetch('/api/join-game', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ gameId, type: 'guest', mode: 'local', player_count: 2 }),
	credentials: 'include'
	});

	// 5. Start game
	const startRes = await fetch('/api/start-game', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ gameId }),
	credentials: 'include'
	});
	const startData = await startRes.json();

	// 6. Launch iframe with both tokens
	setPlayer1Token(startData.playerTokens['player1']);
	setPlayer2Token(startData.playerTokens['player2']);
	setGameStarted(true);

} catch (err) {
	console.error(err);
}
};

return (
  <div
    style={{
      width: "100%",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#1f2937", // dark gray
      flexDirection: "column",
    }}
  >
    {!gameStarted && (
      <button
        onClick={startGame}
        style={{
          padding: "20px 40px",
          fontSize: "24px",
          fontWeight: "bold",
          borderRadius: "12px",
          border: "none",
          backgroundColor: "#4f46e5", // nice purple
          color: "#fff",
          boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#4338ca")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#4f46e5")
        }
      >
        Start Game
      </button>
    )}
	{gameStarted && player1Token && player2Token && (
		<iframe
		src={`http://localhost:3000/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}`}
		style={{ width: "100%", height: "100%", border: "none" }}
		/>
	)}
	</div>
);
};

export default Game;
