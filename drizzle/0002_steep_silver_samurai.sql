CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE INDEX `notifications_time` ON `notifications` (`created_at`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`type` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
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
CREATE TRIGGER notify_job_issue AFTER UPDATE ON ai_jobs
WHEN NEW.state IN ('retry_wait','blocked') AND (NEW.state IS NOT OLD.state OR NEW.error_message IS NOT OLD.error_message)
BEGIN
 INSERT INTO notifications (id,record_id,kind,title,message,created_at)
 VALUES (lower(hex(randomblob(16))),NEW.task_id,'tasks','AI ต้องการความช่วยเหลือ · ' || NEW.department,COALESCE(NEW.error_message,'ตรวจสถานะงานก่อนดำเนินการต่อ'),NEW.updated_at);
END;
