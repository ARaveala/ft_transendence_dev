import React from "react";
import type { Tournament, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";
import Button from "../ui/Button";

interface TournamentBracketProps {
  tournament: Tournament;
  onStartMatch?: (match: Match) => void;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament, onStartMatch }) => {
  const firstRound = tournament.matches; // 2 matches with 4 players

  // Final match placeholder (between the 2 winners of round 1)
  const finalMatch: Match = {
    match_id: "final",
    player1: firstRound[0]?.winner ?? { ...TBD_PLAYER },
    player2: firstRound[1]?.winner ?? { ...TBD_PLAYER },
    winner: { ...TBD_PLAYER },
    status: "pending",
  };

  const isMatchPlayable = (match: Match, round: number): boolean => {
    if (round === 1) return true; // round 1 always playable
    // final match only playable if both winners exist
    return (
      match.player1.user_id !== TBD_PLAYER.user_id &&
      match.player2.user_id !== TBD_PLAYER.user_id
    );
  };

  return (
  <div className="flex flex-col items-center mt-10 gap-8 relative">
    {/* Winner */}
    <div className="flex flex-col items-center">
      <h3 className="font-bold text-lg mb-2">Winner</h3>
      <div className="p-3 bg-yellow-500 text-black font-semibold rounded-xl w-40 text-center">
        {finalMatch.winner?.alias ?? "TBD"}
      </div>
    </div>

    {/* Line from Winner to Final */}
    <div className="relative">
      <svg width="2" height="86" className="absolute -top-8 left-1/2">
            <line x1="1" y1="0" x2="1" y2="86" stroke="#374151" strokeWidth="2" />
          </svg>
    </div>

    {/* Final */}
    <div className="flex flex-col items-center gap-2 relative">
      <div className="relative flex justify-center gap-72 items-center">
        <div className="flex flex-col items-center gap-2 relative">
          <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
            {finalMatch.player1.alias}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 relative">
          <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
            {finalMatch.player2.alias}
          </div>
        </div>
      
        {/* Horizontal line connecting final players */}
        <svg width="290" height="20" className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <line x1="0" y1="1" x2="290" y2="1" stroke="#374151" strokeWidth="2" />
        </svg>
      
        {/* Vertical line down from final player1 center */}
        <svg width="2" height="50" className="absolute top-12 left-20">
          <line x1="1" y1="0" x2="1" y2="50" stroke="#374151" strokeWidth="2" />
        </svg>
        {/* Vertical line down from final player2 center */}
        <svg width="2" height="50" className="absolute top-12 right-20">
          <line x1="1" y1="0" x2="1" y2="50" stroke="#374151" strokeWidth="2" />
        </svg>
    </div>

      <Button
        onClick={() => onStartMatch?.(finalMatch)}
        disabled={!isMatchPlayable(finalMatch, 2)}
        className={
          (isMatchPlayable(finalMatch, 2)
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-gray-500 text-gray-300 cursor-not-allowed") + " -mt-6"
        }
      >
        Play final
      </Button>
    </div>

    {/* Round 1 Matches */}
    <div className="flex justify-center gap-28 mt-8">
      {firstRound.map((match, idx) => (
        <div key={match.match_id} className="flex flex-col items-center gap-6 relative">
          <div className="flex gap-3">
            <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
              {match.player1.alias}
            </div>
            <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
              {match.player2.alias}
            </div>
          </div>
          
          {/* Horizontal line connecting players */}
          <svg width="170" height="3" className="absolute -top-14 left-20">
            <line x1="0" y1="1" x2="170" y2="1" stroke="#374151" strokeWidth="2" />
          </svg>

          {/* Vertical line up from first players */}
          <svg width="2" height="56" className="absolute -top-14 left-20">
            <line x1="1" y1="0" x2="1" y2="56" stroke="#374151" strokeWidth="2" />
          </svg>
          {/* Vertical line up from second players */}
          <svg width="2" height="56" className="absolute -top-14 right-20">
            <line x1="1" y1="0" x2="1" y2="56" stroke="#374151" strokeWidth="2" />
          </svg>

          <Button
            onClick={() => onStartMatch?.(match)}
            disabled={!isMatchPlayable(match, 1)}
            className={
              isMatchPlayable(match, 1)
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-500 text-gray-300 cursor-not-allowed"
            }
          >
            Play match {idx + 1}
          </Button>
        </div>
      ))}
    </div>
  </div>
);
}
export default TournamentBracket;