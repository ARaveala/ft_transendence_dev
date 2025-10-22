const db = require('./initDB.js');
const {logger} = require('@logger');
const flog = logger.child({ fileContext: 'DBtournament.js' }); // scoped logger

'use strict';

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

function createTournamentPlayer(tournamentId, playerId, alias, seed, role, verified) {
	flog.debug({ function: 'createTournamentPlayer' }, 'Adding player to tournament');
		return new Promise((resolve, reject) => {
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


module.exports = {
	createTournament,
	getActiveTournamentStatus,
	createTournamentPlayer,
	getTournamentPlayerById,
	getTournamentPlayersWithUsernames,
};