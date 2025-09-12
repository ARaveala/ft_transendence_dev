const path = require("path");

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
};

//const API_PROTOCOL = {
//  REGISTER_USER: {
//    path: '/api/register',
//    method: 'POST',
//  },
//  LOGIN_USER: {
//    path: '/api/login',
//    method: 'POST',
//  },
//  GET_USER: {
//    path: '/api/profile',
//    method: 'GET',
//  },
//  UPDATE_PROFILE: {
//    path: '/api/profile/update',
//    method: 'POST',
//  },
//  //GET_PROFILE: {
//  //  path: '/api/profile',
//  //  method: 'GET',
//  //},
//  GET_LEADERBOARD: {
//    path: '/api/leaderboard',
//    method: 'GET',
//  },
//  ADD_FRIEND: {
//    path: '/api/friends/add',
//    method: 'POST',
//  },
//  GET_FRIENDS: {
//    path: '/api/friends',
//    method: 'GET',
//  },
//
//  GET_PLAYER: {
//    path: '/api/player',
//    method: 'GET',
//  }
//} //as const; was in file that is .ts
module.exports = { API_PROTOCOL };

//  GET_GAME_STATE: {
//    path: '/api/game/state',
//    method: 'GET',
//  },npm install @sinclair/typebox
