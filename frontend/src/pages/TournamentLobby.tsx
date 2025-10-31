import React, { useEffect, useState, useRef } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import GameSettings from "../components/game/GameSettings";
import { TBD_PLAYER } from "../../shared/constants";
import CenteredContainer from "../components/layout/CenteredContainer";
import type { TournamentState, Match } from "../types/tournament";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useAuth } from "../context/AuthContext";
import { CreateTournamentPayload,
		CreateTournamentResponse,
		} from "../../shared/payloads";

const TournamentLobby: React.FC = () => {
	const { isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
	const [showSetup, setShowSetup] = useState(false);                               // Indicates whether we are in tournament setup mode (adding players etc.)
	const [player1Token, setPlayer1Token] = useState<string | null>(null);
	const [player2Token, setPlayer2Token] = useState<string | null>(null);
	const [activeGameId, setActiveGameId] = useState<string | null>(null);           // Game state: which match is currently active
	const [currentGame, setCurrentGame] = useState<Match | null>(null);
	const [gameStarted, setGameStarted] = useState(false);
	const [gameSettings, setGameSettings] = useState<{
		ballSpeed: number;
		paddleSize: number;
		paddleSpeed: number;
		maxScore: number;
	} | null>(null);
	const [showSettingsModal, setShowSettingsModal] = useState(false);  // controls whether game settings modal is shown
	const [gameResult, setGameResult] = useState<{
		gameId: string;
		winner: string;
		loser: string;
		score: [number, number];
	} | null>(null);

	//	Initialize useRef for the iframe
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

	// Listens for messages from pong iframe 

	useEffect(() => {
		async function handleMessage(event: MessageEvent) {
			if (event.origin !== "http://localhost:3000")
				return;
			if (event.data?.type === "GAME RESULT") {
				console.log("Received game result from iframe:", event.data.payload);
				const result = event.data.payload;
				
				setGameResult(result);
				handleMatchEnd();
				
				console.log("Calling refreshSession...");
				await refreshSession(); // capture updated state
				console.log(tournament);
			}
		}
		window.addEventListener("message", handleMessage);
			return () => window.removeEventListener("message", handleMessage);
	}, [refreshSession]);

  /*
   * Creates a new tournament
   *  Triggered when user clicks "Start a new tournament"
   * - Sends a request to backend
   * - Stores tournament state in React
   */

	const handleCreateTournament = async () => {
		const payload: CreateTournamentPayload = { max_players: 4 };
		console.log('Creating tournament...');
		try {
			const res = await fetch(API_PROTOCOL.CREATE_TOURNAMENT.path, {
				method: API_PROTOCOL.CREATE_TOURNAMENT.method,
				credentials: 'include',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
		});

		const data: CreateTournamentResponse = await res.json();

		if (data.status === "OK") {
			setTournament(data.tournament);
			setShowSetup(true);         // Show setup for adding players
			await refreshSession();     // Refresh session to update tournament state
		} else {
			console.error("Error creating tournament:", data.error);
		}
		} catch (err) {
			console.error("Network error creating tournament:", err);
		}
	};

	const handleCancelTournament = async () => {
		if (!tournament)
			return;

		try {
			const test = tournament.tournament_id;
			const payload = { tournament_id: test };
			const url = API_PROTOCOL.CANCEL_TOURNAMENT.path.replace(':id', tournament.tournament_id);
			console.log("is their a tournamnet id", tournament.tournament_id);
			const res = await fetch(API_PROTOCOL.CANCEL_TOURNAMENT.path, {
				method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
				credentials: "include",
				 headers: {
					'Content-Type': 'application/json'
  				},
				body: JSON.stringify(payload)
				
			});


			if (!res.ok) throw new Error("Failed to cancel tournament");

			setTournament(null);
			setShowSetup(false);
			setGameResult(null);
			await refreshSession(); // Refresh session to update tournament status
		} catch (err) {
			console.error("Error cancelling tournament:", err);
		}
	};

   /* Starts a specific match from the tournament bracket
	- If game settings have not been set, shows settings modal */

	const handleStartTournamentGame = async (match: Match) => {
		if (!tournament || !tournament.bracket) return;

		// Find the round and index for this match
		const roundIndex = tournament.bracket.findIndex(r =>
			r.some(m => m.match_id === match.match_id)
		);
		if (roundIndex === -1) {
			console.error("Match not found in bracket", match);
			return;
		}
		const idx = tournament.bracket[roundIndex].findIndex(m => m.match_id === match.match_id);

		// Show settings modal if not set
		if (!gameSettings) {
			setCurrentGame(match);
			setShowSettingsModal(true);
			return;
		}

		await startTournamentGame(match);
	};

	/* Called when user confirms game settings
	  Starts the match with the selected settings */
	
	const handleSettingsConfirm = async (settings: typeof gameSettings) => {
		setGameSettings(settings);
		setShowSettingsModal(false);
	};

   /* Sends API request to start a tournament match
	  Updates player tokens and active match */

	const startTournamentGame = async (match: Match) => {
		if (!match || !gameSettings)
			return;
	
		const payload = { gameId: match.match_id, tournamentId: tournament?.tournament_id };
		try {
			const res = await fetch(API_PROTOCOL.START_GAME.path, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});

			const data = await res.json();
			if (!res.ok || !data.playerTokens) {
				console.error("Failed to start tournament game:", data.error || res.statusText);
				return;
			}
			setPlayer1Token(data.playerTokens.player1);
			setPlayer2Token(data.playerTokens.player2);
			setGameStarted(true);
			setCurrentGame(match);					// Sets active match to trigger iframe
			setActiveGameId(match.match_id);

		} catch (err) {
			console.error("Error starting tournament match:", err);
		}
	};

	// Ends a match - Simply clears the current game state and closes iframe
	
	const handleMatchEnd = () => {

		setCurrentGame(null);
		setActiveGameId(null);
		setPlayer1Token(null);
		setPlayer2Token(null);
		setGameStarted(false);
	};

	if (loading) return <div className="p-6 text-center text-gray-300">Loading tournament info...</div>;
	if (!isLoggedIn) return <div className="p-6 text-center text-gray-300">Please log in to view tournament</div>;


	//  Handle AuthContext states first
	if (loading) {
		return (
		<div className="p-6 text-center text-gray-300">
			Loading tournament info...
		</div>
		);
	}

	if (!isLoggedIn) {
		return (
		<div className="p-6 text-center text-gray-300">
			Please log in to view tournaments.
		</div>
		);
	}

	return (

		<div className="flex justify-center px-6 py-6">
			{!showSettingsModal && !currentGame && (
			<div className="w-full max-w-4xl bg-gray-900/90 rounded-lg p-6 text-white">
				<TournamentHeader />

				{/* Start New Tournament Button */}
				{!tournament && !showSetup && (
					<div className="flex flex-col items-center mt-8">
						<Button  onClick={handleCreateTournament}>
							Start a new tournament
						</Button>
					</div>
				)}

				{/* Tournament Setup */}
				{showSetup && tournament && (
					<TournamentSetup
						//onTournamentUpdated={handleTournamentUpdated}
						onCancel={handleCancelTournament}
						onTournamentStarted={() => setShowSetup(false)} 
					/>
				)}

				{/* Tournament Bracket */}
				{tournament && !showSetup && !showSettingsModal && !currentGame &&(
					<TournamentBracket

						onStartMatch={handleStartTournamentGame}
						onCancel={handleCancelTournament}
						lastMatchResult={gameResult}
					/>
				)}
			</div>
		)}

				{/* Game settings */}
				{showSettingsModal && (
					<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl">
					<GameSettings
						onConfirm={handleSettingsConfirm}
						onBack={() => setShowSettingsModal(false)}
					/>
				</div>
				)}

				{/* Start Game button */}
				{currentGame && gameSettings && !gameStarted && (
					<div className="w-full max-w-lg bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-4">
						<button
							onClick={() => startTournamentGame(currentGame!)}
							className="px-10 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
						>
							Start Game
						</button>
						<button
							onClick={() => setGameSettings(null)}
							className="px-6 py-2 text-sm font-medium text-gray-800 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors"
						>
							Back
						</button>
					</div>
				)}

	
			{/* Pong Game Iframe  -- this needs to be fixed*/}
			{currentGame && activeGameId && player1Token && gameSettings &&(
				<div className="w-full max-w-5xl bg-gray-900 p-4 rounded-xl shadow-2xl shadow-gray-700/80"> 
				{/* Responsive container with 16:9 aspect ratio */}
				<div className="relative w-full overflow-hidden" style={{ paddingTop: '56.25%' }}> 
					<iframe
						ref={iframeRef}
						// Attach the focus handler to the iframe's onLoad event
						onLoad={handleIframeLoad} 
						src={`http://localhost:3000/pong_game/index.html?gameId=${activeGameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
						// The iframe is absolutely positioned to fill the responsive container
						className="absolute inset-0 w-full h-full border-none rounded-lg"
						scrolling="no"
					/>
				</div>
			</div>
			)}
		</div>

	);
};

export default TournamentLobby;