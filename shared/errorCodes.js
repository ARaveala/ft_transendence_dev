const ERROR_CODES = {
  VALIDATION_FAILED: {
    code: 400,
    message: 'Invalid input'
  },
  UNAUTHORIZED: {
    code: 401,
    message: 'Authentication required'
  },
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

module.exports = ERROR_CODES;
