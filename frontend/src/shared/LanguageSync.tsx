import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation, Lang } from "./Translation";

function isSupported(l: any): l is Lang {
	return l === "en" || l === "fi" || l === "sv";
}

export default function LanguageSync() {
	const { isLoggedIn, user } = useAuth();
	const { lang, setLang } = useTranslation();
	const prevLoggedIn = useRef<boolean>(isLoggedIn);

	useEffect(() => {
		const wasLoggedIn = prevLoggedIn.current;

		if (wasLoggedIn && !isLoggedIn) {
			localStorage.setItem("anonLang", "en");
		}

		if (isLoggedIn) {
			const raw =
				(user as any)?.language ??
				(user as any)?.lang ??
				(user as any)?.locale ??
				(user as any)?.preferred_language ??
				(user as any)?.preferredLanguage;

		const fromUser = isSupported(raw) ? (raw as Lang) : null;
		const stored = localStorage.getItem("serverLang");
		const fromStorage = isSupported(stored) ? (stored as Lang) : null;

		const target = fromUser ?? fromStorage;
		if (target && target !== lang) {
			setLang(target);
			localStorage.setItem("anonLang", target);
			}
		}

		prevLoggedIn.current = isLoggedIn;
	}, [isLoggedIn, user, lang, setLang]);

	return null;
}
