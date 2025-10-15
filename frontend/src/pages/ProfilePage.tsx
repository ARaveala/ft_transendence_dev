import defaultAvatar from "../assets/avatars/default-avatar.png";
import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, UpdateTwoFactorAuthPayload, UpdateTwoFactorAuthResponse } from "../../shared/payloads";

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(API_PROTOCOL.GET_PROFILE.path, {
        credentials: "include", // send HttpOnly cookie
        });
        const data: UserProfile = await res.json();

        if (!data.avatarFile) {
          data.avatarFile = defaultAvatar;
        }

        setProfile(data);
        setTwoFactor(data.twoFactor);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, []);

  // Handle updating 2FA preference
  const handle2FAUpdate = async () => {
    if (!profile) return;

    const payload: UpdateTwoFactorAuthPayload = { twoFactor };

    try {
      const res = await fetch(API_PROTOCOL.UPDATE_2FA.path, {
        method: API_PROTOCOL.UPDATE_2FA.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        //credentials: "include", // for HttpOnly cookie
      });

      const data: UpdateTwoFactorAuthResponse = await res.json();
	  
      if (data.status === "UPDATED") {
        alert("2FA settings updated successfully!");
        setProfile(prev => prev ? { ...prev, twoFactor } : prev);
    
      } else {
        console.error(data.error);
        alert("Failed to update 2FA settings");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update 2FA settings");
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>

      {/* Avatar and username */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={profile.avatarFile || defaultAvatar}
          alt="Avatar"
          className="w-24 h-24 rounded-full"
        />
        <div>
          <h2 className="text-xl font-semibold">{profile.username}</h2>
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

      {/* Stats */}
      <div className="mb-6">
        <h3 className="font-semibold">Stats</h3>
        <p>Rank: {profile.rank}</p>
        <p>Score: {profile.score}</p>
        <p>
          Victories: {profile.victories} | Losses: {profile.losses} | Matches:{" "}
          {profile.totalMatches}
        </p>
      </div>

      {/* Match History */}
      <div>
        <h3 className="font-semibold">Match History</h3>
        <table className="w-full text-left border">
          <thead>
            <tr>
              <th className="border px-2 py-1">Opponent</th>
              <th className="border px-2 py-1">Result</th>
              <th className="border px-2 py-1">Score</th>
              <th className="border px-2 py-1">Date</th>
            </tr>
          </thead>
          <tbody>
            {profile.matchHistory.map((match) => (
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
