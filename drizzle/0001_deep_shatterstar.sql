CREATE TABLE `chatMessages` (
	`id` varchar(36) NOT NULL,
	`roomId` varchar(36),
	`conversationId` varchar(36),
	`senderId` int NOT NULL,
	`kind` enum('text','image','audio') NOT NULL,
	`body` text,
	`attachmentUrl` text,
	`attachmentName` varchar(255),
	`durationSeconds` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `directConversations` (
	`id` varchar(36) NOT NULL,
	`firstUserId` int NOT NULL,
	`secondUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `directConversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `direct_conversation_unique` UNIQUE(`firstUserId`,`secondUserId`)
);
--> statement-breakpoint
CREATE TABLE `friendRequests` (
	`id` varchar(36) NOT NULL,
	`requesterId` int NOT NULL,
	`addresseeId` int NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `friend_request_unique` UNIQUE(`requesterId`,`addresseeId`)
);
--> statement-breakpoint
CREATE TABLE `roomMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `roomMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `room_member_unique` UNIQUE(`roomId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` varchar(36) NOT NULL,
	`ownerId` int NOT NULL,
	`title` varchar(90) NOT NULL,
	`description` text,
	`category` varchar(40) NOT NULL,
	`isLive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
