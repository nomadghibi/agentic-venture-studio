-- Session tokens were stored as plaintext; truncate so existing tokens (which
-- were never hashed) don't match any future hash-based lookups.
TRUNCATE user_sessions;

-- Rename column to reflect that we now store SHA-256(raw_token), not the raw token.
ALTER TABLE user_sessions RENAME COLUMN token TO token_hash;

-- Password reset tokens table.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    CONSTRAINT prt_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON password_reset_tokens (user_id);
