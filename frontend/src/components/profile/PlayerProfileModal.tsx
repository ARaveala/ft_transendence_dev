import React, { useState, useEffect } from "react";
import defaultAvatar from "../../assets/avatars/default-avatar.png";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { OtherUserProfilePayload, OtherUserProfileResponse } from "../../../shared/payloads";

type PlayerProfileModalProps = {
	userId: string;
	onClose: () => void;
};

const handleFetchOtherUser = async (userId: string) => {
	try {
		const url = new URL(API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.path, window.location.origin);
		url.searchParams.append("user_id", userId);
		console.log("Other user iD:", userId);

		const res = await fetch(url.toString(), {
		method: API_PROTOCOL.GET_OTHER_PLAYER_PROFILE.method,
		credentials: 'include',
		});

		if (!res.ok) {
			throw new Error(`HTTP error ${res.status}`);
		}

		const data: OtherUserProfileResponse = await res.json();
		console.log("📦 Other player profile response:", data);
		return data;
	} catch (err) {
		console.error("Error fetching other player profile:", err);
		return null;
	}
};

const fmt = (ts: string) => {
		if (!ts) return "-";
		const dateUtc = new Date(ts.replace(" ", "T") + "Z");

		if (isNaN(dateUtc.getTime())) return ts;

		// Convert to Helsinki time
		const helsinki = new Date(
			dateUtc.toLocaleString("en-US", { timeZone: "Europe/Helsinki" })
		);

		// Format manually as D-M-YYYY HH:MM:SS
		const day = helsinki.getDate();
		const month = helsinki.getMonth() + 1;
		const year = helsinki.getFullYear();
		const hours = helsinki.getHours().toString().padStart(2, "0");
		const minutes = helsinki.getMinutes().toString().padStart(2, "0");
		const seconds = helsinki.getSeconds().toString().padStart(2, "0");

		return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default function PlayerProfileModal({ userId, onClose }: PlayerProfileModalProps) {
	const [profile, setProfile] = useState<OtherUserProfileResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	
	useEffect(() => {
		let active = true;

		handleFetchOtherUser(userId).then((data) => {
			if (!active)
				return;

			if (!data) {
				setError("Failed to load profile");
				setLoading(false);
				return;
			}

			setProfile(data);
			setLoading(false);
		});
		return () => { 
			active = false;
		};
	}, [userId]);


	if (loading)
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white text-lg">
				Loading profile…
			</div>
		);

	if (error || !profile)
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm text-white text-lg">
				{error || "Unable to load profile"}
			</div>
		);

	const matches = Array.isArray(profile.matchHistory) ? [...profile.matchHistory] : [];
	
	matches.sort((a: any, b: any) => {
	const ta = new Date(a.timestamp.replace(" ", "T") + "Z").getTime();
	const tb = new Date(b.timestamp.replace(" ", "T") + "Z").getTime();
	return tb - ta;
});

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center 
						bg-black/70 backdrop-blur-sm"
			onClick={onClose}
			>
			<div
				onClick={(e) => e.stopPropagation()}
				className="
					w-full max-w-2xl rounded-xl shadow-xl border border-gray-700/60 bg-gray-900/95 p-6 animate-[fadeIn_0.2s_ease]"
				>
				{/* Close button */}
				<button
					onClick={onClose}
					className="float-right text-gray-400 hover:text-white text-xl"
				>
					✕
				</button>

				{/* Player Header */}
				<div className="flex items-center gap-5 mb-6">
					<div className="rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-emerald-500">
						<img
							src={profile.avatarFile || defaultAvatar}
							className="h-24 w-24 rounded-full object-cover ring-2 ring-black/30"
							onError={(e) => (e.currentTarget.src = defaultAvatar)}
						/>
					</div>

					<div>
						<h2 className="text-2xl font-bold tracking-tight">{profile.username}</h2>

						<div className="mt-3 flex items-center flex-wrap gap-2">
							<span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-sm text-gray-200">
								<span className="text-gray-400">Rank</span>
								<span className="font-semibold">{profile.rank}</span>
							</span>

							<span className="inline-flex items-center gap-1 rounded-full border border-gray-700 bg-gray-800/70 px-3 py-1 text-sm text-gray-200">
								<span className="text-gray-400">Score</span>
								<span className="font-semibold">{profile.score}</span>
							</span>
						</div>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
					<Stat label="Victories 🏅" value={profile.victories} />
					<Stat label="Losses 💣" value={profile.losses} />
					<Stat label="Matches 🕹️" value={profile.totalMatches} />
				</div>

				{/* Match history */}
				<div className="rounded-lg border border-gray-700 bg-gray-800/40 p-4 max-h-64 overflow-auto">
					<h3 className="font-semibold mb-2">Match History</h3>

					{(!profile.matchHistory || profile.matchHistory.length === 0) ? (
						<div className="text-gray-400">No match history available.</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-left border border-gray-700 rounded-lg">
								<thead className="bg-gray-800/50">
									<tr>
										<th className="px-3 py-2 text-sm font-semibold">Opponent</th>
										<th className="px-3 py-2 text-sm font-semibold">Result</th>
										<th className="px-3 py-2 text-sm font-semibold">Score</th>
										<th className="px-3 py-2 text-sm font-semibold">Time</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-700">
									{matches.slice(0, 10).map((m, idx) => {
										const result = (m.result || "").toLowerCase();
										const resultClass =
											result === "win" ? "text-emerald-400" :
											result === "loss" ? "text-rose-400" :
											"text-gray-300";

									return (
										<tr key={`${m.opponent}-${m.timestamp}-${idx}`} className="border-t border-gray-700">
											<td className="px-3 py-2 text-sm">{m.opponent}</td>
											<td className={`px-3 py-2 text-sm ${resultClass}`}>
												{result ? result.charAt(0).toUpperCase() + result.slice(1) : "-"}
											</td>
											<td className="px-3 py-2 text-sm">{m.score}</td>
											<td className="px-3 py-2 text-sm">{fmt(m.timestamp)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					)}
				</div>
			</div>
		</div>
	);}

	/* Small stat card matching profile */
	function Stat({ label, value } : { label: string; value: React.ReactNode }) {
		return (
			<div className="rounded-lg border border-gray-700 p-4 bg-gray-800/40">
				<div className="text-sm text-gray-400">{label}</div>
				<div className="text-2xl font-semibold">{value}</div>
			</div>
		);
	}