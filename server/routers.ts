import { z } from "zod";

import * as db from "./db";
import { storagePut } from "./storage";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

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

export const appRouter = router({
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
});

export type AppRouter = typeof appRouter;
