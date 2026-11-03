CREATE TABLE `ai_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`department` text NOT NULL,
	`prompt` text NOT NULL,
	`status` text NOT NULL,
	`result` text,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`title` text NOT NULL,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`kind`, `id`)
);
