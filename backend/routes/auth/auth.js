const schemas = require('@sharedSchemas');
const { API_PROTOCOL } = require('@sharedApi');
const {log} = require('@logger');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'auth' }); // scoped logger
const signSchema = require('@schemas/signSchema.js');
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
	schema: signSchema,
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
        schema: signSchema,
        handler: async (request, reply) => {
            const { username, password } = request.body;
            flog.info({ function: 'loginUser' }, `Incoming login attempt for user: ${username}`);
            try {
                const result = await DBget.miniLogin(username, password);
                if (!result) {
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
				reply.code(err.code).send(err);
            }
        }
    });
}

async function logoutUser(fastify, options) {
	const { secure } = options;
	fastify.post(API_PROTOCOL.LOGOUT_USER.path, {
	}, async (request, reply) => {
		//const { username, password} = request.body;
		//log('LOGOUT', `Incoming user data: ${JSON.stringify(request.body)}`);
		try {
		// here it looks to find if user exists and password matches.

////////REMOVE
			//const token = request.cookies.auth_token;
			//const userId = secure.getUserIdFromToken(token);
////////			
			
			// should verify seperatley , unless we need to check anything the 
			// user is activly involved in like a game ...for some reason
			secure.clearAuthCookie(reply);
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


async function deleteUser(fastify, option) {
	const {secure, DBdelete} = option;
	fastify.route({
		method: API_PROTOCOL.DELETE_PROFILE.method,
		url: API_PROTOCOL.DELETE_PROFILE.path,
		handler: async (request, reply) => {
		console.log("DELETE USER ");
		console.log('request.userId:', request.userId);
		try	{
////////REMOVE
			//const token = request.cookies.auth_token;
			//const userId = secure.getUserIdFromToken(token);
/////////
			const userId = request.userId;

			flog.warn({fucntion: 'delteUser', testing: userId}, 'seeing if we get valid id ');
			
			//console.log('checking id in delete backend', userId, 'type', typeof userId);
			const result = await DBdelete.deleteUserById(userId);
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
			flog.error({fucntion: 'deletUser'}, 'ERROR deleting user ');
			reply.code(500).send('error deleting user');
		}
		}
	});

}
/**
 * this nees refactoring so it uses all the api protocol calls 
 * @param {} fastify 
 * @param {*} options 
 */
/* Generates 2FA secret and QR code, stores secret temporarily in memory */
async function setupTwoFactor(fastify, options) {
    const { secure } = options;
    fastify.post(API_PROTOCOL.TFA_SETUP.path, {}, async (request, reply) => {
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
    fastify.post(API_PROTOCOL.TFA_VERIFY.path, {}, async (request, reply) => {
        const { otp } = request.body;
        flog.info({ function: 'verifyTwoFactor' }, 'Attempting first OTP verification for setup.');
        try {
            const token = request.cookies.auth_token;
            const userId = secure.getUserIdFromToken(token); // Expects { id: ... }
            if (!userId || userId.id === undefined) {
                 throw new Error("Invalid user token for 2FA verification.");
            }

            const plainTextSecret = tempSetupSecrets.get(userId.id);

            if (!plainTextSecret) {
                flog.warn({ function: 'verifyTwoFactor', userId: userId.id }, 'No temporary secret found for user.');
                return reply.code(400).send({ error: 'No 2FA setup process started or secret expired. Please try again.' });
            }

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
    fastify.post(API_PROTOCOL.TFA_DISABLE.path, {}, async (request, reply) => {
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
    fastify.get(API_PROTOCOL.TFA_STATUS.path, {}, async (request, reply) => {
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

/* Verifies OTP during login using PLAIN TEXT secret from DATABASE */ //this to be ignored also in authook
async function verifyLoginTwoFactor(fastify, options) {
    const { secure, DBget } = options;
    fastify.post(API_PROTOCOL.TFA_LOGIN_VERIFY.path, {}, async (request, reply) => {
        const { otp, tempAuthToken } = request.body;
        flog.info({ function: 'verifyLoginTwoFactor' }, 'Attempting 2FA login verification.');
        try {
            const decodedTempToken = secure.verifyTemporaryToken(tempAuthToken);
            if (!decodedTempToken || decodedTempToken.type !== '2fa_pending' || decodedTempToken.id === undefined) {
                return reply.code(401).send({ error: 'Invalid or expired session.' });
            }

            const userId = decodedTempToken.id;

            // assumes get2FaSecret returns the plain text base32 secret saved earlier
            const plainTextSecret = await DBget.get2FaSecret(userId);
            if (!plainTextSecret) {
                flog.warn({ function: 'verifyLoginTwoFactor', userId }, '2FA secret not found in DB for user during login.');
                return reply.code(400).send({ error: '2FA is not properly configured for this user.' });
            }

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
