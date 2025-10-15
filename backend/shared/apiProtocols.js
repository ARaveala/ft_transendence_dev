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
  CREATE_TOURNAMENT: {
	path: '/api/tournaments',
	method: 'POST'
},
JOIN_TOURNAMENT: {
	path: '/api/tournaments/:tid/join',
	method: 'POST'
},
START_TOURNAMENT:
{ 
	path: '/api/tournaments/:tid/start',
	method: 'POST'
},
REPORT_GAME_RESULT:{
	path: '/api/games/result',
	method: 'POST' },
};


//} //as const; was in file that is .ts
module.exports = { API_PROTOCOL };

//  GET_GAME_STATE: {
//    path: '/api/game/state',
//    method: 'GET',
//  },npm install @sinclair/typebox
