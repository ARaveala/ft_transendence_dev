const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DBtournament.js' }); // scoped logger

'use strict';

/**
 * info bank SELECT id FROM bracket WHERE tournament_id = ?;
this is how u access bracket info for given tournament
*/


/**
 * 
 * @returns tournamentId of newly created tournament utalizing db to create unique id
 */
function createTournament() {
	flog.debug({ function: 'DBcreateTournament' }, 'Creating tournament');
		return new Promise((resolve, reject) => {
			db.run('INSERT INTO tournaments DEFAULT VALUES', function onDone(err) {
				if (err) {
					flog.error({ function: 'DBcreateTournament', err}, 'DB error creating tournament:');
					return reject(err);
				}
				flog.info({ function: 'DBcreateTournament', tournamentId: this.lastID }, 'Tournament created with ID');
				resolve(this.lastID);
				//const tournamentId = this.lastID
				  // Use tournamentId to insert players and games
				});
		});
}
/**
 * 
 * @param {*} tId tournamentId
 * @returns tournament row with status 'waiting' | 'ready' | 'playing' | 'finished';
 */
function getActiveTournamentStatus(tId) {
	flog.debug({ function: 'getActiveTournamentStatus' }, 'Fetching active tournament status');
		return new Promise((resolve, reject) => {
			db.get('SELECT status FROM tournaments WHERE id = ?',[tId], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fetch' });
				} else if (!row) {
					console.warn('No active tournament found');
					reject({ error: 'No active tournament' });
				} else {
					flog.info({ function: 'getActiveTournamentStatus', tournament: row }, 'Active tournament found');
					resolve(row);
				}
			});
		});
}

/**
 * 
 * @param {*} tournamentId unique id for tournament
 * @param {*} playerId current player id we are adding
 * @param {*} alias alias is set to empty string for now
 * @param {*} seed player 1 will get seed of 1 , others can be added later
 * @param {*} role player1 | player2 | player3 | player4
 * @param {*} verified if player is logged in player is verified, this could in theory be hard coded as 
 * existing player id would verify logged in.
 * @returns 
 */



function createTournamentPlayer(tournamentId, playerId, alias, seed, role, verified) {
	flog.debug({ function: 'createTournamentPlayer', playerid: playerId }, 'Adding player to tournament');
		return new Promise((resolve, reject) => {
			// db.get('SELECT id FROM tournaments WHERE id = ?', [tournamentId], (err, tournamentRow) => {
			//      if (err) return reject(err);
			//      if (!tournamentRow) {
			//		flog.error({ function: 'createTournamentPlayer', tournamentId}, 'Tournament does not exist');
			//        return reject(new Error(`Tournament ${tournamentId} does not exist`));
			//      }
			//  
			//      // Then check that the user exists
			//      db.get('SELECT id FROM users WHERE id = ?', [playerId], (err, userRow) => {
			//        if (err) return reject(err);
			//        if (!userRow) {
			//			flog.error({ function: 'createTournamentPlayer', playerId}, 'User does not exist');
			//          return reject(new Error(`User ${playerId} does not exist`));
			//        }
			// });
			//})			
			db.run('INSERT INTO tournament_players (tournament_id, user_id, alias, seed, player_role, verified) VALUES (?, ?, ?, ?, ?, ?)', 
				[tournamentId, playerId, alias, seed, role, verified], function onDone(err) {
				if (err) {
					flog.error({ function: 'createTournamentPlayer', err}, 'DB error adding player to tournament:');
					return reject(err);
				}
				flog.info({ function: 'createTournamentPlayer', tournamentId, playerId, alias, seed, role,verified }, 'Player added to tournament');
				resolve(this.changes);
				}
			);
		});
}

//function getTournamentPlayersByTournamentId(tournamentId) {
//	flog.debug({ function: 'getTournamentPlayers' }, 'Fetching tournament players');
//		return new Promise((resolve, reject) => {
//			db.all('SELECT * FROM tournament_players WHERE tournament_id = ?',[tournamentId], (err, rows) =>{
//				if (err) {
//					reject({ error: 'DB error fetch' });
//				} else if (!rows) {
//					reject({ error: 'No players found' });
//				} else {
//					flog.info({ function: 'getTournamentPlayers', players: rows }, 'Tournament players found');
//					resolve(rows);
//				}
//			}
//			);
//		});
//}
/**
 * 
 * @param {*} tournamentId unique id for tournament
 * fetches all players in tournament along with their usernames from users table.
 * tp. and u. are table aliases for tournament_players and users respectively
 * 
 * @returns 
 */
function getTournamentPlayersWithUsernames(tournamentId) {
	flog.debug({ function: 'getTournamentPlayersWithUsernames' }, 'Fetching tournament players with usernames');
	return new Promise((resolve, reject) => {
		const query = `
    		SELECT 
				tp.alias,
				tp.player_role,
				tp.player_status,
				tp.player_score,
				tp.verified,
				tp.user_id,
				u.username
			FROM tournament_players tp
			LEFT JOIN users u ON tp.user_id = u.id
			WHERE tp.tournament_id = ?
		`;
    db.all(query, [tournamentId], (err, rows) => {
    	if (err) {
    		return reject({ error: 'DB error fetching players' });
    	}
		flog.info({ function: 'getTournamentPlayersWithUsernames', players: rows }, 'Tournament players with usernames found');
    	resolve(rows);
    });
  });
}

/**
 * 
 * @param {*} userId user id we want tofind
 * fetches tournament player rows for given user id, this may not be really needed
 * @returns 
 */
function getTournamentPlayerById(userId) {
	flog.debug({ function: 'getTournamentPlayers' }, 'Fetching tournament players');
		return new Promise((resolve, reject) => {
			db.all('SELECT * FROM tournament_players WHERE player_id = ?',[userId], (err, rows) =>{
				if (err) {
					reject({ error: 'DB error fetch' });
				} else if (!rows) {
					reject({ error: 'No players found' });
				} else {
					flog.info({ function: 'getTournamentPlayers', players: rows }, 'Tournament players found');
					resolve(rows);
				}
			}
			);
		});
}

function getTournamentById(tournamentId) {
	flog.debug({ function: 'getTournamentById' }, 'Fetching tournament by ID');
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM tournaments WHERE id = ?',[tournamentId], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					reject({ error: 'DB error fetch' });
				} else if (!row) {
					console.warn('No tournament found with given ID');
					reject({ error: 'No tournament found' });
				} else {
					flog.info({ function: 'getTournamentById', tournament: row }, 'Tournament found by ID');
					resolve(row);
				}
			});
		});
}

module.exports = {
	createTournament,
	getActiveTournamentStatus,
	createTournamentPlayer,
	getTournamentPlayerById,
	getTournamentPlayersWithUsernames,
	getTournamentById,
};