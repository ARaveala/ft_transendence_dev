import React, { useState } from "react";

interface PlayerFormData {
  user_id?: string; // logged-in player only
  username?: string;
  password?: string;
  alias: string;
  confirmed: boolean;
}

interface TournamentSetupFormProps {
  loggedInUserId: string; // pass from parent
  onSubmit: (players: PlayerFormData[]) => void; // callback when all players are ready
}

const TournamentSetupForm: React.FC<TournamentSetupFormProps> = ({
  loggedInUserId,
  onSubmit,
}) => {
  const [players, setPlayers] = useState<PlayerFormData[]>([
    { user_id: loggedInUserId, alias: "", confirmed: false },
    { username: "", password: "", alias: "", confirmed: false },
    { username: "", password: "", alias: "", confirmed: false },
    { username: "", password: "", alias: "", confirmed: false },
  ]);

  // Generic updater for fields
  const updatePlayer = (
    index: number,
    field: keyof PlayerFormData,
    value: string
  ) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Confirm alias (locks input)
  const confirmAlias = (index: number) => {
    if (!players[index].alias.trim()) return; // must have alias
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, confirmed: true } : p))
    );
  };

  // Check if all players confirmed
  const allConfirmed = players.every((p) => p.confirmed);

  // Handle final submit
  const handleSubmit = () => {
    if (!allConfirmed) {
      alert("All players must confirm their alias before starting.");
      return;
    }
    onSubmit(players);
  };

  return (
    <div className="p-6 bg-gray-100 rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Tournament Setup</h2>

      {players.map((player, index) => (
        <div
          key={index}
          className="mb-4 p-4 border rounded bg-white shadow-sm"
        >
          {player.user_id ? (
            <p className="font-semibold mb-2">Logged in Player (You)</p>
          ) : (
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Username"
                value={player.username}
                onChange={(e) =>
                  updatePlayer(index, "username", e.target.value)
                }
                disabled={player.confirmed}
                className="p-2 border rounded w-1/2"
              />
              <input
                type="password"
                placeholder="Password"
                value={player.password}
                onChange={(e) =>
                  updatePlayer(index, "password", e.target.value)
                }
                disabled={player.confirmed}
                className="p-2 border rounded w-1/2"
              />
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Alias"
              value={player.alias}
              onChange={(e) => updatePlayer(index, "alias", e.target.value)}
              disabled={player.confirmed}
              className="p-2 border rounded flex-grow"
            />
            {!player.confirmed && (
              <button
                onClick={() => confirmAlias(index)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            )}
            {player.confirmed && (
              <span className="px-4 py-2 bg-green-500 text-white rounded">
                Confirmed
              </span>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allConfirmed}
        className={`mt-4 px-6 py-2 rounded text-white ${
          allConfirmed
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-gray-400 cursor-not-allowed"
        }`}
      >
        Start Tournament
      </button>
    </div>
  );
};

export default TournamentSetupForm;
