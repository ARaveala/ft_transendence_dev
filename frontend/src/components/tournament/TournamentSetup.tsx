import React, { useEffect, useState } from "react";
import PlayerList from "./PlayerList";
import type { TournamentState, Match } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { TBD_PLAYER } from "../../../shared/constants";
import { StartTournamentPayload, StartTournamentResponse, RemovePlayerPayload, RemovePlayerResponse } from '../../../shared/payloads';
import Button from "../ui/Button";

interface TournamentSetupProps {
  tournament?: TournamentState | null;
  onTournamentUpdated: (updated: TournamentState) => void;
  onCancel: () => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({
  tournament,
  onTournamentUpdated,
  onCancel,

}) => {

  const [loading, setLoading] = useState(false);

  const handleRemovePlayer = async (role: string) => {
    if (!tournament) return;

    const payload: RemovePlayerPayload = {
      tournament_id: tournament.tournament_id,
      role,
    };
    try {
      setLoading(true);
      const res = await fetch(API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path, {
        method: API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      
      const data: RemovePlayerResponse = await res.json();

      if (data.status === "OK" && data.tournament) {
        onTournamentUpdated(data.tournament);
      } else {
        console.error("Error removing player:", data.error);
      }
    } catch (err) {
      console.error("Network error when removing player:", err);
    } finally {
      setLoading(false);
    }
  };

  /* Starts the tournament:
    - Sends tournament_id to backend
    - Builds an initial bracket with placeholder (TBD) matches
    - Notifies parent via `onTournamentUpdated`
  */

  const handleStartTournament = async () => {
    if (!tournament) return;

    const payload: StartTournamentPayload = {
      tournament_id: tournament.tournament_id,
    };

    try {
      setLoading(true);
      const res = await fetch(API_PROTOCOL.START_TOURNAMENT.path, {
        method: API_PROTOCOL.START_TOURNAMENT.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data: StartTournamentResponse = await res.json();
	  console.log("lets looky at the data sent ", data);
      if (data.status !== "OK" || !data.tournament) {
        console.error("Tournament start error:", data.error);
        return;
      }

    // Builds bracket structure: first round + placeholders for later rounds
    const firstRound = data.tournament.bracket[0];

    const bracket: Match[][] = [
      firstRound,
      firstRound.map(() => ({
        match_id: "tbd",
        player1: { ...TBD_PLAYER },
        player2: { ...TBD_PLAYER },
        winner: { ...TBD_PLAYER },
        status: "pending",
        score: { player1: 0, player2: 0 },
      })),
        [
        {
          match_id: "tbd-final",
          player1: { ...TBD_PLAYER },
          player2: { ...TBD_PLAYER },
          winner: { ...TBD_PLAYER },
          status: "pending",
          score: { player1: 0, player2: 0 },
        },
      ],
    ];

   // Constructs TournamentState and notifies parent
    const updatedTournament: TournamentState = {
      ...data.tournament,
        status: "ongoing",
        bracket,
        currentMatch: firstRound[0],
    };

    onTournamentUpdated(updatedTournament);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!tournament) {
    return (
      <div className="text-gray-300 mt-8">
        No tournament loaded. Please create one first.
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div>
        <p className="text-gray-300 mb-4 ml-7">Players in Tournament</p>

        <PlayerList
          tournament={tournament}
          onTournamentUpdated={onTournamentUpdated}
          onRemovePlayer={handleRemovePlayer}
        />
      </div>

      <div className="flex gap-4 mt-6 ml-7">
        <Button onClick={onCancel} disabled={loading}>
          Cancel tournament
        </Button>

        <Button
          onClick={handleStartTournament}
          disabled={!tournament.can_start || loading}
        >
          {loading
            ? "Processing..."
            : tournament.can_start
            ? "Start Tournament"
            : "Waiting for players..."}
        </Button>
      </div>
    </div>
  );
};

export default TournamentSetup;
