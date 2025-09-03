import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="p-4 bg-gray-800 flex gap-4">
      <Link to="/" className="hover:underline">Home</Link>
      <Link to="/game" className="hover:underline">Game</Link>
      <Link to="/tournament" className="hover:underline">Tournament</Link>
      <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
      <Link to="/friends" className="hover:underline">Friends</Link>
      <div className="ml-auto flex gap-4">
        <Link to="/profile" className="hover:underline">Profile</Link>
        <Link to="/exit" className="hover:underline">Exit</Link>
      </div>
    </nav>
  );
};

export default Navbar;
