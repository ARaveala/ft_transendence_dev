import React, { useState } from "react";

interface MiniLoginProps {
		gameId:string;
		onLoginSuccess: (player2Token: string) => void;
		onCancel: () => void;
}

const MiniLogin: React.FC<MiniLoginProps> = ({gameId, onLoginSuccess, onCancel }) => {
		const [username, setUsername] = useState("");
		const [password, setPassword] = useState("");
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		const [localError, setLocalError] = useState<string | null>(null);
		const [backendError, setBackendError] = useState<string | null>(null);

		const handleSubmit = async (e: React.FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setLocalError(null);
			setBackendError(null);

			if (!username.trim() || !password.trim()) {
						setLocalError("Username and password are required.");
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
				throw new Error(data.error || "Mini login failed");
			}
			
			onLoginSuccess(data.playerToken);
		} catch (err: any) {
				setBackendError(err?.message || "Mini login failed");
		} finally {
				setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-md bg-gray-900/90 rounded-xl p-6 text-white shadow-lg">
			<h2 className="text-teal-400 text-2xl font-bold mb-5 text-center mt-1"
			>
				Log in as Player 2
			</h2>
			{error && <div className="mb-2 text-red-500">{error}</div>}
			<form onSubmit={handleSubmit} className="flex flex-col space-y-4">
				<div>
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					{localError && !username.trim() && (
					<p className="text-xs text-red-400 mt-1">{localError}</p>
						)}
				</div>
				
				<div>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
					{(backendError || (localError && username.trim())) && (
						<p className="text-xs text-red-400 mt-1">
							{backendError || localError}</p>
					)}
				</div>

				<div className="flex justify-between items-center">
					<button
						type="submit"
						disabled={loading}
						className="px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
					>
						{loading ? "Logging in..." : "Log in"}
					</button>
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
};

export default MiniLogin;

