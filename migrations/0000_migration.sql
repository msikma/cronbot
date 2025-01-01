CREATE TABLE `cache` (
	`guid` text NOT NULL,
	`task` text NOT NULL,
	`subtask` text,
	`data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	PRIMARY KEY(`guid`, `task`)
);
--> statement-breakpoint
CREATE TABLE `cache_to_message` (
	`guid` text NOT NULL,
	`task` text NOT NULL,
	`id` text NOT NULL,
	PRIMARY KEY(`guid`, `task`, `id`),
	FOREIGN KEY (`guid`,`task`) REFERENCES `cache`(`guid`,`task`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text,
	`channel_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
