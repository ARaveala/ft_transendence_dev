// Shared TypeScript payload and response shapes
// this should be seperated into requests and response or labeled as request or response
export interface RegisterUserPayload {
  username: string;
  password: string;
}

export interface LoginUserPayload {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarFile?: string;
  twoFactor: boolean;
  rank: number;
  score: number;
  victories: number;
  losses: number;
  totalMatches: number;
  friends: Friend[];
  matchHistory: Match[];
}

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
}

export interface Match {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: number;
  timestamp: string;
}

export interface UpdateProfilePayload {
  avatar?: string;
  twoFactor?: boolean;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
}

export type PlayerPayload = Player[];