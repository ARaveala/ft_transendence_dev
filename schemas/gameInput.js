fastify.post('/game/input', {
  schema: {
    body: {
      type: 'object',
      required: ['sessionId', 'playerId', 'action'],
      properties: {
        sessionId: { type: 'string' },
        playerId: { type: 'string' },
        action: { type: 'string' },
        direction: { type: 'string' }
      }
    }
  }
}, async (req, reply) => {
  // validated input is now safe to use
});