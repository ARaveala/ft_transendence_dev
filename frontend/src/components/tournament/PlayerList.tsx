// Child component to TournamentSetUp
// Renders a row for each player
// Executes password and alias validation
// Passes changes to parent (alias and password input)
// Notifies parent when all players are validated 


import React, { useState, useEffect } from "react";
import type { TournamentPlayer } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import Button from "../ui/Button";

interface PlayerListProps {
  players: TournamentPlayer[];
  onUpdatePlayer: (index: number, updates: Partial<TournamentPlayer>) => void;
  onValidationChange: (isValid: boolean) => void; // notify parent if tournament can start
  onRemovePlayer: (index: number) => void; 
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  onUpdatePlayer,
  onValidationChange,
  onRemovePlayer,
 }) => {
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

  // Password verification
  const handlePasswordBlur = async (index: number, username: string, password: string) => {
  if (!password) return;

  try {
    const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data: { valid: boolean; error?: string } = await res.json();
    const newErrors = [...errors];

    if (!data.valid) {
      newErrors[index] = data.error || "Invalid password";
    } else {
      newErrors[index] = "";
      onUpdatePlayer(index, { password });
    }
    setErrors(newErrors);
  } catch (err) {
    console.error(err);
  }
};

  // Validation check for all players
  useEffect(() => {
    const allValid = players.every((p, i) => {
      const aliasValid = p.alias && p.alias.length >= 5 && !errors[i];
      const passwordValid = p.isSelf ? true : (!!p.password && !errors[i]);
      return aliasValid && passwordValid;
    });

    onValidationChange(allValid);
  }, [players, errors, onValidationChange]);

  return (
    <div className="space-y-3">
      {players.map((player, index) => {
        const passwordError = errors[index];
        const canEditAlias = player.isSelf || (!!player.password && !passwordError);

        return (
          <div key={player.username} className="flex flex-col gap-1">
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
                disabled={player.isSelf}
                value={player.isSelf ? "********" : player.password || ""}
                className={`p-2 border rounded flex-1 text-black ${
                  player.isSelf
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-black"
                }`}
                onChange={(e) =>
                  !player.isSelf && onUpdatePlayer(index, { password: e.target.value })
                }
                onBlur={(e) =>
                  !player.isSelf && handlePasswordBlur(index, player.username, e.target.value)
                }
              />
              <input
                type="text"
                placeholder="Alias"
                disabled={!canEditAlias}
                className={`p-2 border rounded flex-1 ${
                  errors[index] ? "border-red-500" : "border-gray-300"
                } text-black ${!canEditAlias ? "bg-gray-100 cursor-not-allowed" : ""}`}
                value={player.alias}
                onChange={(e) => onUpdatePlayer(index, { alias: e.target.value })}
                onBlur={(e) => handleAliasChange(index, e.target.value)}
              />
              <Button
                onClick={() => onRemovePlayer(index)}
                disabled={player.isSelf}>
                  Remove
              </Button>
            </div>
            {errors[index] &&
              <span className="text-red-500 text-sm">{errors[index]}</span>
            }
        </div>
        );
      })}
    </div>
  );
};

export default PlayerList;
