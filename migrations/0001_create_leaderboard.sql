-- Migration: Create leaderboard table for Gauntlet mode
-- Purpose: Store player scores with proper indexing for fast queries and cursor pagination

-- Main leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Data constraints
  CHECK (score >= 0 AND score <= 1000),
  CHECK (length(nickname) <= 30)
);

-- Performance indexes
-- Composite index for cursor pagination (score DESC, id ASC for stable ordering)
CREATE INDEX IF NOT EXISTS idx_leaderboard_score_id ON leaderboard(score DESC, id ASC);

-- Index for daily filtering
CREATE INDEX IF NOT EXISTS idx_leaderboard_submitted_at ON leaderboard(submitted_at);

-- Optional: Daily leaderboard history (archives top 10 per day)
CREATE TABLE IF NOT EXISTS leaderboard_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  archived_at TEXT NOT NULL DEFAULT (datetime('now')),

  -- Ensure unique ranks per day
  UNIQUE(date, rank)
);

-- Index for querying specific dates
CREATE INDEX IF NOT EXISTS idx_leaderboard_history_date ON leaderboard_history(date);
