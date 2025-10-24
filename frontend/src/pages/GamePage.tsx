// current game page implementation is harness-like
//1. Log in dev1
//2. Log in dev2
//3. Create game as dev1
//4. Join second player
//5. Start game
//6. Launch iframe with both tokens

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ChooseGameMode from "../components/game/ChooseGameMode";
import GameSettings from "../components/game/GameSettings";
import CenteredContainer from "../components/layout/CenteredContainer";

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


//  Initialize useRef for the iframe
const iframeRef = useRef<HTMLIFrameElement>(null);

// Function to safely focus the iframe after it loads
const handleIframeLoad = () => {
	if (iframeRef.current) {
		// Use a minimal delay (50ms) to ensure the browser finishes processing the 'load' event
		// before we call focus(). This is necessary for some browsers.
		const timer = setTimeout(() => {
			iframeRef.current?.focus();
		}, 50); 
		return () => clearTimeout(timer);
	}
};

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
	// Use the CenteredContainer
	<CenteredContainer>
		{/* Remove all sizing classes from this div */}
	
		{!selectedMode && (
		<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
		<ChooseGameMode
		onSelectMode={(playerType) => setSelectedMode(playerType)}
		/>
		</div>
	)}

	{selectedMode && !gameSettings && !gameStarted && (
				<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">

		<GameSettings
		onConfirm={(settings) => setGameSettings(settings)}
		onBack={() => setSelectedMode(null)}
		/>
		</div>
	)}

	{selectedMode && gameSettings && !gameStarted && (
	<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-4">
				<button
		onClick={() => startGame(gameSettings)} // pass settings to startGame
		className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
		>
		Start Game
		</button>
		<button
		onClick={() => {
			setSelectedMode(null); // Go back to mode selection
			setGameSettings(null); // Reset settings so the settings screen is prompted next time
		}}
		className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
		>
		Back
		</button>
	</div>
	)}
	{gameStarted && player1Token && player2Token && gameId && (
			// Switching to responsive, aspect-ratio scaling to eliminate scrollbars and fit the viewport.
			// max-w-5xl ensures it doesn't get too wide on giant screens.
			<div className="w-full max-w-5xl bg-gray-900 p-4 rounded-xl shadow-2xl shadow-gray-700/80"> 
				{/* Responsive container with 16:9 aspect ratio */}
				<div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}> 
					<iframe
					ref={iframeRef}
						// Attach the focus handler to the iframe's onLoad event
						onLoad={handleIframeLoad} 
						src={`http://localhost:3000/pong_game/index.html?gameId=${gameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
						// The iframe is absolutely positioned to fill the responsive container
						className="absolute inset-0 w-full h-full border-none rounded-lg"
						scrolling="no"
					/>
				</div>
			</div>
		)}


	</CenteredContainer>
);
};

export default Game;

