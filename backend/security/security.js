// this file is just for dev testing , package.json points to this file specifically

const jwt = require('jsonwebtoken');
const {log} = require('@logger');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'security.js' }); // scoped logger

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function generateToken(id, username) {
	console.log("checking id and name before tokenization", id, username);
	return jwt.sign(
    { id: id, username: username },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateWsToken(playerId, gameId) {
  return jwt.sign(
    { id: playerId, gameId},
    JWT_SECRET,
    { expiresIn: '15m' } // short-lived
  );
}
//: 24, user: 'testuser3' 
// right now we are using http , this MUST be https in production
function setAuthCookie(reply, token) {
  reply.setCookie('auth_token', token, {
    httpOnly: true, //this must be https eventually
    path: '/',
    sameSite: 'lax', // change to strict 
    secure: false // set to true in production
  });
}

function clearAuthCookie(reply, token) {
  reply.clearCookie('auth_token', token,{
	expires: new Date(0),
	httpOnly: true,
	path:'/',
	sameSite: 'lax',
	secure: false
,	});
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getUserIdFromToken(token) {
	log('GET USER ID FROM TOKEN', 'taking id from token');
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded === undefined) {
			flog.warn( {function: 'getUserIdFromToken'}, 'Token verification returned undefined');
			//return undefined;
		}
		log('GET USER ID FROM TOKEN', `decoded token ${JSON.stringify(decoded)}`);
//		return JSON.stringify(decoded.id); // or whatever claim you expect
		return decoded.id; // or whatever claim you expect
	} catch (err) {
		flog.error( {function: 'getUserIdFromToken', error: err}, 'Error verifying token');
		console.error('Invalid or expired token:', err.message);
		return undefined; // or throw a custom error if you want to handle it upstream
	}
}

function getUserIdFromTokenH(token) {
	log('GET USER ID FROM TOKEN', 'taking id from token');
	if (!token) {
		return {error: 'MISSING_TOKEN'};
	}
	try {
		const decoded = jwt.verify(token, JWT_SECRET);
		if (decoded === undefined) {
			flog.warn( {function: 'getUserIdFromToken'}, 'Token verification returned undefined');
			//return undefined;
		}
		log('GET USER ID FROM TOKEN', `decoded token ${JSON.stringify(decoded)}`);
//		return JSON.stringify(decoded.id); // or whatever claim you expect
		return {id: decoded.id}; // or whatever claim you expect
	} catch (err) {
		flog.error( {function: 'getUserIdFromToken', error: err}, 'Error verifying token');
		if (err.name === 'TokenExpiredError') {
		  return { error: 'TOKEN_EXPIRED' };
		}
		if (err.name === 'JsonWebTokenError') {
		  return { error: 'INVALID_TOKEN' };
		}
		return { error: 'DEFAULT_AUTH' };

	}
}
//Verify the token’s signature
//Check its expiration
//Extract the user ID from the payload

//Optionally confirm that the user still exists in the database this is done by returning to me id
//  potentailly may require more returned as an object , backend sends to database verify user in db. 

/* functions for creating temporary token on login with 2FA enabled
 */
function generateTemporaryToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '3m' });
}

function verifyTemporaryToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        console.error('Invalid or expired temporary token:', err.message);
        return null;
    }
}

module.exports = { generateToken,
	setAuthCookie,
	verifyToken,
	getUserIdFromToken,
	getUserIdFromTokenH, //this is testing the hook
	generateWsToken,
	clearAuthCookie,
	generateTemporaryToken,
    verifyTemporaryToken
	};
