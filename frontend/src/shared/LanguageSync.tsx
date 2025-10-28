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
			if (lang !== "en") setLang("en");
			localStorage.setItem("anonLang", "en");
		}

		if (isLoggedIn) {
			const raw = (user as any)?.language;
			if (isSupported(raw) && raw !== lang) {
				setLang(raw);
				localStorage.setItem("anonLang", raw);
			}
		}

		prevLoggedIn.current = isLoggedIn;
	}, [isLoggedIn, user?.language, lang, setLang]);

	return null;
}
