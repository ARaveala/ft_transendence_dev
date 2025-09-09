import React from "react";

const players = [
  { username: "PlayerOne", score: 1200 },
  { username: "PlayerTwo", score: 1100 },
  { username: "PlayerThree", score: 950 },
];

export default function Leaderboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
      <ul className="space-y-1">
        {players.map((p, i) => (
          <li key={i} className="p-2 border rounded hover:bg-gray-100">
            {p.username} - {p.score}
          </li>
        ))}
      </ul>
    </div>
  );
}