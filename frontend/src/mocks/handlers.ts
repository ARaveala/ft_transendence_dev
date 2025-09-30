
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";

import { http, HttpResponse } from "msw";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, PlayerPayload } from "../../shared/payloads";
import type { VerifyPlayerPayload, PlayerSearchResponse } from "../../shared/payloads";
import type { TournamentPlayer, Match, TournamentState } from "../types/tournament";
import { TBD_PLAYER } from "../../shared/constants";
import { mockRegisteredPlayers } from "./players";


const mockProfile: UserProfile = {
  user_id: "123",
  username: "PlayerOne",
  avatarFile: avatar1,
  twoFactor: false,
  rank: 5,
  score: 1200,
  victories: 15,
  losses: 7,
  totalMatches: 22,
  friends: [
    { user_id: "1", username: "Player2", avatar: avatar2, online_status: true },
    { user_id: "2", username: "Player3", avatar: avatar3, online_status: false },
  ],
   matchHistory: [
    { user_id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
    { user_id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
  ],
};

export const handlers = [

  //Mock for delete profile
	http.delete(API_PROTOCOL.DELETE_PROFILE.path, async () => {
	  return HttpResponse.json(
	    { status: 'DELETED' },
	    { status: 200 }
	  );
	}),

  // Mock for registration response
  http.post(API_PROTOCOL.REGISTER_USER.path, async ({ request }) => {
    const data = await request.json();

    return HttpResponse.json(
      { message: "Mock registration successful!", user: data },
      { status: 200 }
    );
  }),

  // Mock for password verification
  http.post(API_PROTOCOL.VERIFY_PLAYER.path, async ({ request }) => {
    const body = (await request.json()) as VerifyPlayerPayload;
    const { username, password } = body;

  const player = mockRegisteredPlayers.find((p) => p.username === username);

  if (!player) {
    return HttpResponse.json(
      { valid: false, error: "Player not found" },
      { status: 200 }
    );
  }

  if (player.password !== password) {
    return HttpResponse.json(
      { valid: false, error: "Invalid password" },
      { status: 200 }
    );
  }
    return HttpResponse.json({ valid: true }, { status: 200 });
  }),

  // Mock for creating a new tournament
  http.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async ({ request }) => {
  const tournamentId = "tour-" + Date.now();

  const tournament: TournamentState = {
    tournament_id: tournamentId,
    status: "waiting",
    players: [
      {
        username: "currentUser",
        alias: "",
        status: "waiting",
        score: 0,
        isSelf: true,
      },
    ],
    bracket: [],            // no matches yet
    currentMatch: undefined,
    createdAt: new Date(),
  };

  return HttpResponse.json(
    { status: "OK", tournament },
    { status: 200 }
  );
  }),


  // Mock for starting a tournament
  http.post(API_PROTOCOL.START_TOURNAMENT.path, async ({ request }) => {
    const players = (await request.json()) as TournamentPlayer[] ;

    if (players.length < 4) {
      return HttpResponse.json(
        { status: "ERROR", error: "Need 4 players to start", tournament_id: "" },
        { status: 400 }
      );
    }
     // Assign a tournament ID
    const tournamentId = "tourney-" + Date.now();

    // First round matches
    const firstRound: Match[] = [
      {
        match_id: "m1",
        player1: players[0],
        player2: players[1],
        winner: TBD_PLAYER,
        status: "pending",
        score: { player1: 0, player2: 0 },
      },
      {
        match_id: "m2",
        player1: players[2],
        player2: players[3],
        winner: TBD_PLAYER,
        status: "pending",
        score: { player1: 0, player2: 0 },
      },
    ];

    // Bracket: array of rounds, each round is an array of matches
    const bracket: Match[][] = [
      firstRound,  // first round with real players
      firstRound.map(() => ({
        match_id: "tbd3",
        player1: {...TBD_PLAYER },
        player2: {...TBD_PLAYER },
        winner: {...TBD_PLAYER },
        status: "pending",
        score: { player1: 0, player2: 0 },
      })),
      // final round placeholder
      [
        {
          match_id: "tbd_final",
          player1: {...TBD_PLAYER },
          player2: {...TBD_PLAYER },
          winner: {...TBD_PLAYER },
          status: "pending",
          score: { player1: 0, player2: 0 },
        },
      ],
    ];

    const tournament: TournamentState = {
      tournament_id: tournamentId,
      status: "ongoing",
      players,
      bracket,
      currentMatch: firstRound[0],
      createdAt: new Date(),
    };

      return HttpResponse.json(
        { status: "OK", tournament},
        { status: 200 }
      );
    }),

  // Mock for profile fetch
  http.get(API_PROTOCOL.GET_PROFILE.path, () => {
    return HttpResponse.json(mockProfile, { status: 200 });
  }),

  // Mock profile update request
  http.post(API_PROTOCOL.UPDATE_PROFILE.path, async ({ request }) => {
    const updated = await request.json();
    // merge updated fields into mockProfile
    Object.assign(mockProfile, updated);
    return HttpResponse.json(mockProfile, { status: 200 });
  }),

  //Mock for leaderboard request
  http.get(API_PROTOCOL.GET_LEADERBOARD.path, () => {
    return HttpResponse.json(mockRegisteredPlayers, { status: 200 });
}),

// Mock for tournament search / get all registered players
  http.get(API_PROTOCOL.GET_ALL_REGISTERED_PLAYERS.path, async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("query")?.toLowerCase() || "";
    const excludeIdsParam = url.searchParams.get("excludeUsernames") || "";
    const excludeIds = excludeIdsParam.split(",").filter(Boolean);

    const filtered = mockRegisteredPlayers.filter(
      (p) =>
        p.username.toLowerCase().includes(query) &&
        !excludeIds.includes(p.username)
    );
    const response: PlayerSearchResponse = {
    status: "OK",
    players: filtered,
  };

  return HttpResponse.json(response, { status: 200 });
  }),
];

