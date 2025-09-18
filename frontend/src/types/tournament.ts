export interface TournamentPlayer {
  user_id: string;
  username: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
  score: number;
}

export interface Match {
  match_id: string;
  player1: TournamentPlayer;
  player2: TournamentPlayer;
  winner?: TournamentPlayer;
  score?: {
    player1: number;
    player2: number;
  };
  status: 'pending' | 'active' | 'finished';
  lastUpdated: Date;
  gameState?: any;
}

export interface Tournament {
  tournament_id: string;
  status: 'waiting' | 'active' | 'finished';
  players: TournamentPlayer[];
  matches: Match[];
  bracket: Match[][];
  currentMatch?: Match;
  winner?: TournamentPlayer;
  createdAt: Date;
  lastUpdated?: Date
}