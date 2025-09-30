export interface TournamentPlayer {
  username: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
  score: number;
  isSelf?: boolean;
  password?: string; 
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
  status: 'pending' | 'ongoing' | 'finished';
  //lastUpdated: Date;
  //gameState?: any;
}

export interface TournamentState {
  tournament_id: string;
  status: 'waiting' | 'ongoing' | 'finished';
  players: TournamentPlayer[];
  currentMatch?: Match;
  bracket: Match[][];
  winner?: TournamentPlayer;
  createdAt?: Date;
  lastUpdated?: Date
}