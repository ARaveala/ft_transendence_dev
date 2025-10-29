
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_file TEXT,
	language TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL DEFAULT 'offline',
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
	mfa_secret TEXT,
    rank INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0
);

CREATE tABLE IF NOT EXISTS match_history
(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	opponent_id INTEGER NOT NULL,
	user_score INTEGER NOT NULL,
	opponent_score INTEGER NOT NULL,
	result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
	match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (opponent_id) REFERENCES users(id) ON DELETE CASCADE
);
-- multidirectional friendship table, allows for sigle directional requests
-- status can be 'pending', 'accepted', 'blocked'
-- cap at 20?
CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'pending',
    CHECK (user_id <> friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    PRIMARY KEY (user_id, friend_id) -- ensures no duplicate friendships
);
CREATE INDEX IF NOT EXISTS idx_friend_friend_id ON friends(friend_id);

-- tournament table
CREATE TABLE IF NOT EXISTS tournaments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting','ready','ongoing','finished')),
    winner_id INTEGER,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- do we want to add if game was 1v1 or tournament ?
-- no match key as we want to use this to build leaderboard
-- leaderboard should not have same player twice , if user has top score , next score is another user
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
	game_uid TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'pending', 'ongoing', 'finished')),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE IF NOT  EXISTS tournament_players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    alias TEXT NOT NULL,
    seed INTEGER NOT NULL CHECK (seed BETWEEN 1 AND 4),
	player_role TEXT NOT NULL DEFAULT 'player',
	player_status TEXT NOT NULL DEFAULT 'waiting',
	player_score INTEGER NOT NULL DEFAULT 0,
	verified INTEGER NOT NULL DEFAULT 0,
	is_owner INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tournament_id, user_id),
    UNIQUE (tournament_id, alias),
    UNIQUE (tournament_id, seed),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- leaderboard table to track user rankings
-- this avoids scanning the entire users/matchHistory table for rankings
-- not sure if sensible yet could also be updated each leaderboard request?
--CREATE TABLE leaderboard (
--  user_id INTEGER PRIMARY KEY,
--  wins INTEGER DEFAULT 0,
--  losses INTEGER DEFAULT 0,
--  score INTEGER DEFAULT 0,
--  FOREIGN KEY (user_id) REFERENCES users(id)
--);
