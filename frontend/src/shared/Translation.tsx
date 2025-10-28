import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "fi" | "sv";

import en from  "../../shared/locales/en.json";
import fi from "../../shared/locales/fi.json";
import sv from "../../shared/locales/sv.json";

const DICTS: Record<Lang, Record<string, string>> = { en, fi, sv };

type TranslationContext = {
	lang: Lang;
	setLang: (l: Lang) => void;
	t: (key: string) => string;
};

const Ctx = createContext<TranslationContext | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
	//const [lang, setLang] = useState<Lang>(() => {
	//const saved = localStorage.getItem("lang") as Lang | null;
	//return saved || "en";
	//});

	//useEffect(() => {
	//	localStorage.setItem("lang", lang);
	//}, [lang]);

	//function t(key:string) {
	//	const dict = DICTS[lang] || DICTS.en;
	//	return dict[key] ?? key;
	//}

	//Anynymous session starts at English
	const [lang, setLang] = useState<Lang>(() => {
		const saved = localStorage.getItem("anonLang");
		if (saved === "fi" || saved === "sv" || saved === "en") return saved;
		return "en";
	});

	useEffect(() => {
		localStorage.setItem("anonLang", lang);
	}, [lang]);

	function t(key:string) {
		const dict = DICTS[lang] || DICTS.en;
		return dict[key] ?? key;
	}

	return (
		<Ctx.Provider value={{ lang, setLang, t}}>
			{children}
		</Ctx.Provider>
	);
}

export function useTranslation() {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useTranslation must be used within TranslationProvider");
	return ctx;
}
