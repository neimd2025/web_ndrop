
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view public notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role has full access" ON notifications;

-- 1. Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (
  auth.uid() = user_id
);

-- 2. Policy: Users can view public notifications
CREATE POLICY "Users can view public notifications"
ON notifications FOR SELECT
USING (
  target_type = 'all'
);

-- 3. Policy: Service Role (or Admin) can insert/update/delete
-- Note: Service Role bypasses RLS by default, but if we use a client with RLS enabled (like authenticated admin user), we need this.
-- However, we mostly use Service Role Key which bypasses everything. 
-- So we mainly need to ensure SELECT is permissive enough for Realtime to work for the receiver.

-- Add to Realtime Publication
-- We use 'alter publication ... add table' but need to check if it's already there to avoid error?
-- Postgres allows adding even if exists (it just ignores or handled gracefully usually, but let's be safe).
-- Better to drop and add or just add.
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
