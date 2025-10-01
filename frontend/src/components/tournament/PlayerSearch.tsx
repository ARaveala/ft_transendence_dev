import React, { useMemo, useState } from "react";
import type { TournamentPlayer } from "../../types/tournament";
import Button from "../ui/Button";

interface PlayerSearchProps {
  players: TournamentPlayer[]; // allRegisteredPlayers
  addedPlayers: TournamentPlayer[];   // players already added to the tournament
  onAddPlayer: (player: TournamentPlayer) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ 
  players,
  addedPlayers,
  onAddPlayer, 
}) => {
  const [query, setQuery] = useState("");
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState("");

  const tournamentFull = addedPlayers.length >= 4; // max 3 other players

  // Filter players based on query and exclude already added players
  const filteredPlayers = useMemo(() => {
    const queryLower = query.toLowerCase();
    const addedUsernames = new Set(addedPlayers.map(p => p.username.toLowerCase()));

    return players.filter(p => {
      const matchesQuery = p.username.toLowerCase().includes(queryLower);
      const notAdded = !addedUsernames.has(p.username.toLowerCase());
      return matchesQuery && notAdded;
    });
  }, [players, addedPlayers, query]);

  const handleAddPlayer = () => {
    if (!selectedPlayerUsername) return;

    const playerToAdd = filteredPlayers.find(
      (p) => p.username === selectedPlayerUsername
    );

    if (playerToAdd) {
      onAddPlayer(playerToAdd);
      setSelectedPlayerUsername("");
      setQuery("");
    }
  };

  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search player..."
        className="p-2 border rounded flex-1 text-black"
      />
      <select
        value={selectedPlayerUsername}
        onChange={(e) => setSelectedPlayerUsername(e.target.value)}
        className="p-2 border rounded flex-1 text-black"
      >
        <option value="">Select player</option>
        {filteredPlayers.map((p) => (
          <option key={p.username} value={p.username}>
            {p.username}
          </option>
        ))}
      </select>
      <Button
        onClick={handleAddPlayer}
        disabled={!selectedPlayerUsername || tournamentFull}
      >
        Add Player
      </Button>
    </div>
  );
};
