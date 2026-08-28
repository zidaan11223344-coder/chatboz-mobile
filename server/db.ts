import { and, desc, eq, gt, inArray, isNull, like, ne, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import {
  chatMessages,
  directConversations,
  friendRequests,
  notifications,
  storeProducts,
  userProducts,
  type InsertUser,
  pointTransfers,
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

export async function getLocalUserByUsername(username: string) {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user;
}

export async function getActiveUserById(id: number) {
  const db = await requireDb();
  const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.accountStatus, "active"))).limit(1);
  return user;
}

export async function createLocalUser(input: { username: string; name: string; passwordHash: string; role?: "user" | "admin" | "agent"; createdById?: number }) {
  const db = await requireDb();
  const existing = await getLocalUserByUsername(input.username);
  if (existing) throw new Error("اسم المستخدم مستخدم بالفعل.");
  await db.insert(users).values({
    openId: `local:${crypto.randomUUID()}`,
    username: input.username,
    name: input.name,
    passwordHash: input.passwordHash,
    loginMethod: "local",
    role: input.role ?? "user",
    createdById: input.createdById ?? null,
    accountStatus: "active",
    points: 0,
  });
  const created = await getLocalUserByUsername(input.username);
  if (!created) throw new Error("تعذر إنشاء الحساب.");
  return created;
}

export async function ensureBootstrapAdmin(input: { username: string; name: string; passwordHash: string }) {
  const existing = await getLocalUserByUsername(input.username);
  if (existing) return existing;
  return createLocalUser({ ...input, role: "admin" });
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
    .where(and(eq(rooms.isLive, true), eq(users.accountStatus, "active")))
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
    .where(and(like(users.name, `%${normalized}%`), ne(users.id, currentUserId), eq(users.accountStatus, "active")))
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

  const requestId = existing?.id ?? crypto.randomUUID();
  if (existing) {
    await db.update(friendRequests).set({ requesterId, addresseeId, status: "pending", updatedAt: new Date() }).where(eq(friendRequests.id, existing.id));
  } else {
    await db.insert(friendRequests).values({ id: requestId, requesterId, addresseeId, status: "pending" });
  }
  const requester = await getActiveUserById(requesterId);
  await db.insert(notifications).values({ id: crypto.randomUUID(), recipientId: addresseeId, actorId: requesterId, kind: "friend_request", title: "طلب صداقة جديد", body: `${requester?.name?.trim() || "مستخدم"} أرسل لك طلب صداقة.`, friendRequestId: requestId });
}

export async function respondToFriendRequest(requestId: string, userId: number, accept: boolean) {
  const db = await requireDb();
  const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1);
  if (!request || request.addresseeId !== userId) throw new Error("طلب الصداقة غير متاح.");
  await db.update(friendRequests).set({ status: accept ? "accepted" : "declined", updatedAt: new Date() }).where(eq(friendRequests.id, requestId));
  const responder = await getActiveUserById(userId);
  await db.insert(notifications).values({ id: crypto.randomUUID(), recipientId: request.requesterId, actorId: userId, kind: accept ? "friend_accepted" : "friend_request", title: accept ? "تم قبول طلب الصداقة" : "تم رفض طلب الصداقة", body: `${responder?.name?.trim() || "مستخدم"} ${accept ? "قبل طلب صداقتك." : "رفض طلب صداقتك."}`, friendRequestId: requestId });
}

export async function listIncomingFriendRequests(userId: number) {
  const db = await requireDb();
  const rows = await db.select({ request: friendRequests, requester: users }).from(friendRequests).innerJoin(users, eq(friendRequests.requesterId, users.id)).where(and(eq(friendRequests.addresseeId, userId), eq(friendRequests.status, "pending"), eq(users.accountStatus, "active"))).orderBy(desc(friendRequests.createdAt));
  return rows.map(({ request, requester }) => ({ ...request, requester: { id: requester.id, name: requester.name?.trim() || "مستخدم", username: requester.username } }));
}

export async function listNotifications(userId: number) {
  const db = await requireDb();
  return db.select().from(notifications).where(eq(notifications.recipientId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function countUnreadNotifications(userId: number) {
  const db = await requireDb();
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.recipientId, userId), isNull(notifications.readAt)));
  return Number(row?.count ?? 0);
}

export async function markNotificationRead(notificationId: string, userId: number) {
  const db = await requireDb();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, userId)));
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
  textColor?: string;
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
    textColor: input.textColor?.trim() || null,
    attachmentUrl: input.attachmentUrl ?? null,
    attachmentName: input.attachmentName ?? null,
    durationSeconds: input.durationSeconds ?? null,
    conversationId: input.conversationId ?? null,
    roomId: input.roomId ?? null,
  };
  await db.insert(chatMessages).values(message);
  return { ...message, createdAt: new Date() };
}

const STORE_COLORS = ["#32CD32", "#8F86F5", "#F6B6C2", "#F6A800", "#F27B72", "#7C00FF", "#FF1717", "#E92BC6", "#F59E0B", "#00A8A8", "#9B59B6", "#3B82F6", "#F97316", "#22C55E", "#EAB308", "#2F80ED", "#16A085", "#B62E63", "#FF4A00", "#66CDAA", "#B24CCD", "#FF55AA"] as const;

async function ensureStoreProducts() {
  const db = await requireDb();
  const [row] = await db.select({ count: sql<number>`count(*)` }).from(storeProducts);
  if (Number(row?.count ?? 0) > 0) return;
  await db.insert(storeProducts).values(STORE_COLORS.map((color, index) => ({ id: crypto.randomUUID(), code: `A-${index + 1}`, label: `Color A-${index + 1}`, colorHex: color, pointsCost: 5000, validityDays: 30, active: true })));
}

export async function listStoreProducts() {
  const db = await requireDb();
  await ensureStoreProducts();
  return db.select().from(storeProducts).where(eq(storeProducts.active, true)).orderBy(storeProducts.pointsCost, storeProducts.code);
}

export async function listOwnedProducts(userId: number) {
  const db = await requireDb();
  return db.select({ product: storeProducts, ownership: userProducts }).from(userProducts).innerJoin(storeProducts, eq(userProducts.productId, storeProducts.id)).where(and(eq(userProducts.userId, userId), gt(userProducts.expiresAt, new Date()), eq(storeProducts.active, true))).orderBy(storeProducts.code);
}

export async function purchaseStoreProduct(userId: number, productId: string) {
  const db = await requireDb();
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(and(eq(users.id, userId), eq(users.accountStatus, "active"))).limit(1);
    const [product] = await tx.select().from(storeProducts).where(and(eq(storeProducts.id, productId), eq(storeProducts.active, true))).limit(1);
    if (!user || !product) throw new Error("العنصر أو الحساب غير متاح.");
    if (user.points < product.pointsCost) throw new Error("رصيد النقاط غير كافٍ.");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + product.validityDays * 24 * 60 * 60 * 1000);
    await tx.update(users).set({ points: user.points - product.pointsCost }).where(eq(users.id, userId));
    await tx.insert(userProducts).values({ id: crypto.randomUUID(), userId, productId: product.id, expiresAt }).onDuplicateKeyUpdate({ set: { expiresAt } });
    return { product, points: user.points - product.pointsCost, expiresAt };
  });
}

export async function setUserRole(userId: number, role: "user" | "agent") {
  const db = await requireDb();
  const [target] = await db.select({ id: users.id, accountStatus: users.accountStatus }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target || target.accountStatus !== "active") throw new Error("الحساب غير متاح.");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function listAdminUsers() {
  const db = await requireDb();
  return db
    .select({ id: users.id, username: users.username, name: users.name, role: users.role, accountStatus: users.accountStatus, points: users.points, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function listAdminRooms() {
  const db = await requireDb();
  return db
    .select({ id: rooms.id, title: rooms.title, isLive: rooms.isLive, ownerId: rooms.ownerId, createdAt: rooms.createdAt, closedAt: rooms.closedAt })
    .from(rooms)
    .orderBy(desc(rooms.createdAt));
}

export async function closeRoom(roomId: string) {
  const db = await requireDb();
  const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) throw new Error("الغرفة غير موجودة.");
  await db.update(rooms).set({ isLive: false, closedAt: new Date() }).where(eq(rooms.id, roomId));
}

export async function removeRoom(roomId: string) {
  const db = await requireDb();
  await db.transaction(async (tx) => {
    await tx.delete(chatMessages).where(eq(chatMessages.roomId, roomId));
    await tx.delete(roomMembers).where(eq(roomMembers.roomId, roomId));
    await tx.delete(rooms).where(eq(rooms.id, roomId));
  });
}

export async function transferPoints(input: { adminId: number; recipientId: number; amount: number; note?: string }) {
  if (input.amount <= 0) throw new Error("اكتب عدد نقاط موجبًا.");
  const db = await requireDb();
  await db.transaction(async (tx) => {
    const [admin] = await tx.select().from(users).where(and(eq(users.id, input.adminId), eq(users.role, "admin"), eq(users.accountStatus, "active"))).limit(1);
    const [recipient] = await tx.select().from(users).where(and(eq(users.id, input.recipientId), eq(users.accountStatus, "active"))).limit(1);
    if (!admin || !recipient) throw new Error("الحساب المطلوب غير متاح.");
    if (admin.points < input.amount) throw new Error("رصيد المدير غير كافٍ للتحويل.");
    await tx.update(users).set({ points: admin.points - input.amount }).where(eq(users.id, input.adminId));
    await tx.update(users).set({ points: recipient.points + input.amount }).where(eq(users.id, input.recipientId));
    await tx.insert(pointTransfers).values({ id: crypto.randomUUID(), adminId: input.adminId, recipientId: input.recipientId, amount: input.amount, note: input.note?.trim() || null });
  });
}

export async function deleteLocalUser(userId: number) {
  const db = await requireDb();
  const ownedRooms = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.ownerId, userId));
  const roomIds = ownedRooms.map((room) => room.id);
  const conversations = await db.select({ id: directConversations.id }).from(directConversations).where(or(eq(directConversations.firstUserId, userId), eq(directConversations.secondUserId, userId)));
  const conversationIds = conversations.map((conversation) => conversation.id);

  await db.transaction(async (tx) => {
    if (roomIds.length) {
      await tx.delete(chatMessages).where(inArray(chatMessages.roomId, roomIds));
      await tx.delete(roomMembers).where(inArray(roomMembers.roomId, roomIds));
      await tx.delete(rooms).where(inArray(rooms.id, roomIds));
    }
    if (conversationIds.length) {
      await tx.delete(chatMessages).where(inArray(chatMessages.conversationId, conversationIds));
      await tx.delete(directConversations).where(inArray(directConversations.id, conversationIds));
    }
    await tx.delete(chatMessages).where(eq(chatMessages.senderId, userId));
    await tx.delete(roomMembers).where(eq(roomMembers.userId, userId));
    await tx.delete(friendRequests).where(or(eq(friendRequests.requesterId, userId), eq(friendRequests.addresseeId, userId)));
    await tx.delete(pointTransfers).where(or(eq(pointTransfers.adminId, userId), eq(pointTransfers.recipientId, userId)));
    await tx.delete(users).where(eq(users.id, userId));
  });
}
