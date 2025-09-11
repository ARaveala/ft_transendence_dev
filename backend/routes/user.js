// This file is now a playground
// this comment // @ts-check  enables type checking and IDEs autocompletion for this file when seperated

// schemas do some validation , this one checks score is a number
const updateScoreSchema = require('@schemas/updateScore.js');

//const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
/**
 
 */

console.log('API_PROTOCOL:', API_PROTOCOL);



// Declare a route for getting entire user profile based on id
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password

/**
 * 
 * try {
  const decoded = jwt.verify(token, secret);
} catch (err) {
  if (err.name === 'TokenExpiredError') {
	return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}
 */


async function changeScore(fastify, options) {
	const { DBupdate} = options;
	fastify.patch('/update-score/:id', {
	schema: updateScoreSchema,
	handler: async (request, reply) => {
		const userId = request.params.id;
		const { score } = request.body;

		try {
			const result = await DBupdate.updateUserScore({userId, score});
			reply.send(result);
		} catch (err) {
			reply.code(500).send(err);
		}
	}
	});
}




// This allows the module to be used in other files
async function userRoutes(fastify, options) {
  await changeScore(fastify, options);
}

module.exports = userRoutes;

