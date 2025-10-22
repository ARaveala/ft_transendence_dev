import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { LeaderBoardResponse, LeaderboardEntry, PlayerPayload } from "../../shared/payloads";
//import { useTranslation } from "../shared/Translation";
//import { useAuth } from "../context/AuthContext";

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(API_PROTOCOL.GET_LEADERBOARD.path);
        const data: LeaderBoardResponse = await res.json();
        
        if (data.status === 'OK') {
          setPlayers(data.leaders);
        }
        else {
          console.error("Leaderboard error:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

 
  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
      <table className="w-full text-left border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Rank</th>
            <th className="border px-2 py-1">Avatar</th>
            <th className="border px-2 py-1">Username</th>
            <th className="border px-2 py-1">Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.username}>
              <td className="border px-2 py-1">{player.rank}</td>
              <td className="border px-2 py-1">
                <img
                  src={player.avatar || "/default-avatar.png"}
                  alt={player.username}
                  className="w-8 h-8 rounded-full"
                />
              </td>
              <td className="border px-2 py-1">{player.username}</td>
              <td className="border px-2 py-1">{player.score}</td>
              <td className="border px-2 py-1">
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;