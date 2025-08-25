import React, { useEffect, useState } from "react";

interface Player {
  id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [friends, setFriends] = useState<string[]>([]); // store friend IDs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("http://localhost:3000/leaderboard");
        const data: Player[] = await res.json();
        setPlayers(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleAddFriend = async (playerId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/friends/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: playerId }),
      });

      if (!res.ok) throw new Error("Failed to add friend");

      setFriends((prev) => [...prev, playerId]);
      alert("Friend added!");
    } catch (err) {
      console.error(err);
      alert("Could not add friend");
    }
  };

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
            <th className="border px-2 py-1">Actions</th>
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
                {friends.includes(player.id) ? (
                  <span className="text-gray-500">Friend</span>
                ) : (
                  <button
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleAddFriend(player.id)}
                  >
                    Add Friend
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;