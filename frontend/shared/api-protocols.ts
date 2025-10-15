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

  REMOVE_FRIEND: {
	  path: '/api//friends/remove',
	  method: 'POST'
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
    path:'/api/tournaments',
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

  START_TOURNAMENT: {
    path:'/api/tournament/:id/start',
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

  START_TOURNAMENT_MATCH: {
    path: '/api/tournament/:id/start-match',
    method: 'POST',
  },

  LOGOUT_USER: {
	  path: '/api/logout',
	  method: 'POST',
  },

// SettingsPage;

  DELETE_PROFILE: {
	  path: '/api/profile',
	  method: 'DELETE',
  },

  CHANGE_LANGUAGE: {
	  path: '/api/profile/language',
	  method: 'PATCH',
  },

  CHANGE_USERNAME: {
	  path: '/api/profile/username',
	  method: 'PATCH',
  },

  CHANGE_PASSWORD: {
	  path: '/api/profile/password',
	  method: 'PATCH',
  },

  CHANGE_AVATAR: {
	  path: '/api/profile/avatar',
	  method: 'PATCH',
  },

  UPLOAD_AVATAR: {
	  path: '/api/profile/avatar',
	  method: 'POST',
  },

  CHANGE_2FA: {
	  path: '/api/profile/2fa',
	  method: 'POST',
  }

} as const;


/* handled through websockets??
  GAME_STATE: {
    path: 'game/local/:id/state,
    method: 'GET',
  }

*/ 
