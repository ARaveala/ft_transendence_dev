import React from "react";
import { useTranslation } from "../../shared/Translation";

const TournamentHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
  <header className="mb-6 text-center">
    <h1 className="text-3xl font-bold">{t("tournament.title")}</h1>
  </header>
  );
};

export default TournamentHeader;
