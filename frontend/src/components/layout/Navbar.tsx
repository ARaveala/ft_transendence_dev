import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/Translation";
const Navbar: React.FC = () => {
	  const { t } = useTranslation();
  return (
    <nav className="p-4 bg-gray-800 flex gap-4">
      <Link to="/" className="hover:underline">{t("nav.home")}</Link>
      <Link to="/game" className="hover:underline">{t("nav.game")}</Link>
      <Link to="/tournament" className="hover:underline">{t("nav.tournament")}</Link>
      <Link to="/leaderboard" className="hover:underline">{t("nav.leaderboard")}</Link>
      <Link to="/friends" className="hover:underline">{t("nav.friends")}</Link>
      <div className="ml-auto flex gap-4">
        <Link to="/profile" className="hover:underline">{t("nav.profile")}</Link>
		<Link to="/settings" className="hover:underline">{t("nav.settings")}</Link>
        <Link to="/exit" className="hover:underline">{t("nav.exit")}</Link>
      </div>
    </nav>
  );
};

export default Navbar;
