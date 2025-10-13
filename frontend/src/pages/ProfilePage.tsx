import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import defaultAvatar from "../assets/avatars/default-avatar.png";

import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, UpdateProfilePayload } from "../../shared/payloads";

const availableAvatars = [avatar1, avatar2, avatar3, avatar4];

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState<string>
  (profile?.avatarFile || defaultAvatar);

  //2FA states
  const [qrCode, setQrCode] = useState<string | null>(null); // qrcode image
  const [otp, setOtp] = useState<string>(""); //the 6 digit code the user types

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
        //setTwoFactor(data.twoFactor); removed old tickbox logic
        setSelectedAvatar(data.avatarFile); // default avatar
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

	const fetch2faStatus = async () => {
        try {
            const res = await fetch('/api/2fa/status', {
                credentials: "include"
            });
            const data = await res.json();
            setTwoFactor(data.isEnabled); // check if checkbox is toggled or not
        } catch (err) {
            console.error("Failed to fetch 2FA status", err);
            setTwoFactor(false);
        }
    };

    fetchProfile();
	fetch2faStatus();
  }, []);

  //2fa handlers
  const handle2faCheckboxChange = async () => {
        if (!twoFactor && !qrCode) {
			try {
                const res = await fetch('/api/2fa/setup', {
                    method: 'POST',
                    credentials: "include"
                });
                const data = await res.json();
                if (data.qrCodeUrl) {
                    setQrCode(data.qrCodeUrl);
                }
            }
			catch (err) {
                console.error("Failed to setup 2FA", err);
                alert("Could not start 2FA setup!!!!.");
            }
		}
		else if (twoFactor) {
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
                	}
            	}
				catch (err) {
                	alert("Failed to disable 2FA.");
            	}
        	}
		}
		else {
            console.log("Disabling 2FA is still TODO! need separate flow.");
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
                alert("2FA enabled successfully!");
                setTwoFactor(true); // mark 2FA enabled in UI
                setQrCode(null);    // Hide the qrcode
                setOtp("");
            }
			else {
                alert(data.error || "Invalid code, please try again.");
            }
        }
		catch (err) {
            alert("Failed to verify 2FA.");
        }
    };



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
	  console.log("Updated profile response:", updatedProfile);
	  setProfile(updatedProfile);
      setSelectedAvatar(updatedProfile.avatarFile || avatar1);
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
          src={selectedAvatar || profile.avatarFile || defaultAvatar}
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
		  <input //added new 2FA checkboc logic here
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
			<p className="text-sm mt-1">1. Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
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
