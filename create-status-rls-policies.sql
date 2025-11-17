-- ============================================
-- RLS POLICIES FOR STATUS AND CATEGORY SYSTEM
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own statuses" ON member_statuses;
DROP POLICY IF EXISTS "Supervisors can view own and leaders statuses" ON member_statuses;
DROP POLICY IF EXISTS "Admins can view all statuses" ON member_statuses;
DROP POLICY IF EXISTS "Users can create own statuses" ON member_statuses;
DROP POLICY IF EXISTS "Leaders can update own statuses" ON member_statuses;
DROP POLICY IF EXISTS "Admins can update any status" ON member_statuses;
DROP POLICY IF EXISTS "Admins can delete any status" ON member_statuses;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can create own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own category assignments" ON member_category_assignments;
DROP POLICY IF EXISTS "Users can create own category assignments" ON member_category_assignments;
DROP POLICY IF EXISTS "Users can update own category assignments" ON member_category_assignments;
DROP POLICY IF EXISTS "Users can delete own category assignments" ON member_category_assignments;

DROP POLICY IF EXISTS "Admins can view all conflicts" ON status_conflicts;
DROP POLICY IF EXISTS "Users can view own conflict notifications" ON conflict_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON conflict_notifications;

-- member_statuses policies
-- Users can view their own statuses
CREATE POLICY "Users can view own statuses" ON member_statuses
  FOR SELECT
  USING (updated_by = auth.uid());

-- Supervisors can view their own statuses and their leaders' statuses
CREATE POLICY "Supervisors can view own and leaders statuses" ON member_statuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'supervisor'
    )
    AND (
      updated_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = updated_by 
        AND role = 'team_leader'
        AND supervisor_id = auth.uid()
      )
    )
  );

-- Admins can view all statuses
CREATE POLICY "Admins can view all statuses" ON member_statuses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create their own statuses
CREATE POLICY "Users can create own statuses" ON member_statuses
  FOR INSERT
  WITH CHECK (updated_by = auth.uid());

-- Leaders can update their own statuses
CREATE POLICY "Leaders can update own statuses" ON member_statuses
  FOR UPDATE
  USING (updated_by = auth.uid())
  WITH CHECK (updated_by = auth.uid());

-- Admins can update any status
CREATE POLICY "Admins can update any status" ON member_statuses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete any status
CREATE POLICY "Admins can delete any status" ON member_statuses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- categories policies
-- Users can view their own categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT
  USING (created_by = auth.uid());

-- Users can create their own categories
CREATE POLICY "Users can create own categories" ON categories
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Users can update their own categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own categories
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE
  USING (created_by = auth.uid());

-- member_category_assignments policies
-- Users can view their own category assignments
CREATE POLICY "Users can view own category assignments" ON member_category_assignments
  FOR SELECT
  USING (assigned_by = auth.uid());

-- Users can create their own category assignments
CREATE POLICY "Users can create own category assignments" ON member_category_assignments
  FOR INSERT
  WITH CHECK (assigned_by = auth.uid());

-- Users can update their own category assignments
CREATE POLICY "Users can update own category assignments" ON member_category_assignments
  FOR UPDATE
  USING (assigned_by = auth.uid())
  WITH CHECK (assigned_by = auth.uid());

-- Users can delete their own category assignments
CREATE POLICY "Users can delete own category assignments" ON member_category_assignments
  FOR DELETE
  USING (assigned_by = auth.uid());

-- status_conflicts policies
-- Admins can view all conflicts
CREATE POLICY "Admins can view all conflicts" ON status_conflicts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update conflicts (resolve them)
CREATE POLICY "Admins can update conflicts" ON status_conflicts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- conflict_notifications policies
-- Users can view their own notifications
CREATE POLICY "Users can view own conflict notifications" ON conflict_notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON conflict_notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());




