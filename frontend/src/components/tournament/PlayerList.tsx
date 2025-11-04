import React, { useState, useEffect } from "react";
import type { TournamentPlayer, TournamentState } from "../../types/tournament";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { VerifyPlayerPayload, VerifyPlayerResponse } from "../../../shared/payloads";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

// Username: must start with letter, 6-12 chars, letters, numbers, underscore allowed
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{5,11}$/;

// Password: 8-16 chars, letters, numbers and allowed special chars
const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_\-+=.]{8,16}$/;

// Alias: 5–10 chars, letters/numbers/_
const ALIAS_REGEX = /^[a-zA-Z0-9_]{5,10}$/;

interface PlayerListProps {
	tournament: TournamentState;
	onRemovePlayer: (role: string) => void;                // remove a player from the list
}

type PlayerFormData = {
	username: string;
	password: string;
	alias: string;
};

type FormErrors = Record<string, {
	username?:string;
	password?:string;
	alias?: string;
}>;

type FormData = Record<string, PlayerFormData>;

const emptyPlayerForm = (): PlayerFormData => ({ username: "", password: "", alias: "" });

const PlayerList: React.FC<PlayerListProps> = ({
	tournament, onRemovePlayer,
	}) => {
	const { setTournament, refreshSession } = useAuth();
	const [formData, setFormData] = useState<FormData>({});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState<string | null>(null);
	const [isEditingAlias, setIsEditingAlias] = useState<boolean>(false);
	const [tempAlias, setTempAlias] = useState('');

	useEffect(() => {
		const initial: FormData = {};
		let selfAlias = '';

		tournament.players.forEach(p => {
			if (p.isSelf) {
				// If editing, uses the existing local state value (which was set to "")
				initial[p.role] = formData[p.role] || {
				username: p.username || "",
				password: "",
				alias: p.alias || "",
				};
				selfAlias = p.alias || '';

			} else {
				initial[p.role] = formData[p.role] || {
					username: "",
					password: "",
					alias: "",
				};
			
			}
		});
		setFormData(initial);

		if (!isEditingAlias && tempAlias === "") {
			setTempAlias(selfAlias || "");
		}

	}, [tournament.players.map(p => p.role).join("|")]);

	const updateField = (role: string, field: keyof PlayerFormData, value: string) => {
		const player = tournament.players.find((p) => p.role === role)!;

		if (player.isSelf && field === 'alias') {
			setTempAlias(value);
		} else {
			setFormData((prev) => ({
				...prev,
				[role]: {
				...(prev[role] || emptyPlayerForm()),
				[field]: value,
				},
			}));
		}
	};

	const isFormComplete = (role: string, player: any): boolean => {
		const data = formData[role];

		if (player.isSelf) {
			return ALIAS_REGEX.test(tempAlias);
	
		}
		return (
		USERNAME_REGEX.test(data?.username ?? "") &&
		PASSWORD_REGEX.test(data?.password ?? "") &&
		ALIAS_REGEX.test(data?.alias ?? "")
		);
	};

	// Handles adding and verifying a tournament player

	const handleAddPlayer = async (role: string, player: TournamentPlayer) => {
		const data = formData[role];  // takes existing form data for the role
		
		// Determines the alias to be used:
		// -if the player is the logged-in user (isSelf), uses the temp alias from state
		// -otherwise, uses the alias entered in the form or falls back to empty string
		let aliasToUse = player.isSelf ? tempAlias : data?.alias || '';

		// Frontend validation
		
		const localErrors: Record<string, string | undefined> = {};

		
		// Validate alias
		if (!ALIAS_REGEX.test(aliasToUse)) {
			localErrors.alias = "Alias must be 5–10 chars (letters, numbers, underscores).";
		}

		// Validate username + password for non-self players
		if (!player.isSelf) {
			if (!USERNAME_REGEX.test(data?.username ?? "")) {
				localErrors.username = "Invalid username format";
			}

			if (!PASSWORD_REGEX.test(data?.password ?? "")) {
				localErrors.password = "Invalid password format";
			}
		}

		// Check alias uniqueness among verified players
		const duplicate = tournament.players.some(
			p =>
				p.role !== role &&
				p.isVerified &&
				p.alias?.toLowerCase() === aliasToUse.toLowerCase()
		);

		if (duplicate) {
			localErrors.alias = "Alias must be unique.";
		}

		// If ANY frontend error exists -> stop
		if (Object.keys(localErrors).length > 0) {
			setErrors(prev => ({
				...prev,
				[role]: localErrors
			}));
			return;
		}

		// Clear previous errors
		setErrors(prev => {
			const newErr = { ...prev };
			delete newErr[role];
			return newErr;
		});

		// Backend communication
		try {
			setLoading(role);

			const payload: VerifyPlayerPayload = {
				role,
				username: player.isSelf ? player.username : data.username,	// use username entered in the form or logged-in player's username
				password: player.isSelf ? "" : data.password,	// only sends password if player is not self
				alias: aliasToUse,
			};

			// API call to backend to verify entered player
			const res = await fetch(API_PROTOCOL.VERIFY_PLAYER.path, {
				method: API_PROTOCOL.VERIFY_PLAYER.method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
				credentials: "include",
			});

			if (!res.ok) {
				let msg = "Verification failed.";
				try {
					const body = await res.json();
					if (body?.error) msg = body.error;
				} catch {}

				// Assign backend error inline
				setErrors(prev => ({
					...prev,
					[role]: { alias: msg }
				}));

				return;
			}

			const response: VerifyPlayerResponse = await res.json();
			if (response.status === "OK" && response.tournament) {
			// Update the tournament in context
				setTournament(response.tournament);
				await refreshSession();
		}

			// Clear errors for the role on success
			setErrors((prev) => {
				const next = { ...prev };
				delete next[role];
				return next;
			});

			if (player.isSelf) {
				// Exit editing mode for the logged in player on success
				setIsEditingAlias(false);
			}
			
		} catch (err: any) {
			console.error("Error verifying player:", err);
			setErrors(prev => ({
				...prev,
				[role]: {alias: err.message ||  "Network error. Please try again." }
			}));
		} finally {
			setLoading(null);
		}
	};
	
	const handleRemovePlayer = async (role: string) => {
		setFormData((prev) => ({ ...prev, [role]: emptyPlayerForm() }));
		setErrors((prev) => {
		const next = { ...prev };
		delete next[role];
		return next;
		});

	onRemovePlayer(role);
	await refreshSession();
  };

  return (
	<div className="space-y-3">
		{tournament.players.map((player) => {
			const role = player.role;
			const isCurrentlyLoading = loading === role;

			const verifiedPlayer = tournament.players.find(p => p.role === role);
			const isPlayerVerified = verifiedPlayer?.isVerified ?? false;
			
			const isSelfVerifiedButLocked = player.isSelf && isPlayerVerified && !isEditingAlias && !!player.alias;
			const isOtherPlayerLocked = !player.isSelf && isPlayerVerified;
			const isAliasLocked = isOtherPlayerLocked || isSelfVerifiedButLocked; 

			const data = formData[role] || { username: "", password: "", alias: "" };
			const fieldErrs = errors[role] || {};

		return (
		  <div
			key={role}
			className="flex flex-col gap-1">
			< div className="flex items-center gap-2">
			  <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
				{isPlayerVerified && (
				  <span className="w-4 h-4 rounded-full bg-cyan-400 text-white text-[0.4rem] font-bold flex items-center justify-center">
					✔
				  </span>
				)}
			</span>
			
			<div className="flex flex-col sm:flex-row flex-wrap w-full gap-2 items-stretch sm:items-center">
			  {/* Username */}
			  <input
				type="text"
				placeholder="Username"
				disabled={player.isSelf || isPlayerVerified}
				value={player.isSelf || isPlayerVerified ? player.username : data.username}
				onChange={(e) => updateField(role, "username", e.target.value)}
				className={`p-2 border border-gray-700 rounded flex-1 min-w-0 w-full sm:w-auto
					 ${fieldErrs.username ? "border-red-500" : "border-gray-300"}
					${player.isSelf || isPlayerVerified
					? `${isPlayerVerified ? "text-indigo-400" : "text-gray-400"} bg-gray-900 cursor-not-allowed`
					: "bg-gray-900 text-white"
				}`}
			  />

			  {/* Password */}
			  <input
				type="password"
				placeholder="Password"
				disabled={player.isSelf || isPlayerVerified}
				value={player.isSelf || isPlayerVerified ? "********" : data.password}
				onChange={(e) => updateField(role, "password", e.target.value)}
				className={`p-2 border border-gray-700 rounded flex-1 min-w-0 w-full sm:w-auto
					${fieldErrs.password ? "border-red-500" : "border-gray-300"}
					${player.isSelf || isPlayerVerified
					? `${isPlayerVerified ? "text-indigo-400" : "text-gray-400"} bg-gray-900 cursor-not-allowed`
					: "bg-gray-900 text-white"
				}`}
			  />

			  {/* Alias */}
			  <input
				type="text"
				placeholder="Alias"
				disabled={isAliasLocked}
				value={
				  player.isSelf
					? tempAlias
					: data.alias || player.alias || ""
				}
				onChange={(e) => updateField(role, "alias", e.target.value)}
				className={`p-2 border border-gray-700 rounded flex-1 min-w-0 w-full sm:w-auto 
					 ${fieldErrs.alias ? "border-red-500" : "border-gray-300"}
					${isAliasLocked
					? "bg-gray-900 cursor-not-allowed"
					: "bg-gray-900"
					}
					${isPlayerVerified ? "text-indigo-400" : "text-white"}
				`}
				/>

			  {/* Action Buttons (Other players) */}
			  {!player.isSelf && !isPlayerVerified && (
				<Button
				  onClick={() => handleAddPlayer(role, player)}
				  disabled={isCurrentlyLoading}
				  className="min-w-[6.3rem]"
				>
				  {isCurrentlyLoading ? "Adding..." : "Add Player"}
				</Button>
			  )}

			  {isPlayerVerified && !player.isSelf && (
				<Button
				  onClick={() => handleRemovePlayer(role)}
				  disabled={isCurrentlyLoading}
				  className="min-w-[6.3rem]"
				>
				  Remove
				</Button>
			  )}

			   {/* Action Buttons (Player1) */}
			  {player.isSelf && (
				<div className="flex items-center gap-2">

				  {/* Set/Edit Alias button */}
				  <Button
					onClick={() => {
					 if (isPlayerVerified && !isEditingAlias) {
						setIsEditingAlias(true);
						setTempAlias(player.alias || "");
					  } else {
						// Save Alias
						handleAddPlayer(role, player);
					}
				  }}
					// Check completion against the dedicated logic now
					disabled={isCurrentlyLoading}
					className="min-w-[6.3rem]"
				  >
					{isCurrentlyLoading
					  ? "Saving..."
					  : !isPlayerVerified
					  ? "Set Alias"
					  : isEditingAlias // If verified, check if editing
					  ? "Save Alias" 
					  : "Edit Alias"}
				  </Button>
				</div>
			  )}
			</div>
			</div>
			{/* Inline field errors (shown only after clicking button) */}
			{fieldErrs.username && <span className="text-red-500 text-sm">{fieldErrs.username}</span>}
			{fieldErrs.password && <span className="text-red-500 text-sm">{fieldErrs.password}</span>}
			{fieldErrs.alias && <span className="text-red-500 text-sm">{fieldErrs.alias}</span>}
			</div>
		);
	  })}
	</div>
)};

export default PlayerList;
