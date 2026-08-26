import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("تكوين المدير المحلي", () => {
  it("يتحقق عبر مسار API من توفر بيانات المدير الأول", async () => {
    const caller = appRouter.createCaller({ user: null, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] });
    const result = await caller.localAuth.bootstrapReady();
    expect(result.configured).toBe(true);
  });
});
