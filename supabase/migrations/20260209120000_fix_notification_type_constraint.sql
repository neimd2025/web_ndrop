
-- Drop the restrictive check constraint on notification_type
-- This allows new notification types like 'meeting_request' and 'meeting_chat' to be inserted
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
