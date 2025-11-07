import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";

interface MiniLoginProps {
		gameId:string;
		onLoginSuccess: (player2Token: string) => void;
		onCancel: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;  // 6–12 chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/; // 8–16 chars

const MiniLogin: React.FC<MiniLoginProps> = ({gameId, onLoginSuccess, onCancel }) => {
		const { t } = useTranslation();
		const [username, setUsername] = useState("");
		const [password, setPassword] = useState("");
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		// Field-specific errors
		const [errors, setErrors] = useState<{
			username?: string;
			password?: string;
			general?: string;
		}>({});

		const validateFrontend = () => {
			const newErrors: typeof errors = {};

			if (!USERNAME_REGEX.test(username.trim())) {
				newErrors.username = t("auth.error.usernameFormat");
			}

			if (!PASSWORD_REGEX.test(password.trim())) {
				newErrors.password = t("auth.error.passwordFormat");
			}

			setErrors(newErrors);
			return Object.keys(newErrors).length === 0;
		};

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setErrors({});

			if (!validateFrontend()) {
				setLoading(false);
				return;
			}

		try {
			const res = await fetch("/api/join-game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					gameId,
					type: "login",
					username,
					password,
					mode: "local",
					player_count: 2,
				}),
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				throw new Error(data.error || t("error.auth.miniLoginFailed"));
			}
			
			onLoginSuccess(data.playerToken);
		} catch (err: any) {
			setErrors({ general: err?.message || t("auth.error.secondPlayerLoginFailed") });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md bg-gray-900/90 rounded-xl p-6 text-white shadow-lg">
			<h2 className="text-teal-400 text-2xl font-bold mb-2 text-center">{t("auth.loginAsPlayer2")}</h2>
			<form onSubmit={handleSubmit} className="flex flex-col space-y-4">
				{/* Username */}
				<div>
					<input
						type="text"
						placeholder={t("auth.username")}
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className={`w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400
						${errors.username ? "border-red-500" : "border-gray-700"}
						focus:outline-none focus:ring-2 focus:ring-blue-500`}
					/>
					{errors.username && (
						<p className="text-xs text-red-400 mt-1">{errors.username}</p>
					)}
				</div>
				
				{/* Password */}
				<div>
					<input
						type="password"
						placeholder={t("auth.password")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className={`w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400 
							${errors.password ? "border-red-500" : "border-gray-700"}
							focus:outline-none focus:ring-2 focus:ring-blue-500`}
					/>
					{errors.password && (
						<p className="text-xs text-red-400 mt-1">{errors.password}</p>
					)}
				</div>
				
				{/* Backend error */}
				{errors.general && (
					<div className="text-red-400 text-sm">{errors.general}</div>
				)}

				<div className="flex justify-between items-center">
					<button
						type="submit"
						disabled={loading}
						className="px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
					>
						{loading ? t("auth.loggingIn") : t("auth.logIn")}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
					>
						{t("common.cancel")}
					</button>
				</div>
			</form>
		</div>
	);
};

export default MiniLogin;
