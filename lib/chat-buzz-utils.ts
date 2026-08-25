export type ServerSettingsInput = {
  apiBaseUrl: string;
  liveKitUrl: string;
};

export type ServerSettingsValidation =
  | { valid: true; value: ServerSettingsInput }
  | { valid: false; message: string };

export function normalizeServerUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function validateServerSettings(input: ServerSettingsInput): ServerSettingsValidation {
  const apiBaseUrl = normalizeServerUrl(input.apiBaseUrl);
  const liveKitUrl = normalizeServerUrl(input.liveKitUrl);

  if (apiBaseUrl && !/^https?:\/\//i.test(apiBaseUrl)) {
    return { valid: false, message: "ضع رابط API كاملاً يبدأ بـ https:// أو http://" };
  }
  if (liveKitUrl && !/^(wss?|https?):\/\//i.test(liveKitUrl)) {
    return { valid: false, message: "ضع رابط خدمة الصوت بصيغة wss:// أو https://" };
  }
  return { valid: true, value: { apiBaseUrl, liveKitUrl } };
}

export function formatBuzzPoints(points: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.trunc(points)));
}
