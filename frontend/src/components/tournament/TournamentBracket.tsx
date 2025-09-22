import React from "react";
import type { Tournament, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";

interface TournamentBracketProps {
  tournament: Tournament;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament }) => {
  const bracket: Match[][] = [
    tournament.matches, // first round
    tournament.matches.length > 0
      ? tournament.matches.map(m => ({
          match_id: "tbd",
          player1: { ...TBD_PLAYER },
          player2: { ...TBD_PLAYER },
          winner: { ...TBD_PLAYER },
          status: "pending",
        }))
      : [],
  ];

  return (
    <div className="space-y-4">
       {bracket.map((round, roundIndex) => (
        <div key={roundIndex} className="mb-4">
          <h3 className="font-semibold mb-2">Round {roundIndex + 1}</h3>
          {round.map((match) => (
            <div key={match.match_id} className="p-2 border rounded flex justify-between">
              <span>{match.player1.alias}</span>
              <span>vs</span>
              <span>{match.player2.alias}</span>
              <button className="px-2 py-1 bg-blue-500 text-white rounded">
                Start Match
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TournamentBracket;

