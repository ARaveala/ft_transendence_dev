import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { RegisterUserPayload } from "../../shared/payloads";
import { useAuth } from "../context/AuthContext";
import CenteredContainer from "../components/layout/CenteredContainer"; // <-- Import it
import { useTranslation } from "../shared/Translation";

const LanguageToggle: React.FC<{ compact?: boolean }> = ({ compact = true }) => {
	const { t, setLang } = useTranslation();
	const { isLoggedIn } = useAuth();

	async function changeLang(code: "en" | "fi" | "sv") {
		setLang(code);

		if (isLoggedIn) {
			try {
				await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
					method: API_PROTOCOL.CHANGE_LANGUAGE.method,
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ language: code }),
				});
			} catch {}
		}
	}

	const Btn = ({
		code,
		label,
		flag,
	}: {
		code: "en" | "fi" | "sv";
		label: string;
		flag: string;
	}) => (
		<button
			type="button"
			onClick={() => changeLang(code)}
			aria-label={label}
			className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700"
		>
			<span className="text-xl">{flag}</span>
			{!compact && <span className="text-sm">{label}</span>}
		</button>
	);

	return (
		<div className="flex items-center gap-2">
			<Btn code="en" label={t("lang.english")} flag="🇬🇧" />
			<Btn code="fi" label={t("lang.finnish")} flag="🇫🇮" />
			<Btn code="sv" label={t("lang.swedish")} flag="🇸🇪" />
		</div>
	);
};

const HomePage: React.FC = () => {
	const { t, lang } = useTranslation();
	const [isModalOpen, setIsModalOpen] = useState(false); // Tracks if modal is open
	const [modalMode, setModalMode] = useState<"login" | "register">("register"); // Mode of modal
	const navigate = useNavigate();
	const { isLoggedIn, user, refreshSession } = useAuth(); // Access authentication state and functions

	//2FA states
	const [is2faStep, setIs2faStep] = useState(false);
	const [tempAuthToken, setTempAuthToken] = useState<string | null>(null);
	const [otp, setOtp] = useState("");

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

		if (res.status === 202) {
            // if 2FA is required we get 202
            const responseData = await res.json();
            setTempAuthToken(responseData.tempAuthToken);
            setIsModalOpen(false); // close login modal
            setIs2faStep(true);   // show 2FA modal
            return;
    	}

		if (!res.ok) {
			const error = await res.json();
			throw new Error(error?.error || "Request failed");
		}

		try {
			await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
				method: API_PROTOCOL.CHANGE_LANGUAGE.method,
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ language: lang }),
			});
		} catch (_) {}
		await refreshSession(); // New approach: refresh session to get user profile

		// //fetch user profile after successful login or registration - currently not working because backend does not return user data
		//await new Promise((resolve) => setTimeout(resolve, 1000)); // short delay

		// const profileRes = await fetch(API_PROTOCOL.GET_PROFILE.path, {
		// 	method: API_PROTOCOL.GET_PROFILE.method,
		// 	credentials: "include"
		//  });

	 	//console.log("Profile fetch response status:", profileRes.status);
		//if (!profileRes.ok) throw new Error("Failed to fetch user profile");

		// const userProfile = await profileRes.json();
		// console.log("Fetched user profile:", userProfile);
	
		 // === Mock profile for development ===
		//const userProfile: UserProfile = {
		//user_id: "mock-1",
		//username: data.username || "PlayerOne",
		//avatarFile: "avatars/avatar1.png",
		//twoFactor: false,
		//rank: 5,
		//score: 1200,
		//victories: 15,
		//losses: 7,
		//totalMatches: 22,
		//friends: [
		//	{ id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
		//	{ id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
		//],
		//matchHistory: [
		//	{ id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
		//	{ id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
		//],
		//};

		//loginUser(userProfile); // Update AuthContext with logged-in user. Removed as we are using refreshSession()	

		//Success: notify user, close modal, and update login state

		alert(
			modalMode === "register" 
			? t("home.alert.registerSuccess")
			: t("home.alert.loginSuccess")
		);
		setIsModalOpen(false);

		// Redirect to profile if login or registration was successful
		// navigate("/profile");
		} catch (err) {
		alert(err);
		}
	};

	const handle2faVerifySubmit = async () => {
        if (!tempAuthToken || otp.length !== 6) {
            alert(t("home.2fa.codeInvalid"));
            return;
        }

        try {
            const res = await fetch('/api/2fa/login-verify', { // new endpoint for 2FA login
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp, tempAuthToken }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || "2FA verification failed.");
            }

			try {
				await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
					method: API_PROTOCOL.CHANGE_LANGUAGE.method,
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ language: lang }),
				});
			} catch (_) {}

            await refreshSession();
            alert(t("home.alert.loginSuccess"));
            setIs2faStep(false); // hide 2FA modal
            setOtp("");
            setTempAuthToken(null);

        } catch (err) {
            alert(err);
        }
    };

	return (
		<CenteredContainer> 
		{/* Semi-transparent card wrapper for Home page content */}
        <div className="w-full max-w-md bg-gray-900/90 rounded-xl p-8 text-white shadow-2xl flex flex-col items-center space-y-8">
			{/* Language flags */}
			{!isLoggedIn && (
				<div className="w-full flex justify-end">
					<LanguageToggle compact />
				</div>
			)}

			<h1 className="text-5xl font-bold">{t("home.title")}</h1>

			{!isLoggedIn && (
				<div className="flex gap-4">
					<button
						className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						onClick={() => {
							setModalMode("register");
							setIsModalOpen(true);
						}}
					>
						{t("home.cta.register")}
					</button>

					<button
						className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
						onClick={() => {
							setModalMode("login");
							setIsModalOpen(true);
						}}
					>
						{t("home.cta.login")}
					</button>
				</div>
			)}

			{isLoggedIn && (
				<div className="flex flex-col items-center gap-2">
					<p id="welcome">
						{t("home.greeting")}, {user?.username}!
						<span aria-hidden="true"> 🏓</span>
					</p>
				</div>
			)}
	</div>

	<Modal
		isOpen={isModalOpen}
		onClose={() => setIsModalOpen(false)}
		onFormSubmit={handleSubmit}
		mode={modalMode}
	/>
	{is2faStep && (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
			<div className="bg-white p-6 rounded-lg shadow-xl text-black">
				<h2 className="text-xl font-bold mb-4">Enter Verification Code</h2>
				<p className="mb-4">Open your authenticator app and enter the 6-digit code.</p>
				<input
					type="text"
					value={otp}
					onChange={(e) => setOtp(e.target.value)}
					className="w-full p-2 border rounded-md text-center text-2xl tracking-widest text-black"
                    maxLength={6}
					placeholder="123456"
				/>
				<button
					onClick={handle2faVerifySubmit}
					className="w-full mt-4 px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
				>
					Verify
                </button>
				<button
					onClick={() => setIs2faStep(false)}
					className="w-full mt-2 px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
				>
                Cancel
            </button>
			</div>
		</div>
	)}
	</CenteredContainer> 
);
};

export default HomePage;
