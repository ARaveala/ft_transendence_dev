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

  JOIN_TOURNAMENT: {
    path:'/api/tournament/:id/join',
    method: 'POST',
  },

  START_TOURNAMENT: {
    path:'/api/tournament/:id/start',
    method: 'POST',
  },

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
	  path: '/profile',
	  method: 'DELETE',
  },

  CHANGE_LANGUAGE: {
	  path: '/profile/language',
	  method: 'PATCH',
  },

  CHANGE_USERNAME: {
	  path: 'profile/username',
	  method: 'PATCH',
  },

  CHANGE_PASSWORD: {
	  path: 'profile/password',
	  method: 'PATCH',
  },

  CHANGE_AVATAR: {
	  path: 'profile/avatar',
	  method: 'PATCH',
  }


} as const;


/* handled through websockets??
  GAME_STATE: {
    path: 'game/local/:id/state,
    method: 'GET',
  }

*/ 
