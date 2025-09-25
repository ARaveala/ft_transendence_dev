// Fetches all registered players from backend and stores them in allPlayers state
// Holds a state of all players
// Updates player data when child component changes something
// Tracks validation of alias, password
// Handles "Start tournament" 

import React, { useEffect, useState } from "react";
import PlayerList from "./PlayerList";
import { PlayerSearch } from "./PlayerSearch";
import type { TournamentPlayer, Tournament, Match } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { TBD_PLAYER } from "../../../shared/constants";
import { PlayerSearchRequest, PlayerSearchResponse, StartTournamentResponse } from '../../../shared/payloads';
import Button from "../ui/Button";

interface TournamentSetupProps {
  onTournamentStarted: (tournament: Tournament) => void;
  onCancel: () => void;
}

const TournamentSetup: React.FC<TournamentSetupProps> = ({ onTournamentStarted, onCancel }) => {
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([
    { user_id: "current",
      username: "currentUser",
      alias: "",
      status: "waiting",
      score: 0,
      isSelf: true },
  ]);
  const [allRegisteredPlayers, setAllRegisteredPlayers] = useState<TournamentPlayer[]>([]);
  const [canStart, setCanStart] = useState(false);

  // Fetch all registered players from backend
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const fullUrl = API_PROTOCOL.GET_ALL_REGISTERED_PLAYERS.path;
        const res = await fetch(fullUrl);
        
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json() as PlayerSearchResponse;
        setAllRegisteredPlayers(data.players || []);
      } catch (err) {
        console.error(err);
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

  // Add a registered player to the tournament
  const handleAddPlayer = (player: TournamentPlayer) => {
    if (tournamentPlayers.length >= 4) return;
    if (tournamentPlayers.some((p) => p.user_id === player.user_id)) return;

    setTournamentPlayers((prev) => [
      ...prev,
      {
        ...player,
        isSelf: false,   // new players are never the logged-in user
        password: "",    // initialize empty password field
        alias: "",       // ensure alias starts empty
        status: "waiting",
      },
    ]);
  };

  const handleStartTournament = async () => {
    const payload = tournamentPlayers.map(p => ({
      username: p.username,
      alias: p.alias,
      password: p.isSelf ? undefined : p.password,
      isSelf: p.isSelf
    }));

    try {
      const res = await fetch(API_PROTOCOL.START_TOURNAMENT.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to start tournament");

      const data: StartTournamentResponse = await res.json();

      if (data.status !== "OK") {
        console.error("Tournament start error:", data.error);
        return;
      }

  const firstRound = data.matches;

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

    const tournament: Tournament = {
      tournament_id: data.tournament_id,
      players: data.players,
      matches: firstRound,
      status: "ongoing",
      bracket,
      currentMatch: firstRound[0],
      createdAt: new Date(),
    };

    onTournamentStarted(tournament);
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
        <PlayerSearch players={allRegisteredPlayers} onAddPlayer={handleAddPlayer} />
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
