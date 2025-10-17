const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');

const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'friend.js' }); // scoped logger

async function addFriend(fastify, options) {
	const {secure, DBinsert, DBget} = options;
	fastify.route ({
		method: API_PROTOCOL.ADD_FRIEND.method,
		url: API_PROTOCOL.ADD_FRIEND.path,
		handler: async (request, reply) => {
			flog.info({ function: 'addFriend', payload: request.body }, 'Incoming body');
			const username = request.body.username;
			flog.debug({ function: 'addFriend', username: username}, 'does username come through from body');
			try {
				const token = request.cookies.auth_token;
				const userId = secure.getUserIdFromToken(token);
				flog.debug({ function: 'addFriend', username: username}, 'checking it before sending to fetch');
				const friendId = await DBget.fetchUserByUsername(username);
				flog.debug({ function: 'addFriend', friend: friendId, user: userId}, 'checking ids');
				await DBinsert.insertFriend(friendId, userId.id);
				reply.code(200).send({
					status: "ADDED",
					friend: username,
				})
			} catch (err) {
				reply.code(500).send({
					status: "ERROR",
					friend: username,
					error: err,
				}
				);

			}
		}
	});
}

async function removeFriend(fastify, options) {
	const {secure, DBdelete, DBget} = options;
	fastify.route ({
		method: API_PROTOCOL.REMOVE_FRIEND.method,
		url: API_PROTOCOL.REMOVE_FRIEND.path,
		handler: async (request, reply) => {
			flog.info({ function: 'removeFriend', payload: request.body }, 'Incoming body');
			const username = request.body.username;
			flog.debug({ function: 'removeFriend', username: username}, 'does username come through from body');
			try {
				const token = request.cookies.auth_token;
				const userId = secure.getUserIdFromToken(token);
				flog.debug({ function: 'removeFriend', username: username}, 'checking it before sending to fetch');
				const friendId = await DBget.fetchUserByUsername(username);
				flog.debug({ function: 'removeFriend', friend: friendId, user: userId}, 'checking ids');
				await DBdelete.deleteFriendById(userId.id, friendId);
				reply.code(200).send({
					status: "REMOVED"
				})
			} catch (err) {
				reply.code(500).send({
					status: "ERROR",
					friend: username,
					error: err,
				}
				);

			}
		}
	});
}

async function friendRoutes(fastify, options){
	await addFriend(fastify, options);
	await removeFriend(fastify, options);
}
module.exports = friendRoutes;