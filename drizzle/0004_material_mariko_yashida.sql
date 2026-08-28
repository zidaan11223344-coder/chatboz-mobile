CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`recipientId` int NOT NULL,
	`actorId` int,
	`kind` enum('friend_request','friend_accepted','points_received','room_closed') NOT NULL,
	`title` varchar(120) NOT NULL,
	`body` text NOT NULL,
	`friendRequestId` varchar(36),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `storeProducts` (
	`id` varchar(36) NOT NULL,
	`code` varchar(32) NOT NULL,
	`label` varchar(80) NOT NULL,
	`colorHex` varchar(9) NOT NULL,
	`pointsCost` int NOT NULL,
	`validityDays` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `storeProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `storeProducts_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `userProducts` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_product_unique` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','agent') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `createdById` int;