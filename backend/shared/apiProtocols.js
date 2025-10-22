const path = require("path");


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
    CREATE_GAME:  {
		path: '/api/create-game',
		method: 'POST',
	},
	START_GAME:  {
		path: '/api/start-game',
		method: 'POST',
	},
  JOIN_GAME:  {
		path: '/api/join-game',
		method: 'POST',
	},
  REPORT_GAME_RESULT: {
  path: '/api/game/result',
  method: 'POST',
  },
	GET_USER: {
		path: '/api/user/:id',
		method: 'GET',
	},
	GET_PROFILE: {
		path: '/api/profile',
		method: 'GET',

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

  ADD_FRIEND: {
    path: '/api/friends/add',
    method: 'POST',
  },

  ADD_PLAYER_TO_TOURNAMENT: {
    path: '/api/tournament/add-player',
    method: 'POST',
  },

  CREATE_TOURNAMENT: {
    path:'/api/tournaments',
    method: 'POST',
  },

  GAME_STATE: {
    path:'/api/game/local/:id/state',
    method: 'GET',
  },

  GET_ALL_REGISTERED_PLAYERS: {
    path: '/api/tournament/search',
    method: 'GET'
  },

  GET_FRIENDS: {
    path: '/api/friends',
    method: 'GET',
  },

  GET_LEADERBOARD: {
    path: '/api/leaderboard',
    method: 'GET',
  },

  GET_PLAYER: {
    path: '/api/player',
    method: 'GET',
  },

  GET_TOURNAMENT_STATE: {
    path: '/api/tournament/state',
    method: 'GET',
  },

  REGISTER_PLAYER_ALIAS: {
    path: "/api/tournament/register-alias",
    method: "POST",
  },

  START_TOURNAMENT: {
    path:'/api/tournament/:id/start',
    method: 'POST',
  },

  START_TOURNAMENT_MATCH: {
    path: '/api/tournament/:id/start-match',
    method: 'POST',
  },

  TOURNAMENT_STATE: {
    path: '/api/tournament/:id/state',
    method: 'POST',
  },

  UPDATE_PROFILE: {
    path: '/api/profile/update',
    method: 'POST',
  },

  VERIFY_PLAYER: {
  path: '/api/tournament/verify-player',
  method: 'POST',
  },
  CREATE_TOURNAMENT: {
	path: '/api/tournament',
	method: 'POST'
},
JOIN_TOURNAMENT: {
	path: '/api/tournament/:tid/join',
	method: 'POST'
},
START_TOURNAMENT:
{ 
	path: '/api/tournament/:tid/start',
	method: 'POST'
},
REPORT_GAME_RESULT:{
	path: '/api/games/result',
	method: 'POST' },
};


module.exports = { API_PROTOCOL };

//  GET_GAME_STATE: {
//    path: '/api/game/state',
//    method: 'GET',
//  },npm install @sinclair/typebox
