CREATE TABLE `ai_job_events` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`state` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ai_events_job` ON `ai_job_events` (`job_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `ai_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`department` text NOT NULL,
	`prompt` text NOT NULL,
	`actor` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`provider_id` text,
	`provider_state` text,
	`result` text,
	`next_attempt_at` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`error_code` text,
	`error_message` text,
	`lease_token` text,
	`lease_until` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_jobs_task` ON `ai_jobs` (`task_id`);--> statement-breakpoint
CREATE INDEX `ai_jobs_due` ON `ai_jobs` (`state`,`next_attempt_at`);