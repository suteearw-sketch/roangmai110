-- Stop the worker and deploy the previous app only after this transaction.
-- Retain every new table/column and duplicate job history. Nothing is dropped.
BEGIN;
CREATE TABLE IF NOT EXISTS office_rollback_payloads (
 kind TEXT NOT NULL, record_id TEXT NOT NULL, version INTEGER NOT NULL,
 payload TEXT NOT NULL, PRIMARY KEY(kind,record_id,version)
);
INSERT OR IGNORE INTO office_rollback_payloads(kind,record_id,version,payload)
 SELECT kind,id,version,payload FROM records
 WHERE json_type(payload,'$.reviewSources') IS NOT NULL OR json_type(payload,'$.contactDetails') IS NOT NULL;
UPDATE records SET payload=json_remove(payload,'$.reviewSources','$.contactDetails'),version=version+1,
 updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE json_type(payload,'$.reviewSources') IS NOT NULL OR json_type(payload,'$.contactDetails') IS NOT NULL;
DROP TRIGGER IF EXISTS notify_record_blocked;
DROP TRIGGER IF EXISTS notify_record_insert;
DROP TRIGGER IF EXISTS notify_record_update;
CREATE TRIGGER notify_record_insert AFTER INSERT ON records
WHEN json_extract(NEW.payload,'$.status') IN ('review','blocked','done') AND NEW.kind IN ('tasks','tickets','campaigns','projects')
BEGIN
 INSERT INTO notifications (id,record_id,kind,title,message,created_at)
 VALUES (lower(hex(randomblob(16))),NEW.id,NEW.kind,json_extract(NEW.payload,'$.title'),
 CASE json_extract(NEW.payload,'$.status') WHEN 'review' THEN 'มีผลงานรอตรวจ' WHEN 'blocked' THEN 'งานติดขัด ต้องการความช่วยเหลือ' ELSE 'งานเสร็จแล้ว' END || ' · ' || COALESCE(json_extract(NEW.payload,'$.nextAction'),''),NEW.updated_at);
END;
--> statement-breakpoint
CREATE TRIGGER notify_record_update AFTER UPDATE ON records
WHEN json_extract(NEW.payload,'$.status') IN ('review','blocked','done') AND NEW.kind IN ('tasks','tickets','campaigns','projects') AND json_extract(NEW.payload,'$.status') IS NOT json_extract(OLD.payload,'$.status')
BEGIN
 INSERT INTO notifications (id,record_id,kind,title,message,created_at)
 VALUES (lower(hex(randomblob(16))),NEW.id,NEW.kind,json_extract(NEW.payload,'$.title'),
 CASE json_extract(NEW.payload,'$.status') WHEN 'review' THEN 'มีผลงานรอตรวจ' WHEN 'blocked' THEN 'งานติดขัด ต้องการความช่วยเหลือ' ELSE 'งานเสร็จแล้ว' END || ' · ' || COALESCE(json_extract(NEW.payload,'$.nextAction'),''),NEW.updated_at);
END;
--> statement-breakpoint

COMMIT;
