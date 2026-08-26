CREATE TABLE `pointTransfers` (
	`id` varchar(36) NOT NULL,
	`adminId` int NOT NULL,
	`recipientId` int NOT NULL,
	`amount` int NOT NULL,
	`note` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pointTransfers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rooms` ADD `closedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','disabled') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `points` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);