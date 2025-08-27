// this file is just for dev testing , package.json points to this file specifically

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

function generateToken(user) {
  return jwt.sign(
    { id: user.userId, username: user.user },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}
//: 24, user: 'testuser3' 
// right now we are using http , this MUST be https in production
function setAuthCookie(reply, token) {
  reply.setCookie('auth_token', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: false // set to true in production
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getUserIdFromToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.id;
}


//Verify the token’s signature
//Check its expiration
//Extract the user ID from the payload

//Optionally confirm that the user still exists in the database this is done by returning to me id
//  potentailly may require more returned as an object , backend sends to database verify user in db. 

module.exports = { generateToken, setAuthCookie, verifyToken, getUserIdFromToken };
