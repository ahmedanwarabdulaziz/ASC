-- ============================================
-- MEMBER STATUS AND CATEGORY SYSTEM
-- ============================================

-- Table: member_statuses
-- Tracks all status changes for members
CREATE TABLE IF NOT EXISTS member_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('chance', 'called', 'will_vote', 'sure_vote', 'voted')),
  supervisor_code TEXT,
  leader_code TEXT,
  updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for member_statuses
CREATE INDEX IF NOT EXISTS idx_member_statuses_member_id ON member_statuses(member_id);
CREATE INDEX IF NOT EXISTS idx_member_statuses_updated_by ON member_statuses(updated_by);
CREATE INDEX IF NOT EXISTS idx_member_statuses_status ON member_statuses(status);
CREATE INDEX IF NOT EXISTS idx_member_statuses_supervisor_code ON member_statuses(supervisor_code);
CREATE INDEX IF NOT EXISTS idx_member_statuses_leader_code ON member_statuses(leader_code);
CREATE INDEX IF NOT EXISTS idx_member_statuses_created_at ON member_statuses(created_at);

-- Table: categories
-- Private categories for each user (supervisor or leader)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supervisor_code TEXT,
  leader_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(created_by, name) -- Each user can have unique category names
);

-- Indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON categories(created_by);
CREATE INDEX IF NOT EXISTS idx_categories_supervisor_code ON categories(supervisor_code);
CREATE INDEX IF NOT EXISTS idx_categories_leader_code ON categories(leader_code);

-- Table: member_category_assignments
-- Links members to categories (one member per user can only be in one category)
CREATE TABLE IF NOT EXISTS member_category_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, assigned_by) -- One member can only be in one category per user
);

-- Indexes for member_category_assignments
CREATE INDEX IF NOT EXISTS idx_member_category_assignments_member_id ON member_category_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_category_assignments_category_id ON member_category_assignments(category_id);
CREATE INDEX IF NOT EXISTS idx_member_category_assignments_assigned_by ON member_category_assignments(assigned_by);

-- Table: status_conflicts
-- Tracks conflicts when multiple users update the same member's status
CREATE TABLE IF NOT EXISTS status_conflicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status_ids UUID[] NOT NULL, -- Array of conflicting status IDs
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for status_conflicts
CREATE INDEX IF NOT EXISTS idx_status_conflicts_member_id ON status_conflicts(member_id);
CREATE INDEX IF NOT EXISTS idx_status_conflicts_resolved ON status_conflicts(resolved);

-- Table: conflict_notifications
-- Notifications for users when conflicts occur
CREATE TABLE IF NOT EXISTS conflict_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conflict_id UUID NOT NULL REFERENCES status_conflicts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conflict_id, user_id)
);

-- Indexes for conflict_notifications
CREATE INDEX IF NOT EXISTS idx_conflict_notifications_user_id ON conflict_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_conflict_notifications_read ON conflict_notifications(read);
CREATE INDEX IF NOT EXISTS idx_conflict_notifications_conflict_id ON conflict_notifications(conflict_id);

-- Function to automatically detect conflicts when a new status is added
CREATE OR REPLACE FUNCTION detect_status_conflict()
RETURNS TRIGGER AS $$
DECLARE
  existing_statuses UUID[];
  conflict_id UUID;
  affected_users UUID[];
BEGIN
  -- Get all status IDs for this member (excluding the new one)
  SELECT ARRAY_AGG(id) INTO existing_statuses
  FROM member_statuses
  WHERE member_id = NEW.member_id
    AND id != NEW.id
    AND updated_by != NEW.updated_by
    AND created_at > NOW() - INTERVAL '24 hours'; -- Only conflicts within 24 hours

  -- If there are existing statuses from different users, create a conflict
  IF array_length(existing_statuses, 1) > 0 THEN
    -- Add the new status to the array
    existing_statuses := array_append(existing_statuses, NEW.id);
    
    -- Create conflict record
    INSERT INTO status_conflicts (member_id, status_ids)
    VALUES (NEW.member_id, existing_statuses)
    RETURNING id INTO conflict_id;
    
    -- Get all users who updated statuses for this member
    SELECT ARRAY_AGG(DISTINCT updated_by) INTO affected_users
    FROM member_statuses
    WHERE id = ANY(existing_statuses);
    
    -- Create notifications for all affected users
    INSERT INTO conflict_notifications (conflict_id, user_id)
    SELECT conflict_id, unnest(affected_users)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to detect conflicts
DROP TRIGGER IF EXISTS trigger_detect_status_conflict ON member_statuses;
CREATE TRIGGER trigger_detect_status_conflict
  AFTER INSERT ON member_statuses
  FOR EACH ROW
  EXECUTE FUNCTION detect_status_conflict();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_member_statuses_updated_at ON member_statuses;
CREATE TRIGGER trigger_update_member_statuses_updated_at
  BEFORE UPDATE ON member_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_categories_updated_at ON categories;
CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE member_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies will be added in a separate step after testing


