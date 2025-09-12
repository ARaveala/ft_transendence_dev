import React, { useState } from "react";
import { API_PROTOCOL } from "../../shared/api-protocols";

const SettingsPage: React.FC = () => {
	const [deleting, setDeleting] = useState(false);
	const [deleted, setDeleted] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	async function handleDeleteProfile() {
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(API_PROTOCOL.DELETE_PROFILE.path, {
				method: API_PROTOCOL.DELETE_PROFILE.method,
				headers: { "Content-Type": "application/json" },
			});

			if (!res.ok) throw new Error("Failed to delete profile");

			setDeleted(true);
		} catch (err:any) {
			setDeleteError(err?.message || "Deletion failed");
		} finally {
			setDeleting(false);
		}
	}
				

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-4">Settings</h1>

			{/* Account & profile actions */}
			<section className ="bg-gray-800/50 rounded-lg border border-gray-700 divide-y divide-gray-700">
				<SettingButton
					label="Change Language"
					onClick={() => {}}
				/>
				<SettingButton
					label="Change Username"
					onClick={() => {}}
				/>
				<SettingButton
					label="Change Password"
					onClick={() => {}}
				/>
				<SettingButton
					label="Change Avatar"
					onClick={() => {}}
				/>
				<SettingButton
					label="Change Email"
					onClick={() => {}}
				/>
			</section>
			{/* Danger Zone */}
			<section className="mt-6 border border-red-500/30 bg-red-900/10 rounded-lg p-4">
				<h2 className="text-red-400 font-semibold mb-2">Danger Zone</h2>
				<p className="text-sm text-red-200 mb-3">
					Deleting your profile removes your account, friends, and match history.
					This action is <span className="font-semibold">irreversible</span>!
				</p>

				{deleteError && <p className="text-red-300 text-sm mb-2">{deleteError}</p>}
				{deleted && <p className="text-red-300 text-sm mb-2">Your profile has been deleted!</p>}
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
					{deleted ? "Deleted" : deleting ? "Deleting..." : "Delete Profile"}
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
export default SettingsPage;
