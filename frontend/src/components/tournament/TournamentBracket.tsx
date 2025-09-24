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
      <svg width="50" height="40" className="absolute left-1/2 transform -translate-x-1/2 bg-red-200">
        <line x1="1" y1="0" x2="1" y2="40" stroke="#374151" strokeWidth="2" />
      </svg>
    </div>

    {/* Final */}
    <div className="flex justify-center gap-32 relative">
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
          {finalMatch.player1.alias}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
          {finalMatch.player2.alias}
        </div>
      </div>
      
      {/* Horizontal line connecting final players */}
      <svg width="160" height="2" className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-blue-200">
        <line x1="0" y1="1" x2="160" y2="1" stroke="#374151" strokeWidth="2" />
      </svg>
      
      {/* Vertical line down from center */}
      <svg width="2" height="60" className="absolute top-16 left-1/2 transform -translate-x-1/2  bg-green-200">
        <line x1="1" y1="0" x2="1" y2="60" stroke="#374151" strokeWidth="2" />1
      </svg>
    </div>

    <Button
      onClick={() => onStartMatch?.(finalMatch)}
      disabled={!isMatchPlayable(finalMatch, 2)}
      className={
        isMatchPlayable(finalMatch, 2)
          ? "bg-blue-500 text-white hover:bg-blue-600"
          : "bg-gray-500 text-gray-300 cursor-not-allowed"
      }
    >
      Play final
    </Button>

    {/* Lines connecting to Round 1 */}
    <div className="relative w-full flex justify-center">
      <svg width="400" height="60" className="absolute bg-yellow-200">
        {/* Horizontal line across */}
        <line x1="50" y1="30" x2="350" y2="30" stroke="#374151" strokeWidth="2" />
        {/* Vertical lines down to matches */}
        {firstRound.map((_, idx) => {
          const xPos = 50 + (idx * 300 / (firstRound.length - 1));
          return (
            <line key={idx} x1={xPos} y1="30" x2={xPos} y2="60" stroke="#374151" strokeWidth="2" />
          );
        })}
      </svg>
    </div>

    {/* Round 1 Matches */}
    <div className="flex justify-center gap-32 mt-8">
      {firstRound.map((match, idx) => (
        <div key={match.match_id} className="flex flex-col items-center gap-2 relative">
          <div className="flex gap-2">
            <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
              {match.player1.alias}
            </div>
            <div className="p-3 bg-gray-800 text-white rounded-xl w-40 text-center">
              {match.player2.alias}
            </div>
          </div>
          
          {/* Horizontal line connecting the two players in this match */}
          <svg width="166" height="100" className="absolute bg-purple-200">
            <line x1="1" y1="4" x2="166" y2="4" stroke="#374151" strokeWidth="2" />
          </svg>
          
          {/* Vertical line up from center of match */}
          <svg width="2" height="20" className="absoluteleft-1/2 transform -translate-x-1/2 bg-pink-200">
            <line x1="1" y1="0" x2="1" y2="20" stroke="#374151" strokeWidth="2" />
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
