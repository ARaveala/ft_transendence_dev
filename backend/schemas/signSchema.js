const signSchema = {
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
        pattern: '^[A-Za-z][A-Za-z0-9_]$',
        minLength: 6,
        maxLength: 12
      },
      password: {
        type: 'string',
        pattern: '^[a-zA-Z0-9!@#$%^&*()_\\-+=.]{8,16}$',
        minLength: 8,
        maxLength: 16
      }
    }
  }
};

module.exports = signSchema;
