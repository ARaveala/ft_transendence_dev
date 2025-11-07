/**
 * These are error codes matched to messages, do not change the variable holding the message
 * Fucntions are using the variable formats to pass on message ques, changing them may affect
 * code elsewhere and result in unaligned error messaging
 * 
 * Messages can be changed to your will, remeber that error code objects that use a key,
 * will return an object which must be decoded where used, if you want the specifci error messsage and code.
 * 
 * eg const error = ERROR_CODES.UNAUTHORIZED('MISSING_TOKEN');
			return reply.code(error.code).send({ error: error.message});

	code 500 is a catch all error, it may be better to call that or send it from the failing fucntion,
	so better context can be applied
 */

/**
 *  DEFAULT_AUTH: 'Authentication required', (is default message)
	INVALID_TOKEN: 'Invalid Token', (prompt a new login)
	MISSING_TOKEN: 'Missing Token', (could suggest tampered with , force logout)
	TOKEN_EXPIRED: 'Token expired , refresh',(prompt a new miniLogin, or if we choose
		to implemet refresh tokens, prompt refresh )
	USER_NOT_VERIFIED: 'User account is not verified', (somehow user is not logged in)
 */

const AUTH_ERROR_MSG = {
	DEFAULT_AUTH: 'Authentication required',
	INVALID_TOKEN: 'Invalid Token',
	MISSING_TOKEN: 'Missing Token',
	TOKEN_EXPIRED: 'Token expired , refresh',
	USER_NOT_VERIFIED: 'User account is not verified',
}

const VALIDATION_ERR = {
	PASSWORD: 'invalid password',
	DEFAULT: 'invalid input'
}

const ERROR_MESSAGES = {
	INVALID_USERNAME: 'Username does not exist',
	INVALID_PASSWORD: 'Incorrect password',
	INVALID_INPUT: 'Input format is incorrect',
	DEFAULT_VALIDATION: 'Invalid input',

};

const ERROR_CODES = {
  VALIDATION_FAILED: (msgKey = 'DEFAULT_AUTH') =>({
    code: 400,
	message: AUTH_ERROR_MSG[msgKey] || AUTH_ERROR_MSG.DEFAULT_AUTH
  }),
  
  UNAUTHORIZED: (msgKey = 'DEFAULT_AUTH') =>({
    code: 401,
	message: AUTH_ERROR_MSG[msgKey] || AUTH_ERROR_MSG.DEFAULT_AUTH
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