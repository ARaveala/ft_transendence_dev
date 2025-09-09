import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Profile from "./Profile";
import Leaderboard from "./Leaderboard";

export default function App() {
  return (
    <Router>
      <nav className="mb-4 space-x-4">
        <Link className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" to="/profile">Profile</Link>
        <Link className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" to="/leaderboard">Leaderboard</Link>
      </nav>

      <main className="border p-4 rounded shadow">
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/" element={<Profile />} /> {/* default route */}
        </Routes>
      </main>
    </Router>
  );
}