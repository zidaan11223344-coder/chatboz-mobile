import { describe, expect, it } from "vitest";

import { formatBuzzPoints, normalizeServerUrl, validateServerSettings } from "../lib/chat-buzz-utils";

describe("إعدادات سيرفر شات بوز", () => {
  it("يحذف الشرطة النهائية والمسافات من رابط السيرفر", () => {
    expect(normalizeServerUrl(" https://api.chatbuzz.test/// ")).toBe("https://api.chatbuzz.test");
  });

  it("يقبل رابط API صالحاً ورابط خدمة صوت WSS صالحاً", () => {
    expect(validateServerSettings({ apiBaseUrl: "https://api.chatbuzz.test/", liveKitUrl: "wss://voice.chatbuzz.test/" })).toEqual({
      valid: true,
      value: { apiBaseUrl: "https://api.chatbuzz.test", liveKitUrl: "wss://voice.chatbuzz.test" },
    });
  });

  it("يرفض API بدون بروتوكول آمن أو محلي معلن", () => {
    expect(validateServerSettings({ apiBaseUrl: "api.chatbuzz.test", liveKitUrl: "" })).toEqual({
      valid: false,
      message: "ضع رابط API كاملاً يبدأ بـ https:// أو http://",
    });
  });

  it("يرفض رابط خدمة صوت بلا بروتوكول WebSocket أو HTTP", () => {
    expect(validateServerSettings({ apiBaseUrl: "", liveKitUrl: "voice.chatbuzz.test" })).toEqual({
      valid: false,
      message: "ضع رابط خدمة الصوت بصيغة wss:// أو https://",
    });
  });

  it("ينسق النقاط ولا يسمح بقيمة سالبة", () => {
    expect(formatBuzzPoints(12450)).toBe("12,450");
    expect(formatBuzzPoints(-5)).toBe("0");
  });
});
