import React, { useEffect, useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import GameSettings from "../components/game/GameSettings";
import type { TournamentState, Match } from "../types/tournament";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useAuth } from "../context/AuthContext";
import { CreateTournamentPayload,
        CreateTournamentResponse,
        GetActiveTournamentResponse,
        StartTournamentMatchPayload,
        StartTournamentMatchResponse
      } from "../../shared/payloads";

const TournamentLobby: React.FC = () => {
  const { user, isLoggedIn, loading, refreshSession, tournament, setTournament } = useAuth();
  const [showSetup, setShowSetup] = useState(false);                               // Indicates whether we are in tournament setup mode (adding players etc.)
  const [player1Token, setPlayer1Token] = useState<string | null>(null);
  const [player2Token, setPlayer2Token] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);           // Game state: which match is currently active
  const [currentGameMatch, setCurrentGameMatch] = useState<Match | null>(null);
  const [gameSettings, setGameSettings] = useState<{
      ballSpeed: number;
      paddleSize: number;
      paddleSpeed: number;
      maxScore: number;
  } | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [gameResult, setGameResult] = useState<{
      gameId: string;
      winner: string;
      loser: string;
      score: [number, number];
    } | null>(null);
  
    useEffect(() => {
      function handleMessage(event: MessageEvent) {
        if (event.origin !== "http://localhost:3000") return;

        if (event.data?.type === "GAME RESULT") {
          console.log("Received game result from iframe:", event.data.payload);
          setGameResult(event.data.payload);
          handleMatchEnd(); // closes iframe
        }
      }
      window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

  /*
   * Creates a new tournament
   *  Triggered when user clicks "Start a new tournament"
   * - Sends a request to backend
   * - Stores tournament state in React
   */

  const handleCreateTournament = async () => {
    const payload: CreateTournamentPayload = { max_players: 4 };
    console.log('CREATE TOURNAMENT????');
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
        setShowSetup(true);
        await refreshSession(); // Refresh session to update user tournament status
      } else {
        console.error("Error creating tournament:", data.error);
      }
    } catch (err) {
      console.error("Network error creating tournament:", err);
    }
  };

  /*
   * Updates tournament state
   * - Called by child components when tournament setup or matches update the data
   */
  const handleTournamentUpdated = (updated: TournamentState) => {
    setTournament(updated);

    if (updated.status === "ongoing") {
      setShowSetup(false);
    }
  };

  const handleCancelTournament = async () => {
    if (!tournament)
      return;

    try {
      const res = await fetch(API_PROTOCOL.CANCEL_TOURNAMENT.path, {
        method: API_PROTOCOL.CANCEL_TOURNAMENT.method,
      });

      if (!res.ok) throw new Error("Failed to cancel tournament");

      setTournament(null);
      setShowSetup(false);
      await refreshSession(); // Refresh session to update user tournament status
    } catch (err) {
      console.error("Error cancelling tournament:", err);
    }
  };

  /*
   * Starts a specific match
   * - Sends a start request to backend
   * - If successful, activates the Pong game iframe
   */
  const handleStartMatch = async (match: Match) => {
    if (!tournament) return;

    if (!gameSettings) {
      setCurrentGameMatch(match);
      setShowSettingsModal(true);
      return;
    }

    await startTournamentGame(match, gameSettings);
    };

    const handleSettingsConfirm = async (settings: typeof gameSettings) => {
    setGameSettings(settings);
    setShowSettingsModal(false);
    if (currentGameMatch) {
      await startTournamentGame(currentGameMatch, settings);
    }
  };

const startTournamentGame = async (match: Match, settings: typeof gameSettings) => {
    const payload: StartTournamentMatchPayload = { match_id: match.match_id };
    try {
      const res = await fetch(`/api/tournament/${tournament?.tournament_id}/start-match`, {
        method: API_PROTOCOL.START_TOURNAMENT_MATCH.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: StartTournamentMatchResponse = await res.json();
      if (data.status === "OK") {
        setTournament(data.tournament);
        setCurrentGameMatch(match);
        setActiveGameId(match.match_id);
        // Assuming API returns tokens for each player
        setPlayer1Token(data.playerTokens?.player1 ?? null);
        setPlayer2Token(data.playerTokens?.player2 ?? null);
      } else {
        console.error("Error starting match:", data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

    // Ends a match - Simply clears the current game state and closes iframe
  const handleMatchEnd = () => {
    setCurrentGameMatch(null);
    setActiveGameId(null);
    setPlayer1Token(null);
    setPlayer2Token(null);
  };

  if (loading) return <div className="p-6 text-center text-gray-300">Loading tournament info...</div>;
  if (!isLoggedIn) return <div className="p-6 text-center text-gray-300">Please log in to view tournaments.</div>;


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
    <>
    <div className="p-6 max-w-4xl mx-auto">
      <TournamentHeader />

      {/* Start New Tournament Button */}
      {!tournament && !showSetup && (
        <div className="flex flex-col items-center mt-8">
          <Button
            onClick={handleCreateTournament}>
            Start a new tournament
          </Button>
        </div>
      )}

      {/* Tournament Setup */}
      {showSetup && tournament && (
        <TournamentSetup
          tournament={tournament}
          onTournamentUpdated={handleTournamentUpdated}
          onCancel={handleCancelTournament}
        />
      )}

      {/* Tournament Bracket */}
      {tournament && !showSetup && (
        <TournamentBracket
          tournament={tournament}
          onStartMatch={handleStartMatch}
          onCancel={handleCancelTournament}
          lastMatchResult={gameResult}
        />
      )}
    </div>

    {showSettingsModal && (
        <GameSettings
          onConfirm={handleSettingsConfirm}
          onBack={() => setShowSettingsModal(false)}
        />
      )}
    
      {/* Pong Game Iframe  -- this needs to be fixed*/}
      {currentGameMatch && activeGameId && player1Token && player2Token && gameSettings &&(
        <div
          style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          zIndex: 9999,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
        >
          <iframe
            src={`http://localhost:3000/pong_game/index.html?gameId=${activeGameId}&player1Token=${player1Token}&player2Token=${player2Token}&gameSettings=${encodeURIComponent(JSON.stringify(gameSettings))}`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Pong Game"
          />
      </div>
    )}
  </>
  );
};

export default TournamentLobby;