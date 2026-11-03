-- Restore saved extension fields only when there have been no intervening writes.
-- Changed records require manual merge from office_rollback_payloads; never overwrite them.
BEGIN;
UPDATE records SET payload=(SELECT b.payload FROM office_rollback_payloads b WHERE b.kind=records.kind AND b.record_id=records.id AND b.version=records.version-1),
 version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE EXISTS(SELECT 1 FROM office_rollback_payloads b WHERE b.kind=records.kind AND b.record_id=records.id AND b.version=records.version-1);
DROP TRIGGER IF EXISTS notify_record_insert;
DROP TRIGGER IF EXISTS notify_record_update;
DROP TRIGGER IF EXISTS notify_record_blocked;
CREATE TRIGGER notify_record_blocked AFTER UPDATE ON records
WHEN NEW.kind='tasks' AND json_extract(NEW.payload,'$.status')='blocked' AND json_extract(OLD.payload,'$.status') IS NOT 'blocked'
BEGIN
 INSERT INTO notifications(id,record_id,kind,title,message,created_at) VALUES(lower(hex(randomblob(16))),NEW.id,NEW.kind,json_extract(NEW.payload,'$.title'),'งานติดขัด · '||COALESCE(json_extract(NEW.payload,'$.nextAction'),''),NEW.updated_at);
END;

COMMIT;
