import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import type { TournamentState, Match } from "../types/tournament";
import { CreateTournamentResponse } from "../../shared/payloads";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols"; 

const TournamentLobby: React.FC = () => {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [loadingMatchId, setLoadingMatchId] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [currentGameMatch, setCurrentGameMatch] = useState<Match | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  // Create a new tournament as soon as the user clicks "Start a new tournament"

  const handleCreateTournament = async () => {
    try {
      const res = await fetch(API_PROTOCOL.CREATE_TOURNAMENT.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_players: 4 }),
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

  const handleTournamentUpdated = (updated: TournamentState) => {
    setTournament(updated);
  };

  const handleCancel = () => {
    setShowSetup(false);
    setTournament(null);
  };

  const handleStartMatch = async (match: Match) => {
    if (!tournament) return;
    setLoadingMatchId(match.match_id);

    try {
      const res = await fetch(`/api/tournament/${tournament.tournament_id}/start-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match_id: match.match_id }),
     });

      const updatedTournament: TournamentState = await res.json();
      setTournament(updatedTournament);                               // Updates bracket, winners, etc.
      setCurrentGameMatch(match);
      setGameId(match.match_id);
      setActiveGameId(match.match_id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatchId(null);
    }
  };

  const handleMatchEnd = () => {        // Called when the match finishes, just clear current match
    setCurrentGameMatch(null);
    setGameId(null);
    setActiveGameId(null);
  };

  return (
    <>
    <div className="p-6 max-w-4xl mx-auto">
      <TournamentHeader />

      {/* Start Tournament Button */}
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
