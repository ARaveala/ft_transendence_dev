// Shared endpoint definitions for frontend & backend

export const API_PROTOCOL = {
  REGISTER_USER: {
    path: '/register',
    method: 'POST',
  },
  LOGIN_USER: {
    path: '/login',
    method: 'POST',
  },
  GET_USER: {
    path: '/user/:id',
    method: 'GET',
  },
  UPDATE_PROFILE: {
    path: '/profile/update',
    method: 'POST',
  },
  GET_PROFILE: {
    path: '/profile',
    method: 'GET',
  },
  GET_LEADERBOARD: {
    path: '/leaderboard',
    method: 'GET',
  },
  ADD_FRIEND: {
    path: '/friends/add',
    method: 'POST',
  },
  GET_FRIENDS: {
    path: '/friends',
    method: 'GET',
  },

  GET_PLAYER: {
    path: '/player',
    method: 'GET',
  }
} as const;
