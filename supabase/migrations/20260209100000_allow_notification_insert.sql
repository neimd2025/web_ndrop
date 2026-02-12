-- Enable RLS on notifications if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to insert notifications if they are the sender
-- This allows the fallback mechanism to work if Admin Client fails
CREATE POLICY "Users can insert notifications sent by them"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sent_by);

-- Ensure users can select their own notifications AND global notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR target_type = 'all');

-- Ensure users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
