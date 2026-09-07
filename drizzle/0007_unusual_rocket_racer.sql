CREATE TABLE `blockedUsers` (
	`id` varchar(36) NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockedUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `blocked_user_unique` UNIQUE(`blockerId`,`blockedId`)
);
