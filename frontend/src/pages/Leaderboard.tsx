import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { LeaderBoardResponse, LeaderboardEntry, PlayerPayload } from "../../shared/payloads";
import { useTranslation } from "../shared/Translation";
import { useAuth } from "../context/AuthContext";

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { user, refreshSession } = useAuth(); 

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(API_PROTOCOL.GET_LEADERBOARD.path);
        const data: LeaderBoardResponse = await res.json();
        
        if (data.status === 'OK') {
          setPlayers(data.leaders);
          await refreshSession();
          setMsg(("leaderboard.loaded"));
        }
        else {
          setErr(("leaderboard.errorLoading"));
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
        setErr(("leaderboard.errorNetwork"));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

 
  if (loading) return <div className="p-6 text-center text-gray-400">{("leaderboard.loading")}</div>;

return (
  <div className="p-6 max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold mb-4">{("Leaderboard")}</h1>

    {/* Leaderboard section */}
    <section className="mt-6 bg-gray-800/50 rounded-lg border border-gray-700 p-4">
      <h2 className="font-semibold mb-3">{("Players")}</h2>
        <div className="space-y-3">
          {players.map((p) => (
            <div
              key={p.username}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
            >
              {/* Left side: Rank + Avatar + Username + Status */}
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-10 h-10 flex items-center justify-center
                                font-bold text-white-900"
                                > {p.rank}
                </div>
                {/* Avatar */}
                <img
                  src={p.avatar || "/default-avatar.png"}
                  alt={p.username}
                  className="w-10 h-10 rounded-full"
                />

                {/* Username + status */}
                <div>
                  <div className="font-semibold">{p.username}</div>
                  <div className="flex items-center gap-1 text-sm">
                    <span
                      className={
                        "inline-block w-2 h-2 rounded-full " +
                        (p.online_status ? "bg-green-400" : "bg-gray-500")
                      }
                    />
                    <span
                      className={
                        p.online_status ? "text-green-300" : "text-gray-400"
                      }
                    >
                      {p.online_status
                        ? ("online")
                        : ("offline")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right side: Score */}
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-200">
                  {p.score}
                </span>
              </div>
            </div>
          ))}
        </div>
    </section>
  </div>
);
};

export default Leaderboard;