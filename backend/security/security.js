// 'use strict';
// const jwt = require('jsonwebtoken');

// const COOKIE = 'auth_token';
// const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// function generateToken(id, username) {
//   return jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '1h' });
// }

// function verifyToken(token) {
//   try { return jwt.verify(token, JWT_SECRET); }
//   catch { return null; }
// }



// function getUserFromRequest(request) {
//   const token = request.cookies?.[COOKIE];
//   return token ? verifyToken(token) : null;
// }

// module.exports = {
//   COOKIE,
//   generateToken,
//   verifyToken,
//   setAuthCookie,
//   clearAuthCookie,
//   getUserFromRequest
// };




'use strict';

const jwt = require('jsonwebtoken');

const COOKIE = 'auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function setAuthCookie(reply, token) {
  const isProd = process.env.NODE_ENV === 'production';
  reply.setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',  // dev: lax, prod: none
    secure: isProd,                      // dev: false, prod: true
    path: '/',                           // critical: works across pages
    maxAge: 60 * 60                      // 1 hour
  });
}

// function clearAuthCookie(reply) {
//   const isProd = process.env.NODE_ENV === 'production';
//   reply.clearCookie(COOKIE, {
//     path: '/',
//     sameSite: isProd ? 'none' : 'lax',
//     secure: isProd
//   });
// }

// Session token for HTTP auth
function generateToken(id, username) {
  return jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '1h' });
}

// Short-lived token for WebSockets, scoped to a single game
function generateWsToken(playerId, gameId) {
  return jwt.sign({ id: playerId, gameId }, JWT_SECRET, { expiresIn: '15m' });
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
	generateTemporaryToken,
    verifyTemporaryToken
	};
