const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
/**
 * @type {import('../../shared/payloads').RegisterUserPayload}
 */


//const {formatError} = require("@errors");
//const { formatValidationError } = require('../utils/errorFormatter');

// console.log('API_PROTOCOL:', API_PROTOCOL);


async function registerUser(fastify, options) {
	const {secure, DBinsert, API_PROTOCOL, schemas} = options;
	fastify.post(API_PROTOCOL.REGISTER_USER.path, {
		schema: {body: schemas.RegisterUser}
	}, async (request, reply) => {
		const {username, password} = request.body;
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
			reply.code(err?.status || 500).send({error: err.error || 'Registration failed'});
		}
	});
}

async function loginUser(fastify, options) {
	const {DBget, secure, API_PROTOCOL} = options;
	fastify.route({
		method: API_PROTOCOL.LOGIN_USER.method,
		url: API_PROTOCOL.LOGIN_USER.path,
		handler: async (request, reply) => {
			const {username, password} = request.body;
			try
			{
				const userId = await DBget.miniLogin(username, password);
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
	const { API_PROTOCOL, secure } = options;
	fastify.post(API_PROTOCOL.LOGOUT_USER.path, async (request, reply) => {
		secure.clearAuthCookie(reply);
		reply.code(200).send({ok: true});
	});
}
// delete user 
async function deleteUser(fastify, options) {
	const {DBdelete, API_PROTOCOL, secure} = options;
	fastify.delete(API_PROTOCOL.DELETE_PROFILE.path, async (request, reply) => {
		try
		{
			const token = request.cookies?.auth_token;
			if (!token) return reply.code(401).send({error: 'Not authenticated'});
			const userId = secure.getUserIdFromToken(token);
			const changes = await DBdelete.deleteUserById(userId);
			if (changes === 1)
			{
				secure.clearAuthCookie(reply);
				return reply.code(200).send({ok: true});
			}
			return reply.code(404).send('User not found');
		}
		catch (err)
		{
			console.error('[DELETE /api/profile] failed:', err);
			const status = err?.status || 500;
			const body = {error: err?.error || 'Delete failed'};
			if (process.env.NODE_ENV !== 'production' && err?.details) body.details = err.details;
			reply.code(status).send(body);
		}
	});
}

async function authRoutes(fastify, options) {
  await registerUser(fastify, options);
  await loginUser(fastify, options);
  await logoutUser(fastify, options);
  await deleteUser(fastify, options)
}

module.exports = authRoutes;