// Import the Fastify framework
// Create a Fastify instance
// logger is enabled for debugging purposes

// use stict mode for better error handling

const fastify = require('fastify')({ logger: true });

// Declare a rget route for the homepage '/'
fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});

// Declare a route for a user's profile
// This is your first "dish" for the frontend
fastify.get('/user/:id', async (request, reply) => {
  const userId = request.params.id;
  // This is where you would call your database teammate's function
  // For now, we'll just return a placeholder
  const userData = {
    id: userId,
    username: `user_${userId}`,
    score: 100,
    status: 'online',
  };
  return userData;
});

fastify.get('/status', async (request, reply) => {
	const status = {"status": "API is online!"};
	return status;

});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();