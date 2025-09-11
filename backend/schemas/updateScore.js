const updateScoreSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'number' } // or 'string' if your IDs are alphanumeric
    },
    required: ['id']
  },
  body: {
    type: 'object',
    properties: {
      score: { type: 'number', minimum: 0 }
    },
    required: ['score']
  },
  errorMessage: { // this needs a different addition to work with fastify
      required: {
        score: 'Score is required'
      },
      properties: {
        score: 'Score must be a valid number'
      }
    }
};

module.exports = updateScoreSchema;