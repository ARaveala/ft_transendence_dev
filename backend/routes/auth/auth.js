const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
/**
 * @type {import('../../shared/payloads').RegisterUserPayload}
 */


//const {formatError} = require("@errors");
//const { formatValidationError } = require('../utils/errorFormatter');

console.log('API_PROTOCOL:', API_PROTOCOL);

/**
 * 
defaults 
 */
async function registerUser(fastify, options) {
	const {secure, DBinsert,} = options;
	fastify.post(API_PROTOCOL.REGISTER_USER.path, {
	schema: { body: schemas.RegisterUser }
	}, async (request, reply) => {
		/** @type {RegisterUserPayload} */
		const { username, password} = request.body;
		const  score = 0;
		const  status = 'online';

		log('REGISTER_USER:', `in coming body ${JSON.stringify(request.body)}`);
		try {
		const result = await DBinsert.insertUser({ username, password, score, status });
		log('REGISTER_USER', `User registration result: ${result}`);

		const token = secure.generateToken(result.userId, username);
		log('LOGINUSER', `token on creation ${token}`);
		secure.setAuthCookie(reply, token)
			reply.send(result);
		} catch (err) {
			reply.code(500).send(err);
		}
	});
}

// result change may affect frontend testing due to incorrect path
async function loginUser(fastify, options) {
	const { DBget, secure } = options;
	fastify.post(API_PROTOCOL.LOGIN_USER.path, {
	}, async (request, reply) => {
		const { username, password} = request.body;
		log('LOGINUSER', `Incoming user data: ${JSON.stringify(request.body)}`);
		try {
		// here it looks to find if user exists and password matches.
			const result = await DBget.miniLogin(username, password);//*DBinsert.loginUser({ username, password});
			// if user 2fa -> securty.js handle that
			// dev testing for now
			const token = secure.generateToken(result, username);
			log('LOGINUSER', `token on creation ${token}`);
			secure.setAuthCookie(reply, token);
			// change status function once everything verified

			
			log('LOGINUSER', `User registration result:${JSON.stringify(result)}`);
			reply.code(200).send('ok');
			//reply.send(result);
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	});
}

// delete user 

// will this login also take the alias 
/*async function loginUserTournament(fastify, options) {
	const { DBinsert, secure } = options;
	fastify.post(API_PROTOCOL.LOGIN_USER_TOURNAMENT.path, {
	}, async (request, reply) => {
		const { username, password} = request.body;
		console.log('Incoming user data:', request.body);
		try {
			const result = await DBinsert.loginUser({ username, password});
			// if user 2fa -> securty.js handle that
			// dev testing for now
			const token = secure.generateToken(result);
			secure.setAuthCookie(reply, token);
			// change status function once everything verified

			// add user to to tournament table
			// if table full , set tournament ready {
				reply.code(200).send('ready');?
			}
			console.log('User registration result:', result);
			reply.code(200).send('ok');
			//reply.send(result);
		} catch (err) {
			console.log(('Error during login:', err));
			reply.code(500).send(err);
		}
	});
}*/

//
//async function deleteUser(fastify, option) {
//	const {secure, ?} = option;
//	fastify.post(API_PROTOCOL.DELET_USER.path, {
//	}, async (request, reply) => {
//		const {username, password} = request.body; // do we want user to type password in last time for delete?
//		console.log("DELETE USER ");
//		try	{
//			const token = request.cookies.auth_token;
//			const userId = secure.getUserIdFromToken(token);
//			const result = DBdelete(userId);
//			reply.code(200).send("ok");//?
//		}
//		catch {
//			reply.code(500).send(err);
//		}
//	});
//
//}
//
async function authRoutes(fastify, options) {
  await registerUser(fastify, options);
  await loginUser(fastify, options);
  // deleteUser(fastify, option)
}

module.exports = authRoutes;