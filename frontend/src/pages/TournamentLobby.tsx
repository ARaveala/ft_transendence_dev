import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import type { TournamentState } from "../types/tournament";
import { CreateTournamentResponse } from "../../shared/payloads";
import Button from "../components/ui/Button";
import { API_PROTOCOL } from "../../shared/api-protocols"; 

const TournamentLobby: React.FC = () => {
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [showSetup, setShowSetup] = useState(false);

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <TournamentHeader />

      {!tournament && !showSetup && (
        <div className="flex flex-col items-center mt-8">
          <Button
            onClick={handleCreateTournament}>
            Start a new tournament
          </Button>
        </div>
      )}

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

      {tournament && !showSetup && (
        <TournamentBracket tournament={tournament} />
      )}
    </div>
  );
};

export default TournamentLobby;
