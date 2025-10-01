CREATE TABLE IF NOT EXISTS users
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    avatar_file TEXT,
    status TEXT NOT NULL DEFAULT 'offline',
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0
);

-- multidirectional friendship table, allows for sigle directional requests
-- status can be 'pending', 'accepted', 'blocked'
-- cap at 20?
CREATE TABLE IF NOT EXISTS friends (
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
	status, TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    PRIMARY KEY (user_id, friend_id) -- ensures no duplicate friendships
);


-- do we want to add if game was 1v1 or tournament ?
-- no match key as we want to use this to build leaderboard
-- leaderboard should not have same player twice , if user has top score , next score is another user
CREATE TABLE matches (
	user_id INTEGER NOT NULL,
	match_index INTEGER NOT NULL, -- 0 to 9
	result TEXT NOT NULL,
	opponent_type TEXT NOT NULL DEFAULT 'user',
	opponent_id INTEGER, -- null if ai or guest
	score INTEGER NOT NULL DEFAULT 0,
	timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (user_id, match_index),
	FOREIGN KEY (user_id) REFERENCES users(id),
	FOREIGN KEY (opponent_id) REFERENCES users(id)
);

--///just eg 
--CREATE TABLE IF NOT EXISTS matches (
--    id INTEGER PRIMARY KEY AUTOINCREMENT,
--    user_id INTEGER NOT NULL,           -- the player whose history this is
--    opponent_type TEXT NOT NULL,        -- 'user', 'guest', 'ai'
--    opponent_id INTEGER,                -- nullable if guest or ai
--    result TEXT NOT NULL,               -- 'win' or 'loss'
--    score INTEGER,
--    timestamp TEXT NOT NULL,
--    tournament_id INTEGER,              -- optional
--    FOREIGN KEY (user_id) REFERENCES users(id),
--    FOREIGN KEY (opponent_id) REFERENCES users(id),
--    FOREIGN KEY (tournament_id) REFERENCES tournaments(id)
--);

-- tournament table?
CREATE TABLE IF NOT EXISTS games
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id INTEGER,--deleted on game over?
    p1_id INTEGER,
    p2_id INTEGER,
    p1_score INTEGER NOT NULL DEFAULT 0,
    p2_score INTEGER NOT NULL DEFAULT 0,
    CHECK (p1_id <> p2_id),
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
    FOREIGN KEY (p1_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (p2_id) REFERENCES users(id) ON DELETE SET NULL
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
