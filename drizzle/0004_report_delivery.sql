ALTER TABLE notifications ADD COLUMN revision INTEGER;
--> statement-breakpoint
CREATE UNIQUE INDEX notifications_revision ON notifications(record_id,revision);
--> statement-breakpoint
DROP TRIGGER IF EXISTS notify_record_insert;
--> statement-breakpoint
DROP TRIGGER IF EXISTS notify_record_update;
--> statement-breakpoint
CREATE TRIGGER notify_record_blocked AFTER UPDATE ON records
WHEN NEW.kind='tasks' AND json_extract(NEW.payload,'$.status')='blocked' AND json_extract(OLD.payload,'$.status') IS NOT 'blocked'
BEGIN
 INSERT INTO notifications(id,record_id,kind,title,message,created_at) VALUES(lower(hex(randomblob(16))),NEW.id,NEW.kind,json_extract(NEW.payload,'$.title'),'งานติดขัด · '||COALESCE(json_extract(NEW.payload,'$.nextAction'),''),NEW.updated_at);
END;
--> statement-breakpoint
CREATE TABLE report_deliveries (
 id TEXT PRIMARY KEY NOT NULL,
 episode TEXT NOT NULL,
 state TEXT NOT NULL,
 attempt INTEGER NOT NULL DEFAULT 0,
 lease_until TEXT,
 lease_token TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 next_attempt_at TEXT NOT NULL,
 provider_id TEXT,
 error TEXT
);
