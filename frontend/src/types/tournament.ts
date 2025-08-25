export interface Player {
  id: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner?: Player;
  score?: {
    player1: number;
    player2: number;
  };
  status: 'pending' | 'active' | 'completed';
}

export interface Tournament {
  id: string;
  status: 'waiting' | 'active' | 'completed';
  players: Player[];
  matches: Match[];
  bracket: Match[][];
  currentMatch?: Match;
  createdAt: Date;
}