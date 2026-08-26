import { z } from "zod";

import * as db from "./db";
import { createLocalSession, ensureBootstrapAdmin, getBootstrapAdminConfig, hashPassword, normalizeUsername, validateUsername, verifyPassword } from "./local-auth";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const roomInput = z.object({
  title: z.string().trim().min(3, "اكتب عنوانًا من 3 أحرف على الأقل.").max(90),
  description: z.string().trim().max(600).optional(),
  category: z.string().trim().min(2).max(40),
});

const messageInput = z.object({
  kind: z.enum(["text", "image", "audio"]),
  body: z.string().trim().max(4000).optional(),
  attachmentUrl: z.string().max(2000).optional(),
  attachmentName: z.string().trim().max(255).optional(),
  durationSeconds: z.number().int().min(0).max(3600).optional(),
  conversationId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
}).refine((value) => Boolean(value.conversationId) !== Boolean(value.roomId), "اختر دردشة غرفة أو محادثة خاصة واحدة.");

const attachmentInput = z.object({
  base64: z.string().min(1).max(8_400_000),
  name: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "audio/m4a", "audio/mpeg", "audio/ogg", "audio/webm", "audio/wav"]),
});

const usernameInput = z.string().trim().min(3, "اسم المستخدم قصير.").max(32, "اسم المستخدم طويل.").transform(normalizeUsername).refine(validateUsername, "استخدم حروفًا عربية أو لاتينية أو أرقامًا أو شرطة سفلية فقط.");
const displayNameInput = z.string().trim().min(2, "اكتب اسمًا ظاهرًا من حرفين على الأقل.").max(50, "الاسم الظاهر طويل.").refine((value) => /^[\p{L}\p{N}\s_.-]+$/u.test(value), "الاسم الظاهر يحتوي رموزًا غير مسموحة.");
const passwordInput = z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل.").max(128, "كلمة المرور طويلة جدًا.");
const localAccountInput = z.object({ username: usernameInput, name: displayNameInput, password: passwordInput });

export const appRouter = router({
  localAuth: router({
    bootstrapReady: publicProcedure.query(() => getBootstrapAdminConfig()),
    register: publicProcedure.input(localAccountInput).mutation(async ({ input }) => {
      const user = await db.createLocalUser({ username: input.username, name: input.name, passwordHash: await hashPassword(input.password) });
      return { token: await createLocalSession(user), user: { id: user.id, username: user.username, name: user.name, role: user.role, points: user.points } };
    }),
    login: publicProcedure.input(z.object({ username: usernameInput, password: passwordInput })).mutation(async ({ input }) => {
      await ensureBootstrapAdmin();
      const user = await db.getLocalUserByUsername(input.username);
      if (!user || user.accountStatus !== "active" || !(await verifyPassword(input.password, user.passwordHash))) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحين.");
      return { token: await createLocalSession(user), user: { id: user.id, username: user.username, name: user.name, role: user.role, points: user.points } };
    }),
  }),
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  social: router({
    rooms: router({
      list: protectedProcedure.query(({ ctx }) => db.listRoomsForUser(ctx.user.id)),
      create: protectedProcedure.input(roomInput).mutation(({ ctx, input }) => db.createRoomForUser({ ownerId: ctx.user.id, ...input })),
      join: protectedProcedure.input(z.object({ roomId: z.string().uuid() })).mutation(({ ctx, input }) => db.joinRoomForUser(input.roomId, ctx.user.id)),
      messages: protectedProcedure.input(z.object({ roomId: z.string().uuid() })).query(({ ctx, input }) => db.listRoomMessages(input.roomId, ctx.user.id)),
    }),
    friends: router({
      search: protectedProcedure.input(z.object({ query: z.string().trim().max(90) })).query(({ ctx, input }) => db.searchRealUsers(input.query, ctx.user.id)),
      list: protectedProcedure.query(({ ctx }) => db.listFriendsForUser(ctx.user.id)),
      request: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => db.requestFriendship(ctx.user.id, input.userId)),
      respond: protectedProcedure.input(z.object({ requestId: z.string().uuid(), accept: z.boolean() })).mutation(({ ctx, input }) => db.respondToFriendRequest(input.requestId, ctx.user.id, input.accept)),
    }),
    conversations: router({
      list: protectedProcedure.query(({ ctx }) => db.listConversationsForUser(ctx.user.id)),
      create: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => db.getOrCreateDirectConversation(ctx.user.id, input.userId)),
      messages: protectedProcedure.input(z.object({ conversationId: z.string().uuid() })).query(({ ctx, input }) => db.listConversationMessages(input.conversationId, ctx.user.id)),
    }),
    messages: router({
      send: protectedProcedure.input(messageInput).mutation(({ ctx, input }) => db.createMessage({ senderId: ctx.user.id, ...input })),
    }),
    media: router({
      upload: protectedProcedure.input(attachmentInput).mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.base64, "base64");
        if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new Error("يجب ألا يتجاوز حجم المرفق 6 ميغابايت.");
        const extension = input.mimeType.split("/")[1].replace("jpeg", "jpg");
        const { url } = await storagePut(`chat/${ctx.user.id}/${crypto.randomUUID()}.${extension}`, bytes, input.mimeType);
        return { url, name: input.name, mimeType: input.mimeType };
      }),
    }),
  }),
  admin: router({
    users: adminProcedure.query(() => db.listAdminUsers()),
    createUser: adminProcedure.input(localAccountInput).mutation(async ({ input }) => {
      const user = await db.createLocalUser({ username: input.username, name: input.name, passwordHash: await hashPassword(input.password) });
      return { id: user.id, username: user.username, name: user.name };
    }),
    deleteUser: adminProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) throw new Error("لا يمكنك حذف حساب المدير الذي سجلت الدخول به.");
      await db.deleteLocalUser(input.userId);
      return { success: true } as const;
    }),
    rooms: adminProcedure.query(() => db.listAdminRooms()),
    closeRoom: adminProcedure.input(z.object({ roomId: z.string().uuid() })).mutation(async ({ input }) => {
      await db.closeRoom(input.roomId);
      return { success: true } as const;
    }),
    deleteRoom: adminProcedure.input(z.object({ roomId: z.string().uuid() })).mutation(async ({ input }) => {
      await db.removeRoom(input.roomId);
      return { success: true } as const;
    }),
    transferPoints: adminProcedure.input(z.object({ recipientId: z.number().int().positive(), amount: z.number().int().positive().max(1_000_000), note: z.string().trim().max(180).optional() })).mutation(async ({ ctx, input }) => {
      await db.transferPoints({ adminId: ctx.user.id, ...input });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
