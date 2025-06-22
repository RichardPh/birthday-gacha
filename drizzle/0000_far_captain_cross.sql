CREATE TABLE `login_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`game` text NOT NULL,
	`credits` integer DEFAULT 3 NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 1750607457631
);
