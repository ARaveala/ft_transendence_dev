import defaultAvatar from "../assets/avatars/default-avatar.png";
import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, UpdateProfilePayload } from "../../shared/payloads";
import { useAuth } from "../context/AuthContext";


const Profile: React.FC = () => {
const { user, isLoggedIn, refreshSession } = useAuth();
const [twoFactor, setTwoFactor] = useState(user?.twoFactor ?? false);
const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarFile || defaultAvatar);
const [updating, setUpdating] = useState(false);

useEffect(() => { //changed to using the user info from AuthContext
	if (user) {
	setTwoFactor(user.twoFactor);
	setSelectedAvatar(user.avatarFile || defaultAvatar);
	}
}, [user]);

// Handle updating avatar and 2FA preference
const handleUpdate = async () => {
	if (!user) return;

	const payload: UpdateProfilePayload = {
	twoFactor,
	avatar: selectedAvatar,
	};

	try {
	setUpdating(true);
	const res = await fetch(API_PROTOCOL.UPDATE_PROFILE.path, {
		method: API_PROTOCOL.UPDATE_PROFILE.method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
		credentials: "include",
	});

	if (!res.ok) throw new Error("Update failed");

	alert("Profile updated successfully!");
	await refreshSession(); // ✅ Update user data in AuthContext
	} catch (err) {
	console.error(err);
	alert("Failed to update profile.");
	} finally {
	setUpdating(false);
	}
};

if (!isLoggedIn) return <div>Please log in to view your profile.</div>;
if (!user) return <div>Loading profile...</div>;

return (
	<div className="p-6 max-w-4xl mx-auto">
	<h1 className="text-3xl font-bold mb-4">Profile</h1>

	{/* Avatar and username */}
	<div className="flex items-center gap-4 mb-4">
		<img
		src={selectedAvatar || defaultAvatar}
		alt="Avatar"
		className="w-24 h-24 rounded-full"
		/>
		<div>
		<h2 className="text-xl font-semibold">{user.username}</h2>
		</div>
	</div>

	{/* Settings */}	
	<div className="mb-6">
		<label className="flex items-center gap-2">
		<input
			type="checkbox"
			checked={twoFactor}
			onChange={() => setTwoFactor(!twoFactor)}
		/>
		Enable 2FA via Email
		</label>

	</div>

	<button
		onClick={handleUpdate}
		disabled={updating}
		className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
		>
		{updating ? "Saving..." : "Save Changes"}
	</button>

	{/* Stats */}
	<div className="mt-6">
		<h3 className="font-semibold">Stats</h3>
		<p>Rank: {user.rank}</p>
		<p>Score: {user.score}</p>
		<p>
		Victories: {user.victories} | Losses: {user.losses} | Matches:{" "}
		{user.totalMatches}
		</p>
	</div>

	{/* Friends */}  
	{/* <div className="mb-6"> //removed as we have a dedicated Friends page
		<h3 className="font-semibold">Friends</h3>
		<ul>
		{profile.friends.map((friend) => (
			<li key={friend.user_id} className="flex items-center gap-2">
			<img
				src={friend.avatar || "/default-avatar.png"}
				className="w-8 h-8 rounded-full"
				alt={friend.username}
			/>
			{friend.username}
			</li>
		))}
		</ul>
	</div> */} 


	{/* Match History */}
	<div className="mt-6">
		<h3 className="font-semibold">Match History</h3>
		<table className="w-full text-left border">
		<thead>
			<tr>
			<th className="border px-2 py-1">Opponent</th>
			<th className="border px-2 py-1">Result</th>
			<th className="border px-2 py-1">Score</th>
			<th className="border px-2 py-1">Time</th>
			</tr>
		</thead>
		<tbody>
			{user.matchHistory.map((match) => (
			<tr key={match.id}>
				<td className="border px-2 py-1">{match.opponent}</td>
				<td className="border px-2 py-1">{match.result}</td>
				<td className="border px-2 py-1">{match.score}</td>
				<td className="border px-2 py-1">{match.timestamp}</td>
			</tr>
			))}
		</tbody>
		</table>
	</div>
	</div>
);
};

export default Profile;