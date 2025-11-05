const { ERROR_CODES }= require('@sharedErr');

function formatValidationError(error, msgType) {
  const issues = error.validation || [];

  const errorType = issues.map(issue => {
    const field = issue.instancePath.replace('/', '');
    const keyword = issue.keyword;

    if (field === 'username' && keyword === 'pattern') {
      return ERROR_CODES.VALIDATION_FAILED; 
    }

    if (field === 'username' && keyword === 'minLength') {
      return ERROR_CODES.VALIDATION_FAILED; 
    }

    if (field === 'password' && keyword === 'minLength') {
      return ERROR_CODES.VALIDATION_FAILED; 
    }

    return { message: issue.message, code: 500 } || { message: 'Invalid input', code: 500 };
  });

  return {
    error: 'VALIDATION_FAILED',
	message: msgType || 'Invalid input',
    errorType: errorType[0]
  };
}



function formatServerError(error) {
  return {
    error: 'SERVER_ERROR',
    message: error.message || 'Unexpected error occurred'
  };
}

module.exports = {
  formatValidationError,
  formatServerError
};