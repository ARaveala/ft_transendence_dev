import React from "react";
import Counter from "./Counter";

export default function Profile() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">PlayerOne</h1>
      <p className="mb-1">Score: 1200</p>
      <p>Wins: 15 | Losses: 7</p>

      <div className="mt-4 space-y-4">
        <h2 className="font-semibold">Your counters:</h2>
        <Counter start={0} />
        <Counter start={10} />
        <Counter start={20} />
		<Counter start={30} />
      </div>
    </div>
  );
}