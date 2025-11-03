import React, { useState } from "react";
import { useTranslation } from "../../shared/Translation";

interface MiniLoginProps {
    gameId:string;
    onLoginSuccess: (player2Token: string) => void;
    onCancel: () => void;
}

const MiniLogin: React.FC<MiniLoginProps> = ({gameId, onLoginSuccess, onCancel }) => {
	const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

     const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

    try {
      const res = await fetch("/api/join-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          gameId,
          type: "login",
          username,
          password,
          mode: "local",
          player_count: 2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mini login failed");
      }
      
      onLoginSuccess(data.playerToken);
    } catch (err: any) {
      setError(t("error.auth.miniLoginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900/90 rounded-xl p-6 text-white shadow-lg">
      <h2 className="text-teal-400 text-2xl font-bold mb- text-center">{t("auth.loginAsPlayer2")}</h2>
      {error && <div className="mb-2 text-red-500">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder={t("auth.username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
          required
        />
        <input
          type="password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
          required
        />
        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition"
          >
            {loading ? t("auth.loggingIn") : t("auth.logIn")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MiniLogin;

