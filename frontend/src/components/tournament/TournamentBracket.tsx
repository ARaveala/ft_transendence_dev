import React from "react";
import type { TournamentState, TournamentPlayer, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

interface TournamentBracketProps {
	onStartMatch?: (match: Match) => void;    // callback when a match start is requested
	onCancel?: () => void                    // callback to cancel tournament
	lastMatchResult?: {
		gameId: string;
		winner: string;
		loser: string;
		score: [number, number]
	} | null;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
	onStartMatch,
	onCancel,
	lastMatchResult
}) => {

	const { tournament } = useAuth(); // Always get the up-to-date tournament state
	console.log("=== BRACKET RENDER ===");
	console.log("Tournament from context:", tournament);
	console.log("Tournament ID:", tournament?.tournament_id);
	console.log("Tournament status:", tournament?.status);

	if (!tournament || !tournament.bracket) return null;

	const firstRound = tournament.bracket[0];
	const finalMatch = tournament.bracket[1][0];
	console.log("First round:", firstRound);
	console.log("Match 1:", firstRound[0]);
	console.log("Match 1 status:", firstRound[0]?.status);
	console.log("Match 1 winner:", firstRound[0]?.winner);
	console.log("Match 2:", firstRound[1]);
	console.log("Match 2 status:", firstRound[1]?.status);
	console.log("Final match:", finalMatch);

	 /* Determines if a match can be started:
		- Round 1, Match 1: can be played if status is "pending"
		- Round 1, Match 2: can be played if Match 1 is "finished" and this match is "pending"
		- Final: both Round 1 matches must be "finished" and status must be "pending"
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
				return allPrevFinished && match.status === "pending";
		}
		return false;
	};

	const getMatchDisplay = (match: Match) => {
		if (match.status === "finished" && match.score) {
			return `${match.winner?.alias} (${match.score.player1}-${match.score.player2})`;
		}
		return match.winner?.alias ?? "TBD";
	};

	return (
	<div className="flex flex-col items-center mt-8 mt:mt-10 gap-4 md:gap-8 relative px-4">
		{/* Winner */}
		<div className="flex flex-col items-center">
			<h3 className="font-bold text-base md:text-lg mb-2">Winner</h3>
			<div className="p-2 md:p-3 border-2 border-cyan-600 bg-black text-white font-semibold rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
				{finalMatch?.winner?.alias ?? "TBD"}
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
						{firstRound[0].winner?.alias ?? "TBD"}
					</div>
				</div>
				<div className="flex flex-col items-center gap-2 relative">
					<div className="p-2 md:p-3 border-2 border-purple-600  bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
						{firstRound[1].winner?.alias ?? "TBD"}
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
				className="-mt-4"
			>
				{finalMatch.status === "finished" ? "Final Complete" : "Play Final"}
			</Button>
		</div>

		{/* Round 1 Matches */}
		<div className="flex flex-col sm:flex-row justify-center gap-8 lg:gap-28 mt-8 w-full max-w-6xl">
			{firstRound.map((match, idx) => (
				<div key={match.match_id} className="flex flex-col items-center gap-4 md:gap-6 relative">
					<div className="flex gap-2 md:gap-3">
						<div className="p-2 md:p-3 border-2 ${match.player1.alias === match.winner?.alias ? 'border-green-500 : border-indigo-500 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
							{match.player1.alias}
							{match.status === "finished" && match.score && (
								<div className="text-xs text-gray-400 mt-1">
									{match.score.player1}
								</div>
							)}
						</div>
						<div className="p-2 md:p-3 border-2 ${match.player2.alias === match.winner?.alias ? 'border-green-500 : border-indigo-500 bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
							{match.player2.alias}
							{match.status === "finished" && match.score && (
								<div className="text-xs text-gray-400 mt-1">
									{match.score.player2}
								</div>
							)}
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
					>
						{match.status === "finished" 
								? `Match ${idx + 1} Complete` 
								: `Play Match ${idx + 1}`
							}
					</Button>
				</div>
			 ))}
			</div>

				{/* Cancel button at the bottom */}
				{onCancel && (
					<div className="mt-8">
						<Button 
							onClick={onCancel}
							>
								Cancel Tournament
					</Button>
				</div>
			)}
		</div>
	);
}
export default TournamentBracket;