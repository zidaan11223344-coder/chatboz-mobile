import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 32 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "agent"]).default("user").notNull(),
  agentPermissions: varchar("agentPermissions", { length: 512 }).default("{}").notNull(),
  createdById: int("createdById"),
  accountStatus: mysqlEnum("accountStatus", ["active", "disabled"]).default("active").notNull(),
  points: int("points").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const rooms = mysqlTable("rooms", {
  id: varchar("id", { length: 36 }).primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 90 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 40 }).notNull(),
  isLive: boolean("isLive").default(true).notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pointTransfers = mysqlTable("pointTransfers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  adminId: int("adminId").notNull(),
  recipientId: int("recipientId").notNull(),
  amount: int("amount").notNull(),
  note: varchar("note", { length: 180 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const roomMembers = mysqlTable("roomMembers", {
  id: int("id").autoincrement().primaryKey(),
  roomId: varchar("roomId", { length: 36 }).notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("room_member_unique").on(table.roomId, table.userId)]);

export const friendRequests = mysqlTable("friendRequests", {
  id: varchar("id", { length: 36 }).primaryKey(),
  requesterId: int("requesterId").notNull(),
  addresseeId: int("addresseeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("friend_request_unique").on(table.requesterId, table.addresseeId)]);

export const directConversations = mysqlTable("directConversations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  firstUserId: int("firstUserId").notNull(),
  secondUserId: int("secondUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("direct_conversation_unique").on(table.firstUserId, table.secondUserId)]);

export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  recipientId: int("recipientId").notNull(),
  actorId: int("actorId"),
  kind: mysqlEnum("kind", ["friend_request", "friend_accepted", "points_received", "room_closed"]).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  body: text("body").notNull(),
  friendRequestId: varchar("friendRequestId", { length: 36 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const storeProducts = mysqlTable("storeProducts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  label: varchar("label", { length: 80 }).notNull(),
  colorHex: varchar("colorHex", { length: 9 }).notNull(),
  pointsCost: int("pointsCost").notNull(),
  validityDays: int("validityDays").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userProducts = mysqlTable("userProducts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull(),
  productId: varchar("productId", { length: 36 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("user_product_unique").on(table.userId, table.productId)]);

export const chatMessages = mysqlTable("chatMessages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  roomId: varchar("roomId", { length: 36 }),
  conversationId: varchar("conversationId", { length: 36 }),
  senderId: int("senderId").notNull(),
  kind: mysqlEnum("kind", ["text", "image", "audio"]).notNull(),
  body: text("body"),
  textColor: varchar("textColor", { length: 9 }),
  attachmentUrl: text("attachmentUrl"),
  attachmentName: varchar("attachmentName", { length: 255 }),
  durationSeconds: int("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type DirectConversation = typeof directConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type PointTransfer = typeof pointTransfers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type StoreProduct = typeof storeProducts.$inferSelect;
export type UserProduct = typeof userProducts.$inferSelect;
