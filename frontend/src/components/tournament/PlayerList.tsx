import React, { useState, useEffect } from "react";
import type { TournamentPlayer, TournamentState } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { VerifyPlayerPayload, VerifyPlayerResponse, AddAliasPayload, AddAliasResponse } from "../../../shared/payloads";
import Button from "../ui/Button";

interface PlayerListProps {
  tournament: TournamentState;
  onTournamentUpdated: (updated: TournamentState) => void; 
  onRemovePlayer: (role: string) => void;                // remove a player from the list
}

type LocalAliases = Record<string, string>;
type LocalErrors = Record<string, string>;

const PlayerList: React.FC<PlayerListProps> = ({
  tournament,
  onTournamentUpdated,
  onRemovePlayer,
 }) => {
  // Keeps track of validation errors per player
  const [localUsernames, setLocalUsernames] = useState<Record<string, string>>({});
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


  const handleUsernameChange = (role: string, username: string) => {
    setLocalUsernames(prev => ({ ...prev, [role]: username }));
    const updatedPlayers = tournament.players.map(p =>
      p.role === role ? { ...p, username } : p
    );
    onTournamentUpdated({ ...tournament, players: updatedPlayers });
  };

  const handleAliasChange = (role: string, alias: string) => {

    setLocalAliases(prev => ({ ...prev, [role]: alias }));
    // Clear previous error while typing
    setErrors(prev => ({ ...prev, [role]: "" }));
  };


  const handleAliasBlur = async (role: string) => {

    const alias = localAliases[role] || "";
 
    if (!alias || alias.length < 5) {
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
      const payload: AddAliasPayload = { role, alias };
      const res = await fetch(API_PROTOCOL.ADD_ALIAS.path, {
        method: API_PROTOCOL.ADD_ALIAS.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data: AddAliasResponse = await res.json();

      if (data.status === "OK") {
        onTournamentUpdated(data.tournament);
        setErrors(prev => ({ ...prev, [role]: "" }));
      } else {
        setErrors(prev => ({ ...prev, [role]: data.error || "Alias invalid" }));
      }
    } catch (err) {
      console.error("Error adding alias:", err);
    }
  };

  // Verify player password (not logged in player) against backend API
  const handleVerifyPlayer = async (role: string, username: string, password: string) => {
    if (!password) return;

    try {
      const payload: VerifyPlayerPayload = { role, username, password };
      const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
        method: API_PROTOCOL.VERIFY_PLAYER.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data: VerifyPlayerResponse = await res.json();
      if (data.status === "OK") {
        onTournamentUpdated(data.tournament);
        setErrors((prev) => ({ ...prev, [role]: "" }));
      } else {
        setErrors((prev) => ({ ...prev, [role]: data.error || "Invalid credentials" }));
      }
    } catch (err) {
      console.error("Error verifying player:", err);
    }
  };

  return (
    <div className="space-y-3">
      {tournament.players.map((player) => (
       <div key={player.role} className="flex flex-col gap-1">
          <div className="flex gap-2 items-center">
            {/* Username */}
            <input
              type="text"
              placeholder="Username"
              value={localUsernames[player.role] || ""}
              disabled={player.isSelf || player.isVerified}
              onChange={(e) => handleUsernameChange(player.role, e.target.value)}
              className="p-2 border rounded flex-1 bg-gray-200 text-black"
            />

               {/* Password */}
              <input
                type="password"
                placeholder="Password"
                disabled={player.isSelf || player.isVerified}
                className={`p-2 border rounded flex-1 text-black ${
                  player.isSelf || player.isVerified
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "text-black"
                }`}
                onBlur={(e) => {
                  const typedPassword = e.target.value;
                  if (!player.isSelf && !player.isVerified && typedPassword) {
                    handleVerifyPlayer(player.role, player.username, typedPassword);
                    e.target.value = "";
                  }
                }}
              />

              {/* Alias */}
              <input
                type="text"
                placeholder="Alias"
                disabled={!player.isVerified}
                className={`p-2 border rounded flex-1 ${
                  errors[player.role] ? "border-red-500" : "border-gray-300"
                } text-black`}
                value={localAliases[player.role] || ""}
                onChange={(e) => { handleAliasChange(player.role, e.target.value)}}
                onBlur={(e) => handleAliasBlur(player.role)}
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
      ))}
      <div className="mt-4 text-gray-300 text-sm">
        {tournament.can_start
          ? "✅ All players verified — ready to start!"
          : `Waiting for ${tournament.pending_players ?? 0} players to verify.`}
      </div>
    </div>
  );
};

export default PlayerList;
