const usernameSchema = {
  body: {
    type: 'object',
    required: ['username'],
    properties: {
      username: { 
        type: 'string', 
        pattern: '^[a-zA-Z][a-zA-Z0-9_]{5,11}$',
        minLength: 6,
        maxLength: 12
      }
    },
  }
};

module.exports = usernameSchema;
