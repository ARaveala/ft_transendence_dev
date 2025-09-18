import React, { useEffect, useState } from "react";
import type { TournamentPlayer } from "../../types/tournament";

interface PlayerSearchProps {
  onAddPlayer: (player: TournamentPlayer) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ onAddPlayer }) => {
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [query, setQuery] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState<TournamentPlayer[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  // Fetch all players from MSW
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("/api/tournament/search");
        if (!res.ok) throw new Error("Failed to fetch players");
        const data: TournamentPlayer[] = await res.json();
        setPlayers(data);
        setFilteredPlayers(data);
        console.log("Fetched players:", data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPlayers();
  }, []);

  // Filter players based on search query
  useEffect(() => {
    const filtered = players.filter((p) =>
      p.username.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [query, players]);

  const handleAddPlayer = () => {
    if (!selectedPlayerId) return;
    const player = players.find((p) => p.user_id === selectedPlayerId);
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
          <option key={p.user_id} value={p.user_id}>
            {p.username}
          </option>
        ))}
      </select>
      <button
        onClick={handleAddPlayer}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Player
      </button>
    </div>
  );
};
