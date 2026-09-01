import { describe, expect, it } from "vitest";

import * as db from "../server/db";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function contextFor(user: TrpcContext["user"]): TrpcContext {
  return { user, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const hasLocalAdminTestConfig = Boolean(process.env.DATABASE_URL && process.env.LOCAL_ADMIN_USERNAME && process.env.LOCAL_ADMIN_PASSWORD);

describe("صلاحيات الحسابات المحلية", () => {
  it.skipIf(!hasLocalAdminTestConfig)("يرفض كلمة مرور غير صحيحة للحساب الإداري", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(caller.localAuth.login({ username: process.env.LOCAL_ADMIN_USERNAME!, password: "كلمةمرورخاطئة123" })).rejects.toThrow("اسم المستخدم أو كلمة المرور غير صحيحين");
  });

  it.skipIf(!hasLocalAdminTestConfig)("يسمح للمدير الحقيقي فقط بقراءة لوحة الإدارة", async () => {
    const username = process.env.LOCAL_ADMIN_USERNAME?.trim().toLocaleLowerCase("ar")!;
    const admin = await db.getLocalUserByUsername(username);
    expect(admin?.role).toBe("admin");
    const allowed = appRouter.createCaller(contextFor(admin!));
    await expect(allowed.admin.users()).resolves.toBeInstanceOf(Array);

    const denied = appRouter.createCaller(contextFor({ ...admin!, role: "user" }));
    await expect(denied.admin.users()).rejects.toThrow();
  });
});
