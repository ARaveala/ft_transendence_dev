import React, { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import { useAuth } from "../context/AuthContext";
import { useApiFetch } from "../utils/apiFetch";

import type {
	ChangeLanguagePayload,
	ChangeUsernamePayload,
	ChangePasswordPayload,
	UpdateProfilePayload,
	UploadAvatarResponse,
} from "../../shared/payloads";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";
import defaultAvatar from "../assets/avatars/default-avatar.png";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/;

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
	const [twoFactor, setTwoFactor] = useState(false);
	const [qrCode, setQrCode] = useState<string | null>(null);
	const [otp, setOtp] = useState<string>("");
	const [showDisableConfirm, setShowDisableConfirm] = useState(false);
	//const [twoFactor, setTwoFactor] = useState<boolean>(false);
	//const [loadingTwoFA, setLoadingTwoFA] = useState<boolean>(false); //may need to update the code to remove this with the AuthContext additio

	// Delete Profile state
	const [deleting, setDeleting] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);

	// Use apiFetch hook
	const apiFetch = useApiFetch();

	// Inline error state
	const [inlineErrors, setInlineErrors] = useState<{ username?: string; password?: string }>({});

	function validateUsernameInput(input: string) {
		const errors: { username?: string } = {};

		if (!USERNAME_REGEX.test(input)) {
			errors.username = t("auth.error.usernameFormat");
		}
		return errors;
	}

	function validatePasswordInputs(current: string, next: string, confirm: string) {
		const errors: { password?: string } = {};

		if (!PASSWORD_REGEX.test(next)) {
			errors.password = t("auth.error.passwordFormat");
			return errors;
		}

		if (next !== confirm) {
			errors.password = t("error.password.match");
		}
		if (!current) {
			errors.password = t("error.password.required");
		}
		return errors;
	}

	useEffect(() => {

	const fetch2faStatus = async () => {
		try {
		const res = await fetch(API_PROTOCOL.TFA_STATUS.path, {
			method: API_PROTOCOL.TFA_STATUS.method,
			credentials: "include"
		});
		const data = await res.json();
		setTwoFactor(data.isEnabled);
		} catch (err) {
		console.error("Failed to fetch 2FA status", err);
		setTwoFactor(false);
		}
	};

	if (user) {
		fetch2faStatus();
		setUsername(user.username || "");
		const avatar = user.avatarFile || availableAvatars[0];
		setCurrentAvatar(avatar);
		setSelectedAvatar(avatar);
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

	function reset2faForm() {
		setQrCode(null);
		setOtp("");
		setShowDisableConfirm(false);
	}

	function closeAndReset(row: Exclude<Row, null>) {
		if (row === "username") resetUsernameForm();
		if (row === "password") resetPasswordForm();
		if (row === "avatar") resetAvatarForm();
		if (row === "twofa") reset2faForm();
		setOpenRow(null);
		setInlineErrors({});
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
		setInlineErrors({});

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
		if (openRow === "twofa") reset2faForm();

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
		if (row === "twofa") reset2faForm();

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
		setBusy(true);
		setMsg(null);
		setErr(null);

		try {
			const payload: ChangeLanguagePayload = { language };
			
			const data  = await apiFetch(
				API_PROTOCOL.CHANGE_LANGUAGE.path,
				{
					method: API_PROTOCOL.CHANGE_LANGUAGE.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (data.status !== "UPDATED") {
				console.error("language update error:", data.error);
				setErr(t("error.language.updateFailed"));
				return;
			}
			setLang(language);	
			localStorage.setItem("serverLang", language);
			setOpenRow(null);
			await refreshSession();

		} catch (e: any) {
			if (e.sessionExpired) return; // let apiFetch handle redirect on 401
			setErr(t("error.language.updateFailed"));
		} finally {
			setBusy(false);
		}
	}

	async function saveUsername() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const value = usernameInput.trim();
			const validation = validateUsernameInput(value);
			if (validation.username) {
				setInlineErrors(validation);
				return;
			}
			setInlineErrors({});

			const payload: ChangeUsernamePayload = { username: value };
			const data = await apiFetch(API_PROTOCOL.CHANGE_USERNAME.path, {
					method: API_PROTOCOL.CHANGE_USERNAME.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
			});
			console.log("Backend response for saveUsername:", data);

			setMsg(t("common.username.updated"));
			resetUsernameForm();
			setUsernameInput("");
			setOpenRow(null);

			await refreshSession();
			setUsername(value);

		} catch (e: any) {
			console.error("Caught error in saveUsername:", e);
			let backendError;
			try {
				backendError = JSON.parse(e.message);
			} catch (_) {
				backendError = { error: e.message };
			}

			if (backendError.error === "Username not available" || backendError.error === "username not available") {
				// Inline error under input
				setInlineErrors({ username: t("error.username.taken") });
			} else if (backendError.error === "no such user") {
				setErr(t("error.user.notFound"));
			} else if (e.sessionExpired) {
				return; // let apiFetch handle session expiration
			} else {
				setErr(t("error.username.updateFailed"));
			}
		} finally {
			setBusy(false);
	}
	}

	async function savePassword() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			
			if (!PASSWORD_REGEX.test(currentPassword))
			{
				setInlineErrors({ password: t("auth.error.passwordFormat")});
				return;
			}

			const validation = validatePasswordInputs(
				currentPassword,
				newPassword,
				confirmNewPassword
			);
			
			if (validation.password) {
				setInlineErrors(validation);
				return;
			}
			setInlineErrors({});

			const payload: ChangePasswordPayload = {
				current_password: currentPassword,
				new_password: newPassword,
			};
			console.log("Frontend sending", currentPassword);
			console.log("Frontend sending:", newPassword);
			const res = await apiFetch(API_PROTOCOL.CHANGE_PASSWORD.path, {
			const data: ChangePasswordResponse = await apiFetch(
			API_PROTOCOL.CHANGE_PASSWORD.path,
			{
				method: API_PROTOCOL.CHANGE_PASSWORD.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			setMsg(t("common.password.updated"));
			resetPasswordForm();
			setOpenRow(null);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmNewPassword("");

		} catch (e: any) {
			console.error("Caught error in savePassword:", e);

			let backendError;
			try {
				backendError = JSON.parse(e.message);
			} catch (_) {
				backendError = { error: e.message };
			}

			if (backendError.error === "Invalid password") {
				setInlineErrors({ password: t("error.password.currentIncorrect") });
			} else if (e.sessionExpired) {
				// Let apiFetch handle redirect
				return;
			} else {
				setErr(t("error.password.updateFailed"));
			}
		} finally {
			setBusy(false);
		}
	}

	async function saveAvatar() {
		setBusy(true); setMsg(null); setErr(null);
		try {
			const payload: UpdateProfilePayload = { avatar: selectedAvatar };
			const data = await apiFetch(
				API_PROTOCOL.CHANGE_AVATAR.path,
				{
					method: API_PROTOCOL.CHANGE_AVATAR.method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (data.status !== "UPDATED") {
				throw new Error(data.error || "Failed to update avatar.");
			}

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
			if (e.sessionExpired) return;
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

	/*
	async function saveTwoFactor() {
		setBusy(true);
		setMsg(null);
		setErr(null);
		try {
			const payload: ChangeTwoFactorPayload = { twoFactor };
			const res = await fetch(API_PROTOCOL.CHANGE_2FA.path, {
				method: API_PROTOCOL.CHANGE_2FA.method,
				headers: { "Content-Type": "application/json" },
				credentials: "include",
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
	*/

	//2FA handlers
	const handle2faCheckboxChange = async () => {
		setMsg(null);
		setErr(null);
		if (!twoFactor && !qrCode) { // enabling 2FA
			try {
				const res = await fetch(API_PROTOCOL.TFA_SETUP.path, {
					method: API_PROTOCOL.TFA_SETUP.method,
					credentials: "include"
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Could not start 2FA setup.");
				if (data.qrCodeUrl) { 
					setQrCode(data.qrCodeUrl);
					setMsg(t("settings.twofa.setupStarted"));
				} else {
					throw new Error("No QR code received.");
				}
			} catch (err: any) {
				//console.error("Failed to setup 2FA", err); alert(err.message || "Could not start 2FA setup.");
				setErr(t("error.twofa.setupFailed"));
			}
			return;
		}
		if (twoFactor) {
			setShowDisableConfirm(true);
		}
	};

	const cancel2faSetup = () => {
		setQrCode(null);
		setOtp("");
		setMsg(null);
		setErr(null);
		setTwoFactor(false);
	}

	const confirmDisable2fa = async () => {
		setBusy(true);
		setErr(null);
		setMsg(null);
		try {
				const res = await fetch(API_PROTOCOL.TFA_DISABLE.path, {
				method: API_PROTOCOL.TFA_DISABLE.method,
				credentials: "include"
			});
			const data = await res.json();
			if (!res.ok || !data.disabled) throw new Error(data.error || "Failed to disable 2FA.");
			setTwoFactor(false);
			setShowDisableConfirm(false);
			setMsg(t("common.twofa.disabled"));
			await refreshSession();
		} catch (err: any) {
			setErr(t("error.twofa.disableFailed"));
		} finally {
			setBusy(false);
		}
	};

	const cancelDisableConfirm = () => {
		setShowDisableConfirm(false);
	};

		
		//else if (twoFactor) { //  disabling 2FA
		//	if (window.confirm("Are you sure you want to disable 2FA?")) {
		//		try {
		//			const res = await fetch(API_PROTOCOL.TFA_DISABLE.path, {
		//				method: API_PROTOCOL.TFA_DISABLE.method,
		//				credentials: "include"
		//			});
		//			const data = await res.json();
		//			if (!res.ok) throw new Error(data.error || "Failed to disable 2FA.");
		//			if (data.disabled) { alert("2FA disabled."); setTwoFactor(false); setOpenRow(null); await refreshSession(); }
		//		} catch (err: any) { alert(err.message || "Failed to disable 2FA."); }
		//	}
		//}
	//};

	const handleVerify2fa = async () => {
		setMsg(null);
		setErr(null);
		if (otp.length !== 6) { 
			//alert("Please enter a 6-digit code."); return;
			setErr(t("error.twofa.codeLength"));
			return;
		}
		try {
			const res = await fetch(API_PROTOCOL.TFA_VERIFY.path, {
				method: API_PROTOCOL.TFA_VERIFY.method,
				headers: { 'Content-Type': 'application/json' },
				credentials: "include",
				body: JSON.stringify({ otp })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to verify 2FA.");
			if (data.verified) { 
				//alert("2FA enabled successfully!");
				setTwoFactor(true);
				setQrCode(null);
				setOtp("");
				setOpenRow(null);
				setMsg(t("common.twofa.enabled"));
				await refreshSession();
			} else {
				//alert(data.error || "Invalid code, please try again.");
				setErr(t("error.twofaverifyFailed"));
			}
		} catch (_) {
			//alert(err.message || "Failed to verify 2FA.");
			setErr(t("error.twofa.verifyFailed"));
		}
	};

	async function handleDeleteProfile() {
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(API_PROTOCOL.DELETE_PROFILE.path, {
				method: API_PROTOCOL.DELETE_PROFILE.method,
				//headers: { "Content-Type": "application/json" },
				credentials: "include",
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
						{/* Inline error shown under the input */}
						{inlineErrors.username && (
							<p className="text-red-400 text-xs mt-1">{inlineErrors.username}</p>
						)}

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
						{/* Inline error shown under the input */}
						{inlineErrors.password && (
							<p className="text-red-400 text-xs mt-1">{inlineErrors.password}</p>
						)}
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
						{/*2FA*/}
						<SettingButton label={t("settings.change2fa")} onClick={() => toggle("twofa")} />
						{openRow === "twofa" && (
							<div className="px-4 pt-3 pb-4">
								{/* Your interactive checkbox */}
								<label className="flex items-center gap-2 mb-4">
									<input
									type="checkbox"
									checked={twoFactor}
									onChange={handle2faCheckboxChange}
									disabled={!!qrCode}
									/>
									<span className="text-sm">{t("settings.twofaLabel")}</span>
								</label>
						{showDisableConfirm && (
							<div className="mt-3 p-4 rounded-lg border border-gray-700 bg-gray-900/60">
								<h3 className="font-semibold text-lg">{t("settings.twofaDisableConfirmTitle")}</h3>
								<p className="text-sm mt-1 text-gray-300">
									{t("settings.twofaDisableConfirmText")}
								</p>
								<div className="mt-3 flex gap-2">
									<PrimaryTiny onClick={confirmDisable2fa} disabled={busy}>
										{t("common.disable")}
									</PrimaryTiny>
									<SecondaryTiny onClick={cancelDisableConfirm} disabled={busy}>
										{t("common.cancel")}
									</SecondaryTiny>
								</div>
							</div>
						)}
						{qrCode && (
							<div className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900/60 text-white">
								<h3 className="font-semibold text-lg">{t("settings.twofaEnableTitle")}</h3>
								<p className="text-sm mt-1">{t("settings.twofaScanQR")}</p>
								<img
									src={qrCode}
									alt="2FA QR Code"
									className="my-3 mx-auto bg-white p-1 rounded"
								/>
								<p className="text-sm">{t("settings.twofaEnterCode")}</p>
								<div className="flex items-center gap-2 mt-2">
									<input
										type="text"
										className="border border-gray-700 bg-gray-900 text-white p-2 rounded-md w-32 text-center tracking-widest"
										placeholder="123456"
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))}
										maxLength={6}
									/>
									<PrimaryTiny onClick={handleVerify2fa} disabled={busy}>
										{t("common.verifyEnable")}
									</PrimaryTiny>
									<SecondaryTiny onClick={cancel2faSetup} disabled={busy}>
										{t("settings.twofaCancelSetup")}
									</SecondaryTiny>
								</div>
							</div>
						)}
						{!qrCode && !showDisableConfirm && (
							<div className="mt-3 flex gap-2">
								<SecondaryTiny onClick={() => closeAndReset("twofa")} disabled={busy}>
									{t("common.cancel")}
								</SecondaryTiny>
							</div>
						)}
					</div>
				)}
			</section>

			{/* Danger Zone */}
		<section className="mt-6 border border-red-500/30 bg-red-900/10 rounded-lg p-4">
		<h2 className="text-red-400 font-semibold mb-2">
			{t("settings.title.delete")}
		</h2>

		{deleteError && <p className="text-red-300 text-sm mb-2">{deleteError}</p>}
		{deleted && <p className="text-red-300 text-sm mb-2">{t("common.delete.success")}</p>}

		{/* Delete confirmation logic */}
		{confirmDelete ? (
			<div className="border border-red-500/30 bg-red-900/10 rounded p-4 mt-3">
			<p className="text-sm text-red-200 mb-3">
				{t("settings.delete.text")}
			</p>
			<div className="flex gap-2">
				<button
				type="button"
				onClick={handleDeleteProfile}
				disabled={deleting || deleted}
				className="px-3 py-1.5 text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed"
				>
				{deleting ? t("common.deleting") : t("game.action.confirm")}
				</button>
				<button
				type="button"
				onClick={() => setConfirmDelete(false)}
				disabled={deleting}
				className="px-3 py-1.5 text-sm rounded-md text-white bg-gray-600 hover:bg-gray-700 disabled:cursor-not-allowed"
				>
				{t("common.cancel")}
				</button>
			</div>
			</div>
		) : (
			<button
			type="button"
			onClick={() => setConfirmDelete(true)}
			disabled={deleting || deleted}
			className={`px-3 py-1.5 text-sm rounded-md text-white ${
				deleted
				? "bg-red-600 cursor-not-allowed"
				: deleting
				? "bg-red-500 cursor-wait"
				: "bg-red-600 hover:bg-red-700"
			}`}
			>
			{deleted ? t("common.deleted") : t("settings.item.delete")}
			</button>
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
