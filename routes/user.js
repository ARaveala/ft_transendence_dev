// insert whole module to keep code clean
const db = require('@db/initDB.js');
const DBinsert = require('@db/insert.js');
const DBget = require('@db/get.js');
const DBupdate = require('@db/update.js');
const secure = require('@security');
// api path determines the route for adding new user

// schemas do some validation , this one checks score is a number
const updateScoreSchema = require('@schemas/updateScore.js');

const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');

//const {formatError} = require("@errors");
//const { formatValidationError } = require('../utils/errorFormatter');

console.log('API_PROTOCOL:', API_PROTOCOL);


async function registerUser(fastify, options) {
	fastify.post(API_PROTOCOL.REGISTER_USER.path, {
	  schema: { body: schemas.RegisterUser }
	}, async (request, reply) => {
		const { username, password, score, status } = request.body;
	  	console.log('Incoming user data:', request.body);
		try {
	       const result = await DBinsert.insertUser({ username, password, score, status });
		console.log('User registration result:', result);
		   reply.send(result);
	    } catch (err) {
	    
			reply.code(500).send(err);
	    }
	});
}


async function loginUser(fastify, options) {
	fastify.post(API_PROTOCOL.LOGIN_USER.path, {
	}, async (request, reply) => {
		const { username, password} = request.body;
	  	console.log('Incoming user data:', request.body);
		try {
	       	const result = await DBinsert.loginUser({ username, password});
			// if user 2fa -> securty.js handle that
			// dev testing for now
			const token = secure.generateToken(result);
		    secure.setAuthCookie(reply, token);
			


			console.log('User registration result:', result);
		  	reply.code(200).send('ok');
			//reply.send(result);
	    } catch (err) {
			console.log(('Error during login:', err));
	        reply.code(500).send(err);
	    }
	});
}

// Declare a route for getting entire user profile based on id
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password
async function getUser(fastify, options) {
	fastify.get(API_PROTOCOL.GET_USER.path,{
	}, async (request, reply) => {
		const token = request.cookies.auth_token;

		console.log('Cookies in get User:', request.cookies);

		const userId = secure.getUserIdFromToken(token);

		const mockProfile = {
		 		 username: "PlayerOne",
		 		 avatarFile: "avatars/avatar1.png",
		 		 twoFactor: false,
		 		 rank: 5,
		 		 score: 1200,
		 		 victories: 15,
		 		 losses: 7,
		 		 totalMatches: 22,
		 		 friends: [
		 		   { id: "1", username: "Player2", avatar: "/avatars/avatar2.png" },
		 		   { id: "2", username: "Player3", avatar: "/avatars/avatar3.png" },
		 		 ],
		 		  matchHistory: [
		 		   { id: "m1", opponent: "Player2", result: "win", score: 21, timestamp: "2025-08-25T12:00:00" },
		 		   { id: "m2", opponent: "Player3", result: "loss", score: 18, timestamp: "2025-08-24T15:30:00" },
		 		 ],
			};

		//const userId = request.params.id;
		console.log('Fetching user with ID:', userId);
		try {
			const result = await DBget.fetchUser({userId});
			console.log("the user we should be returning is :", result);
			reply.send(mockProfile);
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
  await loginUser(fastify, options);
}

module.exports = userRoutes;
//module.exports = registerUser;
//module.exports = getUser;
