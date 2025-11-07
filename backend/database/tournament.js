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



function createTournamentPlayer(tournamentId, playerId, alias, role, verified, isOwner) {
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
			db.run('INSERT INTO tournament_players (tournament_id, user_id, alias, player_role, verified, is_owner) VALUES (?, ?, ?, ?, ?, ?)', 
				[tournamentId, playerId, alias, role, verified, isOwner], function onDone(err) {
				if (err) {
					flog.error({ function: 'createTournamentPlayer', err}, 'DB error adding player to tournament:');
					return reject(err);
				}
				flog.info({ function: 'createTournamentPlayer', tournamentId, playerId, alias, role,verified }, 'Player added to tournament');
				resolve(this.changes);
				}
			);
		});
}

function seedPlayers(tournamentId) {
	flog.info({fucntion: 'seedPlayers', tid: tournamentId}, "tid ")
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Step 1: Join users to tournament_players to get rank
      db.all(
        `SELECT tp.user_id, u.rank
         FROM tournament_players tp
         JOIN users u ON tp.user_id = u.id
         WHERE tp.tournament_id = ?
         ORDER BY u.rank DESC`,
        [tournamentId],
        (err, rows) => {
          if (err) {
            flog.error({fucntion: 'seedPlayers'}, 'Error fetching players:', err);
            return reject({ error: 'Failed to fetch players', details: err });
          }

          if (!rows || rows.length === 0) {
            flog.warn({fucntion: 'seedPlayers'}, 'No players found for tournament:');
            return resolve({ message: 'No players to seed' });
          }

          // Step 2: Assign seeds based on rank order
          const updates = rows.map((player, index) => {
            return new Promise((res, rej) => {
              db.run(
                'UPDATE tournament_players SET seed = ? WHERE tournament_id = ? AND user_id = ?',
                [index + 1, tournamentId, player.user_id],
                (err) => {
                  if (err) {
                    flog.error({fucntion: 'seedPlayers', err: err.message}, 'Error updating seed for user:');
                    return rej({ error: 'Failed to update seed', userId: player.user_id, details: err });
                  }
                  res();
                }
              );
            });
          });

          // Step 3: Wait for all updates to complete
          Promise.all(updates)
            .then(() => {
              console.info('Seeding complete for tournament:', tournamentId);
              resolve({ message: 'Seeding complete', totalSeeded: updates.length });
            })
            .catch((err) => {
              console.error('Seeding failed:', err);
              reject(err);
            });
        }
      );
    });
  });
}

//function seedPlayers(tournamentId) {
//  return new Promise((resolve, reject) => {
//    db.serialize(() => {
//      db.all('SELECT user_id, rank FROM tournament_players WHERE tournament_id = ? ORDER BY rank DESC',
//		[tournamentId], (err, rows) => {
//        if (err){
//			flog.error({fucntion: 'seed players', err: err.message}, 'fffffffffffffff');
//			 return reject(err);
//		}
//		flog.warn({function: 'seed players'}, 'aaaaaaaaaaaaaaaaaaaaa');
//        const updates = rows.map((player, index) => {
//        return new Promise((res, rej) => {
//          db.run(
//            'UPDATE tournament_players SET seed = ? WHERE tournament_id = ? AND user_id = ?',
//            [index + 1, tournamentId, player.user_id],
//            (err) => {
//              if (err) return rej(err);
//              res();
//            }
//          );
//        });
//          });
//
//          Promise.all(updates)
//            .then(() => resolve({ message: 'Seeding complete', totalSeeded: updates.length }))
//            .catch(reject);
//        }
//      );
//    });
//  });
//}

//function seedPlayers(tournamnetId) {
//	return new Promise ((resolve, reject) => {
//		db.run('UPDATE FROM tournamen_players seed')
//		//seed based on rank		
//	})
//}
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
			db.all('SELECT * FROM tournament_players WHERE tournament_id = ? ORDER BY seed ASC',[tid], (err, rows) =>{
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
				return resolve(this.changes);
				}
			);
		});
}

function updateTournamentStats(gameId, p1Score, p2Score, status, winnerId){
	flog.debug({function: "updateTournamentStats", gameid: gameId, p1Score: p1Score, p2Score: p2Score, winnerId: winnerId});
		return new Promise((resolve, reject) => {
    		db.get('SELECT tournament_id, p1_id, p2_id FROM game WHERE game_uid = ?', [gameId], (err, row) => {
    			if (err || !row) {
    				flog.error({ function: "updateTournamentStats", errmsg: err?.message || 'Game not found' });
    				return reject(err || new Error('Game not found'));
    			}
			const { tournament_id, p1_id, p2_id } = row;


		db.serialize(() => { 
			db.run(
				'UPDATE game SET p1_score = ?, p2_score = ?, winner_id = ?, status = ? WHERE tournament_id = ? AND game_uid = ?',
			[p1Score, p2Score, winnerId, status, tournament_id, gameId], function onDone(err){
				if (err) {
					flog.error({fucntion: "updateTournamentStats", errmsg: err.message});
					return reject(err);
				}
				// if no changes check?
				return resolve(this.changes);
			})
			db.run('UPDATE tournament_players SET player_score = ? WHERE  tournament_id = ? AND user_id = ? ',
				[p1Score, tournament_id, p1_id])
			db.run('UPDATE tournament_players SET player_score = ? WHERE  tournament_id = ? AND user_id = ? ',
				[p2Score, tournament_id, p2_id])
		
		}
		)}
)}
)}
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
	flog.debug({ function: 'getUserByRole' , tid: tournamentId, role: role});
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

		flog.debug({function: "removePlayer", playerid: player.user_id});
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
	.catch(reject);
	});
}

/**
CREATE TABLE IF NOT EXISTS game
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
	ALTER TABLE game ADD COLUMN game_uid TEXT UNIQUE,
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
	if (round === 1 || round === 2)
	{
		bracket_pos = 1;
	}
	else {
		bracket_pos = 2;
	}
	return new Promise((resolve, reject) => {
	db.run('INSERT INTO game (tournament_id, p1_id, p2_id, game_uid, round, status, bracket_pos) VALUES (?, ?, ?, ?, ?, ?, ?)', 
		[tournamentId, player1Id, player2Id, gameid, round, status, bracket_pos], function onDone(err) {
		if (err) {
			flog.error({ function: 'DBbuild bracket', err}, 'DB error adding player to tournament:');
			return reject(err);
		}
		flog.info({ function: 'DBbuild bracket', tournamentId, player1Id, player2Id}, 'Players added to bracket');
		 const insertedId = this.lastID;
		db.get(
		  'SELECT * FROM game WHERE id = ?',
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

function updateBracket(tournamentId, userId, bracketPos) {
  return new Promise((resolve, reject) => {
    // Step 1: Find the game with empty slot at bracketPos
    db.get(
      `SELECT id, p1_id, p2_id, game_uid FROM game 
       WHERE tournament_id = ? AND bracket_pos = ? AND status = 'pending'`,
      [tournamentId, bracketPos],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('No available game slot found'));

        const { id, p1_id, p2_id, game_uid } = row;

        // Step 2: Fill the empty slot
        let updateField = '';
		let both = false;
		flog.warn({fucntion: "updateBracket", p1: p1_id}, "-----do we have a id ---------");
        if (p1_id === null) {
          updateField = 'p1_id';
        } else if (p2_id === null) {
          updateField = 'p2_id';
		  both = true;
        } else {
          return reject(new Error('Both player slots are already filled'));
        }

        // Step 3: Update game with player
        db.run(
          `UPDATE game SET ${updateField} = ?, status = ? WHERE id = ?`,
          [
            userId,
//            p1_id && p2_id ? 'ongoing' : 'pending', // status becomes 'ongoing' if both are filled
			both == true ? 'ongoing' : 'pending',
			id,
          ],
          function (err2) {
            if (err2) return reject(err2);

            // Step 4: Update player status
            db.run(
              `UPDATE tournament_players SET player_status = ? WHERE tournament_id = ? AND user_id = ?`,
              ['ready', tournamentId, userId]
            );

            return resolve({ gameId: game_uid, slot: updateField });
          }
        );
      }
    );
  });
}

function getBrackets(tournamentId) {
  flog.debug({ function: 'getBrackets' }, 'Getting brackets');

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM game WHERE tournament_id = ? ORDER BY round ASC, bracket_pos ASC`,
      [tournamentId],
      (err, games) => {
        if (err) {
          flog.error({ function: 'getBrackets', err }, 'DB error getting games');
          return reject(err);
        }

        db.all(
          `SELECT tp.*, u.username FROM tournament_players tp
           LEFT JOIN users u ON tp.user_id = u.id
           WHERE tp.tournament_id = ?`,
          [tournamentId],
          (err, players) => {
            if (err) {
              flog.error({ function: 'getBrackets', err }, 'DB error getting players');
              return reject(err);
            }

            const playerMap = {};
            players.forEach(p => {
              playerMap[p.user_id] = {
                username: p.username || "",
                alias: p.alias,
                role: p.player_role,
                status: p.player_status,
                score: p.player_score,
                isSelf: !!p.is_owner,
                isVerified: !!p.verified,
              };
            });

        const groupedBrackets = {};
		games.forEach(game => {
		if (!groupedBrackets[game.round]) {
		    groupedBrackets[game.round] = [];
		}
		const winnerAlias = game.winner_id && playerMap[game.winner_id]
		    ? playerMap[game.winner_id].alias : null;

		  groupedBrackets[game.round].push({
		    match_id: game.game_uid,
		    round: game.round,
		    bracket_pos: game.bracket_pos,
		    player1: playerMap[game.p1_id] || null,
		    player2: playerMap[game.p2_id] || null,
		    status: game.status,
			winner: winnerAlias,
		    score: {
		      player1: game.p1_score,
		      player2: game.p2_score,
		    },
		  });
			});
			//flog.debug({ players }, 'Fetched players');
			const bracketArray = Object.keys(groupedBrackets)
			  .sort((a, b) => a - b)
			  .map(round => groupedBrackets[round]);
				flog.debug({function: 'Fetched games array',  brackket: bracketArray});
			  return resolve(bracketArray);
		      }
		    );
		  }
	    );
  });
}
//function getBrackets(tournamentId){
//	flog.debug({ function: 'getBrackets',}, 'getting Brackets');
//		return new Promise((resolve, reject) => {
//			//what i need for each game
//			// game_uid
//			// bracket num 2 is last, the other 2
//			// are in round order .
//
//			//p1_id , p2_id 
//			db.get('SELECT')
//			if (err) {
//				flog.error({ function: 'getBrackets', err}, 'DB error gettin getBrackets:');
//				return reject(err);
//			}
//
//			return resolve([1, 2][3]);
//		});
//}
//getTOurnamnetplayers attach them to relative gameid, for return get game status for that , build score results
//const ret = {
//		match_id: bracket.game_uid,
//		player1: player1,
//		player2: player2,
//		status: "pending",
//		score: { player1: player1.score, player2: player2.score },
//	}

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
	flog.debug({ function: 'getUserByRole' , tid: tournamentId, role: role});
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

		flog.debug({function: "removePlayer", playerid: player.user_id});
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
	.catch(reject);
	});
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
	updateTournamentStats,
	 updateBracket,
	 getBrackets,
	 seedPlayers
};