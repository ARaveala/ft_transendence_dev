import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import  { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile } from "../../shared/payloads";
import type { TournamentState } from "../types/tournament";

interface AuthContextType {
	isLoggedIn: boolean;
	user: UserProfile | null; //user is a property of AuthContextType which can be either a UserProfile object or null
	tournament: TournamentState | null;
	loginUser: (user: UserProfile) => void; // Function to log in user
	logoutUser: () => Promise<void>; // Promise is a JavaScript object representing the eventual completion (or failure) of an asynchronous operation and its resulting value. Without Promise you could not reliably wait for the logout to complete before proceeding with other actions.
	setTournament: React.Dispatch<React.SetStateAction<TournamentState | null>>;
	refreshSession: () => Promise<void>; // Function to fetch user profile
	loading: boolean; // Optional loading state
	
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // Create context with undefined as default value

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track if user is logged in.
	const [user, setUser] = useState<UserProfile | null>(null); // State to hold user profile or null if not logged in
	const [tournament, setTournament] = useState<TournamentState | null>(null);
	const [loading, setLoading] = useState(true); // State to track loading status
	const [refreshing, setRefreshing] = useState(false); // State to track if session is being refreshed

	// // Log the current state whenever it changes
	// useEffect(() => {
	// 	console.log("AuthContext state:", { isLoggedIn, user });
	// }, [isLoggedIn, user]);  // dependency array ensures it logs every time the state changes
	
	const refreshSession = useCallback(async () => {
		setRefreshing(true); 
		try {
			const res = await fetch(API_PROTOCOL.GET_PROFILE.path, {
				method: API_PROTOCOL.GET_PROFILE.method,
				credentials: "include", // include cookies in request
			});
			if (res.ok) {
				const data: UserProfile = await res.json();
				setUser(data);
				setIsLoggedIn(true);

				 if (data.tournament && 
					typeof data.tournament === 'object' && 
					data.tournament.tournament_id) {
					setTournament(data.tournament);
				} else {
					setTournament(null);
				}
			} else {
				setUser(null);
				setIsLoggedIn(false);
				setTournament(null);
			}
		} catch (err) {
			console.error("Failed to refresh session:", err);
			setUser(null);
			setIsLoggedIn(false);
			setTournament(null);
		}
		finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []); 

	useEffect(() => { // On component mount, check if user is logged in by fetching profile	
		refreshSession();

		const interval = setInterval(() => {
			if (isLoggedIn)
				refreshSession(); // periodically refresh session if logged in
			}, 5 * 60 * 1000); // every 5 minutes
			
		return () => clearInterval(interval); // cleanup on unmount
	}, []); // Empty dependency array means this runs once on mount

	const loginUser = (userData: UserProfile) => {
		setUser(userData);
		setIsLoggedIn(true);
		setLoading(false);
	}

	// Logout function to clear user state and call backend logout endpoint
	const logoutUser = async () => {
		try {
			// Call backend logout endpoint
			const res = await fetch(API_PROTOCOL.LOGOUT_USER.path, {
				method: API_PROTOCOL.LOGOUT_USER.method,
				credentials: "include", // include cookies in request
			});
		} catch (err) {
			console.error("Logout error:", err);
			throw err; // re-throw error for caller to handle
		}
		finally {
			setUser(null);
			setIsLoggedIn(false);
			setTournament(null);
		}
	};

	return (
		<AuthContext.Provider value={{ isLoggedIn, user, tournament, setTournament, loading, loginUser, logoutUser, refreshSession }}>
			{children}	
		</AuthContext.Provider>
	);

};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
