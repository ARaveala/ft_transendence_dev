import React, { useState } from "react";
import Button from "./Button";
import { useTranslation } from "../../shared/Translation";

// Props interface for the Modal component
interface ModalProps {
	isOpen: boolean;      // Controls whether the modal is visible
	onClose: () => void;  // Callback to close the modal
	onFormSubmit: (data: {
		username: string;
		password: string;
	}) => void;            // Callback to send the registration data to parent
	mode?: "register" | "login"; // new prop to indicate mode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onFormSubmit, mode = "register" }) => {
	const { t } = useTranslation();

	// Local state to track form inputs
	const [username, setUsername] = useState("");            // Username input
	const [password, setPassword] = useState("");            // Password input
	const [error, setError] = useState("");                  // Validation error message

	// If modal is not open, don't render anything
	if (!isOpen) return null;

	const title =
		mode === "login" ? t("auth.title.login") : t("auth.title.register");
	const buttonText =
		mode === "login" ? t("auth.action.login") : t("auth.action.register");


	// Handles form submission
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		// Validates that username and password are provided
		if (!username.trim() || !password.trim()) {
			setError(t("error.auth.missingFields"));
			return;
		}
		// Clears any previous errors
		setError("");

		// Calls parent's onSubmit callback with form data
		onFormSubmit({
			username,
			password
		});
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

			<div className="relative w-[22rem] sm:w-[26rem] rounded-2xl border border-gray-700 bg-gray-900/95 text-gray-100 shadow-2xl">

				<div className="px-5 pt-4">
					<h2 className="text-lg font-bold">{title}</h2>
				</div>

			<form className="px-5 pb-5 pt-3 space-y-3" onSubmit={handleSubmit}>
				{error && <p className="text-sm text-red-400">{error}</p>}

				{/* Username input */}
				<input
					type="text"
					placeholder={t("auth.placeholder.username")}
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>

				{/* Password input */}
				<input
					type="password"
					placeholder={t("auth.placeholder.password")}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>

				{/* Submit and Close buttons */}
				<div className="flex justify-between items-center mt-4">
					<Button type="submit" className="bg-blue-600 hover:bg-blue-700">
						{buttonText}
					</Button>
					<Button
						type="button"
						onClick={onClose}
						className="bg-red-500 hover:bg-red-600"
					>
						{t("common.close")}
					</Button>
				</div>
			</form>
		</div>
	</div>
	);
};

export default Modal;
