import React, { useEffect, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import defaultAvatar from "../assets/avatars/default-avatar.png";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../utils/apiFetch"


type Friend = {
	user_id: string;
	username: string;
	avatar?: string | null;
	online_status: boolean;
};

type FriendRequestResponse = {
	status: "ADDED" | "REMOVED" | "ERROR";
	friend?: Friend;
	error?: string;
};

const MAX_FRIENDS = 20;

const Friends: React.FC = () => {
	const { t } = useTranslation();
	const {isLoggedIn, user, loading, refreshSession } = useAuth(); //now using AuthContext to get user info

	// Inline status
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);

	// Expand/collapse
	const [openAdd, setOpenAdd] = useState(false);

	// Remove friend
	const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
	const [removing, setRemoving] = useState(false);

	// List friend (from Authontext)
	const [friends, setFriends] = useState<Friend[]>(user?.friends?.slice(0, MAX_FRIENDS) || []);// means we use the friends from AuthContext if available. Slice to limit to MAX_FRIENDS

	// Add friend
	const [username, setUsername] = useState("");
	const [busyAdd, setBusyAdd] = useState(false);

	// Clear forms
	function resetAddForm() {
		setUsername("");
	}

	// Open/close remove friend
	function toggleRemove(friendId: string) {
		setMsg(null);
		setErr(null);
		setRemoveConfirmId((cur) => (cur === friendId ? null : friendId));
	}
	// Use apiFetch hook
	const apiFetch = useApiFetch();


	if (loading) return <div className="p-6">{t("friends.loading")}</div>;
	if (!isLoggedIn) { //changed from !user to !isLoggedIn
	return (
		<div className="p-6 text-center text-gray-300">
		 {t("friends.loginRequired")}
		</div>
	);
	}

	useEffect(() => {
		if (user) {
			setFriends(user.friends?.slice(0, MAX_FRIENDS) || []);
		}
	}, [user]);

	async function handleAdd() {
		setErr(null);
		setMsg(null);
		setBusyAdd(true);
		
		try {
			const value = username.trim();
			if (!value) {
				setBusyAdd(false);
				return;
			}
			if (friends.length >= MAX_FRIENDS) {
				setErr(t("error.friends.maxNum"));
				setBusyAdd(false);
				return;
			}
			if (friends.some((f) => f.username.toLowerCase() === value.toLowerCase())) {
				setErr(t("error.friends.alreadyFriend"));
				setBusyAdd(false);
				return;
			}

			if (user?.username && value.toLowerCase() === user.username.toLowerCase()) {
				setErr(t("error.friends.cannotAddSelf"));
				setBusyAdd(false);
				return;
			}

			const data: FriendRequestResponse = await apiFetch(API_PROTOCOL.ADD_FRIEND.path, {
			method: API_PROTOCOL.ADD_FRIEND.method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username: value }),
			});

			if (data.status !== "ADDED" || !data.friend) {
			throw new Error(data.error); // no fallback text
			}

			//setFriends((prev) => [...prev, data.friend!].slice(0, MAX_FRIENDS));
			resetAddForm();
			setMsg(t("common.friends.added"));
			setOpenAdd(false);
			await refreshSession(); // Refresh user data in AuthContext to update friends list there too
		} catch (e: any) {
			if (e.sessionExpired) return; // let apiFetch redirect handle it
			setErr(t("error.friends.addFailed"));
		} finally {
			setBusyAdd(false);
		}
	}

	async function confirmRemove(friendId: string) {
		setRemoving(true);
		setErr(null);
		setMsg(null);
		try {
			
			const data: FriendRequestResponse = await apiFetch(API_PROTOCOL.REMOVE_FRIEND.path, {
			method: API_PROTOCOL.REMOVE_FRIEND.method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ friend_id: friendId }),
			});

			if (data.status !== "REMOVED") {
			throw new Error(data.error);
			}

			setFriends((prev) => prev.filter((f) => f.user_id !== friendId));
			setRemoveConfirmId(null);
			setMsg(t("common.friends.removed"));
			await refreshSession(); // Refresh user data in AuthContext to update friends list there too
		} catch (e: any) {
			if (e.sessionExpired) return; // redirect already triggered by apiFetch
			setErr(t("error.friends.removeFailed"));
		} finally {
			setRemoving(false);
		}
	}

	return (
  	<div className="flex justify-center px-6 py-6">
    	{/* Semi-transparent card for content */}
    	<div className="w-full max-w-4xl bg-gray-900/90 rounded-lg p-6 text-white">
			<h1 className="text-3xl font-bold mb-4">{t("friends.title")}</h1>

			{/* Inline status */}
			{msg && <p className="mb-3 text-green-300">{msg}</p>}
			{err && <p className="mb-3 text-red-300">{err}</p>}

			{/* Actions section */}
			<section className="bg-gray-800/50 rounded-lg border border-gray-700 divide-y divide-gray-700">
				{/* Add friend by username row */}
				<SettingButton
					label={t("friends.add.title")}
					onClick={() => setOpenAdd((v) => !v)}
				/>
				{openAdd && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">
							{t("friends.item.username")}
						</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm w-full md:w-1/2"
						/>
						<div className="mt-3 flex gap-2">
							<PrimaryTiny
								onClick={handleAdd}
								disabled={busyAdd || !username.trim() || friends.length >= MAX_FRIENDS}
							>
								{t("common.add")}
							</PrimaryTiny>
							<SecondaryTiny
								onClick={() => { resetAddForm(); setOpenAdd(false); }}
								disabled={busyAdd}
							>
								{t("common.cancel")}
							</SecondaryTiny>
						</div>
						{friends.length >= MAX_FRIENDS && (
							<p className="text-xs text-gray-400 mt-2">
								{t("error.friends.maxNum")}
							</p>
						)}
					</div>
				)}
			</section>

			{/* Friends list */}
			<section className="mt-6 bg-gray-800/50 rounded-lg border border-gray-700 p-4">
				<h2 className="font-semibold mb-3">{t("friends.list.title")}</h2>

				{friends.length === 0 ? (
					<div className="text-gray-400">{t("friends.list.empty")}</div>
				) : (
					<div className="space-y-3">
						{friends.map((f) => {
							const avatarSrc =
								f.avatar ??
								(f as any).avatarFile ??
								(f as any).avatar_file ??
								defaultAvatar;
							return (
							<div key={f.user_id} className="space-y-2">
								<div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700">
									<div className="flex items-center gap-3">
										<img
											src={avatarSrc}
											alt={`${f.username} avatar`}
											className="w-10 h-10 rounded-full"
											onError={(e) => { 
												(e.currentTarget as HTMLImageElement).src = defaultAvatar;
											}}
										/>
										<div>
											<div className="font-semibold">{f.username}</div>
											<div className="flex items-center gap-1 text-sm">
											<span
											className={
											"inline-block w-2 h-2 rounded-full " +
											(f.online_status ? "bg-green-400" : "bg-gray-500")
											}
											/>
											<span className={f.online_status ? "text-green-300" : "text-gray-400"}>
											{f.online_status ? t("common.online") : t("common.offline")}
											</span>
											</div>
										</div>
									</div>

									<button
										type="button"
										onClick={() => toggleRemove(f.user_id)}
										className="px-2 py-1 text-sm rounded-md text-white bg-gray-800 hover:bg-gray-700 border border-gray-700"
									>
										{t("friends.item.remove")}
									</button>
								</div>

								{/* Remove confirmation */}
								{removeConfirmId === f.user_id && (
									<div className="px-4 pb-4">
										<div className="border border-red-500/30 bg-red-900/10 rounded p-4">
											<h3 className="text-red-400 font-semibold mb-2">
											{t("friends.confirmRemove.title")}
											</h3>
											<p className="text-sm text-red-200 mb-3">
											{t("friends.confirmRemove.text")}
											</p>
											<div className="flex gap-2">
											<PrimaryTiny
											onClick={() => confirmRemove(f.user_id)}
											disabled={removing}
											>
											{t("common.remove")}
											</PrimaryTiny>
											<SecondaryTiny
											onClick={() => setRemoveConfirmId(null)}
											disabled={removing}
											>
											{t("common.cancel")}
											</SecondaryTiny>
											</div>
										</div>
									</div>
								)}
							</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	  </div>
	);
};

function SettingButton({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<div className="px-4 py-3">
			<button
				type="button"
				onClick={onClick}
				className="px-3 py-1.5 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"

			>
				{label}
			</button>
		</div>
	);
}

function PrimaryTiny({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={
				"px-3 py-1.5 text-sm rounded-md text-white " +
				(disabled ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700")
			}
		>
			{children}
		</button>
	);
}

function SecondaryTiny({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="px-3 py-1.5 text-sm rounded-md text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
		>
			{children}
		</button>
	);
}

export default Friends;
