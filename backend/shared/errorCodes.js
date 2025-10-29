const ERROR_MESSAGES = {
  INVALID_USERNAME: 'Username does not exist',
  INVALID_PASSWORD: 'Incorrect password',
  INVALID_INPUT: 'Input format is incorrect',
  USER_NOT_VERIFIED: 'User account is not verified',
  DEFAULT_VALIDATION: 'Invalid input',
  DEFAULT_AUTH: 'Authentication required',
};

const ERROR_CODES = {
  VALIDATION_FAILED: {
    code: 400,
    message: 'Invalid input'
  },
  
  UNAUTHORIZED: (msgKey = 'DEFAULT_AUTH') =>({
    code: 401,
	message: ERROR_MESSAGES[msgKey] || ERROR_MESSAGES.DEFAULT_AUTH
  }),

  FORBIDDEN: {
    code: 403,
    message: 'Access denied'
  },
  NOT_FOUND: {
    code: 404,
    message: 'Resource not found'
  },
  CONFLICT: {
    code: 409,
    message: 'Conflict detected'
  },
  SERVER_ERROR: {
    code: 500,
    message: 'Unexpected server error'
  }
};

module.exports = {ERROR_CODES, ERROR_MESSAGES};