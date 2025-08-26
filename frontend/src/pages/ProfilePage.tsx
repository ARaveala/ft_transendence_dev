import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, UpdateProfilePayload } from "../../shared/payloads";

const availableAvatars = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
];

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);

const [selectedAvatar, setSelectedAvatar] = useState<string>
  (profile?.avatarFile || "/default-avatar.png");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(API_PROTOCOL.GET_PROFILE.path, {
          //credentials: "include", // send HttpOnly cookie
        });
        const data: UserProfile = await res.json();

        if (!data.avatarFile) {
          data.avatarFile = "/avatars/default-avatar.png";
        }

        setProfile(data);
        setTwoFactor(data.twoFactor);
        setSelectedAvatar(data.avatarFile); // default avatar
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchProfile();
  }, []);

  // Handle updating avatar and 2FA preference
  const handleUpdate = async () => {
    if (!profile) return;

    const payload: UpdateProfilePayload = {
      twoFactor,
      avatar: selectedAvatar,
    };

    try {
      const res = await fetch(API_PROTOCOL.UPDATE_PROFILE.path, {
        method: API_PROTOCOL.UPDATE_PROFILE.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        //credentials: "include", // for HttpOnly cookie
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedProfile: UserProfile = await res.json();
      setProfile(updatedProfile);
      setSelectedAvatar(updatedProfile.avatarFile || "/avatars/avatar1.png");
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>

      {/* Avatar and username */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={selectedAvatar || profile.avatarFile || "/avatars/default-avatar.png"}
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

        <div className="mt-2">
          <label>Change Avatar:</label>
            <div className="flex gap-2 mt-1">
              {availableAvatars.map((avatar) => (
                <img
                  key={avatar}
                  src={avatar}
                  className={`w-12 h-12 rounded-full cursor-pointer border-2 ${
                    selectedAvatar === avatar ? "border-blue-500" : "border-transparent"
                  }`}
                  alt="Avatar"
                  onClick={() => setSelectedAvatar(avatar)}
                />
              ))}
             </div>
        </div>
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

      {/* Friends */}
      <div className="mb-6">
        <h3 className="font-semibold">Friends</h3>
        <ul>
          {profile.friends.map((friend) => (
            <li key={friend.id} className="flex items-center gap-2">
              <img
                src={friend.avatar || "/default-avatar.png"}
                className="w-8 h-8 rounded-full"
                alt={friend.username}
              />
              {friend.username}
            </li>
          ))}
        </ul>
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
