import React, { useState } from "react";
import TournamentHeader from "../components/tournament/TournamentHeader";
import TournamentBracket from "../components/tournament/TournamentBracket";
import TournamentSetup from "../components/tournament/TournamentSetup";
import type { Tournament } from "../types/tournament";
import Button from "../components/ui/Button";

const TournamentLobby: React.FC = () => {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const handleTournamentStarted = (newTournament: Tournament) => {
    setTournament(newTournament);
    setShowSetup(false); // hide setup after tournament starts
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <TournamentHeader />

      {!tournament && !showSetup && (
        <div className="flex flex-col items-center mt-8">
          <Button
            onClick={() => setShowSetup(true)}>
            Start a new tournament
          </Button>
        </div>
      )}

      {!tournament && showSetup && (
        <TournamentSetup onTournamentStarted={handleTournamentStarted}
        onCancel={() => setShowSetup(false)} />
      )}

      {tournament && <TournamentBracket tournament={tournament} />}
    </div>
  );
};

export default TournamentLobby;
