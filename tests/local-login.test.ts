import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const hasLocalAdminTestConfig = Boolean(process.env.DATABASE_URL && process.env.LOCAL_ADMIN_USERNAME && process.env.LOCAL_ADMIN_PASSWORD);

describe("تسجيل الدخول المحلي", () => {
  it.skipIf(!hasLocalAdminTestConfig)("ينشئ المدير الأول من بياناته الآمنة ثم يصدر له جلسة محلية", async () => {
    const username = process.env.LOCAL_ADMIN_USERNAME;
    const password = process.env.LOCAL_ADMIN_PASSWORD;
    expect(username).toBeTruthy();
    expect(password).toBeTruthy();

    const caller = appRouter.createCaller({ user: null, req: { headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const result = await caller.localAuth.login({ username: username!, password: password! });
    expect(result.token.length).toBeGreaterThan(40);
    expect(result.user.role).toBe("admin");
  });
});
