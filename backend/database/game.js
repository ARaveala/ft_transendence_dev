const db = require('./initDB');

function createGameRow({p1Id})
{
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO games (p1_id, p2_id, status)
             VALUES (?, NULL, 'waiting')`,
            [p1Id],
            function (err)
            {
                if (err) return reject(err);
                resolve({id: this.lastID});
            }
        );
    });
}

function joinGameRow({gameId, p2Id})
{
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE games
                SET p2_id = ?, status = 'ongoing'
            WHERE id = ?
                AND p2_id IS NULL
                AND status IN ('waiting')`,
            [p2Id, gameId],
            function (err)
            {
                if (err) return reject(err);
                if (this.changes === 0) return reject(new Error('GAME_NOT_JOINABLE'));
                resolve({ok: true});
            }
        );
    });
}

function startGameRow({gameId, allowSolo = false})
{
    return new Promise((resolve, reject) =>{
        const sql = allowSolo
            ? `UPDATE games SET status = 'ongoing' WHERE id = ?`
            : `UPDATE games SET status = 'ongoing' WHERE id = ? AMD p1_id IS NOT NULL AND p2_id IS NOT NULL`;
        db.run(sql, [gameId],
            function (err)
            {
                if (err) return reject(err);
                if (this.changes === 0) return reject(new Error('GAME_NOT_READY'));
                resolve({ok: true});
            }
        );
    });
}

function fetchGame(gameId)
{
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT id, p1_id, p2_id, status, mode, type, p1_score, p2_score, winner_id
                FROM games where id = ?`,
                [gameId],
            (err, row) => (err ? reject(err) : resolve(row || null))
        );
    });
}

module.exports = { createGameRow, joinGameRow, startGameRow, fetchGame };