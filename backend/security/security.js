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
		if (!token) throw new Error('jwt must be provided');
		const decoded = jwt.verify(token, JWT_SECRET);
		const raw = decoded?.id;
		const userId =
			typeof raw === 'string'
			? raw
			: (raw && (raw.id || raw.userId) || null);
		if (typeof userId !== 'string' || !userId) throw new Error('invalid token payload: id not string');
		return userId;
	}
	catch (error)
	{
		flog.error({function: 'geUserIdFronToken', error}, 'Error verifying token');
		return null;
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
	generateWsToken,
	clearAuthCookie,
	generateTemporaryToken,
    verifyTemporaryToken
	};
