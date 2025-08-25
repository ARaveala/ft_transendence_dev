// insert whole module to keep code clean
const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js');
const DBupdate = require('@db/update.js');
// api path determines the route for adding new user

// schemas do some validation , this one checks score is a number
const updateScoreSchema = require('@schemas/updateScore.js');
// this does not yet validate the input! 
// does username exist, is password safe, etc.

// idea: write 
//class {
//	registerUser
//	getUser
//	changeScore
//}
//
//// Frontend
//function registerUser(data)
//{
//	fetch()
//	{
//		POST:
//		DATA
//	}
//}

async function registerUser(fastify, options) {
    fastify.post('/register-user/username', async (request, reply) => {
        const { username, password, score, status } = request.body;
        console.log('Incoming user data:', request.body);

        try {
            const result = await DBinsert.insertUser({ username, password, score, status });
            reply.send(result);
        } catch (err) {
            reply.code(500).send(err);
        }
    });
}

// Declare a route for getting entire user profile based on id
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password
async function getUser(fastify, options) {
	fastify.get('/user/:id', async (request, reply) => {
		const userId = request.params.id;
		console.log('Fetching user with ID:', userId);
		try {
			const result = await DBget.fetchUser({userId});
			reply.send(result);
		} catch (err) {
			reply.code(500).send(err);
		}
	});
}




async function changeScore(fastify, options) {
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
  await registerUser(fastify, options);
  await getUser(fastify, options);
  await changeScore(fastify, options);
}

module.exports = userRoutes;
//module.exports = registerUser;
//module.exports = getUser;
