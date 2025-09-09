CREATE TABLE `scraps` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`content` text NOT NULL,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scraps_code_unique` ON `scraps` (`code`);