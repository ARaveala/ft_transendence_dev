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
import MiniLogin from "../components/game/MiniLogin";

type GameMode = "guest" | "login" | "ai";
//	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
const Game: React.FC = () => {
	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
	const [gameStarted, setGameStarted] = useState(false);
	const [player1Token, setPlayer1Token] = useState<string | null>(null);
	const [player2Token, setPlayer2Token] = useState<string | null>(null);
	const [gameId, setGameId] = useState<string | null>(null);
	//const [loading, setLoading] = useState(true);
	const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
	const [showMiniLogin, setShowMiniLogin] = useState(false);
	const [gameSettings, setGameSettings] = useState<{
		ballSpeed: number;
		paddleSize: number;
		paddleSpeed: number;
		maxScore: number;
	} | null>(null);

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

	useEffect(() => {
		function handleMessage(event: MessageEvent) {
			if (event.origin !== "http://localhost:3000") return;

			if (event.data?.type === "GAME RESULT") {
			console.log("Received game end from iframe:", event.data.payload);
			handleGameEnd();
			}

		refreshSession();

		}
		window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
		}, []);

	const handleGameEnd = () => {
		console.log("Game ended!");
		setPlayer1Token(null);
		setPlayer2Token(null);
		setGameId(null);
		setGameSettings(null);
		setGameStarted(false);
		setSelectedMode(null);

	};

	// Flow depending on selected game mode

	const handleModeSelect = async (mode:GameMode) => {
		setSelectedMode(mode);

		try {
		// 1. Create game
			const createRes = await fetch("/api/create-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					type: "local",
					mode: "vs",
					settings: null}),
				});
			
			if (!createRes.ok) throw new Error("Failed to create game.");
			const { gameId: newGameId } = await createRes.json();
			setGameId(newGameId);

			// 2. Show minilogin only if login mode is selected
			if (mode === "login") {
				setShowMiniLogin(true);
				return; // pause here until MiniLogin completes
			}

			// 3. For guest/AI opponent, join game immediately
			if (mode === "guest" || mode === "ai") {
				await joinGuestOrAi(newGameId, mode);
				// Flow continues to GameSettings because showMiniLogin is false
			}
		} catch (err) {
			console.error(err);
			alert("Failed to create game. Make sure you are logged in.");
			setSelectedMode(null);
			setGameId(null);
		}
	};

	const joinGuestOrAi = async (gameId: string, mode: "guest" | "ai") => {
			const joinGuestOrAiRes = await fetch("/api/join-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					gameId,
					type: mode,
					mode: "local",
					player_count: 2,}),
				});
				const data = await joinGuestOrAiRes.json();
				console.log(joinGuestOrAiRes);

			if (!joinGuestOrAiRes.ok) {
				throw new Error("Failed to join guest/ai opponent.");
			}
		};
		

	// Launch game 

	const handleStartGame = async (settings: typeof gameSettings) => {
		if (!gameId) return;

		try {
			const startRes = await fetch("/api/start-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameId }),
				credentials: "include",
			});

			if (!startRes.ok) {
				throw new Error("Failed to start game.");
			}

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
	<CenteredContainer>
		{/* Mode selection */}
		{!selectedMode && (
		<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
		<ChooseGameMode
			onSelectMode={handleModeSelect}
			/>
		</div>
	)}
		{/* Mini login */}
		{selectedMode === "login" && showMiniLogin && gameId && (
			<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
			<MiniLogin
				gameId={gameId}
				onLoginSuccess={(token) => {
					setPlayer2Token(token);
					setShowMiniLogin(false);
				}}
				onCancel={() => {
					setShowMiniLogin(false);
					setGameId(null);
					setSelectedMode(null);
				}}
				/>
			</div>
		)}

		{/* Game settings modal */}
		{selectedMode && gameId && !showMiniLogin && !gameSettings && !gameStarted && (
			<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
				<GameSettings
					onConfirm={(settings) => setGameSettings(settings)}
					onBack={() => {
						setSelectedMode(null);
						setGameId(null);
						setPlayer2Token(null);
					}}
				/>
			</div>
		)}

		{/* Start Game button */}
		{selectedMode && gameId && gameSettings && !gameStarted && (
		<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-4">
			<button
				onClick={() => handleStartGame(gameSettings)} // pass settings to startGame
				className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
				>
				Start Game
			</button>
			<button
				onClick={() => { setGameSettings(null)}}
				className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
				>
				Back
			</button>
		</div>
		)}
		{/* Game iframe */}
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

