const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'auth' }); // scoped logger

const speakeasy = require('speakeasy'); // for creating 2FA secrets
const qrcode = require('qrcode');      // creating qrcodes
const tempSetupSecrets = new Map();

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
		flog.info( {function: 'registerUser'}, `see trace.log/server.log for body/verbose`);
		flog.trace({ function: 'registerUser', payload: request.body }, 'Incoming body');
		//log('REGISTER_USER:', `in coming body ${JSON.stringify(request.body)}`);
		try {
			const result = await DBinsert.insertUser({ username, password, score, status });

			const token = secure.generateToken(result, username);
			secure.setAuthCookie(reply, token)
			//saftey protocols here ? or centralize?
			reply.code(200).send('ok');
		} catch (err) {
			reply.code(500).send(err);
			flog.error( {function: 'registerUser', error: err}, 'Error during user registration::', err);
		}
	});
}

async function loginUser(fastify, options) {
    const { DBget, secure } = options;
    fastify.route({
        method: API_PROTOCOL.LOGIN_USER.method,
        url: API_PROTOCOL.LOGIN_USER.path,
        handler: async (request, reply) => {
            const { username, password } = request.body;
            flog.info({ function: 'loginUser' }, `Incoming login attempt for user: ${username}`);
            try {
                const result = await DBget.miniLogin(username, password);
                if (!result || result.id === undefined) {
                    return reply.code(401).send({ error: "Invalid username or password." });
                }

                const isTwoFactorEnabled = await DBget.is2FaEnabled(result.id);

                if (isTwoFactorEnabled) {
                    flog.info({ function: 'loginUser' }, `2FA required for user: ${result.id}`);
                    const tempToken = secure.generateTemporaryToken({ id: result.id, username: username, type: '2fa_pending' });
					reply.code(202).send({
                        message: '2FA required',
                        tempAuthToken: tempToken
                    });
                } else {
                    const token = secure.generateToken(result, username);
                    flog.info({ function: 'loginUser' }, `2FA not enabled. Issuing standard token for user: ${result.id}`);
                    secure.setAuthCookie(reply, token);
                    reply.code(200).send('ok');
                }
            } catch (err) {
                flog.error({ function: 'loginUser', error: err }, 'Error during login:', err);
                reply.code(500).send({ error: "An internal server error occurred during login." });
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

/* Generates 2FA secret and QR code, stores secret temporarily in memory */
async function setupTwoFactor(fastify, options) {
    const { secure } = options;
    fastify.post('/api/2fa/setup', {}, async (request, reply) => {
        flog.info({ function: 'setupTwoFactor' }, 'Starting 2FA setup process.');
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token); // Expects { id: ... }
            if (!userId || userId.id === undefined) {
                 throw new Error("Invalid user token for 2FA setup.");
            }

            const secret = speakeasy.generateSecret({
                name: `Ft_Transcendence (${userId.id})`
            });

            tempSetupSecrets.set(userId.id, secret.base32);

            flog.info({ function: 'setupTwoFactor', userId: userId.id }, `Generated temporary secret for user.`);

            const data_url = await qrcode.toDataURL(secret.otpauth_url);
            reply.code(200).send({ qrCodeUrl: data_url });

        } catch (err) {
            flog.error({ function: 'setupTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred during 2FA setup.'); // Improved error logging
            reply.code(500).send({ error: 'An error occurred during 2FA setup.' });
        }
    });
}

/* verifies first OTP, saves PLAIN TEXT secret atm to DB, enables 2FA flag */
async function verifyTwoFactor(fastify, options) {
    const { secure, DBupdate } = options;
    fastify.post('/api/2fa/verify', {}, async (request, reply) => {
        const { otp } = request.body;
        flog.info({ function: 'verifyTwoFactor' }, 'Attempting first OTP verification for setup.');
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token); // Expects { id: ... }
            if (!userId || userId.id === undefined) {
                 throw new Error("Invalid user token for 2FA verification.");
            }

            // Get the temporary plain text secret from memory
            const plainTextSecret = tempSetupSecrets.get(userId.id);

            if (!plainTextSecret) {
                flog.warn({ function: 'verifyTwoFactor', userId: userId.id }, 'No temporary secret found for user.');
                return reply.code(400).send({ error: 'No 2FA setup process started or secret expired. Please try again.' });
            }

            // Verify token using the secret from memory
            const isVerified = speakeasy.totp.verify({
                secret: plainTextSecret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
                flog.info({ function: 'verifyTwoFactor', userId: userId.id }, `Successfully verified OTP. Enabling 2FA in DB.`);
                await DBupdate.update2fa(true, userId.id, plainTextSecret); // add to DB
                flog.debug({ function: 'verifyTwoFactor', userId: userId.id }, 'DB update attempted (plain text).');
                tempSetupSecrets.delete(userId.id);
                reply.code(200).send({ verified: true });
            } else {
                flog.warn({ function: 'verifyTwoFactor', userId: userId.id }, `Failed OTP verification during setup.`);
                reply.code(400).send({ verified: false, error: 'Invalid token.' });
            }
        } catch (err) {
            flog.error({ function: 'verifyTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred during 2FA verification.');
            reply.code(500).send({ error: 'An error occurred during 2FA verification.' });
        }
    });
}

/* Disables 2FA in the database */
async function disableTwoFactor(fastify, options) {
    const { secure, DBupdate } = options;
    fastify.post('/api/2fa/disable', {}, async (request, reply) => {
        flog.info({ function: 'disableTwoFactor' }, 'Attempting to disable 2FA.');
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token);
             if (!userId || userId.id === undefined) {
                 throw new Error("Invalid user token for disabling 2FA.");
            }

            await DBupdate.update2fa(false, userId.id, null); // Pass null secret, false status

            flog.info({ function: 'disableTwoFactor', userId: userId.id }, '2FA disabled in DB for user.');
            tempSetupSecrets.delete(userId.id);
            reply.code(200).send({ disabled: true });
        } catch (err) {
            flog.error({ function: 'disableTwoFactor', error: { message: err.message, stack: err.stack } }, 'An error occurred while disabling 2FA.');
            reply.code(500).send({ error: 'An error occurred while disabling 2FA.' });
        }
    });
}

/* Checks the DB if 2FA is enabled for user */
async function getTwoFactorStatus(fastify, options) {
    const { secure, DBget } = options;
    fastify.get('/api/2fa/status', {}, async (request, reply) => {
        flog.debug({ function: 'getTwoFactorStatus' }, 'Fetching 2FA status for user');
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token);
             if (!userId || userId.id === undefined) {
                 flog.warn({ function: 'getTwoFactorStatus'}, 'Invalid token, returning 2FA disabled.');
                 return reply.code(200).send({ isEnabled: false });
            }

            const isEnabled = await DBget.is2FaEnabled(userId.id);

            flog.debug({ function: 'getTwoFactorStatus', userId: userId.id, isEnabled }, 'Returning 2FA status from DB.');
            reply.code(200).send({ isEnabled });

        } catch (err) {
            flog.error({ function: 'getTwoFactorStatus', error: { message: err.message, stack: err.stack } }, 'Error fetching 2FA status from DB:', err);
             reply.code(200).send({ isEnabled: false });
            // reply.code(500).send({ error: 'An error occurred while fetching 2FA status.' }); // better error?
        }
    });
}

/* Verifies OTP during login using PLAIN TEXT secret from DATABASE */
async function verifyLoginTwoFactor(fastify, options) {
    const { secure, DBget } = options;
    fastify.post('/api/2fa/login-verify', {}, async (request, reply) => {
        const { otp, tempAuthToken } = request.body;
        flog.info({ function: 'verifyLoginTwoFactor' }, 'Attempting 2FA login verification.');
        try {
            const decodedTempToken = secure.verifyTemporaryToken(tempAuthToken);
            if (!decodedTempToken || decodedTempToken.type !== '2fa_pending' || decodedTempToken.id === undefined) {
                return reply.code(401).send({ error: 'Invalid or expired session.' });
            }

            const userId = decodedTempToken.id; // Primitive ID

            // assumes get2FaSecret returns the plain text base32 secret saved earlier
            const plainTextSecret = await DBget.get2FaSecret(userId);
            if (!plainTextSecret) {
                flog.warn({ function: 'verifyLoginTwoFactor', userId }, '2FA secret not found in DB for user during login.');
                return reply.code(400).send({ error: '2FA is not properly configured for this user.' });
            }

            // Verify the code using the plain text secret from DB
            const isVerified = speakeasy.totp.verify({
                secret: plainTextSecret,
                encoding: 'base32',
                token: otp
            });

            if (isVerified) {
                flog.info({ function: 'verifyLoginTwoFactor', userId }, 'Login OTP verified. Issuing final token.');

                const finalToken = secure.generateToken({ id: userId }, decodedTempToken.username);
                secure.setAuthCookie(reply, finalToken);
                reply.code(200).send('ok');
            } else {
                flog.warn({ function: 'verifyLoginTwoFactor', userId }, 'Invalid login OTP provided.');
                reply.code(401).send({ error: 'Invalid 2FA code.' });
            }
        } catch (err) {
			flog.error({
        	function: 'verifyLoginTwoFactor',
        	errorMsg: err.message || err.error,
        	errorStack: err.stack,
        	rawError: err
			}, 'Error during 2FA login verification.');
            reply.code(500).send({ error: 'An error occurred during 2FA login verification.' });
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
