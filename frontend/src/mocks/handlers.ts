
import avatar1 from "../assets/avatars/avatar1.png";
import avatar2 from "../assets/avatars/avatar2.png";
import avatar3 from "../assets/avatars/avatar3.png";

import { http, HttpResponse } from "msw";
import { API_PROTOCOL } from "../../shared/api-protocols";
import type { UserProfile, PlayerPayload } from "../../shared/payloads";
import type { VerifyPlayerPayload, PlayerSearchResponse } from "../../shared/payloads";
import type { TournamentPlayer, Match, Tournament } from "../types/tournament";
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

const mockPlayers: PlayerPayload = [
  { user_id: "123", username: "PlayerOne", avatar: avatar1, score: 1200, rank: 1 },
  { user_id: "124", username: "PlayerTwo", avatar: avatar2, score: 1100, rank: 2 },
  { user_id: "125", username: "PlayerThree", avatar: avatar3, score: 950, rank: 3 },
];

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
    return HttpResponse.json(mockPlayers, { status: 200 });
}),

 // Mock for tournament search: returns all registered players
  http.get(API_PROTOCOL.GET_ALL_REGISTERED_PLAYERS.path, () => {
    return HttpResponse.json(mockRegisteredPlayers, { status: 200 });
  }),
];
