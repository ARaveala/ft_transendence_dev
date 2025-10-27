const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'auth' }); // scoped logger

const speakeasy = require('speakeasy'); // for creating 2FA secrets
const qrcode = require('qrcode');      // creating qrcodes
const { DBget } = require('./context');
const tempTwoFactorSecrets = new Map(); // TMP fix for not having database secrets yet, DELETE

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
			reply.code(200).send({id: userId, username: username});
		}
		catch (err)
		{
			reply.code(err?.status || 500).send({error: err.error || 'Registration failed'});
		}
	});
}


// async function loginUser(fastify, { DBget, secure, API_PROTOCOL }) {
//   fastify.route({
//     method: API_PROTOCOL.LOGIN_USER.method,
//     url: API_PROTOCOL.LOGIN_USER.path,
//     handler: async (request, reply) => {
//       const { username, password } = request.body;
//       try {
//         const userId = await DBget.miniLogin(username, password);
//         const token = secure.generateToken(userId, username);
//         secure.setAuthCookie(reply, token);
//         reply.send({ id: userId, username }); // return basic info for immediate UI update
//       } catch (err) {
//         reply.code(err?.status || 401).send({ error: err?.error || 'Invalid credentials' });
//       }
//     }
//   });
// }

// async function logoutUser(fastify, { secure, API_PROTOCOL }) {
//   fastify.route({API_PROTOCOL.LOGOUT_USER.path,
//     handler: async (_req, reply) => {
// 		secure.clearAuthCookie(reply);
// 		const username = db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
// 			if (err || !row) {
// 				resolve({ error: 'Username available' });
// 			}else {
// 				reject({error: 'Username not available'});
// 			}
// 		run(`UPDATE users SET status = 'offline' WHERE username = ?`, [username]);});
//       reply.code(204).send();
//     }
//   });
// }

async function loginUser(fastify, options) {
    const { DBget, secure } = options;
    fastify.route({
        method: API_PROTOCOL.LOGIN_USER.method,
        url: API_PROTOCOL.LOGIN_USER.path,
        handler: async (request, reply) => {
			//schema: { body: schemas.LoginUser },

            const { username, password } = request.body;
            log('LOGINUSER', `Incoming user data: ${JSON.stringify(request.body)}`);
            try {
                const result = await DBget.miniLogin(username, password);
                if (!result) {
                    return reply.code(401).send({ error: "Invalid username or password." });
                }

                // check if 2FA is enabled for user
                const isTwoFactorEnabled = tempTwoFactorSecrets.has(result.id);

                if (isTwoFactorEnabled) {
                    log('LOGINUSER', `2FA required for user: ${result.id}`);

                    // temporary token, access to 2FA login after 
                    const tempToken = secure.generateTemporaryToken({ id: result.id, username: username, type: '2fa_pending' });

                    // Send 202 response to frontend signaling that further login steps are needed
                    reply.code(202).send({
                        message: '2FA required',
                        tempAuthToken: tempToken
                    });

                } else { // old login logic before 2FA added
                    const token = secure.generateToken(result.id ?? result, username);
                    log('LOGINUSER', `token on creation ${token}`);
                    secure.setAuthCookie(reply, token);
                    log('LOGINUSER', `User registration result:${JSON.stringify(result)}`);
                    reply.code(200).send('ok');
                }

            } catch (err) {
                console.log(('Error during login:', err));
                reply.code(500).send(err);
            }
        }
    });
}


async function logoutUser(fastify, options) {
	const { API_PROTOCOL, secure } = options;
	fastify.post(API_PROTOCOL.LOGOUT_USER.path, async (request, reply) => {
		const username = db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>{
		if (err || !row) {
			resolve({ error: 'Username available' });
		}else {
			reject({error: 'Username not available'});
		}
		run(`UPDATE users SET status = 'offline' WHERE username = ?`, [username]);});
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

/* Generates 2FA and qrcode for user when opting in for 2FA in profile
 */
async function setupTwoFactor(fastify, options) {
    const { secure } = options;
    fastify.post('/api/2fa/setup', {}, async (request, reply) => {
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token); // logged in user id

            const secret = speakeasy.generateSecret({ // generated secret
                name: `Ft_Transedence (${userId.id})` // app name in authenticator
            });

            // Tmp store the secret in a map associated with Id - secret
            tempTwoFactorSecrets.set(userId.id, secret.base32);
            log('2FA_SETUP:', ` Generated temporary secret for user ${userId.id}`);

			const data_url = await qrcode.toDataURL(secret.otpauth_url);
            reply.code(200).send({ qrCodeUrl: data_url });
        } catch (err) {
            reply.code(500).send({ error: 'An error occurred during 2FA setup.' });
        }
    });
}

/* Verify the OTP token and enable 2FA for the user
 */
async function verifyTwoFactor(fastify, options) {
    const { secure, DBupdate } = options;
    fastify.post('/api/2fa/verify', {}, async (request, reply) => {
        const { otp } = request.body; // 6 Digit code form the user
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token);

            const secret = tempTwoFactorSecrets.get(userId.id);
            if (!secret) {
                return reply.code(400).send({ error: 'No 2FA setup process started. Please try again.' });
            }

            // verify token
            const isVerified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
                log('2FA_VERIFY', `Successfully verified 2FA for user ${userId.id}`);
				const enabled = await DBget.is2FaEnabled(userId.id);
				const check = await DBupdate.update2fa(enabled, userId.id, secret);
                // in the real database version - ->
                // 1.save the secret to the users row
                // 2.set 2FA boolen true
				flog.debug({ function: 'verifyTwoFactor', check: check.message }, '2FA enabled for user in DB update');
                //tempTwoFactorSecrets.delete(userId.id);
                reply.code(200).send({ verified: true });
            } else {
                log('2FA_VERIFY', `Failed verification for user ${userId.id}`);
                reply.code(400).send({ verified: false, error: 'Invalid token.' });
            }

        } catch (err) {
            reply.code(500).send({ error: 'An error occurred during 2FA verification.' });
        }
    });
}

/* disables 2FA, atm delets the id and secret from map. real vertsion would toggle boolean
 * and delete secret from database
 */
async function disableTwoFactor(fastify, options) {
    const { secure } = options;
    fastify.post('/api/2fa/disable', {}, async (request, reply) => {
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token);

            // deletes secret from tmp map
            const wasDeleted = tempTwoFactorSecrets.delete(userId.id);

            if (wasDeleted) {
                log('2FA_DISABLE', `2FA disabled for user ${userId.id}`);
                reply.code(200).send({ disabled: true });
            } else {
                // if for some reason it was already disabled?
                log('2FA_DISABLE', `2FA was already disabled for user ${userId.id}`);
                reply.code(200).send({ disabled: true, message: '2FA already disabled.' });
            }

        } catch (err) {
            reply.code(500).send({ error: 'An error occurred while disabling 2FA.' });
        }
    });
}

/* checks if the 2FA is currently enabled for user, used to check if tick box on or off
 * on profile pages
 */
async function getTwoFactorStatus(fastify, options) {
    const { secure, DBget} = options;
    fastify.get('/api/2fa/status', {}, async (request, reply) => {
        try {
			flog.debug({ function: 'getTwoFactorStatus' }, 'Fetching 2FA status for user');
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token);
			const isEnabled = await DBget.is2FaEnabled(userId.id);// this get from db with id
            //const isEnabled = tempTwoFactorSecrets.has(userId.id);
            reply.code(200).send({ isEnabled });
        } catch (err) {
			flog.error( {function: 'getTwoFactorStatus', error: err}, 'Error fetching 2FA status::', err);
        	reply.code(500).send({ error: 'An error occurred while fetching 2FA status.' });
			// reply.code(200).send({ isEnabled: false });
        }
    });
}

/* 2FA check for login
 */
async function verifyLoginTwoFactor(fastify, options) {
    const { secure } = options;
    fastify.post('/api/2fa/login-verify', {}, async (request, reply) => {
        const { otp, tempAuthToken } = request.body;

        try {
            // verify token
            const decodedTempToken = secure.verifyTemporaryToken(tempAuthToken);
            if (!decodedTempToken || decodedTempToken.type !== '2fa_pending') {
                return reply.code(401).send({ error: 'Invalid or expired session.' });
            }

            const userId = decodedTempToken.id;
            // get users 2FA secret
            const secret = tempTwoFactorSecrets.get(userId);
            if (!secret) {
                return reply.code(400).send({ error: '2FA is not properly configured.' });
            }

            // verify the code
            const isVerified = speakeasy.totp.verify({
                secret: secret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
				const finalToken = secure.generateToken({ id: decodedTempToken.id }, decodedTempToken.username);
				secure.setAuthCookie(reply, finalToken);
				reply.code(200).send('ok');
            } else {
                reply.code(401).send({ error: 'Invalid 2FA code.' });
            }

        } catch (err) {
            reply.code(500).send({ error: 'An error occurred during 2FA verification.' });
        }
    });
}

async function authRoutes(fastify, options) {
	await registerUser(fastify, options);
	await loginUser(fastify, options);
	await logoutUser(fastify, options);
	await deleteUser(fastify, options);
	await setupTwoFactor(fastify, options);
    await verifyTwoFactor(fastify, options);
	await disableTwoFactor(fastify, options);
	await getTwoFactorStatus(fastify, options);
	await verifyLoginTwoFactor(fastify, options);
}

module.exports = authRoutes;
