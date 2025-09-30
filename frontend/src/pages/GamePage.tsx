
// current game page implementation is harness-like
//1. Log in dev1
//2. Log in dev2
//3. Create game as dev1
//4. Join second player
//5. Start game
//6. Launch iframe with both tokens

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";



const Game: React.FC = () => {
const {isLoggedIn, user, refreshSession} = useAuth();
const [gameStarted, setGameStarted] = useState(false);
const [player1Token, setPlayer1Token] = useState<string | null>(null);
const [player2Token, setPlayer2Token] = useState<string | null>(null);
const [gameId, setGameId] = useState<string | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
	const checkAuth = async () => {
		if (!isLoggedIn) {
			try {
				console.log('refreshing session to check login');
				await refreshSession(); // fetch user profile
			} catch (err) {
				console.error("Failed to refresh session", err);
			}
		}
		setLoading(false); // done checking
	};

	checkAuth();
}, [isLoggedIn, refreshSession]);
	
const startGame = async () => {
try {
	// Fetch the currently logged-in user
	const profileRes = await fetch("/api/profile", { credentials: "include" });
	const currentUser = await profileRes.json();
	console.log("Logged-in user starting the game:", currentUser);

	// 1. Create game
	const createRes = await fetch("/api/create-game", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ type: "local", mode: "vs" }),
	credentials: "include",
	});
	const { gameId } = await createRes.json();
	setGameId(gameId);

	// 2. Join second player as guest
	await fetch("/api/join-game", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ gameId, type: "guest", mode: "local", player_count: 2 }),
	credentials: "include",
	});

	// 3. Start game
	const startRes = await fetch("/api/start-game", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ gameId }),
	credentials: "include",
	});
	const startData = await startRes.json();

	console.log("Game started, player tokens:", startData.playerTokens);

	setPlayer1Token(startData.playerTokens["player1"]);
	setPlayer2Token(startData.playerTokens["player2"]);
	setGameStarted(true);
} catch (err) {
	console.error(err);
	alert("Failed to start game. Make sure you are logged in.");
}
};


if (loading) return <div>Checking login status...</div>;
if (!isLoggedIn) return <div>Please log in to access the game.</div>;

return (
	<div
	style={{
		width: "100%",
		height: "100vh",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#1f2937",
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
			backgroundColor: "#4f46e5",
			color: "#fff",
			boxShadow: "0 8px 15px rgba(0, 0, 0, 0.2)",
			cursor: "pointer",
			transition: "all 0.3s ease",
		}}
		onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
		onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
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