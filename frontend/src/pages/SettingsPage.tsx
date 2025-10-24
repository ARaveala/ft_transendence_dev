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
import defaultAvatar from "../assets/avatars/default-avatar.png";

const availableAvatars = [defaultAvatar, avatar1, avatar2, avatar3, avatar4];

type Row = "language" | "username" | "password" | "avatar" | "twofa" | null;

const SettingsPage: React.FC = () => {
	const { t, setLang } = useTranslation();
	const {isLoggedIn, user, loading, refreshSession } = useAuth();

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
		return <div className="p-6 text-center text-gray-300">{t("settings.loading")}</div>;
	}
	if (!isLoggedIn) {
		return <div className="p-6 text-center text-gray-300">{t("settings.loginRequired")}</div>;
	}

	// Clear forms
	function resetUsernameForm() {
		setUsername("");
		setUsernameInput("");
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
			setErr(t("error.avatar.type"));
			setUploadFile(null);
			setUploadPreview(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			markAvatarDirty(selectedAvatar, null, null);
			return; 
		}

		const maxBytes = 2 * 1024 * 1024;
		if (f.size > maxBytes) {
			setErr(t("error.avatar.tooLarge"));
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
			setMsg(t("common.language.updated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(t("error.language.updateFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function saveUsername() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const value = usernameInput.trim();
			if (value.length < 3 || value.length > 15) throw new Error(t("error.username.length"));
			const payload: ChangeUsernamePayload = { username: value };
			const res = await fetch(API_PROTOCOL.CHANGE_USERNAME.path, {
				method: API_PROTOCOL.CHANGE_USERNAME.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update username.");

			const data = (await res.json()) as ChangeUsernameResponse;
			if (data.status !== "UPDATED") throw new Error(data.error || "Failed to update username.");

			setMsg(t("common.username.updated"));
			resetUsernameForm();
			setUsernameInput("");
			setOpenRow(null);
			await refreshSession();
			setUsername(value);
		} catch (e: any) {
			setErr(t("error.username.updateFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function savePassword() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			if (newPassword.length < 8) throw new Error(t("error.password.length"));
			if (newPassword !== confirmNewPassword) throw new Error(t("error.password.match"));
			if (!currentPassword) throw new Error (t("error.password.required"));
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
				throw new Error(t("error.password.currentIncorrect"));
			}

			setMsg(t("common.password.updated"));
			resetPasswordForm();
			setOpenRow(null);
			setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
		} catch (e: any) {
			setErr(t("error.password.updateFailed"));
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
			setMsg(t("common.avatar.updated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(t("error.avatar.updateFailed"));
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
			setMsg(t("common.avatar.updated"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(t("error.avatar.updateFailed"));
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

			setMsg(twoFactor ? t("common.twofa.enabled") : t("common.twofa.disabled"));
			setOpenRow(null);
			await refreshSession();
		} catch (e: any) {
			setErr(t("error.twofa.updateFailed"));
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
			await refreshSession();
		} catch (err:any) {
			setDeleteError(t("error.delete.removeFailed"));
		} finally {
			setDeleting(false);
		}
	}

	const previewSrc = uploadPreview || selectedAvatar || currentAvatar || null;
				
	return (
  <div className="flex justify-center px-6 py-6">
    {/* Semi-transparent card for content */}
    <div className="w-full max-w-4xl bg-gray-900/90 rounded-lg p-6 text-white">
			<h1 className="text-3xl font-bold mb-4">{t("settings.title")}</h1>

			{/* Inline status */}
			{msg && <p className="mb-3 text-green-300">{msg}</p>}
			{err && <p className="mb-3 text-red-300">{err}</p>}

			{/* Account & profile actions */}
			<section className ="bg-gray-800/50 rounded-lg border border-gray-700 divide-y divide-gray-700">
				{/* Change Language row */}
				<SettingButton
					label={t("settings.title.language")}
					onClick={() => toggle("language")}
				/>
				{openRow === "language" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.item.language")}</label>
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
					label={t("settings.title.username")}
					onClick={() => toggle("username")}
				/>
				{openRow === "username" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.item.newUsername")}</label>
						<input
							type="text"
							name="settings-username"
							value={usernameInput}
							onChange={(e) => setUsernameInput(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
							placeholder={t("settings.username.notice")}
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
					label={t("settings.title.password")}
					onClick={() => toggle("password")}
				/>
				{openRow === "password" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.item.passwordCurrent")}</label>
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
						<label className="block mt-3 mb-2 text-sm">{t("settings.item.passwordNew")}</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
							placeholder={t("settings.password.notice")}
						/>
						<label className="block mt-3 mb-2 text-sm">{t("settings.item.passwordConfirm")}</label>
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
					label={t("settings.title.avatar")}
					onClick={() => toggle("avatar")}
				/>
				{openRow === "avatar" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.item.avatarSelect")}</label>

						<div className="mb-3">
							<label className="block mb-1 text-sm">{t("settings.item.avatarCustomAvatar")}</label>
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

							<p className="mt-1 text-xs text-gray-400">{t("settings.item.avatarUploadHint")}</p>
						</div>

						{/* Built-in avatar */}
						<p className="text-sm mb-2">{t("settings.item.avatarBuiltIn")}</p>
						<div className="grid grid-cols-5 gap-2">
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
					label={t("settings.title.twofa")}
					onClick={() => toggle("twofa")}
				/>
				{openRow === "twofa" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.twofa.text")}</label>

						<label className="inline-flex items-center gap-2">
							<input
								type="checkbox"
								checked={twoFactor}
								onChange={() => setTwoFactor((v) => !v)}
								disabled={busy || loadingTwoFA}
							/>
							<span className="text-sm">{t("settings.item.twofa")}</span>
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
				<h2 className="text-red-400 font-semibold mb-2">{t("settings.title.delete")}</h2>
				<p className="text-sm text-red-200 mb-3">
					{t("settings.delete.text")}
				</p>

				{deleteError && <p className="text-red-300 text-sm mb-2">{deleteError}</p>}
				{deleted && <p className="text-red-300 text-sm mb-2">{t("common.delete.success")}</p>}
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
					{deleted ? t("common.deleted") : deleting ? "Deleting..." : t("settings.item.delete")}
				</button>
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
