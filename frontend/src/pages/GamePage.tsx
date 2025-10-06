// current game page implementation is harness-like
//1. Log in dev1
//2. Log in dev2
//3. Create game as dev1
//4. Join second player
//5. Start game
//6. Launch iframe with both tokens

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ChooseGameMode from "../components/game/ChooseGameMode";

type GameMode = "guest" | "login" | "ai";

const Game: React.FC = () => {
const { isLoggedIn, refreshSession } = useAuth();
const [gameStarted, setGameStarted] = useState(false);
const [player1Token, setPlayer1Token] = useState<string | null>(null);
const [player2Token, setPlayer2Token] = useState<string | null>(null);
const [gameId, setGameId] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

useEffect(() => {
	const checkAuth = async () => {
	console.log('is game started true or false', gameStarted);
	if (!isLoggedIn) {
		try {

	// TEMPORARY FOR TESTING
		//setSelectedMode("guest");
		//setGameStarted(true);
		//setGameId('1');
		//setPlayer1Token('testtoken1');
		//setPlayer2Token('testtoken2');

		console.log("refreshing session to check login");
		await refreshSession(); // fetch user profile
		// NEW TEST ONLY TO REFRESH GAME
		} catch (err) {
		console.error("Failed to refresh session", err);
		}
	}
	setLoading(false); // done checking
	};

	checkAuth();
}, [isLoggedIn, refreshSession]); //run once on mount

	// Start game depending on selected mode
const startGame = async () => {
	if (!selectedMode) return;

	try {
	// 1. Create game
	const createRes = await fetch("/api/create-game", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ type: "local", mode: "vs" }),
		credentials: "include",
	});
	const { gameId } = await createRes.json();
	setGameId(gameId);

	// 2. Join second player
	const joinRes = await fetch("/api/join-game", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
		gameId,
		type: selectedMode, // "guest" | "login" | "ai"
		mode: "local",
		player_count: 2,
		}),
		credentials: "include",
	});
	const joinData = await joinRes.json();
	console.log("Joined player:", joinData);

	// 3. Start game
	const startRes = await fetch("/api/start-game", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ gameId }),
		credentials: "include",
	});
	const startData = await startRes.json();

	setPlayer1Token(startData.playerTokens.player1);
	setPlayer2Token(startData.playerTokens.player2);
	setGameStarted(true);
	} catch (err) {
	console.error(err);
	alert("Failed to start game. Make sure you are logged in.");
	}
};

if (loading) return <div>Checking login status...</div>;
if (!isLoggedIn) return <div>Please log in to access the game.</div>;

return (
	<div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
	{!selectedMode && (
		<ChooseGameMode
		onSelectMode={(playerType) => setSelectedMode(playerType)}
		/>
	)}

	{selectedMode && !gameStarted && (
	<div className="flex flex-col items-center space-y-4">
				<button
		onClick={startGame}
		className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
		>
		Start Game
		</button>
		<button
		onClick={() => setSelectedMode(null)}
		className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
		>
		Back
		</button>
	</div>
	)}

	{gameStarted && player1Token && player2Token && gameId && (
		<iframe
		src={`http://localhost:3000/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}`}
		className="w-full h-screen border-none"
		/>
	)}
	</div>
);
};

export default Game;

