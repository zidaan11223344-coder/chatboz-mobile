import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { normalizeServerUrl } from "@/lib/chat-buzz-utils";

export type ApiUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  points: number;
  role?: "user" | "assistant" | "admin" | "owner";
  permissions?: Record<string, boolean>;
  createdAt?: string;
};

export type ApiRoom = {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  coverUrl?: string | null;
  isLive: boolean;
  maxMembers: number;
  memberCount: number;
  owner: { id: string; username: string; displayName: string };
  createdAt?: string;
};

export type ApiMessage = { id: string; body: string; createdAt: string; sender: ApiUser };
export type ApiGift = { id: string; code: string; name: string; emoji: string; imageUrl?: string | null; price: number };
export type HealthCheckResult = { ok: true; detail: string } | { ok: false; detail: string };
export type AdminSummary = { users: number; rooms: number; liveRooms: number; activeGifts: number; role: string; permissions: Record<string, boolean> };

export const DEFAULT_API_URL = "https://hhaa-just-elegance.up.railway.app";
const TOKEN_KEY = "chat_buzz_api_token";

async function storageGet(key: string) {
  if (Platform.OS === "web") return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}
async function storageSet(key: string, value: string) {
  if (Platform.OS === "web") { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
async function storageRemove(key: string) {
  if (Platform.OS === "web") { if (typeof localStorage !== "undefined") localStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}
export const tokenStorage = { get: () => storageGet(TOKEN_KEY), save: (token: string) => storageSet(TOKEN_KEY, token), clear: () => storageRemove(TOKEN_KEY) };

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string") return payload.message;
  return fallback;
}

export async function apiRequest<T>(apiBaseUrl: string, path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const base = normalizeServerUrl(apiBaseUrl);
  if (!base) throw new Error("أضف عنوان API من إعدادات السيرفر أولاً.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...options, headers }); } catch { throw new Error("تعذر الوصول إلى API. تحقق من الإنترنت ورابط Railway."); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(getErrorMessage(payload, `تعذر تنفيذ الطلب (${response.status}).`)) as Error & { status?: number; code?: string };
    error.status = response.status;
    if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") error.code = payload.error;
    throw error;
  }
  return payload as T;
}

export async function checkServerHealth(apiBaseUrl: string): Promise<HealthCheckResult> {
  const normalized = normalizeServerUrl(apiBaseUrl);
  if (!normalized) return { ok: false, detail: "أضف عنوان API أولاً." };
  try {
    const response = await fetch(`${normalized}/health`, { method: "GET", headers: { Accept: "application/json" } });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload.database === "ready") return { ok: true, detail: "الخادم وقاعدة البيانات جاهزان." };
    if (payload.database === "not_configured") return { ok: false, detail: "الخادم يعمل، لكن DATABASE_URL غير مربوط بقاعدة PostgreSQL في Railway." };
    if (payload.database === "connected") return { ok: false, detail: "اتصل الخادم بقاعدة البيانات، لكنه لم يطبق المخطط بعد." };
    return { ok: false, detail: `حالة قاعدة البيانات: ${payload.database ?? response.status}.` };
  } catch { return { ok: false, detail: "تعذر الوصول إلى الخادم. تحقق من الرابط والإنترنت وشهادة HTTPS." }; }
}

export async function login(apiBaseUrl: string, username: string, password: string) {
  return apiRequest<{ ok: true; user: ApiUser; token: string }>(apiBaseUrl, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}
export async function register(apiBaseUrl: string, username: string, displayName: string, password: string) {
  return apiRequest<{ ok: true; user: ApiUser; token: string }>(apiBaseUrl, "/api/v1/auth/register", { method: "POST", body: JSON.stringify({ username, displayName, password }) });
}

export const liveApi = {
  me: (base: string, token: string) => apiRequest<{ ok: true; user: ApiUser }>(base, "/api/v1/me", {}, token),
  rooms: (base: string) => apiRequest<{ ok: true; rooms: ApiRoom[] }>(base, "/api/v1/rooms"),
  roomMessages: (base: string, token: string, roomId: string) => apiRequest<{ ok: true; messages: ApiMessage[] }>(base, `/api/v1/rooms/${roomId}/messages`, {}, token),
  joinRoom: (base: string, token: string, roomId: string) => apiRequest<{ ok: true }>(base, `/api/v1/rooms/${roomId}/join`, { method: "POST" }, token),
  leaveRoom: (base: string, token: string, roomId: string) => apiRequest<{ ok: true }>(base, `/api/v1/rooms/${roomId}/leave`, { method: "POST" }, token),
  sendRoomMessage: (base: string, token: string, roomId: string, body: string) => apiRequest<{ ok: true; message: ApiMessage }>(base, `/api/v1/rooms/${roomId}/messages`, { method: "POST", body: JSON.stringify({ body }) }, token),
  gifts: (base: string) => apiRequest<{ ok: true; gifts: ApiGift[] }>(base, "/api/v1/gifts"),
  sendGift: (base: string, token: string, giftId: string, recipientId: string, roomId?: string) => apiRequest<{ ok: true; transaction: { id: string; gift: ApiGift; totalPoints: number; remainingPoints: number; recipient: ApiUser } }>(base, "/api/v1/gifts/send", { method: "POST", body: JSON.stringify({ giftId, recipientId, roomId: roomId ?? null, quantity: 1 }) }, token),
  adminSummary: (base: string, token: string) => apiRequest<{ ok: true; summary: AdminSummary }>(base, "/api/v1/admin/summary", {}, token),
  adminUsers: (base: string, token: string) => apiRequest<{ ok: true; users: ApiUser[] }>(base, "/api/v1/admin/users", {}, token),
  createUser: (base: string, token: string, input: { username: string; displayName: string; password: string }) => apiRequest<{ ok: true; user: ApiUser }>(base, "/api/v1/admin/users", { method: "POST", body: JSON.stringify(input) }, token),
  updateUserRole: (base: string, token: string, userId: string, role: "user" | "admin" | "assistant", permissions: Record<string, boolean> = {}) => apiRequest<{ ok: true; user: ApiUser }>(base, `/api/v1/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role, permissions }) }, token),
  deleteUser: (base: string, token: string, userId: string) => apiRequest<{ ok: true }>(base, `/api/v1/admin/users/${userId}`, { method: "DELETE" }, token),
  setRoomStatus: (base: string, token: string, roomId: string, isLive: boolean) => apiRequest<{ ok: true }>(base, `/api/v1/admin/rooms/${roomId}/status`, { method: "PATCH", body: JSON.stringify({ isLive }) }, token),
  deleteRoom: (base: string, token: string, roomId: string) => apiRequest<{ ok: true }>(base, `/api/v1/admin/rooms/${roomId}`, { method: "DELETE" }, token),
};
