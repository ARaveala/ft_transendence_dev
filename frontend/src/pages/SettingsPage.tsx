import React, { useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";
import { useTranslation } from "../shared/Translation";
import type {
	ChangeLanguagePayload,
	ChangeLanguageResponse,
	ChangeUsernamePayload,
	ChangeUsernameResponse,
	ChangePasswordPayload,
	ChangePasswordResponse,
	UpdateProfilePayload,
} from "../../shared/payloads";
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";
import avatar4 from "../assets/avatars/avatar4.png";

const availableAvatars = [avatar1, avatar2, avatar3, avatar4];

type Row = "language" | "username" | "password" | "avatar" | null;

const SettingsPage: React.FC = () => {
	const { t, setLang } = useTranslation();

	// Which row is open state
	const [openRow, setOpenRow] = useState<Row>(null);

	// Inline status
	const [msg, setMsg] = useState<string | null>(null);
	const [err, setErr] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	// Forms
	const [language, setLanguage] = useState<"en" | "fi" | "sv">("en");
	const [username, setUsername] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmNewPassword, setConfirmNewPassword] = useState("");
	const [selectedAvatar, setSelectedAvatar] = useState<string>(availableAvatars[0]);

	// Delete Profile state
	const [deleting, setDeleting] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	// Clear forms
	function resetUsernameForm() {
		setUsername("");
	}

	function resetPasswordForm() {
		setCurrentPassword("");
		setNewPassword("");
		setConfirmNewPassword("");
	}

	function resetAvatarForm() {
		setSelectedAvatar(availableAvatars[0]);
	}

	function closeAndReset(row: Exclude<Row, null>) {
		if (row === "username") resetUsernameForm();
		if (row === "password") resetPasswordForm();
		if (row === "avatar") resetAvatarForm();
		setOpenRow(null);
	}

	// Set row state (if same row clicked again, it closes it)
	function toggle(row: Exclude<Row, null>) {
		setMsg(null);
		setErr(null);
		if (openRow === row) {
			closeAndReset(row);
			return;
		}

		if (openRow === "username") resetUsernameForm();
		if (openRow === "password") resetPasswordForm();
		if (openRow === "avatar") resetAvatarForm();

		setOpenRow(row);
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
			setOpenRow(null);
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
			if (!res.ok) throw new Error("Failed to update password.");

			const data = (await res.json()) as ChangePasswordResponse;
			if (data.status !== "UPDATED") throw new Error(data.error || "Failed to update password.");

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
			const res = await fetch(API_PROTOCOL.UPDATE_PROFILE.path, {
				method: API_PROTOCOL.UPDATE_PROFILE.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			if (!res.ok) throw new Error("Failed to update avatar.");

			setMsg(t("common.avatarUpdated"));
			closeAndReset("avatar");
		} catch (e: any) {
			setErr(e?.message || "Could not update avatar.");
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
				{openRow == "language" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.languageSelect")}</label>
						<select
							value={language}
							onChange={(e) => setLanguage(e.target.value)}
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
				{openRow == "username" && (
					<div className="px-4 pt-3 pb-4">
						<label className="block mb-2 text-sm">{t("settings.usernameEnter")}</label>
						<input
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm"
							placeholder={t("settings.usernameEnter")}
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
						<div className="grid grid-cols-4 gap-3">
							{availableAvatars.map((av) => (
								<button
									key={av}
									type="button"
									onClick={() => setSelectedAvatar(av)}
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
							<PrimaryTiny onClick={saveAvatar} disabled={busy}>{t("common.save")}</PrimaryTiny>
							<SecondaryTiny onClick={() => closeAndReset("avatar")} disabled={busy}>{t("common.cancel")}</SecondaryTiny>
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
