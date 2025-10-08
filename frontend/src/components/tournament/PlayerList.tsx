import React, { useState, useEffect } from "react";
import type { TournamentPlayer, TournamentState } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { VerifyPlayerPayload, VerifyPlayerResponse } from "../../../shared/payloads";
import Button from "../ui/Button";

interface PlayerListProps {
  tournament: TournamentState;
  onTournamentUpdated: (updated: TournamentState) => void; 
  onRemovePlayer: (role: string) => void;                // remove a player from the list
}

type LocalAliases = Record<string, string>;
type LocalPasswords = Record<string, string>;
type LocalUsernames = Record<string, string>;
type LocalErrors = Record<string, string>;

const PlayerList: React.FC<PlayerListProps> = ({
  tournament,
  onTournamentUpdated,
  onRemovePlayer,
 }) => {
  // Keeps track of validation errors per player
  const [localUsernames, setLocalUsernames] = useState<LocalUsernames>({});
  const [localPasswords, setLocalPasswords] = useState<LocalPasswords>({});
  const [localAliases, setLocalAliases] = useState<LocalAliases>({});
  const [errors, setErrors] = useState<LocalErrors>({});

  useEffect(() => {
    const initialAliases: LocalAliases = {};
    tournament.players.forEach(p => {
      initialAliases[p.role] = p.alias || "";
    });
    setLocalAliases(initialAliases);
  }, [tournament.players.map(p => p.alias).join("|")]);


  useEffect(() => {
    const initialUsernames: Record<string, string> = {};
    tournament.players.forEach(p => {
      initialUsernames[p.role] = p.username || "";
    });
    setLocalUsernames(initialUsernames);
  }, [tournament.players.map(p => p.username).join("|")]);

  useEffect(() => {
    const initialPasswords: Record<string, string> = {};
    tournament.players.forEach(p => {
      initialPasswords[p.role] = "";
    });
    setLocalPasswords(initialPasswords);
  }, [tournament.players.map(p => p.username).join("|")]);


  const handleUsernameChange = (role: string, username: string) => {
    setLocalUsernames(prev => ({ ...prev, [role]: username }));
  };

  const handleAliasChange = (role: string, alias: string) => {
    setLocalAliases(prev => ({ ...prev, [role]: alias }));
    // Clear previous error while typing
    setErrors(prev => ({ ...prev, [role]: "" }));
  };

  const handlePasswordChange = (role: string, password: string) => {
    setLocalPasswords(prev => ({ ...prev, [role]: password }));
    // Clear previous error while typing
    setErrors(prev => ({ ...prev, [role]: "" }));
  };

  const handleVerifyPlayer = async (
    role: string,
    username: string,
    password: string,
    alias: string
  ) => {
 
    if (!username || !password || !alias) {
        setErrors(prev => ({ ...prev, [role]: "All three fields are required." }));
        return;
    }

    if (alias.length < 5) {
      setErrors(prev => ({ ...prev, [role]: "Alias must be at least 5 characters" }));
      return;
    }

    // Ensure uniqueness among all players
    const duplicate = tournament.players.some(
      p => p.role !== role && p.alias?.toLowerCase() === alias.toLowerCase()
    );
    if (duplicate) {
      setErrors(prev => ({ ...prev, [role]: "Alias must be unique" }));
      return;
    }

    try {
      const payload: VerifyPlayerPayload = { role, username, password, alias };
      const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
        method: API_PROTOCOL.VERIFY_PLAYER.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data: VerifyPlayerResponse = await res.json();
      if (data.status === "OK") {
        onTournamentUpdated(data.tournament);
        setLocalPasswords(prev => {
            const newState = { ...prev };
            delete newState[role]; 
            return newState;
        });
        
      } else {
        setErrors((prev) => ({ ...prev, [role]: data.error || "Invalid credentials" }));
      }
    } catch (err) {
      console.error("Error verifying player:", err);
    }
  };

  return (
    <div className="space-y-3">
      {tournament.players.map((player) => {
        const role = player.role;
        const username = localUsernames[role] || player.username || "";
        const password = localPasswords[role] || "";
        const alias = localAliases[role] || "";

        const isEditable = !player.isSelf && !player.isVerified;

        return (
          <div key={player.role} className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">

              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                disabled={player.isSelf || player.isVerified}
                value={username}
                onChange={(e) => handleUsernameChange(role, e.target.value)}
                className={`p-2 border rounded flex-1 ${
                player.isSelf || player.isVerified
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-black"
                }`}
              />

               {/* Password */}
              <input
                type="password"
                placeholder="Password"
                disabled={!isEditable} 
                value={password}
                onChange={(e) => handlePasswordChange(role, e.target.value)} 
                onBlur={() => {
                if (!isEditable && password) {
                  handleVerifyPlayer(role, username, password, alias);
                  }
                }}
                className={`p-2 border rounded flex-1 ${
                  !isEditable
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white text-black"
                }`}
              />

              {/* Alias */}
              <input
                type="text"
                placeholder="Alias"
                disabled={player.isVerified}
                value={alias}
                onChange={(e) => { handleAliasChange(role, e.target.value)}}
                className={`p-2 border rounded flex-1 ${
                  errors[player.role] ? "border-red-500" : "border-gray-300"
                } text-black`}
              />
              <Button
                onClick={() => onRemovePlayer(player.role)}
                disabled={player.isSelf}>
                  Remove
              </Button>
            </div>
            {errors[player.role] &&
              <span className="text-red-500 text-sm">{errors[player.role]}</span>
            }
        </div>
      );
    })}
      <div className="mt-4 text-gray-300 text-sm">
        {tournament.can_start
          ? "✅ All players verified — ready to start!"
          : `Waiting for ${tournament.pending_players ?? 0} players to verify.`}
      </div>
    </div>
  );
};

export default PlayerList;
