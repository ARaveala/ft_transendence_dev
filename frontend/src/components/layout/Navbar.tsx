import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";

const Navbar: React.FC = () => {
const { t } = useTranslation();

return (
	<nav className="p-4 bg-gray-800 bg-opacity-90 backdrop-blur-md rounded-xl shadow-md flex items-center gap-4 mx-4 mt-4">
	<Link
		to="/"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		Home
	</Link>
	<Link
		to="/game"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		Game
	</Link>
	<Link
		to="/tournament"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		Tournament
	</Link>
	<Link
		to="/leaderboard"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		Leaderboard
	</Link>
	<Link
		to="/friends"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
	>
		Friends
	</Link>

	<div className="ml-auto flex gap-4">
		<Link
		to="/profile"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
		>
		Profile
		</Link>
		<Link
		to="/settings"
		className="px-3 py-1 rounded hover:bg-gray-700 transition-colors"
		>
		Settings
		</Link>
		<Link
		to="/exit"
		className="px-3 py-1 rounded hover:bg-red-600 transition-colors"
		>
		Exit
		</Link>
	</div>
	</nav>
);
};

export default Navbar;
