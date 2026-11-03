CREATE TABLE IF NOT EXISTS ai_usage (
 id TEXT PRIMARY KEY NOT NULL,
 job_id TEXT NOT NULL,
 created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ai_usage_time ON ai_usage(created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS record_revisions (
 kind TEXT NOT NULL,
 record_id TEXT NOT NULL,
 version INTEGER NOT NULL,
 payload TEXT NOT NULL,
 saved_at TEXT NOT NULL,
 PRIMARY KEY(kind,record_id,version)
);
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS preserve_record_revision AFTER UPDATE ON records
BEGIN
 INSERT OR IGNORE INTO record_revisions(kind,record_id,version,payload,saved_at)
 VALUES(OLD.kind,OLD.id,OLD.version,OLD.payload,OLD.updated_at);
END;
--> statement-breakpoint
DROP INDEX IF EXISTS ai_jobs_task;
--> statement-breakpoint
CREATE INDEX ai_jobs_task ON ai_jobs(task_id);
