/*
  App.tsx is the root React component of the frontend application. It is the main
  container of the UI. Other components can be  added inside it.
  In a React project, everything on the page is built from components, and 
  App.tsx is the top-level component that gets mounted into the HTML
*/

import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Game from "./pages/GamePage";
import Tournament from "./pages/TournamentLobby";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import Profile from "./pages/ProfilePage";
import Navbar from "./components/layout/Navbar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  // Only show navbar if not on home page
  const showNavbar = location.pathname !== "/";
  return (
    <>
      {showNavbar && <Navbar />}
      <main className="p-6">{children}</main>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/tournament" element={<Tournament />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        </Layout>
    </Router>
  );
}
