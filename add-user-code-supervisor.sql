-- Add code and supervisor_id columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for supervisor_id
CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON users(supervisor_id);

-- Create index for code
CREATE INDEX IF NOT EXISTS idx_users_code ON users(code);

-- Add constraint: code is required for supervisor and team_leader roles
-- Note: We'll enforce this in application logic since CHECK constraints can't reference other columns easily



