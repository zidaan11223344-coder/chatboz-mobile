import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

const hasLocalAdminTestConfig = Boolean(process.env.DATABASE_URL && process.env.LOCAL_ADMIN_USERNAME && process.env.LOCAL_ADMIN_PASSWORD);

describe("تكوين المدير المحلي", () => {
  it.skipIf(!hasLocalAdminTestConfig)("يتحقق عبر مسار API من توفر بيانات المدير الأول", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const result = await caller.localAuth.bootstrapReady();
    expect(result.configured).toBe(true);
  });
});
