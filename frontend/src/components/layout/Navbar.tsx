import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";

const Navbar: React.FC = () => {
const { t } = useTranslation();

// Dont remove translations for buttons!!
return (
	<nav className="p-4 bg-gray-800 bg-opacity-90 backdrop-blur-md shadow-md flex items-center gap-4">
	<Link
		to="/"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		{t("nav.home")}
	</Link>
	<Link
		to="/game"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		{t("nav.game")}
	</Link>
	<Link
		to="/tournament"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		{t("nav.tournament")}
	</Link>
	<Link
		to="/friends"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		{t("nav.friends")}
	</Link>

	<div className="ml-auto flex gap-4">
		<Link
		to="/profile"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
		>
		{t("nav.profile")}
		</Link>
		<Link
		to="/settings"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
		>
		{t("nav.settings")}
		</Link>
		<Link
		to="/exit"
		className="px-3 py-1 rounded hover:bg-red-600 transition-colors"
		>
		{t("nav.exit")}
		</Link>
	</div>
	</nav>
);
};

export default Navbar;
