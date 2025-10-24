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
import GameSettings from "../components/game/GameSettings";

type GameMode = "guest" | "login" | "ai";

const Game: React.FC = () => {
const { isLoggedIn, loading} = useAuth();
const [gameStarted, setGameStarted] = useState(false);
const [player1Token, setPlayer1Token] = useState<string | null>(null);
const [player2Token, setPlayer2Token] = useState<string | null>(null);
const [gameId, setGameId] = useState<string | null>(null);
//const [loading, setLoading] = useState(true);
const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
const [gameSettings, setGameSettings] = useState<{
	ballSpeed: number;
	paddleSize: number;
	paddleSpeed: number;
	maxScore: number;
} | null>(null); // New state for game settings

// useEffect(() => { //may be redundant now as AuthContext handles this
// 	const checkAuth = async () => {
// 	if (!isLoggedIn) {
// 		try {
// 		console.log("refreshing session to check login");
// 		await refreshSession(); // fetch user profile
// 		} catch (err) {
// 		console.error("Failed to refresh session", err);
// 		}
// 	}
// 	setLoading(false); // done checking
// 	};

// 	checkAuth();
// }, [isLoggedIn, refreshSession]); //run once on mount

	useEffect(() => {
	  function handleMessage(event: MessageEvent) {
		if (event.origin !== "http://localhost:3000") return;

		if (event.data?.type === "GAME RESULT") {
		  console.log("Received game end from iframe:", event.data.payload);
		  handleGameEnd();
		}
	  }
	  window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, []);


	// Start game depending on selected mode
const startGame = async (settings?: typeof gameSettings) => {
	if (!selectedMode) return;

	try {
	// 1. Create game
		const createRes = await fetch("/api/create-game", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		type: "local",
		mode: "vs",
		settings: settings, // <-- pass settings here. backend needs to be updated to handle this
	}),
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

const handleGameEnd = () => {
	console.log("Game ended!");
	setPlayer1Token(null);
	setPlayer2Token(null);
	setGameId(null);
	setGameSettings(null);
	setGameStarted(false);
	setSelectedMode(null);

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

	{selectedMode && !gameSettings && !gameStarted && (
		<GameSettings
		onConfirm={(settings) => setGameSettings(settings)}
		onBack={() => setSelectedMode(null)}
		/>
	)}

	{selectedMode && gameSettings && !gameStarted && (
	<div className="flex flex-col items-center space-y-4">
				<button
		onClick={() => startGame(gameSettings)} // pass settings to startGame
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
		src={`http://localhost:3000/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
		className="w-full h-screen border-none"
		/>
	)}
	</div>
);
};

export default Game;

