// Shared endpoint definitions for frontend & backend

export const API_PROTOCOL = {
  REGISTER_USER: {
    path: '/api/register',
    method: 'POST',
  },
  LOGIN_USER: {
    path: '/api/login',
    method: 'POST',
  },
  GET_USER: {
    path: '/api/user/:id',
    method: 'GET',
  },
  UPDATE_PROFILE: {
    path: '/api/profile/update',
    method: 'POST',
  },
  GET_PROFILE: {
    path: '/api/profile',
    method: 'GET',
  },
  GET_LEADERBOARD: {
    path: '/api/leaderboard',
    method: 'GET',
  },
  ADD_FRIEND: {
    path: '/api/friends/add',
    method: 'POST',
  },
  GET_FRIENDS: {
    path: '/api/friends',
    method: 'GET',
  },

  GET_PLAYER: {
    path: '/api/player',
    method: 'GET',
  },

  CREATE_GAME: {
    path:'/api/game/local',
    method: 'POST',
  },

  CREATE_TOURNAMENT: {
    path:'/api/tournament',
    method: 'POST',
  },

  GET_ALL_REGISTERED_PLAYERS: {
    path: '/api/tournament/search',
    method: 'GET'
  },

  VERIFY_PLAYER: {
  path: '/api/tournament/verify-player',
  method: 'POST',
  },

  ADD_PLAYER_TO_TOURNAMENT: {
    path: '/api/tournament/add-player',
    method: 'POST',
  },

  REGISTER_PLAYER_ALIAS: {
    path: "/api/tournament/register-alias",
    method: "POST",
  },

  JOIN_TOURNAMENT: {
    path:'/api/tournament/:id/join',
    method: 'POST',
  },

   START_TOURNAMENT: {
    path:'/api/tournament/start',
    method: 'POST',
  },

  /*START_TOURNAMENT: {
    path:'/api/tournament/:id/start',
    method: 'POST',
  }, */

  TOURNAMENT_STATE: {
    path: '/api/tournament/:id/state',
    method: 'POST',
  },

  GET_TOURNAMENT_STATE: {
    path: '/api/tournament/state',
    method: 'GET',
  },

  DELETE_PROFILE: {
	  path: '/api/profile',
	  method: 'DELETE',
  },

} as const;


/* handled through websockets??
  GAME_STATE: {
    path: 'game/local/:id/state,
    method: 'GET',
  }

*/ 
