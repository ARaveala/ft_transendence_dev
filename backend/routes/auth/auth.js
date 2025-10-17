const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
/**
 * @type {import('../../shared/payloads').RegisterUserPayload}
 */


//const {formatError} = require("@errors");
//const { formatValidationError } = require('../utils/errorFormatter');

console.log('API_PROTOCOL:', API_PROTOCOL);


async function registerUser(fastify, options) {
	const {secure, DBinsert} = options;
	fastify.post(API_PROTOCOL.REGISSTER_USER.path, {
		schema: {body: schemas.RegisterUser}
	}, async (request, reply) => {
		const {username, password} = /** @type {{username:string,password:string}} */ (request.body);
		const score = 0;
		const status = 'online';
		try
		{
			const userId = await DBinsert.insertUser({username, password, score, status});
			const token = secure.generateToken(userId, username);
			secure.setAuthCookie(reply, token);
			reply.code(201).send({id: userId, username});
		}
		catch (err)
		{
			const status = err?.status || 500;
			reply.code(status).send({error: err.error || 'Registration failed'});
		}
	});
}

// result change may affect frontend testing due to incorrect path
async function loginUser(fastify, options) {
	fastify.route({
		method: API_PROTOCOL.LOGIN_USER.method,
		url: API_PROTOCOL.LOGIN_USER.path,
		handler: async (request, reply) => {
			const {username, password} = /** @type {{username:string,password:string}} */ (request.body);
			try
			{
				const userId = await DBget.minilogin(username, password);
				const token = secure.generateToken(userId, username);
				secure.setAuthCookie(reply, token);
				reply.code(200).send({id: userId, username});
			}
			catch (err)
			{
				const status = err?.status || 500;
				reply.code(status).send({error: err.error || 'Login failed'});
			}
		}
	});
}

async function logoutUser(fastify, options) {
	const { DBget, secure } = options;
	fastify.post(API_PROTOCOL.LOGOUT_USER.path, {
	}, async (request, reply) => {
		//const { username, password} = request.body;
		//log('LOGOUT', `Incoming user data: ${JSON.stringify(request.body)}`);
		try {
		// here it looks to find if user exists and password matches.
			const token = request.cookies.auth_token;

			//console.log('Cookies in logout User:', request.cookies);

			const userId = secure.getUserIdFromToken(token);
			// should verify seperatley , unless we need to check anything the 
			// user is activly involved in like a game ...for some reason
			secure.clearAuthCookie(reply, token);
			//log('LOGINUSER', `token on creation ${token}`);
			//secure.setAuthCookie(reply, token);
			// change status function once everything verified

			
			//log('LOGINUSER', `User registration result:${JSON.stringify(result)}`);
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
async function deleteUser(fastify, option) {
	const {secure, DBdelete} = option;
	fastify.route({
		method: API_PROTOCOL.DELETE_PROFILE.method,
		url: API_PROTOCOL.DELETE_PROFILE.path,
		handler: async (request, reply) => {
	//fastify.post(API_PROTOCOL.DELETE_PROFILE.path, {
	//}, async (request, reply) => {
		//const {username, password} = request.body; // do we want user to type password in last time for delete?
		console.log("DELETE USER ");
		try	{
			const token = request.cookies.auth_token;
			const userId = secure.getUserIdFromToken(token);
			console.log('checking id in delete backend', userId.id, 'type', typeof userId.id);
			const result = await DBdelete.deleteUserById(userId.id);
			// is result is 1 , a row was deleted
			//if row is 0 , user was not found
			if (result === 1) {
				reply.code(200).send("ok");//?
			}
			if (result === 0) {
				reply.code(400).send("user not found");
			}
			console.log("result of delete user", result);
		}
		catch {
			reply.code(500).send('error deleting user');
		}
		}
	});

}
//
async function authRoutes(fastify, options) {
  await registerUser(fastify, options);
  await loginUser(fastify, options);
  await logoutUser(fastify, options);
  await deleteUser(fastify, options)
}

module.exports = authRoutes;