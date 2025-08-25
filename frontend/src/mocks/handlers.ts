import { http, HttpResponse } from "msw";

const mockProfile = {
  username: "PlayerOne",
  avatarFile: "avatars/avatar1.png",
  twoFactor: false,
  rank: 5,
  score: 1200,
  victories: 15,
  losses: 7,
  totalMatches: 22,
  friends: [
    { id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
    { id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
  ],
   matchHistory: [
    { id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
    { id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
  ],
};

export const handlers = [
  // Mock for registration response
  http.post("http://localhost:3000/register", async ({ request }) => {
    const data = await request.json();

    return HttpResponse.json(
      { message: "Mock registration successful!", user: data },
      { status: 200 }
    );
  }),

// Mock for profile fetch
  http.get("http://localhost:3000/profile", () => {
    return HttpResponse.json(mockProfile, { status: 200 });
  }),

  // Mock profile update request
  http.post("http://localhost:3000/profile/update", async ({ request }) => {
    const updated = await request.json();
    // merge updated fields into mockProfile
    Object.assign(mockProfile, updated);
    return HttpResponse.json(mockProfile, { status: 200 });
  }),

  //Mock for leaderboard request
  http.get("http://localhost:3000/leaderboard", () => {
    const mockPlayers = [
      { rank: 1, username: "PlayerOne", avatar: "/avatars/avatar1.png", score: 1200 },
      { rank: 2, username: "PlayerTwo", avatar: "/avatars/avatar2.png", score: 1100 },
      { rank: 3, username: "PlayerThree", avatar: "/avatars/avatar3.png", score: 950 },
    ];

  return HttpResponse.json(mockPlayers, { status: 200 });
}),

];
