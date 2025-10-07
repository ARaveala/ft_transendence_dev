import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import type { TournamentState, Match } from "../types/tournament";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { CreateTournamentPayload, TournamentStateResponse, StartTournamentMatchPayload, StartTournamentMatchResponse } from "../../shared/payloads";

const TournamentLobby: React.FC = () => {
  const [tournament, setTournament] = useState<TournamentState | null>(null);      // Main tournament state (null means there is no tournament yet)
  const [showSetup, setShowSetup] = useState(false);                               // Indicates whether we are in tournament setup mode (adding players etc.)
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
    try {
      const res = await fetch(API_PROTOCOL.CREATE_TOURNAMENT.path, {
        method: API_PROTOCOL.CREATE_TOURNAMENT.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data: TournamentStateResponse = await res.json();

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
          onCancel={() => handleCancelTournament}
        />
      )}

      {/* Tournament Bracket */}
      {tournament && !showSetup && (
        <TournamentBracket
          tournament={tournament}
          onStartMatch={handleStartMatch}
          onCancel={handleCancelTournament}
        />
      )}
    </div>
    
      {/* Pong Game Iframe  -- this needs to be fixed*/}
      {currentGameMatch && activeGameId && (
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
            src={`../../shared/index.html?gameId=${activeGameId}&player1Token=localP1&player2Token=localP2`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Pong Game"
          />
      </div>
    )}
  </>
  );
};

export default TournamentLobby;



{/*
window.addEventListener("message", (event) => {    // to automatically close iframe when the match ends and pong game sends a message that match ended
  if (event.data?.type === "MATCH_END") {
    handleMatchEnd();
  }
});

*/}