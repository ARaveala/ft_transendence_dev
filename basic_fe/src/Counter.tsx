import React, { useState } from "react";

type CounterProps = { start?: number };

export default function Counter({ start = 0 }: CounterProps) {
  const [count, setCount] = useState(start);

  return (
    <div className="p-4 border rounded flex items-center gap-4">
      <p className="font-bold">Count: {count}</p>
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => setCount(count + 1)}
      >
        +1
      </button>
    </div>
  );
}