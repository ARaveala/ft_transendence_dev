// this file is just for dev testing , package.json points to this file specifically

const jwt = require('jsonwebtoken');
const {log} = require('@logger');
const COOKIE = 'auth_token'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function generateToken(id, username) {
	return jwt.sign({id, username}, JWT_SECRET, {expiresIn: '1h'});
}

function setAuthCookie(reply, token) {
	reply.setCookie(COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		sevure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60,
	});
}

function clearAuthCookie(reply) {
	reply.clearCookie('auth_token', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function verifyToken(token) {
	return jwt.verify(token, JWT_SECRET);
}

function getUserIdFromToken(token) {
	const payload = verifyToken(token);
	return payload.id;
}

function generateWsToken(id, username) {
	return generateToken(id, username);
}

module.exports = {
  generateToken,
  setAuthCookie,
  verifyToken,
  getUserIdFromToken,
  generateWsToken,
  clearAuthCookie,
};

// function generateToken(id, username) {
// 	console.log("checking id and name before tokenization", id, username);
// 	return jwt.sign(
//     { id: id, username: username },
//     JWT_SECRET,
//     { expiresIn: '1h' }
//   );
// }

// function generateWsToken(playerId, gameId) {
//   return jwt.sign(
//     { id: playerId, gameId},
//     JWT_SECRET,
//     { expiresIn: '15m' } // short-lived
//   );
// }
// //: 24, user: 'testuser3' 
// // right now we are using http , this MUST be https in production
// function setAuthCookie(reply, token) {
//   reply.setCookie('auth_token', token, {
//     httpOnly: true, //this must be https eventually
//     path: '/',
//     sameSite: 'lax', // change to strict 
//     secure: false // set to true in production
//   });
// }

// function clearAuthCookie(reply, token) {
//   reply.clearCookie('auth_token', token,{
// 	expires: new Date(0),
// 	httpOnly: true,
// 	path:'/',
// 	sameSite: 'lax',
// 	secure: false
// ,	});
// }

// function verifyToken(token) {
//   return jwt.verify(token, JWT_SECRET);
// }

// function getUserIdFromToken(token) {
// 	log('GET USER ID FROM TOKEN', 'taking id from token');
// 	try {
// 		const decoded = jwt.verify(token, JWT_SECRET);
// 		log('GET USER ID FROM TOKEN', `decoded token ${JSON.stringify(decoded)}`);
// //		return JSON.stringify(decoded.id); // or whatever claim you expect
// 		return decoded.id; // or whatever claim you expect
// 	} catch (err) {
// 		console.error('Invalid or expired token:', err.message);
// 		return undefined; // or throw a custom error if you want to handle it upstream
// 	}
// }

// module.exports = { generateToken,
// 	setAuthCookie,
// 	verifyToken,
// 	getUserIdFromToken,
// 	generateWsToken,
// 	clearAuthCookie
// 	};
