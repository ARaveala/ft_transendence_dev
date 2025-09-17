import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { RegisterUserPayload } from "../../shared/payloads";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
const [isModalOpen, setIsModalOpen] = useState(false); // Tracks if modal is open
const [modalMode, setModalMode] = useState<"login" | "register">("register"); // Mode of modal
const navigate = useNavigate();

const { isLoggedIn, user, loginUser, logoutUser } = useAuth(); // Access authentication state and functions

// Generic form submit handler for registration or login
const handleSubmit = async (data: RegisterUserPayload) => {
	
	const endpoint =
		modalMode === "register" ? API_PROTOCOL.REGISTER_USER : API_PROTOCOL.LOGIN_USER;
	try {
	const res = await fetch(endpoint.path, {
		method: endpoint.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
		credentials: "include", // include cookies in request
	});

	if (!res.ok) {
		const error = await res.json();
		throw new Error(error?.error || "Request failed");
	}

	// //fetch user profile after successful login or registration - currently not working because backend does not return user data
	// const profileRes = await fetch(API_PROTOCOL.GET_PROFILE.path, {
	// 	method: API_PROTOCOL.GET_PROFILE.method,
	// 	credentials: "include",
	// });
	// if (!profileRes.ok) throw new Error("Failed to fetch user profile");

	// const userProfile = await profileRes.json();

	// === Mock profile for development ===
	const userProfile: UserProfile = {
	user_id: "mock-1",
	username: data.username || "PlayerOne",
	avatarFile: "avatars/avatar1.png",
	twoFactor: false,
	rank: 5,
	score: 1200,
	victories: 15,
	losses: 7,
	totalMatches: 22,
	friends: [
		{ id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
		{ id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
	],
	matchHistory: [
		{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
		{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
	],
	};
	loginUser(userProfile); // Update AuthContext with logged-in user

	// Success: notify user, close modal, and update login state

	alert(modalMode === "register" ? "Registration successful!" : "Login successful!");
	setIsModalOpen(false);

	// Redirect to profile if login or registration was successful
	// navigate("/profile");
	} catch (err) {
	alert(err);
	}
};

return (
	<div className="flex flex-col items-center justify-center min-h-screen gap-6">
	<h1 className="text-5xl font-bold">Pong</h1>

	{!isLoggedIn && (
		<div className="flex gap-4">
		<button
			className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
			onClick={() => {
			setModalMode("register");
			setIsModalOpen(true);
			}}
		>
			Register
		</button>

		<button
			className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
			onClick={() => {
			setModalMode("login");
			setIsModalOpen(true);
			}}
		>
			Login
		</button>
		</div>
	)}

	{isLoggedIn && (
		<div className="flex flex-col items-center gap-2">
		<p>Welcome, {user?.username}!</p>
		<button
			className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
			onClick={logoutUser}
		>
			Logout
		</button>
		</div>
	)}

	<Modal
		isOpen={isModalOpen}
		onClose={() => setIsModalOpen(false)}
		onFormSubmit={handleSubmit}
		mode={modalMode}
	/>
	</div>
);
};

export default HomePage;