import React from "react";
import type { Tournament } from "../../types/tournament";

interface TournamentBracketProps {
  tournament: Tournament;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournament }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Tournament Bracket</h2>
      {tournament.matches.length === 0 ? (
        <p>No matches yet.</p>
      ) : (
        <div className="space-y-2">
          {tournament.matches.map((match) => (
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
      )}
    </div>
  );
};

export default TournamentBracket;

