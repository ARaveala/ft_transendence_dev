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

type PlayerFormData = {
  username: string;
  password: string;
  alias: string;
};

type FormErrors = Record<string, string>;
type FormData = Record<string, PlayerFormData>;

const FIXED_ROLES = ["player1", "player2", "player3", "player4"];

const createEmptySlot = (role: string): TournamentPlayer => ({
    role: role,
    username: "",
    alias: "",
    status: "waiting",
    isSelf: false,
    isVerified: false,
});

const PlayerList: React.FC<PlayerListProps> = ({
  tournament,
  onTournamentUpdated,
  onRemovePlayer,
 }) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [isEditingAlias, setIsEditingAlias] = useState<boolean>(false);
  const [tempAlias, setTempAlias] = useState('');

  useEffect(() => {
    const initialFormData: FormData = {};
    let selfAlias = '';

    tournament.players.forEach(p => {
      if (p.isSelf) {
        // If editing, uses the existing local state value (which was set to "")
        initialFormData[p.role] = formData[p.role] || {
          username: p.username || "",
          password: "",
          alias: p.alias || "",
        };
      } else {
          // 2. Capture the verified alias for the logged in player
          selfAlias = p.alias || '';
      }
    });

    const selfPlayerRole = tournament.players.find(p => p.isSelf)?.role;
    if (selfPlayerRole) {
        initialFormData[selfPlayerRole] = {
            username: tournament.players.find(p => p.isSelf)?.username || "",
            password: "",
            alias: selfAlias,
        };
    }
    setFormData(initialFormData);
    
    if (!isEditingAlias) {
        setTempAlias(selfAlias);
    }

  }, [tournament.players.map(p => p.role).join("|")]);

  const updateField = (role: string, field: keyof PlayerFormData, value: string) => {
    const isSelfPlayer = tournament.players.find(p => p.role === role)?.isSelf;

    if (isSelfPlayer && field === 'alias') {
        setTempAlias(value);
    } else {
        setFormData(prev => ({
          ...prev,
          [role]: {
            ...prev[role],
            [field]: value
          }
        }));
    }
    setErrors(prev => ({ ...prev, [role]: "" }));
  };

  const isFormComplete = (role: string, player: any): boolean => {
    if (player.isSelf) {
      // Check for alias validity in either the temp state or the verified state
      return !!tempAlias;
    }
    
    const data = formData[role];
    return !!(data?.username && data?.password && data?.alias);
  };

  const handleAddPlayer = async (role: string, player: TournamentPlayer) => {
    const data = formData[role];
    let aliasToUse = player.isSelf ? tempAlias : data?.alias || '';

    // Frontend validation
    if (aliasToUse.length < 5) {
      setErrors(prev => ({ ...prev, [role]: "Alias must be at least 5 characters" }));
      return;
    }

    // Check alias uniqueness among verified players
    const duplicate = tournament.players.some(
      p => p.role !== role && p.isVerified && p.alias?.toLowerCase() === aliasToUse.toLowerCase()
    );
    if (duplicate) {
      setErrors(prev => ({ ...prev, [role]: "Alias must be unique" }));
      return;
    }

    try {
      setLoading(role);

      const payload: VerifyPlayerPayload = {
        role,
        username: player.isSelf ? player.username : data.username,
        password: player.isSelf ? "" : data.password,
        alias: aliasToUse,
      };

      const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
        method: API_PROTOCOL.VERIFY_PLAYER.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Non-OK response:", res.status, await res.text());
        throw new Error(`HTTP ${res.status}`);
  }

      const response: VerifyPlayerResponse = await res.json();

      if (response.status === "OK" && response.tournament) {
        if (player.isSelf) {
            // Exit editing mode for the logged in player on success
            setIsEditingAlias(false);
        }

        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[role];
          return newErrors;
        });
        onTournamentUpdated(response.tournament);
      } else {
        setErrors(prev => ({
          ...prev,
          [role]: response.error || "Invalid credentials or alias."
        }));
      }
    } catch (err) {
      console.error("Error verifying player:", err);
      setErrors(prev => ({
        ...prev,
        [role]: "Network error. Please try again."
      }));
    } finally {
      setLoading(null);
    }
  };

  const handleRemovePlayer = (role: string) => {
      setFormData(prev => {
        const newState = { ...prev };
        newState[role] = { username: "", password: "", alias: "" }; 
        return newState;
      });

      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[role];
        return newErrors;
      });

      onRemovePlayer(role);
  };

  return (
    <div className="space-y-3">
      {tournament.players.map((player) => {
        const role = player.role;
        const isVerified = player.isVerified;
        const isCurrentlyLoading = loading === role;
        const isSelfVerifiedButLocked = player.isSelf && isVerified && !isEditingAlias;
        const isOtherPlayerLocked = !player.isSelf && isVerified;
        const isAliasLocked = isOtherPlayerLocked || isSelfVerifiedButLocked; 

        const data = formData[role] || { username: "", password: "", alias: "" };

        return (
          <div
            key={role}
            className="flex flex-col gap-1">
            < div className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {isVerified && (
                  <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[0.4rem] font-bold flex items-center justify-center">
                    ✔
                  </span>
                )}
            </span>
            
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                disabled={player.isSelf || isVerified}
                value={player.isSelf || isVerified ? player.username : data.username}
                onChange={(e) => updateField(role, "username", e.target.value)}
                className={`p-2 border border-gray-700 rounded flex-1 ${
                  player.isSelf || isVerified
                    ? "bg-gray-900 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white"
                }`}
              />

              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                disabled={player.isSelf || isVerified}
                value={player.isSelf || isVerified ? "********" : data.password}
                onChange={(e) => updateField(role, "password", e.target.value)}
                className={`p-2 border border-gray-700 rounded flex-1 ${
                  player.isSelf || isVerified
                    ? "bg-gray-900 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white"
                }`}
              />

              {/* Alias */}
              <input
                type="text"
                placeholder="Alias"
                disabled={isAliasLocked}
                value={
                  player.isSelf
                    ? tempAlias
                    : data.alias || player.alias || ""
                }
                onChange={(e) => updateField(role, "alias", e.target.value)}
                className={`p-2 border border-gray-700 rounded flex-1 ${
                  errors[role] ? "border-red-500" : "border-gray-300"
                } ${
                  isAliasLocked
                    ? "bg-gray-900 text-white cursor-not-allowed"
                    : "bg-gray-900 text-white"
                }`}
              />

              {/* Action Buttons (Other players) */}
              {!player.isSelf && !isVerified && (
                <Button
                  onClick={() => handleAddPlayer(role, player)}
                  disabled={!isFormComplete(role, player) || isCurrentlyLoading}
                  className="min-w-[6.3rem]"
                >
                  {isCurrentlyLoading ? "Adding..." : "Add Player"}
                </Button>
              )}

              {isVerified && !player.isSelf && (
                <Button
                  onClick={() => handleRemovePlayer(role)} disabled={isCurrentlyLoading}
                  className="min-w-[6.3rem]">
                  Remove
                </Button>
              )}

               {/* Action Buttons (Player1) */}
              {player.isSelf && (
                <div className="flex items-center gap-2">

                  {/* Set/Edit Alias button */}
                  <Button
                    onClick={() => {
                     if (isVerified && !isEditingAlias) {
                        setIsEditingAlias(true);
                        setTempAlias(""); 
                      } else {
                        // Save Alias
                        handleAddPlayer(role, player);
                    }
                  }}
                    // Check completion against the dedicated logic now
                    disabled={isCurrentlyLoading || (isEditingAlias && !isFormComplete(role, player))}
                    className="min-w-[6.3rem]"
                  >
                    {isCurrentlyLoading
                      ? "Saving..."
                      : !isVerified
                      ? "Set Alias"
                      : isEditingAlias // If verified, check if editing
                      ? "Save Alias" 
                      : "Edit Alias"}
                  </Button>
                </div>
              )}
            </div>
           </div>
            {/* Error Message */}
            {errors[role] && (
              <span className="text-red-500 text-sm ml-7">
                {errors[role]}
              </span>
            )}

          </div>
        );
      })}
    </div>
  )};  export default PlayerList;
