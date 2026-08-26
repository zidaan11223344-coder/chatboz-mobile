import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "chatbaz_local_session_token";
const USER_KEY = "chatbaz_local_session_user";

export type LocalSessionUser = { id: number; username: string | null; name: string | null; role: "user" | "admin"; points: number };

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export async function getLocalSessionToken() {
  if (Platform.OS === "web") return browserStorage()?.getItem(TOKEN_KEY) ?? null;
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getLocalSessionUser(): Promise<LocalSessionUser | null> {
  const raw = Platform.OS === "web" ? browserStorage()?.getItem(USER_KEY) : await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as LocalSessionUser; } catch { return null; }
}

export async function saveLocalSession(token: string, user: LocalSessionUser) {
  const serialized = JSON.stringify(user);
  if (Platform.OS === "web") {
    browserStorage()?.setItem(TOKEN_KEY, token);
    browserStorage()?.setItem(USER_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, serialized);
}

export async function clearLocalSession() {
  if (Platform.OS === "web") {
    browserStorage()?.removeItem(TOKEN_KEY);
    browserStorage()?.removeItem(USER_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
