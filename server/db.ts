import { and, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  chatMessages,
  directConversations,
  friendRequests,
  type InsertUser,
  roomMembers,
  rooms,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حاليًا.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  textFields.forEach((field) => {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  });

  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type RoomSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  isLive: boolean;
  createdAt: Date;
  owner: { id: number; name: string };
  memberCount: number;
  joined: boolean;
};

export async function listRoomsForUser(userId: number): Promise<RoomSummary[]> {
  const db = await requireDb();
  const rows = await db
    .select({ room: rooms, owner: users })
    .from(rooms)
    .innerJoin(users, eq(rooms.ownerId, users.id))
    .orderBy(desc(rooms.createdAt));

  return Promise.all(rows.map(async ({ room, owner }) => {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomMembers)
      .where(eq(roomMembers.roomId, room.id));
    const [membership] = await db
      .select({ id: roomMembers.id })
      .from(roomMembers)
      .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.userId, userId)))
      .limit(1);

    return {
      id: room.id,
      title: room.title,
      description: room.description,
      category: room.category,
      isLive: room.isLive,
      createdAt: room.createdAt,
      owner: { id: owner.id, name: owner.name?.trim() || "مستخدم" },
      memberCount: Number(countRow?.count ?? 0),
      joined: Boolean(membership),
    };
  }));
}

export async function createRoomForUser(input: { ownerId: number; title: string; description?: string; category: string }) {
  const db = await requireDb();
  const roomId = crypto.randomUUID();
  await db.insert(rooms).values({
    id: roomId,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category.trim(),
    isLive: true,
  });
  await db.insert(roomMembers).values({ roomId, userId: input.ownerId, role: "owner" });
  return roomId;
}

export async function joinRoomForUser(roomId: string, userId: number) {
  const db = await requireDb();
  const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) throw new Error("الغرفة غير موجودة.");
  await db.insert(roomMembers).values({ roomId, userId, role: "member" }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function searchRealUsers(query: string, currentUserId: number) {
  const db = await requireDb();
  const normalized = query.trim();
  if (normalized.length < 2) return [];
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(like(users.name, `%${normalized}%`), ne(users.id, currentUserId)))
    .limit(20);
}

export async function listFriendsForUser(userId: number) {
  const db = await requireDb();
  const accepted = await db
    .select()
    .from(friendRequests)
    .where(and(or(eq(friendRequests.requesterId, userId), eq(friendRequests.addresseeId, userId)), eq(friendRequests.status, "accepted")));

  return Promise.all(accepted.map(async (request) => {
    const friendId = request.requesterId === userId ? request.addresseeId : request.requesterId;
    const [friend] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, friendId)).limit(1);
    return friend ? { id: friend.id, name: friend.name?.trim() || "مستخدم", email: friend.email } : null;
  })).then((items) => items.filter((item): item is NonNullable<typeof item> => Boolean(item)));
}

export async function requestFriendship(requesterId: number, addresseeId: number) {
  if (requesterId === addresseeId) throw new Error("لا يمكنك إضافة حسابك كصديق.");
  const db = await requireDb();
  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, addresseeId)).limit(1);
  if (!target) throw new Error("الحساب المطلوب غير موجود.");

  const [existing] = await db
    .select()
    .from(friendRequests)
    .where(or(
      and(eq(friendRequests.requesterId, requesterId), eq(friendRequests.addresseeId, addresseeId)),
      and(eq(friendRequests.requesterId, addresseeId), eq(friendRequests.addresseeId, requesterId)),
    ))
    .limit(1);
  if (existing?.status === "accepted") throw new Error("هذا الحساب موجود ضمن أصدقائك بالفعل.");
  if (existing?.status === "pending") throw new Error("يوجد طلب صداقة قيد المراجعة بالفعل.");

  await db.insert(friendRequests).values({
    id: crypto.randomUUID(),
    requesterId,
    addresseeId,
    status: "pending",
  });
}

export async function respondToFriendRequest(requestId: string, userId: number, accept: boolean) {
  const db = await requireDb();
  const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1);
  if (!request || request.addresseeId !== userId) throw new Error("طلب الصداقة غير متاح.");
  await db.update(friendRequests).set({ status: accept ? "accepted" : "declined" }).where(eq(friendRequests.id, requestId));
}

async function assertFriendship(userId: number, otherUserId: number) {
  const db = await requireDb();
  const [friendship] = await db
    .select({ id: friendRequests.id })
    .from(friendRequests)
    .where(and(
      or(
        and(eq(friendRequests.requesterId, userId), eq(friendRequests.addresseeId, otherUserId)),
        and(eq(friendRequests.requesterId, otherUserId), eq(friendRequests.addresseeId, userId)),
      ),
      eq(friendRequests.status, "accepted"),
    ))
    .limit(1);
  if (!friendship) throw new Error("يجب أن تكونما صديقين لبدء محادثة خاصة.");
}

export async function getOrCreateDirectConversation(userId: number, otherUserId: number) {
  await assertFriendship(userId, otherUserId);
  const db = await requireDb();
  const [firstUserId, secondUserId] = [userId, otherUserId].sort((a, b) => a - b);
  const [existing] = await db
    .select()
    .from(directConversations)
    .where(and(eq(directConversations.firstUserId, firstUserId), eq(directConversations.secondUserId, secondUserId)))
    .limit(1);
  if (existing) return existing;

  const conversation = { id: crypto.randomUUID(), firstUserId, secondUserId };
  await db.insert(directConversations).values(conversation);
  return { ...conversation, createdAt: new Date() };
}

export async function listConversationsForUser(userId: number) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(directConversations)
    .where(or(eq(directConversations.firstUserId, userId), eq(directConversations.secondUserId, userId)))
    .orderBy(desc(directConversations.createdAt));

  return Promise.all(rows.map(async (conversation) => {
    const otherUserId = conversation.firstUserId === userId ? conversation.secondUserId : conversation.firstUserId;
    const [other] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, otherUserId)).limit(1);
    const [lastMessage] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversation.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(1);
    return {
      id: conversation.id,
      user: other ? { id: other.id, name: other.name?.trim() || "مستخدم" } : null,
      lastMessage: lastMessage ?? null,
      createdAt: conversation.createdAt,
    };
  })).then((items) => items.filter((item): item is typeof item & { user: NonNullable<typeof item.user> } => Boolean(item.user)));
}

async function assertConversationMember(conversationId: string, userId: number) {
  const db = await requireDb();
  const [conversation] = await db.select().from(directConversations).where(eq(directConversations.id, conversationId)).limit(1);
  if (!conversation || (conversation.firstUserId !== userId && conversation.secondUserId !== userId)) throw new Error("لا تملك صلاحية هذه المحادثة.");
}

async function assertRoomMember(roomId: string, userId: number) {
  const db = await requireDb();
  const [membership] = await db
    .select({ id: roomMembers.id })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1);
  if (!membership) throw new Error("انضم إلى الغرفة أولًا لعرض الدردشة أو إرسال رسالة.");
}

export async function listConversationMessages(conversationId: string, userId: number) {
  await assertConversationMember(conversationId, userId);
  const db = await requireDb();
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt).limit(100);
}

export async function listRoomMessages(roomId: string, userId: number) {
  await assertRoomMember(roomId, userId);
  const db = await requireDb();
  return db.select().from(chatMessages).where(eq(chatMessages.roomId, roomId)).orderBy(chatMessages.createdAt).limit(100);
}

export async function createMessage(input: {
  senderId: number;
  kind: "text" | "image" | "audio";
  body?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  durationSeconds?: number;
  conversationId?: string;
  roomId?: string;
}) {
  if (!input.conversationId && !input.roomId) throw new Error("حدد وجهة الرسالة.");
  if (input.conversationId) await assertConversationMember(input.conversationId, input.senderId);
  if (input.roomId) await assertRoomMember(input.roomId, input.senderId);
  if (input.kind === "text" && !input.body?.trim()) throw new Error("لا يمكن إرسال رسالة فارغة.");
  if (input.kind !== "text" && !input.attachmentUrl) throw new Error("المرفق مطلوب لهذه الرسالة.");

  const db = await requireDb();
  const message = {
    id: crypto.randomUUID(),
    senderId: input.senderId,
    kind: input.kind,
    body: input.body?.trim() || null,
    attachmentUrl: input.attachmentUrl ?? null,
    attachmentName: input.attachmentName ?? null,
    durationSeconds: input.durationSeconds ?? null,
    conversationId: input.conversationId ?? null,
    roomId: input.roomId ?? null,
  };
  await db.insert(chatMessages).values(message);
  return { ...message, createdAt: new Date() };
}
