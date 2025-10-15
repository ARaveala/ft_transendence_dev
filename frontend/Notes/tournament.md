# Creating a new tournament

## Basic types used to store data related to a tournament

```
export interface TournamentState {
  tournament_id: string;
  status: 'waiting' | 'ongoing' | 'finished';
  players: TournamentPlayer[];
  currentMatch?: Match;
  bracket: Match[][];
  winner?: TournamentPlayer;
  createdAt?: Date;               // not sure if this is needed
  lastUpdated?: Date              // not sure if this is needed
}
```
```
export interface TournamentPlayer {
  username: string;
  alias: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  avatar?: string;
  score: number;
  isSelf?: boolean;
  isVerified?: boolean;
}
```
```
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
```

## Tournament logic 

1. Tournament (lobby) page is the main entry point for the tournament and manages the other components
  * When "Start a new tournament" is clicked
    - Frontend sends ```CreateTournamentPayload``` to ```CREATE_TOURNAMENT``` API path
    - Backend generates a tournament_id  ```CreateTournamentResponse``` and returns it to frontend
2. PlayerSearch component: Frontend requests all registered players from the backend to show them in the drop-down menu
  * Frontend fetches players from ```GET_ALL_REGISTERED_PLAYERS```
  * Backend returns all registered players  ```PlayerSearchResponse```
3. Frontend displays search fields and "Add Player" button
4. When "Add Player" button is clicked, the player is added to the PlayerList
5. PlayerList component shows username, password and alias fields for all added players
6. When a user enters a password
  * Frontend sends a verification request```VerifyPlayerPayload``` to ```VERIFY_PLAYER```
  * Backend returns ```VerifyPlayerResponse```
7. Frontend validates alias input based on specified rules
8. If user removes a player from the tournament, the frontend updates the tournamentPlayers accordingly
9. When all players have been verified and aliases provided, frontend enables "Start tournament" button
10. When "Start tournament" button is clicked
  * TournamentSetup page: Frontend sends ```StartTournamentPayload``` request to ```START_TOURNAMENT```
  * Backend responds with ```StartTournamentResponse``` which should include match ID for all matches and players for    round1 matches
11. TournamentBracket component: Frontend renders a tournament bracket based on ```StartTournamentResponse```
  * First round matches are known, others are TBD
  * Buttons for playing all three matches (enabled for first round matches)
12. TournamentLobby page: When "Play Match" button is clicked
  * Frontend sends ```StartTournamentMatchPayload``` to ```START_TOURNAMENT_MATCH```
  * Backend responds with ```StartTournamentMatchResponse```
13. Game frame rendering


## Files related to tournament

### TournamentLobby.tsx
 
The main controller for the tournament flow

 Responsibilities:
 - Displays the header and main layout for the tournament page
 - Manages tournament state (create → setup → bracket → active match)
 - Creates a new tournament through backend API
 - Handles setup phase (adding and verifying players)
 - Switches to the bracket view once setup is complete
 - Starts individual matches and displays the Pong game in an iframe
 - Cleans up active match state when a match ends
 
 State Flow:
 - `tournament = null`: No tournament yet → show "Start new tournament" button
 - `tournament && showSetup = true`: Tournament created → show setup (player search & list)
 - `tournament && !showSetup`: Tournament ready/ongoing → show tournament bracket
 - `currentGameMatch && activeGameId`: A match is active → show Pong iframe

### TournamentSetup.tsx

Manages the setup phase of a tournament

 Responsibilities:
  - Fetches all registered players from the backend
  - Asks the user to add 3 players (the logged in player is always included)
  - Displays the selected players and requires verification from backend through password
  - Asks players to update their alias and gives an option to remove players
  - Ensures the setup is valid before allowing the tournament to start
  - When "Start tournament" is clicked, sends the tournament + player data to backend,
    builds the initial bracket structure, and notifies the parent via `onTournamentUpdated`

 State Flow:
  - `tournamentPlayers`: list of players in the tournament (starts with current user)
  - `allRegisteredPlayers`: all players fetched from backend (used for PlayerSearch)
  - `canStart`: set to `true` when validation passes (from PlayerList)
 
 ### PlayerSearch.tsx

Component for searching and adding players to a tournament

 Responsibilities:
  - Provides a text input for searching players by username
  - Displays a drop-down menu of players that match the search query
  - Excludes players that have already been added to the tournament
  - Allows adding a selected player through the "Add Player" button

 State Flow:
  - `query`: text input for filtering player list
  - `selectedPlayerUsername`: player currently selected in the dropdown
  - `filteredPlayers`: derived list of players based on query - excluded players
  - `tournamentFull`: disables adding when 4 players are already in tournament

 Sequence:
  1. User types into search → filters players in drop-down menu
  2. User selects a player from dropdown → clicks "Add Player"
  3. Component calls `onAddPlayer` → parent updates `addedPlayers`

 ### PlayerList.tsx

Component that manages the list of players added to the tournament

 Responsibilities:
  - Displays all players added to the tournament
  - Lets the logged-in user see their username but not edit/remove it
  - Lets other players:
    - Enter a password (for verification)
    - Enter a unique alias (must be at least 5 characters)
    - Validates inputs and reports back to parent via `onValidationChange`
    - Supports removing players (except logged in player)

 State Flow:
  - `errors`: per-player error messages (password or alias issues)
  - `onUpdatePlayer`: parent callback to update player fields
  - `onValidationChange`: tells parent whether all players are valid

  Sequence:
  1. Parent adds players via PlayerSearch → PlayerList renders them
  2. User types alias/password → validation executed
  3. If all aliases unique + all passwords valid → `onValidationChange(true)` → start button enabled

 ### TournamentBracket.tsx

 Component that visually renders a simple tournament bracket

 Structure:
  - 2 matches in the first round (4 players total)
  - 1 final match between the winners of round 1
  - Displays the eventual winner once the final has been played

 Responsibilities:
  - Shows each round of the tournament in a bracket-style layout with connecting lines
  - Displays players, current match statuses, and the winner when available
  - Allows matches to be started through `onStartMatch` callback

 Data Flow:
  - Input: `tournament` (state including players, matches, winners)
  - Output: Calls `onStartMatch(match)` when a user clicks to play a match

 Helpers:
  - `isMatchPlayable`: ensures matches can only be started when both players are ready

Sequence:
  1. Once all players are validated (PlayerList) → parent builds `tournament` state
  2. Bracket renders players in matches → waits for `winner` updates
  3. User clicks "Play Match" → calls `onStartMatch` → parent updates match results
  4. Winners propagate until final → bracket shows tournament winner