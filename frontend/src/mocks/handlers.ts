
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";

import { http, HttpResponse } from "msw";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, PlayerPayload, Player, LeaderboardEntry } from "../../shared/payloads";
import type { RemovePlayerPayload, RemovePlayerResponse, StartTournamentPayload, StartTournamentResponse, VerifyPlayerPayload, VerifyPlayerResponse } from "../../shared/payloads";
import type { TournamentPlayer, Match, TournamentState } from "../types/tournament";
import { TBD_PLAYER } from "../../shared/constants";
import { mockUsers, MockUser } from "./players";
import { tournamentApi } from "../services/api";
import type {
	Friend,
	ChangeTwoFactorResponse,
	UploadAvatarResponse,
	UpdateProfileResponse,
} from "../../shared/payloads";

const tournamentsByToken: Record<string, TournamentState> = {};

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

let mockFriends: Friend[] = [
        { user_id: "1", username: "Player2", avatar: avatar2, online_status: true },
        { user_id: "2", username: "Player3", avatar: avatar3, online_status: false },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { username: "Al", avatar: avatar1, rank: 1, score: 250, online_status: true },
  { username: "Peggy", avatar: avatar2, rank: 2, score: 200, online_status: true },
  { username: "Dobby", avatar: avatar3, rank: 3, score: 180, online_status: false },
  { username: "Dixie", avatar: avatar1, rank: 4, score: 160, online_status: true },
  { username: "Carson", avatar: avatar2, rank: 5, score: 140, online_status: false },
];

let currentTournament: TournamentState | null = null;
let mockTwoFactor = false;
let uploadCounter = 1;

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
	
	//Mock for change 2FA
    http.post(API_PROTOCOL.CHANGE_2FA.path, async ({ request }) => {
            const body = await request.json();
            const enabled = !!body?.twoFactor;
            mockTwoFactor = enabled;
            mockProfile.twoFactor = mockTwoFactor;
                        
            const res: ChangeTwoFactorResponse = {
                    status: "UPDATED",
                    twoFactor: enabled,
            };     
            return HttpResponse.json(res, { status: 200 });
    }),

	//Mock for change avatar
    http.patch(API_PROTOCOL.CHANGE_AVATAR.path, async ({ request }) => {
            const body = await request.json();
            const newAvatar = body?.avatar as string | undefined;
            if (!newAvatar) {
                    return HttpResponse.json(
                            { status: "ERROR", error: "no avatar" } satisfies UpdateProfileResponse,
                            { status: 400 },
                    );
            }
            mockProfile.avatarFile = newAvatar;
            return HttpResponse.json(
                    { status: "UPDATED" } satisfies UpdateProfileResponse,
                    { status: 200 },
            );
    }),

	//Mock for upload avatar
	http.post(API_PROTOCOL.UPLOAD_AVATAR.path, async ({ request }) => {
            const form = await request.formData();
            const file = form.get("file");
                
            if (!(file instanceof File)) {
                    return HttpResponse.json(
                            { status: "ERROR", error: "no file"} satisfies UploadAvatarResponse,
                            { status: 400 }
                    );
            }
                
            const allowed = ["image/png", "image/jpeg", "image/webp"];
            if (!allowed.includes(file.type)) {
                    return HttpResponse.json(
                            { status: "ERROR", error: "bad type" } satisfies UploadAvatarResponse,
                            { status: 415 }
                    );
            }
                        
            const MAX = 2 * 1024 * 1024;
            if (file.size > MAX) {
                    return HttpResponse.json(
                            { status: "ERROR", error: "too large" } satisfies UploadAvatarResponse,
                            { status: 413 }
                    );
            }
                
            const url = `/uploads/custom-avatar-${uploadCounter++}.png`;
            mockProfile.avatarFile = url;
            return HttpResponse.json(
                    { status: "UPLOADED", url } satisfies UploadAvatarResponse,
                    { status: 200 }
            );
    }),     

	// Mock for get friends
    http.get(API_PROTOCOL.GET_FRIENDS.path, () => {
            return HttpResponse.json(mockFriends, { status: 200 }
            );
    }),

	// Mock for add friend
    http.post(API_PROTOCOL.ADD_FRIEND.path, async ({ request }) => {
            const body = await request.json();
            const friendId = body.friend_id ?? body.friendId;
            const username = body.username;
                                
            let toAdd: Friend | null = null;
                 
            if (friendId) {
                    if (mockFriends.some((f) => f.user_id === friendId)) {
                        return HttpResponse.json(
                            { status: "ADDED", friend: mockFriends.find(f => f.user_id === friendId) },
                            { status: 200 }
                    );
            }
                
            toAdd = {
                    user_id: friendId,
                    username: `User_${friendId}`,  
                    avatar: avatar2,
                    online_status: Math.random() > 0.5,
            };
        } else if (username) {
            const newId = String(Date.now());
            toAdd = {
                    user_id: newId,
                    username,
                    avatar: avatar1,
                    online_status: Math.random() > 0.5,
            };
        }

		if (!toAdd) {
                return HttpResponse.json(
                        { status: "ERROR", error: "Missing friend_id or username" },
                        { status: 400 }
                );
        }
                
        mockFriends.push(toAdd);
        return HttpResponse.json(
            { status: "ADDED", friend: toAdd },
            { status: 200 }
        );
    }),

	 // Mock for remove friend
        http.post(API_PROTOCOL.REMOVE_FRIEND.path, async ({ request }) => {
            const body = await request.json();
            const friendId = body.friend_id ?? body.friendId;
            if (!friendId) {
                    return HttpResponse.json(
                            { status: "ERROR", error: "Missing friend_id" },
                            { status: 400 }
                    );
            }
            mockFriends = mockFriends.filter((f) => f.user_id !== friendId);
            return HttpResponse.json(
                    { status: "REMOVED" },
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

  // Mock for player verification
  http.post(API_PROTOCOL.VERIFY_PLAYER.path, async ({ request }) => {
    const body = (await request.json()) as VerifyPlayerPayload;
    const { role, username, password, alias } = body;
    const storedUser = (mockUsers as MockUser[]).find((p) => p.username === username);

    if (!currentTournament) {
      return HttpResponse.json(
        { status: "ERROR", error: "No active tournament found" },
        { status: 400 }
      );
    }
    
     const selfPlayer = currentTournament.players.find(p => p.isSelf);
     const isSelf = selfPlayer && username === selfPlayer.username;

    if (!alias || alias.trim().length < 5) {
    const res: VerifyPlayerResponse = { 
      status: "ERROR",
      error: "Alias must be at least 5 characters",
      tournament: currentTournament
    };
    return HttpResponse.json(res, { status: 200 });
  }

    // Alias uniqueness check
    const duplicate = currentTournament.players.some(
      p => p.alias?.toLowerCase() === alias.toLowerCase() && p.role !== role
    );
    if (duplicate) {
      const res: VerifyPlayerResponse = { 
        status: "ERROR",
        error: "Alias already taken",
        tournament: currentTournament
      };
      return HttpResponse.json(res, { status: 200 });
    }

    if (!isSelf) {
    // Normal player verification
      const storedUser = (mockUsers as MockUser[]).find((p) => p.username === username);
      if (!storedUser) {
        const res: VerifyPlayerResponse = { 
          status: "ERROR",
          error: "Player not found",
          tournament: currentTournament
        };
        return HttpResponse.json(res, { status: 200 });
      }

      if (password !== storedUser.password) {
        const res: VerifyPlayerResponse = {
          status: "ERROR",
          error: "Invalid password",
          tournament: currentTournament
        };
        return HttpResponse.json(res, { status: 200 });
      }
    } else {
    // Logged-in player (skip password check)
    console.log("Mock: self alias verification for", username);
  }

  const updatedPlayers = [...currentTournament.players];
  const existingIndex = updatedPlayers.findIndex((p) => p.role === role);

  if (existingIndex !== -1) {
    updatedPlayers[existingIndex] = {
      ...updatedPlayers[existingIndex],
      username,
      alias,
      status: "ready",
      isVerified: true,
      role,
    };
  } else {

    // Add new player if not found
    updatedPlayers.push({
      username,
      alias,
      status: "ready",
      isVerified: true,
      isSelf: isSelf || false,
      role,
      score: 0,
    });
  }

  const verifiedCount = updatedPlayers.filter(p => p.isVerified).length;
  const totalPlayers = updatedPlayers.length;
  const pendingPlayers = totalPlayers - verifiedCount;
  const canStart = pendingPlayers === 0 && totalPlayers === 4;

  // Update tournament
  currentTournament = {
    ...currentTournament,
    players: updatedPlayers,
    pending_players: pendingPlayers,
    can_start: canStart,
    lastUpdated: new Date(),
  };

  console.log('Mock: Player verified', { role, username, alias, canStart, pendingPlayers });

  // Return updated tournament state
  const res: VerifyPlayerResponse = {
    status: "OK",
    tournament: currentTournament,
  } as any;

  return HttpResponse.json(res, { status: 200 });
}),

  // Mock for removing a player from the tournament
  http.post(API_PROTOCOL.REMOVE_PLAYER_FROM_TOURNAMENT.path, async ({ request }) => {
    const body = await request.json() as RemovePlayerPayload;
    const { tournament_id, role } = body;

    if (!currentTournament || currentTournament.tournament_id !== tournament_id) {
      return HttpResponse.json({
        status: "ERROR",
        error: "Tournament not found",
      }, { status: 400 });
    }

    // Remove the player
    const updatedPlayers = currentTournament.players.map(p =>
      p.role === role
        ? { ...p, username: "", alias: "", isVerified: false, status: "waiting" }
        : p
    );

    // Recalculate pending players and can_start
    const verifiedCount = updatedPlayers.filter(p => p.isVerified).length;
    const totalPlayers = updatedPlayers.length;
    const pendingPlayers = totalPlayers - verifiedCount;
    const canStart = pendingPlayers === 0 && totalPlayers === 4;

    // Update the tournament state
    currentTournament = {
      ...currentTournament,
      players: updatedPlayers,
      pending_players: pendingPlayers,
      can_start: canStart,
      lastUpdated: new Date(),
    };

  console.log('Mock: Player removed', { role, canStart, pendingPlayers });

  // Return updated tournament
  const res: RemovePlayerResponse = {
    status: "OK",
    tournament: currentTournament,
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
        isVerified: false,
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
  tournamentsByToken["localP1"] = tournament;

  return HttpResponse.json(
    { status: "OK", tournament },
    { status: 200 }
  );
  }),

  // Mock for getting active tournament (upon refresh)
  http.get(API_PROTOCOL.GET_ACTIVE_TOURNAMENT.path, async ({ request }) => {
    
    const playerToken = request.headers.get("Authorization") || "localP1";
    const tournament = tournamentsByToken[playerToken];

    if (!tournament) {
      return HttpResponse.json(
        { status: "ERROR", error: "No active tournament for this player" },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      { status: "OK", tournament },
      { status: 200 }
    );
  }),

  // Mock for starting a tournament
  http.post(API_PROTOCOL.START_TOURNAMENT.path, async ({ request }) => {
    const payload = (await request.json()) as StartTournamentPayload;

    const fullPlayers = currentTournament?.players || [];
    
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

    // Mock for leaderboard
  http.get(API_PROTOCOL.GET_LEADERBOARD.path, () => {
    console.log("Mock: GET leaderboard");
    return HttpResponse.json(
      {
        status: "OK",
        leaders: mockLeaderboard,
      },
      { status: 200 }
    );
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
  }),
  

];


