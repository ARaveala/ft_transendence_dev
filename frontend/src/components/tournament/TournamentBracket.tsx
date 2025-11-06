import React from "react";
import type { TournamentState, TournamentPlayer, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import { useTranslation } from "../../shared/Translation";

interface TournamentBracketProps {
	onStartMatch?: (match: Match) => void;    // callback when a match start is requested
	onCancel?: () => void                    // callback to cancel tournament
	onClose?: () => void                     // callback to close tournament
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
	onStartMatch,
	onCancel,
	onClose
}) => {
	const { t } = useTranslation();
	const { tournament } = useAuth(); // Always get the up-to-date tournament state

	if (!tournament || !tournament.bracket || tournament.bracket.length < 2) {
		return null;
	}

	if (!tournament.bracket[0] || !tournament.bracket[1] || !tournament.bracket[1][0]) {
		return null;
	}

	const firstRound = tournament.bracket[0];
	const finalMatch = tournament.bracket[1][0];

	const allMatchesFinished = firstRound.every(m => m.status === "finished") && finalMatch.status === "finished";

	/* Determines if a match can be started:
		- Round 1, Match 1: can be played if status is "pending"
		- Round 1, Match 2: can be played if Match 1 is "finished" and this match is "pending"
		- Final: both Round 1 matches must be "finished" and status must be "pending or ongoing???"
	*/
	const isMatchPlayable = (match: Match, round: number, idx: number): boolean => {
		if (match.status === "finished") {
			return false;
		}
		if (!tournament?.bracket)
			return false;

		if (round === 1)
		{
			if (idx === 0)
				return match.status === "pending";
			if (idx === 1) {
				const match1 = firstRound[0];
				return match1.status === "finished" && match.status === "pending";
			}
		}

		if (round === 2) {
				const allPrevFinished = firstRound.every(m => m.status === "finished");
				return allPrevFinished && (match.status === "pending" || match.status === "ongoing");
		}
		return false;
	};

	return (
	<div className="flex flex-col items-center mt-8 mt:mt-10 gap-4 md:gap-8 relative px-4">
		{/* Winner */}
		<div className="flex flex-col items-center">
			<h3 className="font-bold text-base md:text-lg mb-2">{t("tournament.winner")}</h3>
			<div className="p-2 md:p-3 border-2 border-cyan-600 bg-black text-white font-semibold rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
				{"🏆  " + (finalMatch?.winner ?? t("tournament.tbd"))}
			</div>
		</div>

		{/* Line from Winner to Final */}
		<div className="hidden md:block relative">
			<svg width="2" height="90" className="absolute -top-8 left-1/2">
						<line x1="1" y1="0" x2="1" y2="90" stroke="#6366F1" strokeWidth="2" />
					</svg>
		</div>

		{/* Final */}
		<div className="flex flex-col items-center gap-5 relative">
			<div className="relative flex justify-center gap-2 sm:gap-8 md:gap-48 lg:gap-72 items-center">
				<div className="flex flex-col items-center gap-2 relative">
					<div className="p-2 md:p-3 border-2 border-purple-600 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
						{firstRound[0].winner ?? t("tournament.tbd")}
					</div>
				</div>
				<div className="flex flex-col items-center gap-2 relative">
					<div className="p-2 md:p-3 border-2 border-purple-600 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
						{firstRound[1].winner ?? t("tournament.tbd")}
					</div>
				</div>
			
				{/* Horizontal line connecting players - Medium */}
				<svg width="194" height="2" className="hidden md:block lg:hidden absolute left-1/2 transform -translate-x-1/2">
					<line x1="0" y1="1" x2="194" y2="1" stroke="#6366F1" strokeWidth="2" />
				</svg>
				{/* Horizontal line connecting players - Large */}
				<svg width="288" height="2" className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
					<line x1="0" y1="1" x2="288" y2="1" stroke="#6366F1" strokeWidth="2" />
				</svg>
			
				{/* Vertical line down from final player1 center */}
				<svg width="2" height="50" className=" hidden md:block absolute top-12 left-20">
					<line x1="1" y1="2" x2="1" y2="50" stroke="#6366F1" strokeWidth="2" />
				</svg>
				{/* Vertical line down from final player2 center */}
				<svg width="2" height="50" className="hidden md:block absolute top-12 right-20">
					<line x1="1" y1="2" x2="1" y2="50" stroke="#6366F1" strokeWidth="2" />
				</svg>
		</div>

			<Button
				onClick={() => onStartMatch?.(finalMatch)}
				disabled={!isMatchPlayable(finalMatch, 2, 0)}
				className={`-mt-4 border-2
					${finalMatch.status === "finished"
						 ? "border-gray-600 bg-gray-900 text-gray-500 cursor-not-allowed"
						: !isMatchPlayable(finalMatch, 2, 0)
						? "border-indigo-500 bg-black text-gray-400 cursor-not-allowed"
						: "border-indigo-500 bg-black text-white hover:bg-indigo-700"
					}
				`}
				> 
					{t("tournament.playFinal")}
				</Button>
		</div>

		{/* Round 1 Matches */}
		<div className="flex flex-col sm:flex-row justify-center gap-8 lg:gap-28 mt-8 w-full max-w-6xl">
			{firstRound.map((match, idx) => (
				<div key={match.match_id} className="flex flex-col items-center gap-4 md:gap-6 relative">
					<div className="flex gap-2 md:gap-3">
						<div className="p-2 md:p-3 border-2 border-indigo-500 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
							{match.player1.alias}
						</div>
						<div className="p-2 md:p-3 border-2 border-indigo-500 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
							{match.player2.alias}
						</div>
					</div>
					
					{/* Horizontal line connecting players */}
					<svg width="170" height="2" className="hidden md:block absolute -top-14 left-20">
						<line x1="0" y1="1" x2="170" y2="1" stroke="#6366F1" strokeWidth="2" />
					</svg>

					{/* Vertical line up from first players */}
					<svg width="2" height="56" className=" hidden md:block absolute -top-14 left-20">
						<line x1="1" y1="0" x2="1" y2="56" stroke="#6366F1" strokeWidth="2" />
					</svg>
					{/* Vertical line up from second players */}
					<svg width="2" height="56" className="hidden md:block absolute -top-14 right-20">
						<line x1="1" y1="0" x2="1" y2="56" stroke="#6366F1" strokeWidth="2" />
					</svg>

					<Button
						onClick={() => onStartMatch?.(match)}
						disabled={!isMatchPlayable(match, 1, idx)}
						className={`
							border-2
							${match.status === "finished"
								? "border-gray-600 bg-gray-900 text-gray-500 cursor-not-allowed"
								: !isMatchPlayable(match, 1, idx)
								? "border-indigo-500 bg-black text-gray-400 cursor-not-allowed"
								: "border-indigo-500 bg-black text-white hover:bg-indigo-700"
							}
						`}
					>
						{t("tournament.playMatch")} {idx + 1}
					</Button>	
				</div>
			))}
		</div>

				{/* Close Tournament temporarily commented out until backend is ready */}
				<div className="mt-8">
					{/*
					{allMatchesFinished ? (
						<Button onClick={onClose}>
							{t("tournament.close")}
						</Button>
					)}
					*/}
						{onCancel && (
							<Button onClick={onCancel}>
								{t("tournament.cancel")}
							</Button>
						)}
				</div>
			
		</div>
	);
}
export default TournamentBracket;