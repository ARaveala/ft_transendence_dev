import React, { useEffect, useState } from "react";
import PlayerList from "./PlayerList";
import { PlayerSearch } from "./PlayerSearch";
import type { TournamentPlayer, TournamentState, Match } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { TBD_PLAYER } from "../../../shared/constants";
import { PlayerSearchRequest, PlayerSearchResponse, StartTournamentPayload, StartTournamentResponse } from '../../../shared/payloads';
import Button from "../ui/Button";

interface TournamentSetupProps {
  tournament?: TournamentState | null;
  onTournamentUpdated: (updated: TournamentState) => void;
  onCancel: () => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({tournament, onTournamentUpdated, onCancel }) => {
  // Players currently in the tournament (starts with logged-in user)
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([
    { 
      username: "currentUser",
      alias: "",
      status: "waiting",
      score: 0,
      isSelf: true },
  ]);
  // All registered players
  const [allRegisteredPlayers, setAllRegisteredPlayers] = useState<TournamentPlayer[]>([]);
  // Tracks whether tournament can start (set by PlayerList validation)
  const [canStart, setCanStart] = useState(false);

  // Fetches all registered players from backend
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(API_PROTOCOL.GET_ALL_REGISTERED_PLAYERS.path);
        if (!res.ok) throw new Error("Failed to fetch players");

        const data: PlayerSearchResponse = await res.json();

        setAllRegisteredPlayers(data.players || []);  // Returns an empty array if backend returns nothing
      } catch (err) {
        console.error(err);
        setAllRegisteredPlayers([]); // fallback in case of error
      }
    };
  fetchPlayers();
}, []);

  // Update a single tournament player’s data
  const handleUpdatePlayer = (index: number, updates: Partial<TournamentPlayer>) => {
    setTournamentPlayers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  // Add a player (from PlayerSearch) to the tournament
  const handleAddPlayer = (player: TournamentPlayer) => {
    if (tournamentPlayers.length >= 4) return;              // max number of players reached
  
    setTournamentPlayers(prev => [
      ...prev,
      {
        username: player.username,
        alias: "",       // alias must start empty
        isSelf: false,   // new player is never the logged-in user
        password: "",    // initializes empty password field
        status: "waiting",
        score: 0,
      },
    ]);
  };

  /* Starts the tournament:
    - Sends tournament + player data to backend
    - Builds an initial bracket with placeholder (TBD) matches
    - Notifies parent via `onTournamentUpdated`
  */

  const handleStartTournament = async () => {
    if (!tournament) return;

  const payload: StartTournamentPayload = {
      tournament_id: tournament.tournament_id,
      players: tournamentPlayers.map(p => ({
        username: p.username,
        alias: p.alias,
        isSelf: p.isSelf,
    })),
  };
    try {
      const res = await fetch(API_PROTOCOL.START_TOURNAMENT.path, {
        method: API_PROTOCOL.START_TOURNAMENT.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start tournament");

      const data: StartTournamentResponse = await res.json();

      if (data.status !== "OK") {
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
    const tournamentState: TournamentState = {
      tournament_id: data.tournament.tournament_id,
      status: "ongoing",
      players: data.tournament.players,
      bracket,
      currentMatch: firstRound[0],
      createdAt: new Date(),
    };

    onTournamentUpdated(tournamentState);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="mt-20">
        <p className="text-gray-300">Select 3 players</p>
      </div>

      <div className="mt-4">
        <PlayerSearch players={allRegisteredPlayers} addedPlayers={tournamentPlayers} onAddPlayer={handleAddPlayer} />
      </div>

      <div className="mt-20">
        <p className="text-gray-300">Players in tournament</p>
      </div>

      <div className="mt-4">
        <PlayerList
          players={tournamentPlayers}
          onUpdatePlayer={handleUpdatePlayer}
          onValidationChange={setCanStart}
          onRemovePlayer={(index) =>
            setTournamentPlayers((prev) => prev.filter((_, i) => i !== index))
          }
        />
      </div>
      <div className="flex gap-4 mt-4">
        <Button
          onClick={onCancel}
          >Cancel tournament
        </Button>

        {canStart && tournamentPlayers.length === 4 && (
          <Button
            onClick={handleStartTournament}
          >
            Start tournament
          </Button>
        )}
      </div>
    </div>
  );
};

export default TournamentSetup;
