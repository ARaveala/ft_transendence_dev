import React, { useState } from "react";
import type { TournamentPlayer } from "../../types/tournament";

interface PlayerListProps {
  players: TournamentPlayer[];
  onUpdatePlayer: (index: number, updates: Partial<TournamentPlayer>) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onUpdatePlayer }) => {
  const [errors, setErrors] = useState<string[]>(Array(players.length).fill(""));

  const handleAliasChange = (index: number, alias: string) => {
    let error = "";

    // Check minimum length
    if (alias.length < 5) {
      error = "Alias must be at least 5 characters";
    }

    // Check uniqueness
    const duplicate = players.some(
      (p, i) => i !== index && p.alias.toLowerCase() === alias.toLowerCase()
    );
    if (duplicate) {
      error = "Alias must be unique";
    }

    // Update error state
    const newErrors = [...errors];
    newErrors[index] = error;
    setErrors(newErrors);

    // Only update alias if no error
    if (!error) {
      onUpdatePlayer(index, { alias });
    }
  };

  return (
    <div className="space-y-3">
      {players.map((player, index) => (
        <div key={player.user_id} className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={player.username}
              readOnly
              className="p-2 border rounded flex-1 bg-gray-200 text-black"
            />
            <input
              type="password"
              placeholder="Password"
              className="p-2 border rounded flex-1 text-black"
              onChange={(e) => onUpdatePlayer(index, { /* password logic */ })}
            />
            <input
              type="text"
              placeholder="Alias"
              className={`p-2 border rounded flex-1 ${
                errors[index] ? "border-red-500" : "border-gray-300"
              } text-black`}
              value={player.alias}
              onChange={(e) => onUpdatePlayer(index, { alias: e.target.value })}
              onBlur={(e) => handleAliasChange(index, e.target.value)} // validate when leaving field
            />
          </div>
          {errors[index] && (
            <span className="text-red-500 text-sm">{errors[index]}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
