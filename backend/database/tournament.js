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



function createTournamentPlayer(tournamentId, playerId, alias, seed, role, verified, isOwner) {
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
			db.run('INSERT INTO tournament_players (tournament_id, user_id, alias, seed, player_role, verified, is_owner) VALUES (?, ?, ?, ?, ?, ?, ?)', 
				[tournamentId, playerId, alias, seed, role, verified, isOwner], function onDone(err) {
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
	//flog.debug({ function: 'getTournamentPlayersWithUsernames' }, 'Fetching tournament players with usernames');
	return new Promise((resolve, reject) => {
		const query = `
			SELECT 
				tp.alias,
				tp.player_role,
				tp.player_status,
				tp.player_score,
				tp.verified,
				tp.is_owner,
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
	//flog.debug({ function: 'getTournamentPlayers' }, 'Fetching tournament players');
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


function getTournamentPlayers(tid) {
	//flog.debug({ function: 'fffffffffffffffffffffgetTournamentPlayersALL', tournamnetId: tid }, 'Fetching tournament players');
		return new Promise((resolve, reject) => {
			db.all('SELECT * FROM tournament_players WHERE tournament_id = ?',[tid], (err, rows) =>{
				if (err) {
					flog.error({ function: 'getTournamentPlayersALL', err}, 'DB error fetching tournament players:');
					return reject({ error: 'DB error fetch' });
				} else if (!rows) {
					flog.error({ function: 'getTournamentPlayersALL', tid}, 'No players found for tournament');
					return reject({ error: 'No players found' });
				} else {
					flog.info({ function: 'getTournamentPlayers', players: rows }, 'Tournament players found');
				if (rows.length === 4) {
					flog.info({ function: 'getTournamentPlayersALL', tid: tid }, '4 players found for tournament');
					return resolve(rows);

				}
				else {
					return resolve(rows);
				}
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

function updateAlias(tournamentId, playerId, newAlias) {
	//flog.debug({ function: 'updateAlias', playerId: playerId }, 'Updating player alias in tournament');
		return new Promise((resolve, reject) => {
			db.run('UPDATE tournament_players SET alias = ? WHERE tournament_id = ? AND user_id = ?', 
				[newAlias, tournamentId, playerId], function onDone(err) {
				if (err) {
					flog.error({ function: 'updateAlias', err}, 'DB error updating alias:');
					return reject(err);
				}
				flog.info({ function: 'updateAlias', tournamentId, playerId, newAlias }, 'Player alias updated in tournament');
				resolve(this.changes);
				}
			);
		});
}


function updatePlayerReadyStatus(tournamentId, playerId, newStatus) {
	flog.debug({ function: 'playerReadyStatus', playerId: playerId }, '!!!!!!!!!!Updating playerReadyStatus in tournament');
		return new Promise((resolve, reject) => {
			db.run('UPDATE tournament_players SET player_status = ? WHERE tournament_id = ? AND user_id = ?', 
				[newStatus, tournamentId, playerId], function onDone(err) {
				if (err) {
					flog.error({ function: 'playerReadyStatus', err}, 'DB error updating playerReadyStatus:');
					return reject(err);
				}
//				flog.info({ function: 'playerReadyStatus', tournamentId, playerId, newAlias }, 'playerReadyStatus updated in tournament');
				resolve(this.changes);
				}
			);
		});
}

/**
CREATE TABLE IF NOT EXISTS brackets
(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tournament_id INTEGER,
	p1_id INTEGER,
	p2_id INTEGER,
	p1_score INTEGER NOT NULL DEFAULT 0,
	p2_score INTEGER NOT NULL DEFAULT 0,
	winner_id INTEGER,
	round INTEGER,
	bracket_pos INTEGER,
	ALTER TABLE brackets ADD COLUMN game_uid TEXT UNIQUE,
	status TEXT NOT NULL DEFAULT 'waiting'
		CHECK (status IN ('waiting', 'ready', 'ongoing', 'finished')),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
	FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);


 */

//status pending
function buildBracket(tournamentId, player1Id, player2Id, gameid, round, status){
	let bracket_pos = 0;
	if (round === 1 || 3)
	{
		bracket_pos = 1;
	}
	else {
		bracket_pos = 2;
	}
	return new Promise((resolve, reject) => {
	db.run('INSERT INTO brackets (tournament_id, p1_id, p2_id, game_uid, round, status, bracket_pos) VALUES (?, ?, ?, ?, ?, ?, ?)', 
		[tournamentId, player1Id, player2Id, gameid, round, status, bracket_pos], function onDone(err) {
		if (err) {
			flog.error({ function: 'DBbuild bracket', err}, 'DB error adding player to tournament:');
			return reject(err);
		}
		flog.info({ function: 'DBbuild bracket', tournamentId, player1Id, player2Id}, 'Players added to bracket');
		 const insertedId = this.lastID;
		db.get(
		  'SELECT * FROM brackets WHERE id = ?',
		  [insertedId],
		  (err2, row) => {
			if (err2) return reject(err2);
			resolve(row); // now you have the full row object
		  }
		);
	  }
	);
  });
}

function updateTournamentStatus(tournamentId, newStatus) {
	flog.debug({ function: 'updateTournamnetStatus',}, 'Updating tournamnetStatus in tournament');
		return new Promise((resolve, reject) => {
			db.run('UPDATE tournaments SET status = ? WHERE id = ?', 
				[newStatus, tournamentId], function onDone(err) {
				if (err) {
					flog.error({ function: 'updatetournamnetStatus', err}, 'DB error updating tournamnetStatus:');
					return reject(err);
				}
//				flog.info({ function: 'playerReadyStatus', tournamentId, playerId, newAlias }, 'playerReadyStatus updated in tournament');
				resolve(this.changes);
				}
			);
		});
}

function cancelTournament(tournamentId) {
	flog.debug({ function: 'DBcancelTournament' , tid: tournamentId}, 'Cancelling tournament with id of');
		return new Promise((resolve, reject) => {
			db.run('DELETE FROM tournaments WHERE id = ?', [tournamentId], function onDone(err) {
				
				if (err) {
					flog.error({ function: 'DBcancelTournament', err}, 'DB error canceling tournament:');
					return reject(err);
				}
				if (this.changes === 0) {
        			flog.warn({ function: 'DBcancelTournament', tournamentId }, 'No tournament found to cancel');
        			return resolve({ success: false, message: 'No tournament found' });
        		}
				flog.info({ function: 'DBcancelTournament'}, 'tournamnet canceled');
				resolve(this.changes);
				//const tournamentId = this.lastID
				  // Use tournamentId to insert players and games
				});
		});
}

function getUserByRole(tournamentId, role) {
	flog.debug({ function: 'getUserByRole' }, 'Fetching tournament by ID');
		return new Promise((resolve, reject) => {
			db.get('SELECT * FROM tournament_players WHERE tournament_id = ? AND player_role = ?',
				[tournamentId, role], (err, row) =>{
				if (err) {
					console.error('DB error:', err);
					return reject({ error: 'DB error fetch' });
				} else if (!row) {
					console.warn('No tournament found with given ID');
					return reject({ error: 'No tournament found' });
				} else {
					flog.info({ function: 'getUserByRole', player: row }, 'player found by role');
					return resolve(row);
				}
			});
		});
}

function removePlayer(tournamentId, role) {
	return new Promise ((resolve, reject) => {
		getUserByRole(tournamentId, role).then(player => {

		
		db.run('DELETE FROM tournament_players WHERE user_id = ?',
			[player.user_id], function(err) {
				if (err) {
					flog.error({fucntion: 'DBremovePlayer'});
					return reject({error: 'DB error in rmeove player'});
				}
				else if (this.changes === 0) {
					return reject({error: 'DB remove player no changes made '});
				}
				return resolve(this.changes);
			}

		)
	})
	})
}

module.exports = {
	createTournament,
	getActiveTournamentStatus,
	createTournamentPlayer,
	getTournamentPlayerById,
	getTournamentPlayersWithUsernames,
	getTournamentById,
	updateAlias,
	updatePlayerReadyStatus,
	getTournamentPlayers,
	updateTournamentStatus,
	buildBracket,
	cancelTournament,
	removePlayer,
};