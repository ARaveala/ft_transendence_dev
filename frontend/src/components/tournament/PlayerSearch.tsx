import React, { useCallback, useMemo, useState } from "react";
import type { TournamentPlayer } from "../../types/tournament";
import Button from "../ui/Button";

interface PlayerSearchProps {
  players: TournamentPlayer[]; // allRegisteredPlayers
  addedPlayers: TournamentPlayer[];   // players already added to the tournament
  onAddPlayer: (player: TournamentPlayer) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ 
  players,
  addedPlayers = [],
  onAddPlayer, 
}) => {
  const [query, setQuery] = useState("");
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState("");

  // Filter players based on query and exclude already added players
  const getFilteredPlayers = useCallback(() =>
    players.filter((p) => 
      p.username.toLowerCase().includes(query.toLowerCase()) &&
        !addedPlayers.some(
          (ap) => ap.username.toLowerCase() === p.username.toLowerCase()
        )
    ), [players, addedPlayers, query]);

    const filteredPlayers = useMemo(() => {
      const newFilteredPlayers = getFilteredPlayers();

      if (
        selectedPlayerUsername && !newFilteredPlayers.some(
          (p) => p.username.toLowerCase() === selectedPlayerUsername.toLowerCase()
      )
    ) {
      setSelectedPlayerUsername("");
    }
  return newFilteredPlayers;
  }, [getFilteredPlayers, selectedPlayerUsername]);

  const handleAddPlayer = () => {
    if (!selectedPlayerUsername) return;

    const playerToAdd = players.find(
      (p) => p.username.toLowerCase() === selectedPlayerUsername.toLowerCase()
    );

    if (!playerToAdd) {
      alert("Player not found.");
      return;
    }
    const isAlreadyAdded = addedPlayers.some(
      (ap) => ap.username.toLowerCase() === playerToAdd.username.toLowerCase()
    );
    if (isAlreadyAdded) {
      alert("Player is already added.");
      return;
    }

      onAddPlayer(playerToAdd);
      setSelectedPlayerUsername("");
      setQuery("");
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
      >
        Add Player
      </Button>
    </div>
  );
};
