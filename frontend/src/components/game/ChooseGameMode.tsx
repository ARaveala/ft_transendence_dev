import React from "react";
import { useTranslation } from "../../shared/Translation";

interface ChooseGameModeProps {
onSelectMode: (mode: "guest" | "login" | "ai") => void;
}

const ChooseGameMode: React.FC<ChooseGameModeProps> = ({ onSelectMode }) => {
	const { t } = useTranslation();
return (
	<div className="flex flex-col items-center space-y-4">
	<h2 className="text-2xl font-bold text-teal-700 dark:text-teal-300 mb-4">
		{t("game.mode.title")}
	</h2>
	<button
		className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("guest")}
	>
		{t("game.mode.guest")}
	</button>
	<button
		className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("login")}
	>
		{t("game.mode.loginSecond")}
	</button>
	<button
		className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg w-64"
		onClick={() => onSelectMode("ai")}
	>
		{t("game.mode.ai")}
	</button>
	</div>
);
};

export default ChooseGameMode;
