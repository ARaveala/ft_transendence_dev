import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import { PlayerSearch } from "../components/tournament/PlayerSearch";
import PlayerList from "../components/tournament/PlayerList";
import TournamentBracket from "../components/tournament/TournamentBracket";
import type { TournamentPlayer, Tournament, Match } from "../types/tournament";

const TournamentLobby: React.FC = () => {
  // Initial state: logged-in player pre-filled
  const [players, setPlayers] = useState<TournamentPlayer[]>([
    { user_id: "current", username: "currentUser", alias: "", status: "waiting", score: 0 },
  ]);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [tournamentStarted, setTournamentStarted] = useState(false);

  // Add a player from PlayerSearch
  const handleAddPlayer = (player: TournamentPlayer) => {
    if (players.length >= 4) return;
    // Add new player to the next empty row
    setPlayers((prev) => [...prev, player]);
  };

  // Update a player's alias/password/status in PlayerList
  const handleUpdatePlayer = (index: number, updates: Partial<TournamentPlayer>) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p))
    );
  };

  // Check if all players have alias and password -> enable start button
  const allPlayersReady = players.length === 4 && players.every(p => p.alias && p.user_id);

  // Start tournament: call backend to create tournament and generate matches
  const handleStartTournament = async () => {
    // Example placeholder API call
    // const response = await fetch("/api/tournaments", { method: "POST", body: JSON.stringify(players) });
    // const newTournament: Tournament = await response.json();

    const newTournament: Tournament = {
      tournament_id: "t1",
      status: "active",
      players,
      matches: [],      // First matches returned from backend
      bracket: [],
      createdAt: new Date(),
      currentMatch: undefined
    };

    setTournament(newTournament);
    setTournamentStarted(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <TournamentHeader />

      {!tournamentStarted && (
        <>
          <PlayerSearch onAddPlayer={handleAddPlayer} />
          <PlayerList players={players} onUpdatePlayer={handleUpdatePlayer} />
          {allPlayersReady && (
            <button
              onClick={handleStartTournament}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
            >
              Start Tournament
            </button>
          )}
        </>
      )}

      {tournamentStarted && tournament && (
        <TournamentBracket tournament={tournament} />
      )}
    </div>
  );
};

export default TournamentLobby;
