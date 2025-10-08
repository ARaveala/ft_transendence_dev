
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";

import { http, HttpResponse } from "msw";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, PlayerPayload } from "../../shared/payloads";
import type { AddAliasPayload, AddAliasResponse, StartTournamentPayload, StartTournamentResponse, VerifyPlayerPayload, VerifyPlayerResponse } from "../../shared/payloads";
import type { TournamentPlayer, Match, TournamentState } from "../types/tournament";
import { TBD_PLAYER } from "../../shared/constants";
import { mockUsers, MockUser } from "./players";
import { tournamentApi } from "../services/api";

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

let currentTournament: TournamentState | null = null;

export const handlers = [
	// Mock for delete profile
	http.delete(API_PROTOCOL.DELETE_PROFILE.path, async () => {
		return HttpResponse.json(
			{ status: 'DELETED' }, 
			{ status: 200 }
		);
	}),

	// Mock for language change
	http.patch(API_PROTOCOL.CHANGE_LANGUAGE.path, async ({ request }) => {
		const body = await request.json();
		if (!body?.language) {
			return HttpResponse.json(
				{ status: "ERROR", error: "language required" }, 
				{ status: 400 }
			);
		}
		return HttpResponse.json(
			{ status: "UPDATED" }, 
			{ status: 200 }
		);
	}),

	// Mock for username change
	http.patch(API_PROTOCOL.CHANGE_USERNAME.path, async ({ request }) => {
		const body = await request.json();
		if (!body?.username || body.username.length < 3 || body.username.length > 15) {
			return HttpResponse.json(
				{ status: "ERROR", error: "invalid username" },
				{ status: 400 }
			);
		}
		return HttpResponse.json(
			{ status: "UPDATED" },
			{ status: 200 }
		);
	}),

	// Mock for change password
	http.patch(API_PROTOCOL.CHANGE_PASSWORD.path, async ({ request }) => {
		const body = await request.json();
		if (!body?.current_password || !body?.new_password) {
			return HttpResponse.json(
				{ status: "ERROR", error: "missing fields" },
				{ status: 400 }
			);
		}
		if (String(body.new_password).length < 8) {
			return HttpResponse.json(
				{ status: "ERROR", error: "password too short" },
				{ status: 400 }
			);
		}
		return HttpResponse.json(
			{ status: "UPDATED" },
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
    const { role, username, password } = body;
    const storedUser = (mockUsers as MockUser[]).find((p) => p.username === username);

    if (!storedUser) {
      const res: VerifyPlayerResponse = { status: "ERROR", error: "Player not found", tournament: currentTournament! };
      return HttpResponse.json(res, { status: 200 });
    }

    if (password !== storedUser.password) {
      const res: VerifyPlayerResponse = { status: "ERROR", error: "Invalid password", tournament: currentTournament! };
      return HttpResponse.json(res, { status: 200 }); // Return 200 for internal validation error
    }

    if (!currentTournament) {
      return HttpResponse.json(
        { status: "ERROR", error: "No active tournament found" },
        { status: 400 }
      );
    }
  const updatedPlayers = [...currentTournament.players];
  const existingIndex = updatedPlayers.findIndex((p) => p.role === role);

  if (existingIndex !== -1) {
    updatedPlayers[existingIndex] = {
      ...updatedPlayers[existingIndex],
      username,
      status: "ready",
      isVerified: true,
      role,
    };
  } else {

    // Add new player if not found
    updatedPlayers.push({
      username,
      alias: "",
      status: "ready",
      isVerified: true,
      isSelf: false,
      role,
      score: 0,
    });
  }

  // 4️⃣ Update tournament
  currentTournament = {
    ...currentTournament,
    players: updatedPlayers,
    lastUpdated: new Date(),
  };

  // 5️⃣ Return updated tournament state
  const res: VerifyPlayerResponse = {
    status: "OK",
    tournament: currentTournament,
  } as any;

  return HttpResponse.json(res, { status: 200 });
}),

  // Mock for adding/updating a player's alias
  http.post(API_PROTOCOL.ADD_ALIAS.path, async ({ request }) => {
    const body = (await request.json()) as AddAliasPayload;
    const { role, alias } = body;

    // Alias must be at least 5 characters
    if (!alias || alias.length < 5) {
      const res: AddAliasResponse = { 
        status: "ERROR", 
        error: "Alias must be at least 5 characters",
        tournament: currentTournament!, 
      };
      return HttpResponse.json(res, { status: 200 });
    }

    // Check for uniqueness among tournament players
    const duplicate = currentTournament?.players.some(
      (p) => p.role !== role && p.alias?.toLowerCase() === alias.toLowerCase()
    );
    if (duplicate) {
      const res: AddAliasResponse = { 
        status: "ERROR", 
        error: "Alias must be unique",
        tournament: currentTournament!,
      };
      return HttpResponse.json(res, { status: 200 });
    }

    // Update the alias for the specified player
    currentTournament = {
      ...currentTournament!,
      players: currentTournament!.players.map((p) =>
        p.role === role ? { ...p, alias } : p
      ),
    };

  const res: AddAliasResponse = {
    status: "OK",
    tournament: currentTournament!,
  };

  return HttpResponse.json(res, { status: 200 });
}),


  // Mock for creating a new tournament
  http.post(API_PROTOCOL.CREATE_TOURNAMENT.path, async ({ request }) => {
  const tournamentId = "tour-" + Date.now();

  const tournament: TournamentState = {
    tournament_id: tournamentId,
    owner: "player1",
    status: "waiting",
    players: [
      {
        username: "currentUser",
        alias: "",
        role: "player1",
        status: "ready",
        score: 0,
        isSelf: true,
        isVerified: true,
      },
      { username: "", alias: "", role: "player2", status: "waiting", score: 0, isVerified: false },
      { username: "", alias: "", role: "player3", status: "waiting", score: 0, isVerified: false },
      { username: "", alias: "", role: "player4", status: "waiting", score: 0, isVerified: false },
    ],
    bracket: [],            // no matches yet
    currentMatch: undefined,
    createdAt: new Date(),
  };

  currentTournament = tournament;

  return HttpResponse.json(
    { status: "OK", tournament },
    { status: 200 }
  );
  }),

  // Mock for starting a tournament
  http.post(API_PROTOCOL.START_TOURNAMENT.path, async ({ request }) => {

    const payload = (await request.json()) as StartTournamentPayload;

    if (!payload.players || payload.players.length < 4) {
      const res: StartTournamentResponse = {
        status: "ERROR",
        error: "Need 4 players to start",
        tournament: currentTournament,
      };
      return HttpResponse.json(res, { status: 400 });
    }

    const fullPlayers: TournamentPlayer[] = payload.players.map((p, index) => ({
      username: p.username,
      alias: p.alias,
      isSelf: p.isSelf || false,
      isVerified: p.isVerified || false,
      role: `player${index + 1}`,
      status: 'ready',
      score: 0,
    }));

    // First round matches
    const firstRound: Match[] = [
      {
        match_id: "round1match1",
        player1: fullPlayers[0],
        player2: fullPlayers[1],
        winner: TBD_PLAYER,
        status: "pending",
        score: { player1: 0, player2: 0 },
      },
      {
        match_id: "round1match2",
        player1: fullPlayers[2],
        player2: fullPlayers[3],
        winner: TBD_PLAYER,
        status: "pending",
        score: { player1: 0, player2: 0 },
      },
    ];

    const final: Match = {
      match_id: "finalmatch",
      player1: { ...TBD_PLAYER },
      player2: { ...TBD_PLAYER },
      winner: { ...TBD_PLAYER },
      status: "pending",
      score: { player1: 0, player2: 0 },
    };

    // Bracket: array of rounds, each round is an array of matches
    const bracket: Match[][] = [
      firstRound,  // first round with real players
      [final],
    ];

    const tournamentId = currentTournament?.tournament_id || "tour-" + Date.now();
    
    const tournament: TournamentState = {
      tournament_id: tournamentId,
      status: "ongoing",
      owner: fullPlayers[0].username,
      players: fullPlayers,
      bracket,
      currentMatch: firstRound[0],
      createdAt: new Date(),
    };

    currentTournament = tournament;

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
    return HttpResponse.json(mockUsers, { status: 200 });
}),


  // Mock for fetching a tournament by its ID
  http.get('/api/tournament/:tournamentId', async ({ params }) => {
    const { tournamentId } = params;

    if (!currentTournament || currentTournament.tournament_id !== tournamentId) {
      return HttpResponse.json({ status: 'ERROR', error: 'Tournament not found' }, { status: 404 });
    }

    return HttpResponse.json({ status: 'OK', tournament: currentTournament }, { status: 200 });
  }),


  // Mock for starting a tournament match
  http.post('/api/tournament/:tournamentId/start-match', async ({ params, request }) => {
  const { tournamentId } = params;
  const { match_id } = await request.json() as { match_id: string };
  
  console.log('Mock: Starting match', match_id, 'in tournament', tournamentId);

  if (!currentTournament) {
      return HttpResponse.json(
        { error: 'No tournament found' },
        { status: 404 }
      );
    }
  
  const updatedBracket = currentTournament.bracket.map(round =>
      round.map(match => {
        if (match.match_id !== match_id) return match;
        return {
          ...match,
          status: "ongoing" as const,
          score: { player1: 0, player2: 0 },
        };
      })
    );

  const currentMatch: Match | undefined = updatedBracket
    .flat()
    .find((m) => m.match_id === match_id);

  currentTournament = {
    ...currentTournament,
    bracket: updatedBracket,
    currentMatch,
  };
    
  return HttpResponse.json({
    status: "OK",
    tournament: currentTournament,
    playerTokens: { player1: "p1", player2: "p2"},
    });
  }),

  // Mock for canceling a tournament
  http.delete(API_PROTOCOL.CANCEL_TOURNAMENT.path, async ({ params, request }) => {
    const { tournamentId } = params;

     console.log('Mock: Cancel tournament called');

    // Simulate success
    currentTournament = null;
    return HttpResponse.json(
      { status: 'OK' },
      { status: 200 }
    );
  })
];


