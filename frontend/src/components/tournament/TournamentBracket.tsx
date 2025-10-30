import React from "react";
import type { TournamentState, TournamentPlayer, Match } from "../../types/tournament";
import { TBD_PLAYER } from "../../../shared/constants";
import { API_PROTOCOL } from "../../../shared/api-protocols";
import Button from "../ui/Button";

interface TournamentBracketProps {
	tournament: TournamentState;
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
	tournament,
	onStartMatch,
	onCancel,
	lastMatchResult
}) => {

	const firstRound = tournament.bracket?.[0] ?? [];// 2 matches with 2 players each
	console.log("Bracket round 1:", firstRound);

	const firstRoundUpdated = firstRound.map((match) => {
	if (lastMatchResult?.gameId === match.match_id) {
		return {
			...match,
			winner: {
				username: lastMatchResult.winner,
				alias: lastMatchResult.winner,
				status: "finished",
				role: "player",
				isVerified: true,
			} as TournamentPlayer,
			loser: {
				username: lastMatchResult.loser,
				alias: lastMatchResult.loser,
				status: "finished",
				role: "player",
				isVerified: true,
			} as TournamentPlayer,
			score: lastMatchResult.score,
			status: "finished",
		};
	}
	return match;
	});


	if (!tournament.bracket)
			return;
	
	const lastRound = tournament.bracket[tournament.bracket.length - 1];
	const finalMatch = lastRound[0];

	 /* Determines if a match can be started:
		- Round 1: match is "pending"
		- Final: both winners must be known and status "pending"
	 */
	const isMatchPlayable = (match: Match, round: number, idx: number): boolean => {
		if (!tournament?.bracket)
			return false;
		if (match.status === "finished")
			return false;
		if (round === 1)
		{
			if (idx === 0)
				return match.status === "pending";
			const prevMatch = tournament.bracket?.[0][idx - 1];
			return prevMatch?.status === "finished" && match.status === "pending";
		}

		if (round === 2) {
				const prevRound = tournament.bracket[0]; // Round 1
				const allPrevFinished = prevRound.every(m => m.status === "finished");
				return allPrevFinished && match.status === "pending";
		}
		return false;
	};

	return (
	<div className="flex flex-col items-center mt-8 mt:mt-10 gap-4 md:gap-8 relative px-4">
		{/* Winner */}
		<div className="flex flex-col items-center">
			<h3 className="font-bold text-base md:text-lg mb-2">Winner</h3>
			<div className="p-2 md:p-3 border-2 border-cyan-600 bg-black text-white font-semibold rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
				{finalMatch.winner?.alias ?? "TBD"}
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
						{finalMatch.player1.alias}
					</div>
				</div>
				<div className="flex flex-col items-center gap-2 relative">
					<div className="p-2 md:p-3 border-2 border-purple-600  bg-black text-white rounded-xl w-32 md:w-40 text-center text-sm md:text-base">
						{finalMatch.player2.alias}
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
				Play final
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
					>
						Play match {idx + 1}
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