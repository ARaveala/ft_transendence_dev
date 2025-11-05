// Shared endpoint definitions for frontend & backend

const API_PROTOCOL = {
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

TFA_SETUP: {
	path: '/api/2fa/setup',
    method: 'POST',
  },

  TFA_VERIFY: {
	path: '/api/2fa/verify',
	method: 'POST',
  },

  TFA_DISABLE: {
	path: '/api/2fa/disable',
    method: 'POST',
  },

  TFA_STATUS: {
	path: '/api/2fa/status',
    method: 'GET',
  },

  TFA_LOGIN_VERIFY: {
	path: '/api/2fa/login-verify',
	method: 'POST',
  }
}


/* handled through websockets??
  GAME_STATE: {
    path: 'game/local/:id/state,
    method: 'GET',
  }

*/ 

module.exports = { API_PROTOCOL };
