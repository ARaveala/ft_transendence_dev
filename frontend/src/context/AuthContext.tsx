import React, { createContext, useContext, useState, useEffect } from "react";
import  { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile } from "../../shared/payloads";

interface AuthContextType {
	isLoggedIn: boolean;
	user: UserProfile | null; //user is a property of AuthContextType which can be either a UserProfile object or null
	loginUser: (user: UserProfile) => void; // Function to log in user
	logoutUser: () => Promise<void>; // Promise is a JavaScript object representing the eventual completion (or failure) of an asynchronous operation and its resulting value. Without Promise you could not reliably wait for the logout to complete before proceeding with other actions.
	refreshSession: () => Promise<void>; // Function to fetch user profile
	
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // Create context with undefined as default value

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track if user is logged in.
	const [user, setUser] = useState<UserProfile | null>(null); // State to hold user profile or null if not logged in

	// Log the current state whenever it changes
	useEffect(() => {
		console.log("AuthContext state:", { isLoggedIn, user });
	}, [isLoggedIn, user]);  // dependency array ensures it logs every time the state changes
	
	const refreshSession = async () => {
		try {
			const res = await fetch(API_PROTOCOL.GET_PROFILE.path, {
				method: API_PROTOCOL.GET_PROFILE.method,
				credentials: "include", // include cookies in request
			});
			if (res.ok) {
				const data: UserProfile = await res.json();
				setUser(data);
				setIsLoggedIn(true);
			} else {
				setUser(null);
				setIsLoggedIn(false);
			}
		} catch (err) {
			console.error("Failed to refresh session:", err);
			setUser(null);
			setIsLoggedIn(false);
		}
	};

	useEffect(() => {
		refreshSession();

	const interval = setInterval(refreshSession, 5 * 60 * 1000); // Refresh session every 5 minutes
	return () => clearInterval(interval); // Cleanup interval on component unmount;
	}, []);

	const loginUser = (userData: UserProfile) => {
		setUser(userData);
		setIsLoggedIn(true);
	}

	const logoutUser = async () => {
		try {
			// Call backend logout endpoint
			const res = await fetch(API_PROTOCOL.LOGOUT_USER.path, {
				method: API_PROTOCOL.LOGOUT_USER.method,
				credentials: "include", // include cookies in request
			});
			if (!res.ok) throw new Error("Logout failed");

			// Clear user state on successful logout
			setUser(null);
			setIsLoggedIn(false);
		} catch (err) {
			console.error("Logout error:", err);
			throw err; // re-throw error for caller to handle
		}
	};

	return (
		<AuthContext.Provider value={{ isLoggedIn, user, loginUser, logoutUser, refreshSession }}>
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