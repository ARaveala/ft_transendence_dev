/*
  Root React component of the frontend application. It is the main
  container of the UI. Other components can be  added inside it.
  In a React project, everything on the page is built from components, and 
  App.tsx is the top-level component that gets mounted into the HTML
*/

import React from "react";

// Import React Router utilities for navigation
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

// Import page components
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Game from "./pages/GamePage";
import Tournament from "./pages/TournamentLobby";
import Leaderboard from "./pages/Leaderboard";
import Friends from "./pages/Friends";
import Profile from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

// Import shared layout components
import Navbar from "./components/layout/Navbar";
// Translation
import { TranslationProvider } from "./shared/Translation";

// Import AuthContext to manage user authentication state
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Layout wrapper component
// - Shows the Navbar unless user is on the LandingPage ("/")
// - Wraps page content inside <main>
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn } = useAuth(); // get login status

  // Show navbar if user is logged in OR if not on landing page
  const showNavbar = isLoggedIn || location.pathname !== "/";

  return (
    <>
      {showNavbar && <Navbar />}
      <main className="p-6">{children}</main>
    </>
  );
};

// App component
// - Wraps everything in <Router> to enable client-side routing
// - Defines all application routes and maps them to page components
export default function App() {
  return (
    <AuthProvider>
		<Router>
			<TranslationProvider>
		<Layout>
			<Routes>
			<Route path="/" element={<LandingPage />} />
			<Route path="/home" element={<HomePage />} />
			<Route path="/game" element={<Game />} />
			<Route path="/tournament" element={<Tournament />} />
			<Route path="/leaderboard" element={<Leaderboard />} />
			<Route path="/friends" element={<Friends />} />
			<Route path="/profile" element={<Profile />} />
			<Route path="/settings" element={<SettingsPage />} />
			</Routes>
			</Layout>
			</TranslationProvider>
		</Router>
	</AuthProvider>  
	    );
	}
