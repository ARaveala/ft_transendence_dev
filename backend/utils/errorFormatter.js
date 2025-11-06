const { ERROR_CODES } = require('@sharedErr');

function formatValidationError(error, msgType) {
    const issues = error.validation || [];
    return {
        error: "VALIDATION_FAILED",
        message: issue.message,
        code: 400
    }
}

function formatValidationError(error) {
    // If error.validation is truthy, issue becomes its first element,
    // otherwise an empty object
    const issue = (error.validation && error.validation[0]) || {};

    // Extract name of field
    const field = issue.instancePath?.replace('/', '') || '';

    // Message shouldn't give too much information,
    // so don't use issue.message which is too precise
    let message;
    if (field === 'username' || field === 'password') {
        message = "Invalid username or password";
    } else if (field === 'alias') {
        message = "Invalid alias";
    } else {
        message = "Validation error";
    }

    return {
        code: 400, // Bad Request
        error: "VALIDATION_FAILED",
        message // shorter syntax for "message: message"
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
