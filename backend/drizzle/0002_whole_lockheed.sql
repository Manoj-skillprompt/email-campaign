CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`sender_email` text NOT NULL,
	`type` text DEFAULT 'EMAIL' NOT NULL,
	`group_ids` text NOT NULL,
	`content` text NOT NULL,
	`status` text NOT NULL,
	`scheduled_at` text,
	`sent_at` text,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`open_rate` real DEFAULT 0 NOT NULL,
	`click_rate` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
