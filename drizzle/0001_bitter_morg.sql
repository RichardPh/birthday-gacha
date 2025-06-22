CREATE TABLE `prizes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`image_url` text,
	`weight` integer DEFAULT 1
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_login_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`game` text NOT NULL,
	`credits` integer DEFAULT 3 NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT 1750612806012
);
--> statement-breakpoint
INSERT INTO `__new_login_codes`("code", "game", "credits", "spent", "created_at") SELECT "code", "game", "credits", "spent", "created_at" FROM `login_codes`;--> statement-breakpoint
DROP TABLE `login_codes`;--> statement-breakpoint
ALTER TABLE `__new_login_codes` RENAME TO `login_codes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;