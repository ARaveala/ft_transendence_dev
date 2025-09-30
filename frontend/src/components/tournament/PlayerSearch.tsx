import React, { useEffect, useState } from "react";
import type { TournamentPlayer } from "../../types/tournament";
import Button from "../ui/Button";

interface PlayerSearchProps {
  players: TournamentPlayer[]; // allRegisteredPlayers
  onAddPlayer: (player: TournamentPlayer) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ players, onAddPlayer }) => {
  const [query, setQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<TournamentPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Filter players based on search query
  useEffect(() => {
    const filtered = players.filter((p) =>
      p.username.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [query, players]);

  const handleAddPlayer = () => {
    if (!selectedPlayerId) return;
    const player = players.find((p) => p.username === selectedPlayerId);
    if (player) onAddPlayer(player);
    setSelectedPlayerId("");
    setQuery(""); // reset search
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
        value={selectedPlayerId}
        onChange={(e) => setSelectedPlayerId(e.target.value)}
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
