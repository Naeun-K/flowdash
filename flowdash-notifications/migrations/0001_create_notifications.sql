-- Migration number: 0001 	 2026-09-27T13:09:02.275Z
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  todo_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notify_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent')),
  sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (user_id, todo_id, notification_id)
);

CREATE INDEX idx_notifications_due
ON notifications (status, notify_at);

CREATE INDEX idx_notifications_todo
ON notifications (user_id, todo_id);