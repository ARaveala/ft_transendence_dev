# Creating a new tournament

## TournamentState type is used to store data related to a tournament

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

## Tournament logic 

1. Tournament (lobby) page is the parent of the other components
    * When "Start a new tournament" is clicked
        - Frontend sends ```CreateTournamentPayload``` to ```CREATE_TOURNAMENT``` API path
        - Backend generates a tournament_id  ```CreateTournamentResponse`` and returns it to frontend
2. PlayerSearch component: Frontend requests all registered players from the backend to show them in the drop-down menu
    * Frontend fetches players from ```GET_ALL_REGISTERED_PLAYERS``
    * Backend returns all registered players  ```PlayerSearchResponse```
3. Frontend displays search fields and "Add Player" button
4. When "Add Player" button is clicked, the player is added to the PlayerList component
5. PlayerList component shows username, password and alias fields for all added players
6. When a user enters a password
    * Frontend sends a verification request```VerifyPlayerPayload``` to ```VERIFY_PLAYER```
    * Backend returns ```VerifyPlayerResponse```
7. Frontend validates alias input based on specified rules
8. If user removes a player from the tournament, the frontend updates the tournamentPlayers accordingly
9. When all players have been verified and aliases provided, frontend enables "Start tournament" button
10. When "Start tournament" button is clicked
    * TournamentSetup page: Frontend sends ```StartTournamentPayload``` request to ```START_TOURNAMENT```
    * Backend responds with ```StartTournamentResponse``` which should include match ID for all matches and players for round1 matches
11. TournamentBracket component: Frontend renders a tournament bracket based on StartTournamentResponse
    * First round matches are known, others are TBD
    * Buttons for playing all three matches (enabled for first round matches)
12. TournamentLobby page: When Play button is clicked
    * Frontend sends ```StartTournamentMatchPayload``` to ```START_TOURNAMENT_MATCH```
    * Backend responds with ```StartTournamentMatchResponse```
13. Game frame rendering ???


