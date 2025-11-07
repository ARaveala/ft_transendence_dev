import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredContainer from "../components/layout/CenteredContainer";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../shared/Translation";

const Exit: React.FC = () => {
	const { t } = useTranslation();
	const { isLoggedIn, logoutUser } = useAuth();
	const navigate = useNavigate();
	

	const [busy, setBusy] = useState(false);
	const [done, setDone] = useState(false);
	const [err, setErr] = useState<string | null>(null);

	const sessionExpired = new URLSearchParams(location.search).get("reason") === "sessionExpired";

	useEffect(() => {
		if (done || sessionExpired) {  // <-- redirect also on session expired
		const timer = setTimeout(() => navigate("/"), 2500);
		return () => clearTimeout(timer);
		}
	}, [done, sessionExpired, navigate]);

	async function handleLogout() {
		try {
			setBusy(true);
			setErr(null);
			await logoutUser();
			setDone(true);
		} catch (e:any) {
			setErr(t("exit.error"));
		} finally {
			setBusy(false);
		}
	}

	const arrivedLoggedOut = !isLoggedIn && !done;

		return (
		<CenteredContainer>
			<div className="w-full max-w-[26rem] bg-gray-900/90 rounded-xl p-6 text-white shadow-2xl flex flex-col items-center gap-2">
				<h1 className="text-3xl font-bold mb-0.5">{t("exit.title")}</h1>

				{err && <p className="text-sm text-red-300">{err}</p>}

				{done ? (
					// Case 1: user just logged out
					<>
						<p className="text-gray-300">{t("exit.loggedOut")}</p>
						<p className="text-gray-400 text-sm">{t("exit.redirectHome")}</p>
					</>
				) : sessionExpired ? (
					// Case 2: session expired
					<>
						<p className="text-gray-300">{t("exit.sessionExpired")}</p>
						<p className="text-gray-400 text-sm">{t("exit.redirectHome")}</p>
					</>
				) : arrivedLoggedOut ? (
					// Case 3: user opened exit while logged out
					<>
						<p className="text-gray-300">{t("exit.alreadyLoggedOut")}</p>
						<p className="text-gray-400 text-sm">{t("exit.loginPrompt")}</p>
						<button
							type="button"
							onClick={() => navigate("/")}
							className="mt-2 px-5 py-2 rounded bg-blue-600 hover:bg-blue-700"
						>
							{t("nav.home")}
						</button>
					</>
				) : (
					// Case 4: user is logged in and wants to log out
					<>
						<p className="text-gray-300">
							{busy ? t("exit.loggingOut") : t("exit.goodbye")}
						</p>
						<button
							type="button"
							onClick={handleLogout}
							disabled={busy}
							className="px-5 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50"
						>
							{busy ? t("exit.loggingOut") : t("nav.exit")}
						</button>
					</>
				)}
			</div>
		</CenteredContainer>
	);
};

export default Exit;
