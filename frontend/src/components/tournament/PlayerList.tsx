import React, { useState, useEffect } from "react";
import type { TournamentPlayer, TournamentState } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { VerifyPlayerPayload, VerifyPlayerResponse } from "../../../shared/payloads";
import Button from "../ui/Button";
import CheckCircle from "../ui/CheckCircle";

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

const PlayerList: React.FC<PlayerListProps> = ({
  tournament,
  onTournamentUpdated,
  onRemovePlayer,
 }) => {
  const [formData, setFormData] = useState<FormData>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [isEditingAlias, setIsEditingAlias] = useState<boolean>(false);

  useEffect(() => {
    const initialFormData: FormData = {};
    tournament.players.forEach(p => {
      initialFormData[p.role] = {
        username: p.username || "",
        password: "",
        alias: p.alias || "",
      };
    });
    setFormData(initialFormData);
  }, [tournament.players.map(p => p.role).join("|")]);

  const updateField = (role: string, field: keyof PlayerFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [field]: value
      }
    }));
    // Clear error when user types
    setErrors(prev => ({ ...prev, [role]: "" }));
  };

  const isFormComplete = (role: string, player: any): boolean => {
    const data = formData[role];
    if (!data) return false;

    if (player.isSelf) {
      return !!(data.alias);
    }

    return !!(data.username && data.password && data.alias);
  };

  const handleAddPlayer = async (role: string, player: TournamentPlayer) => {
    const data = formData[role];
    if (!data) return;

    // Frontend validation
    if (data.alias.length < 5) {
      setErrors(prev => ({ ...prev, [role]: "Alias must be at least 5 characters" }));
      return;
    }

    // Check alias uniqueness among verified players
    const duplicate = tournament.players.some(
      p => p.role !== role && p.isVerified && p.alias?.toLowerCase() === data.alias.toLowerCase()
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
        alias: data.alias
      };

      const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
        method: API_PROTOCOL.VERIFY_PLAYER.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const response: VerifyPlayerResponse = await res.json();

      if (response.status === "OK" && response.tournament) {
        if (player.isSelf) {
            // Exit editing mode for the self-player on success
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

  const handleRemovePlayer = async (role: string) => {
      // Clear all local state for the removed player's slot
      setFormData(prev => {
        const newState = { ...prev };
        // Clears username, password, and alias fields
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
            className="flex items-center gap-2">
              <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {isVerified && (
                  <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[0.4rem] font-bold flex items-center justify-center">
                    ✔
                  </span>
                )}
            </span>
            
            <div className="flex gap-2 items-center">
              {/* Username */}
              <input
                type="text"
                placeholder="Username"
                disabled={player.isSelf || isVerified}
                value={player.isSelf || isVerified ? player.username : data.username}
                onChange={(e) => updateField(role, "username", e.target.value)}
                className={`p-2 border rounded flex-1 ${
                  player.isSelf || isVerified
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-black"
                }`}
              />

              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                disabled={player.isSelf || isVerified}
                value={player.isSelf || isVerified ? "********" : data.password}
                onChange={(e) => updateField(role, "password", e.target.value)}
                className={`p-2 border rounded flex-1 ${
                  player.isSelf || isVerified
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-black"
                }`}
              />

              {/* Alias */}
              <input
                type="text"
                placeholder="Alias"
                disabled={isAliasLocked}
                value={data.alias || player.alias || ""}
                onChange={(e) => updateField(role, "alias", e.target.value)}
                className={`p-2 border rounded flex-1 ${
                  errors[role] ? "border-red-500" : "border-gray-300"
                } ${
                  isAliasLocked
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-black"
                }`}
              />

              {/* Action Buttons */}
              {!player.isSelf && !isVerified && (
                <Button
                  onClick={() => handleAddPlayer(role, player)}
                  disabled={!isFormComplete(role, player) || isCurrentlyLoading}
                >
                  {isCurrentlyLoading ? "Adding..." : "Add Player"}
                </Button>
              )}

              {isVerified && !player.isSelf && (
                <Button
                  onClick={() => handleRemovePlayer(role)} disabled={isCurrentlyLoading}>
                  Remove
                </Button>
              )}

              {player.isSelf && (
                <div className="flex items-center gap-2">

                  {/* Set/Edit Alias button */}
                  <Button
                    onClick={() => {
                     if (isVerified && !isEditingAlias) {
                      setIsEditingAlias(true);
                    }
                    // If UNVERIFIED or ALREADY EDITING, click to SAVE
                    else {
                      handleAddPlayer(role, player);
                    }
                    }}
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

            {/* Error Message */}
            {errors[role] && (
              <span className="text-red-500 text-sm ml-2">
                {errors[role]}
              </span>
            )}

          </div>
        );
      })}
    </div>
  )};  export default PlayerList;
