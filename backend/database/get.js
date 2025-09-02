const db = require('./initDB.js');

// naming can be changed 
// get each element from database , such as score, name , status
// userId is passed as ({object}) not (value) to allow adjustmenst such as do not show password
async function fetchUser({ userId }) {
	console.log('Fetching user with ID:', userId);
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) =>{
				if (err || !row) {
					reject({ error: 'User not found' });
				} else {
					resolve(row || { error: 'User not found' });
				}
			});
		});
}

module.exports = { fetchUser };
//similar logic as below may be required
//async function userRoutes(fastify, options) {
//  await registerUser(fastify, options);
//  await getUser(fastify, options);
//}
//
//module.exports = userRoutes;