import React, { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import { useAuth } from "../context/AuthContext";
import type {
	ChangeLanguagePayload,
	ChangeLanguageResponse,
	ChangeUsernamePayload,
	ChangeUsernameResponse,
	ChangePasswordPayload,
	ChangePasswordResponse,
	UpdateProfilePayload,
	ChangeTwoFactorPayload,
	ChangeTwoFactorResponse,
	UploadAvatarResponse,
} from "../../shared/payloads";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";

const availableAvatars = [avatar1, avatar2, avatar3, avatar4];

type Row = "language" | "username" | "password" | "avatar" | "twofa" | null;

const SettingsPage: React.FC = () => {
	const { t, setLang } = useTranslation();
	const { user, loading, refreshSession } = useAuth();

	// Which row is open state
	const [openRow, setOpenRow] = useState<Row>(null);

	// Inline status
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	// Forms
	const [language, setLanguage] = useState<"en" | "fi" | "sv">("en");
	const [username, setUsername] = useState("");
	const [usernameInput, setUsernameInput] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [selectedAvatar, setSelectedAvatar] = useState<string>(availableAvatars[0]);
	const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
	const [avatarDirty, setAvatarDirty] = useState(false);

	//Upload avatar
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadPreview, setUploadPreview] = useState<string | null>(null);
	const [uploadBusy, setUploadBusy] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 2FA state
	const [twoFactor, setTwoFactor] = useState<boolean>(false);
	const [loadingTwoFA, setLoadingTwoFA] = useState<boolean>(false); //may need to update the code to remove this with the AuthContext additio

	// Delete Profile state
	const [deleting, setDeleting] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	useEffect(() => {
	if (user) {
		setUsername(user.username || "");
		const avatar = user.avatarFile || availableAvatars[0];
		setCurrentAvatar(avatar);
		setSelectedAvatar(avatar);
		setTwoFactor(user.twoFactor ?? false);
	}
	}, [user]);
	
	if (loading) {
		return <div className="p-6 text-center text-gray-300">Loading...</div>;
	}
	if (!user) {
	return (
		<div className="p-6 text-center text-gray-300">
		Please log in to access settings.
		</div>
		);
	}

	//Preload current 2FA status. Should be redundant now as we use user info from AuthContext
	// useEffect(() => {
	// 	let cancelled = false;
	// 	async function preloadTwoFA() {
	// 		try {
	// 			setLoadingTwoFA(true);
	// 			const res = await fetch(API_PROTOCOL.GET_PROFILE.path, {
	// 				method: API_PROTOCOL.GET_PROFILE.method,
	// 				headers: { "Content-Type": "application/json" },
	// 			});
	// 			if (!res.ok) return;

	// 			const data = await res.json();
	// 			if (!cancelled && typeof data?.twoFactor === "boolean") {
	// 				setTwoFactor(data.twoFactor);
	// 			}

	// 			if (!cancelled) {
	// 				const serverAvatar = (data?.avatarFile || data?.avatar) as string | undefined;
	// 				if (serverAvatar) {
	// 					setCurrentAvatar(serverAvatar);
	// 					setSelectedAvatar(serverAvatar);
	// 				}
	// 			}
	// 		} finally {
	// 			if (!cancelled) setLoadingTwoFA(false);
	// 		}
	// 	}
	// 	preloadTwoFA();
	// 	return () => { cancelled = true; };
	// }, []);

	// Clear forms
	function resetUsernameForm() {
		setUsername("");
		setUserNameInput("");
	}

	function resetPasswordForm() {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
	}

	function resetAvatarForm() {
		try {
			if (uploadPreview && uploadPreview.startsWith("blob:")) {
				URL.revokeObjectURL(uploadPreview);
			}
		} catch (_) { }

		setUploadPreview(null);
		setUploadFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (selectedAvatar !== currentAvatar) {
			setSelectedAvatar(currentAvatar ?? availableAvatars[0]);
		}
	}

	function closeAndReset(row: Exclude<Row, null>) {
		if (row === "username") resetUsernameForm();
		if (row === "password") resetPasswordForm();
		if (row === "avatar") resetAvatarForm();
		setOpenRow(null);
	}

	function onCancelAvatar() {
		if (avatarDirty) {
			resetAvatarForm();
		}
		setOpenRow(null);
	}

	// Set row state (if same row clicked again, it closes it)
	function toggle(row: Exclude<Row, null>) {
		setMsg(null);
		setErr(null);

		if (openRow === "avatar" && row !== "avatar") {
			if (avatarDirty) resetAvatarForm();
		}

		if (openRow === row) {
			if (row === "avatar" && avatarDirty) resetAvatarForm();
			setOpenRow(null);
			return;
		}

		if (openRow === "username") setUsernameInput("");
		if (openRow === "password") resetPasswordForm();
		if (openRow === "avatar") resetAvatarForm();

		if (row === "avatar") {
			if (currentAvatar) setSelectedAvatar(currentAvatar);
			setAvatarDirty(false);
		}
		if (row === "username") {
			setUsernameInput("");
		}
		if (row === "password") {
			resetPasswordForm();
		}

		setOpenRow(row);
	}

	// Upload avatar
	function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
		const f = e.target.files?.[0] || null;
		setMsg(null);
		setErr(null);
		if (uploadPreview && uploadPreview.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);

		if (!f) {
			setUploadFile(null);
			setUploadPreview(null);
			markAvatarDirty(selectedAvatar, null, null);
			return;
		}

		const okType = ["image/png", "image/jpeg", "image/webp"].includes(f.type);
		if (!okType) { 
			setErr(t("error.avatarType"));
			setUploadFile(null);
			setUploadPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			markAvatarDirty(selectedAvatar, null, null);
			return; 
		}

		const maxBytes = 2 * 1024 * 1024;
		if (f.size > maxBytes) {
			setErr(t("error.avatarTooLarge"));
			setUploadFile(null);
			setUploadPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			markAvatarDirty(selectedAvatar, null, null);
			resetFileInput();
			return;
		}

		const url = URL.createObjectURL(f);
		setUploadFile(f);
		setUploadPreview(url);
		markAvatarDirty(selectedAvatar, f, url);
	}

	function clearPickedFile() {
		if (uploadPreview && uploadPreview.startsWith("blob:")) {
			URL.revokeObjectURL(uploadPreview);
		}
		setUploadPreview(null);
		setUploadFile(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		markAvatarDirty(selectedAvatar, null, null);
	}

	function resetFileInput() {
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function onCancelAvatarClick() {
		resetAvatarForm();
		setOpenRow(null);
	}

	function markAvatarDirty(
		nextSelected= selectedAvatar,
		nextUploadFile: File | null = uploadFile,
		nextUploadPreview = uploadPreview
	) {
		const hasBlobPreview = !!nextUploadPreview && nextUploadPreview.startsWith("blob:");
		setAvatarDirty(nextSelected !== currentAvatar || !!nextUploadFile || hasBlobPreview);
	}

	async function saveLanguage() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const payload: ChangeLanguagePayload = { language };
			const res = await fetch(API_PROTOCOL.CHANGE_LANGUAGE.path, {
				method: API_PROTOCOL.CHANGE_LANGUAGE.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update language.");

			const data = (await res.json()) as ChangeLanguageResponse;
			if (data.status !== "UPDATED") throw new Error(data.error || "Failed to update language.");
			
			setLang(language);
			setMsg(t("common.languageUpdated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(e?.message || "Could not update language.");
		} finally {
			setBusy(false);
		}
	}

	async function saveUsername() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const value = username.trim();
			if (value.length < 3 || value.length > 15) throw new Error(t("error.usernameLength"));
			const payload: ChangeUsernamePayload = { username: value };
			const res = await fetch(API_PROTOCOL.CHANGE_USERNAME.path, {
				method: API_PROTOCOL.CHANGE_USERNAME.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update username.");

			const data = (await res.json()) as ChangeUsernameResponse;
			if (data.status !== "UPDATED") throw new Error(data.error || "Failed to update username.");

			setMsg(t("common.usernameUpdated"));
			resetUsernameForm();
			setUsernameInput("");
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(e?.message || "Could not update username.");
		} finally {
			setBusy(false);
		}
	}

	async function savePassword() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			if (newPassword.length < 8) throw new Error(t("error.passwordLength"));
			if (newPassword !== confirmNewPassword) throw new Error(t("error.passwordMatch"));
			if (!currentPassword) throw new Error (t("error.passwordRequired"));
			const payload: ChangePasswordPayload = {
				current_password: currentPassword,
				new_password: newPassword,
			};
			const res = await fetch(API_PROTOCOL.CHANGE_PASSWORD.path, {
				method: API_PROTOCOL.CHANGE_PASSWORD.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			//if (!res.ok) throw new Error("Failed to update password.");

			const data = (await res.json()) as ChangePasswordResponse;
			if (!res.ok || data.status !== "UPDATED") {
				throw new Error(t("error.currentPasswordIncorrect"));
			}

			setMsg(t("common.passwordUpdated"));
			resetPasswordForm();
			setOpenRow(null);
			setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
		} catch (e: any) {
			setErr(e?.message || "Could not update password.");
		} finally {
			setBusy(false);
		}
	}

	async function saveAvatar() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const payload: UpdateProfilePayload = { avatar: selectedAvatar };
			const res = await fetch(API_PROTOCOL.CHANGE_AVATAR.path, {
				method: API_PROTOCOL.CHANGE_AVATAR.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update avatar.");

			setCurrentAvatar(selectedAvatar);
			if (uploadPreview) {
				if (uploadPreview.startsWith("blob:")) URL.revokeObjectURL(uploadPreview);
				setUploadPreview(null);
			}
			setUploadFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			setMsg(t("common.avatarUpdated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(e?.message || "Could not update avatar.");
		} finally {
			setBusy(false);
		}
	}

	async function uploadAvatarFile() {
		if (!uploadFile) return;
		setUploadBusy(true);
		setErr(null);
		setMsg(null);
		try {
			const fd = new FormData();
			fd.append("file", uploadFile); //backend read file

			const res = await fetch(API_PROTOCOL.UPLOAD_AVATAR.path, {
				method: API_PROTOCOL.UPLOAD_AVATAR.method,
				body: fd,
			});
			if (!res.ok) throw new Error("Failed to upload avatar.");

			const data = (await res.json()) as UploadAvatarResponse;
			if (data.status !== "UPLOADED" || !data.url) throw new Error(data.error || "Upload failed.");

			setSelectedAvatar(data.url);
			setCurrentAvatar(data.url);
			setUploadPreview(data.url);
			setUploadFile(null);
			if (fileInputRef.current) fileInputRef.current.value= "";

			setAvatarDirty(false);
			setMsg(t("common.avatarUpdated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(e?.message || "Could not upload avatar.");
		} finally {
			setUploadBusy(false);
		}
	}

	async function saveTwoFactor() {
		setBusy(true);
		setMsg(null);
		setErr(null);
		try {
			const payload: ChangeTwoFactorPayload = { twoFactor };
			const res = await fetch(API_PROTOCOL.CHANGE_2FA.path, {
				method: API_PROTOCOL.CHANGE_2FA.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update 2FA.");
			
			const data = (await res.json()) as ChangeTwoFactorResponse;
			if (data.status !== "UPDATED") throw new Error(data.error || "Failed to update 2FA.");

			setMsg(twoFactor ? t("common.twofaEnabled") : t("common.twofaDisabled"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(e?.message || "Could not change 2FA.");
		} finally {
			setBusy(false);
		}
	}

	async function handleDeleteProfile() {
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(API_PROTOCOL.DELETE_PROFILE.path, {
				method: API_PROTOCOL.DELETE_PROFILE.method,
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) throw new Error("Failed to delete profile.");

			setDeleted(true);
		} catch (err:any) {
			setDeleteError(err?.message || "Deletion failed.");
		} finally {
			setDeleting(false);
		}
	}

	const previewSrc = uploadPreview || selectedAvatar || currentAvatar || null;
				
	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-4">{t("settings.title")}</h1>

			{/* Inline status */}
			{msg && <p className="mb-3 text-green-300">{msg}</p>}
			{err && <p className="mb-3 text-red-300">{err}</p>}

			{/* Account & profile actions */}
			<section className ="bg-gray-800/50 rounded-lg border border-gray-700 divide-y divide-gray-700">
				{/* Change Language row */}
				<SettingButton
					label={t("settings.changeLanguage")}
					onClick={() => toggle("language")}
				/>
				{openRow === "language" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.languageSelect")}</label>
						<select
							value={language}
							onChange={(e) => setLanguage(e.target.value as "en" | "fi" | "sv")}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
						>
							<option value="en">{t("lang.english")}</option>
							<option value="fi">{t("lang.finnish")}</option>
							<option value="sv">{t("lang.swedish")}</option>
						</select>
						<div className="mt-3 flex gap-2">
							<PrimaryTiny onClick={saveLanguage} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny onClick={() => closeAndReset("language")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Change Username row */}
				<SettingButton
					label={t("settings.changeUsername")}
					onClick={() => toggle("username")}
				/>
				{openRow === "username" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.usernameEnter")}</label>
						<input
							type="text"
							name="settings-username"
							value={usernameInput}
							onChange={(e) => setUsernameInput(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
							placeholder={t("settings.usernameEnter")}
							autoComplete="off"
						/>
						<div className="mt-3 flex gap-2">
							<PrimaryTiny onClick={saveUsername} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny onClick={() => closeAndReset("username")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Change Password row */}
				<SettingButton
					label={t("settings.changePassword")}
					onClick={() => toggle("password")}
				/>
				{openRow === "password" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.passwordCurrent")}</label>
						<input
							type="password"
							name="settings-current-password"
							autoComplete="off"
							readOnly
							onFocus={e => (e.currentTarget.readOnly = false)}
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
						/>
						<label className="block mt-3 mb-2 text-sm">{t("settings.passwordNew")}</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
							placeholder={t("notice.passwordLength")}
						/>
						<label className="block mt-3 mb-2 text-sm">{t("settings.passwordConfirm")}</label>
						<input
							type="password"
							value={confirmNewPassword}
							onChange={(e) => setConfirmNewPassword(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
						/>
						<div className="mt-3 flex gap-2">
							<PrimaryTiny onClick={savePassword} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny onClick={() => closeAndReset("password")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* Change Avatar row */}
				<SettingButton
					label={t("settings.changeAvatar")}
					onClick={() => toggle("avatar")}
				/>
				{openRow === "avatar" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.avatarSelect")}</label>

						<div className="mb-3">
							<label className="block mb-1 text-sm">{t("settings.avatarCustomAvatar")}</label>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onChange={onPickFile}
								className="text-sm"
							/>

							<div className="mt-2 flex items-center gap-3">
								{previewSrc ? (
									<img
										src={previewSrc}
										alt="Preview"
										className="w-16 h-16 rounded-full border border-gray-700"
										onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
									/>
								) : (
									<div className="w-16 h-16 rounded-full border border-gray-700" />
								)}
								<button
									type="button"
									onClick={clearPickedFile}
									className="px-3 py-1.5 text-sm rounded-md text-white bg-gray-700 hover:bg-gray-600"
								>
									{t("common.clear")}
								</button>
								<button
									type="button"
									onClick={uploadAvatarFile}
									disabled={!uploadFile || uploadBusy}
									className={
										"px-3 py-1.5 text-sm rounded-md text-white " +
										(uploadBusy ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700")
									}
								>
									{t("common.upload")}
								</button>
							</div>

							<p className="mt-1 text-xs text-gray-400">{t("settings.avatarUploadHint")}</p>
						</div>

						{/* Built-in avatar */}
						<p className="text-sm mb-2">{t("settings.avatarBuiltIn")}</p>
						<div className="grid grid-cols-4 gap-3">
							{availableAvatars.map((av) => (
								<button
									key={av}
									type="button"
									onClick={() => { setSelectedAvatar(av); setAvatarDirty(av !== currentAvatar); }}
									className={
										"rounded-lg p-1 border " +
										(selectedAvatar === av ? "border-blue-500" : "border-gray-700")
									}
									aria-label="Select avatar"
								>
									<img
										src={av}
										alt="Avatar choice"
										className="w-16 h-16 rounded-full"
									/>
								</button>
							))}
						</div>
						<div className="mt-3 flex gap-2">
							<PrimaryTiny onClick={saveAvatar} disabled={busy || uploadBusy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny
								onClick={onCancelAvatarClick} disabled={busy || uploadBusy}>{t("common.cancel")}</SecondaryTiny>
						</div>
					</div>
				)}

				{/* 2FA row */}
				<SettingButton
					label={t("settings.change2fa")}
					onClick={() => toggle("twofa")}
				/>
				{openRow === "twofa" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.twofaDescription")}</label>

						<label className="inline-flex items-center gap-2">
							<input
								type="checkbox"
								checked={twoFactor}
								onChange={() => setTwoFactor((v) => !v)}
								disabled={busy || loadingTwoFA}
							/>
							<span className="text-sm">{t("settings.twofaLabel")}</span>
						</label>

						<div className="mt-3 flex gap-2">
							<PrimaryTiny onClick={saveTwoFactor} disabled={busy || loadingTwoFA}>
								{t("common.save")}
							</PrimaryTiny>
							<SecondaryTiny onClick={() => setOpenRow(null)} disabled={busy}>
								{t("common.cancel")}
							</SecondaryTiny>
						</div>
					</div>
				)}	
			</section>

			{/* Danger Zone */}
			<section className="mt-6 border border-red-500/30 bg-red-900/10 rounded-lg p-4">
				<h2 className="text-red-400 font-semibold mb-2">{t("settings.danger")}</h2>
				<p className="text-sm text-red-200 mb-3">
					{t("settings.deleteText")}
				</p>

				{deleteError && <p className="text-red-300 text-sm mb-2">{deleteError}</p>}
				{deleted && <p className="text-red-300 text-sm mb-2">{t("common.deletedText")}</p>}
				<button
					type="button"
					onClick={handleDeleteProfile}
					disabled={deleting || deleted}
					className={`px-3 py-1.5 text-sm  rounded-md text-white ${
						deleted
							? "bg-red-600 cursor-not-allowed"
							: deleting
							 ? "bg-red-500 cursor-wait"
							 : "bg-red-600 hover:bg-red-700"
					}`}
				>
					{deleted ? t("common.deleted") : deleting ? "Deleting..." : t("settings.delete")}
				</button>
			</section>
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
				className="px-3 py-1.5 text-sm rounded-md text-white bg-gray-800 hover:bg-gray-600"
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
			className={"px-3 py-1.5 text-sm rounded-md text-white " +
				(disabled ? "bg-blue-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700")
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

export default SettingsPage;
