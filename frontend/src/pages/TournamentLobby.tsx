import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import type { TournamentState, Match } from "../types/tournament";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { CreateTournamentPayload, CreateTournamentResponse, StartTournamentMatchPayload, StartTournamentMatchResponse } from "../../shared/payloads";

const TournamentLobby: React.FC = () => {
  const [tournament, setTournament] = useState<TournamentState | null>(null);      // Main tournament state (null means there is no tournament yet)
  const [showSetup, setShowSetup] = useState(false);                               // Indicates whether we are in tournament setup mode (adding players etc.)     
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);       // Used to track which match is currently being started/loading
  const [activeGameId, setActiveGameId] = useState<string | null>(null);           // Game state: which match is currently active
  const [currentGameMatch, setCurrentGameMatch] = useState<Match | null>(null);

   /*
   * Creates a new tournament
   *  Triggered when user clicks "Start a new tournament"
   * - Sends a request to backend
   * - Stores tournament state in React
   * - Switches UI into setup mode
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
  };

  const handleCancel = () => {
    setShowSetup(false);
    setTournament(null);
  };

  /*
   * Starts a specific match
   * - Sends a start request to backend
   * - Marks the match as loading (disables UI during request)
   * - If successful, activates the Pong game iframe
   */
  const handleStartMatch = async (match: Match) => {
    if (!tournament) return;
    setLoadingMatchId(match.match_id);

    const payload: StartTournamentMatchPayload = { match_id: match.match_id };

    try {
      const res = await fetch(`/api/tournament/${tournament.tournament_id}/start-match`, {
        method: API_PROTOCOL.START_TOURNAMENT_MATCH.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
     });

      const data: StartTournamentMatchResponse = await res.json();

      if (data.status === "OK") {
          setTournament(data.tournament);      // Updates tournament state with new match info
          setCurrentGameMatch(match);          // Sets active game state (triggers Pong iframe)
          setActiveGameId(match.match_id);
      } else {
        console.error ("Error starting match:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatchId(null);
    }
  };

  // Ends a match - Simply clears the current game state and closes iframe

  const handleMatchEnd = () => {
    setCurrentGameMatch(null);
    setActiveGameId(null);
  };

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
          onTournamentUpdated={(updated) => {
            setTournament(updated);
            setShowSetup(false);
          }}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Tournament Bracket */}
      {tournament && !showSetup && (
        <TournamentBracket
          tournament={tournament}
          loadingMatchId={loadingMatchId}
          onStartMatch={handleStartMatch} 
        />
      )}
    </div>
    
      {/* Pong Game Iframe  -- this needs to be fixed*/}
      {currentGameMatch && activeGameId && (
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
        {!loadingMatchId && (
          <button
            onClick={() => {}}
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
            Start Match
          </button>
        )}

        {loadingMatchId && (
          <iframe
            src={`/pong_game/index.html?gameId=${activeGameId}`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Pong Game"
          />
        )}

        <button
          onClick={handleMatchEnd}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            fontSize: "18px",
            borderRadius: "8px",
            backgroundColor: "#dc2626",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
        >
          End Match
        </button>
      </div>
    )}
  </>
  );
};

export default TournamentLobby;
