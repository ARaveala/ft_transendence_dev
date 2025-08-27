
function formatValidationError(error, msgType) {
  const issues = error.validation || [];

  const messages = issues.map(issue => {
    const field = issue.instancePath.replace('/', '');
    const keyword = issue.keyword;

    if (field === 'username' && keyword === 'pattern') {
      return 'Username must not contain spaces or special characters';
    }

    if (field === 'username' && keyword === 'minLength') {
      return 'Username must be at least 3 characters long';
    }

    if (field === 'password' && keyword === 'minLength') {
      return 'Password must be at least 6 characters long';
    }

    return issue.message || 'Invalid input';
  });

  return {
    error: 'VALIDATION_FAILED',
	message: msgType || 'Invalid input',
    messages
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