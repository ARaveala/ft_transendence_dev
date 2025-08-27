// Shared TypeScript payload and response shapes

// Auth

// for new users
export interface RegisterUserPayload {
  username: string;
  password: string;
}

export interface RegisterUserResponse {
  status: 'REGISTERED' | 'ERROR';
  user_id?: string;   // if registration is successful
  jwt?: string;       // automatic login after successful registration
  error?: string;     // only in case of error
}


//for existing users
export interface LoginUserPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  status: 'AUTHENTICATED' | '2FA_REQUIRED | ERROR';
  jwt?: string;   // if authenticated successfully
  method?: 'TOTP' | 'EMAIL';   // only if 2FA is required (depends on selected method: authenticator vs email)
  error?: string;  // only in case of error 
}


// if 2FA is enabled in user profile
export interface TwoFactorPayload {
  username: string;
  code: string;
}

export interface TwoFactorResponse {
  status: 'AUTHENTICATED' | 'ERROR';
  jwt?: string;  // upon successful 2FA authentication 
  error?: string; // only in case of error
}


// User profile

export interface UserProfile {
  user_id: string;
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
  //online_status: boolean;
}

// is user enables/disables 2FA or changes avatar image on profile page, USERNAME CHANGE???

export interface UpdateProfilePayload {
  avatar?: string;
  twoFactor?: boolean;
}

export interface UpdateProfileResponse {
  status: 'UPDATED' | 'ERROR';
  profile?: UserProfile;
  error?: string;
} 


// Friends

export interface Friend {
  user_id: string;
  username: string;
  avatar?: string;
  online_status: boolean;
}

export interface FriendRequestPayload {
  friend_id: string;  // user_id of the user being added as friend
}

export interface FriendRequestResponse {
  status: 'ADDED' | 'REMOVED' | 'ERROR';
  friend?: Friend;
  error?: string;
}


// Matches

export interface Match {
  user_id: string;
  opponent: string;
  result: 'win' | 'loss';
  score: number;
  timestamp: string;
}

export interface Player {
  user_id: string;
  username: string;
  avatar: string;
  score: number;
  rank: number;
  //online_status: boolean;
}

export type PlayerPayload = Player[];

export interface MatchHistoryResponse {
  matches: Match[];
}


// Game creation

export interface CreateGamePayload {
  player1: string;
  player2: string;
}

export interface CreateGameResponse {
  game_id: string;                           // unique ID for the game session
  player1: { alias: string };
  player2: { alias: string };
  paddle1: PaddleState;                      // initial position of player1 paddle
  paddle2: PaddleState;                      // initial position of player2 paddle
  ball: BallState;                           // initial ball position and speed
  scorePlayer1: number;                            // initial score of player1
  scorePlayer2: number;                            // initial score of player1
  status: 'WAITING' |'PLAYING' | 'FINISHED'; // game status
}


// Game state

export interface PaddleState {
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}


// Player controls

export interface PaddleMovementPayload {
  game_id: string;                 // game ID
  side: 'LEFT' | 'RIGHT';          // which paddle moves
  action: 'UP' | 'DOWN' | 'STOP';
}

export interface PaddleMovementResponse {
  status: 'OK' | 'ERROR';
  error?: string; 
}


// Game state updates


export interface GameFinished {
  game_id: string;
  winner: 'PLAYER1' | 'PLAYER2';
  finalScorePlayer1: number;
  finalScorePlayer2: number;
}

/* handled through websockets??


export interface GameStateUpdate {
  game_id: string;                            // unique ID for the game session
  paddle1: PaddleState;                       // position of player1 paddle
  paddle2: PaddleState;                       // position of player2 paddle
  ball: BallState;                            // ball position and speed
  scorePlayer1: number;                       // score of player1
  scorePlayer2: number;                       // score of player1
  status: 'WAITING' |'PLAYING' | 'FINISHED';  // game status
}
*/


// Tournament

export interface CreateTournamentPayload {
  tournament_name: string;
  max_players: number;             // minimum 3, max can be set
}

export interface CreateTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  tournament_id?: string;     // unique ID for the tournament
  tournament_name?: string;
  max_players?: number;
  created_at?: string;        // timestamp
}


// Should these go over API endpoint or websocket??

export interface JoinTournamentPayload {
  tournament_id: string;
  tournament_name: string;
  alias: string;                  // player's temporary alias for the tournament
}

export interface JoinTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  players?: string[];       // updated list of aliases
}

export interface StartTournamentPayload {
  tournament_id: string;
}

export interface StartTournamentResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  current_match?: MatchInfo;    // first match info
}

export interface MatchInfo {
  game_id: string;
  player1: string;
  player2: string;
}

export interface MatchResultPayload {
  tournament_id: string;
  game_id: string;
  winner: string;
  scorePlayer1: number;
  scorePlayer2: number;
}

export interface MatchResultResponse {
  status: 'OK' | 'ERROR';
  error?: string;
  updated_tournament?: TournamentState;
}

/* over websocket??

export interface TournamentState {
  tournament_id: string;
  status: 'WAITING' | 'RUNNING' | 'FINISHED';
  players: string[];                            // aliases in this tournament
  current_match?: MatchInfo;                    // ongoing match
  upcoming_matches: MatchInfo[];                // matches yet to be played
  finished_matches: FinishedMatch[];            // completed matches
}

export interface FinishedMatch {
  game_id: string;
  player1: string;
  player2: string;
  winner: string;
  scorePlayer1: number;
  scorePlayer2: number;
}

export interface TournamentFinished {
  tournament_id: string;
  winner: string;
  final_results: Results[];
}

export interface Results {
  alias: string;
  position: number;
}

*/

