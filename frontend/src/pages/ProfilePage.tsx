import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import defaultAvatar from "../assets/avatars/default-avatar.png";

import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, UpdateProfilePayload } from "../../shared/payloads";
import { useAuth } from "../context/AuthContext";

const availableAvatars = [avatar1, avatar2, avatar3, avatar4];

const Profile: React.FC = () => {
  const { user, isLoggedIn, refreshSession } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarFile || defaultAvatar);
  const [updating, setUpdating] = useState(false);
  
  const [twoFactor, setTwoFactor] = useState(false); 
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [otp, setOtp] = useState<string>("");

  useEffect(() => {
    const fetch2faStatus = async () => {
      try { //check if 2fa is enabled atm or not
		console.log("fetching status of 2FA");
        const res = await fetch('/api/2fa/status', {
          credentials: "include"
        });
		///
		console.log("fetched status of 2FA, whats in res", res);
		if (!res.ok) {
		  throw new Error(`HTTP error ${res.status}`);
		}
		///
		const data = await res.json();
		console.log("await data res.json()", data);

        setTwoFactor(data.isEnabled);
      } catch (err) {
        console.error("Failed to fetch 2FA status", err);
        setTwoFactor(false);
      }
    };
    
    fetch2faStatus();

    if (user) {
      setSelectedAvatar(user.avatarFile || defaultAvatar);
    }
  }, [user]);

  const handle2faCheckboxChange = async () => {
    if (!twoFactor && !qrCode) { // user enabling 2FA
      try {
        const res = await fetch('/api/2fa/setup', {
          method: 'POST',
          credentials: "include"
        });
        const data = await res.json();
        if (data.qrCodeUrl) {
          setQrCode(data.qrCodeUrl);
        }
      } catch (err) {
        console.error("Failed to setup 2FA", err);
        alert("Could not start 2FA setup.");
      }
    } else if (twoFactor) { // User is disabling 2FA
      if (window.confirm("Are you sure you want to disable 2FA?")) {
        try {
          const res = await fetch('/api/2fa/disable', {
            method: 'POST',
            credentials: "include"
          });
          const data = await res.json();
          if (data.disabled) {
            alert("2FA has been disabled.");
            setTwoFactor(false);
            await refreshSession();
          }
        } catch (err) {
          alert("Failed to disable 2FA.");
        }
      }
    }
  };

  const handleVerify2fa = async () => {
    if (otp.length !== 6) {
      alert("Please enter a 6-digit code.");
      return;
    }
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (data.verified) {
		console.log("2FA enabled successfully");
        alert("2FA enabled successfully!");
        setTwoFactor(true);
        setQrCode(null);
        setOtp("");
		console.log("2FA enabled, before refreshSession");
        await refreshSession();
      } else {
        alert(data.error || "Invalid code, please try again.");
      }
    } catch (err) {
      alert("Failed to verify 2FA.");
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    const payload = {
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
      await refreshSession();
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
            onChange={handle2faCheckboxChange}
            disabled={!!qrCode}
          />
          Enable 2FA
        </label>

        {qrCode && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-lg">Enable Two-Factor Authentication</h3>
            <p className="text-sm mt-1">1. Scan this QR code with your authenticator app.</p>
            <img src={qrCode} alt="2FA QR Code" className="my-3 mx-auto" />
            <p className="text-sm">2. Enter the 6-digit code from your app below.</p>
            <div className="flex items-center mt-2">
              <input
                type="text"
                className="border p-2 rounded-md w-32 text-center text-black"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
              <button onClick={handleVerify2fa} className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
                Verify & Enable
              </button>
            </div>
          </div>
        )}


        {/* Change Avatar (from new version) */}
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

      <button
        onClick={handleUpdate}
        disabled={updating}
        className="px-6 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        {updating ? "Saving Avatar..." : "Save Avatar"}
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
