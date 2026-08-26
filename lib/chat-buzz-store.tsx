import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Room = { id: string; title: string; topic: string; host: string; audienceCount: number; speakers: { id: string; name: string; initials: string; tint: string; speaking?: boolean }[]; tags: string[]; live: boolean; tint: string };
export type Gift = { id: string; title: string; emoji: string; price: number; tint: string };
export type Conversation = { id: string; name: string; initials: string; tint: string; lastMessage: string; time: string; unread: number; online: boolean; userId?: string };
export type ChatMessage = { id: string; text: string; mine: boolean; time: string; type: "text" | "gift" };
type ServerSettings = { apiBaseUrl: string; liveKitUrl: string };
type UserRole = "user" | "assistant" | "admin" | "owner";

type ChatBuzzContextValue = {
  profile: { id?: string; name: string; handle: string; initials: string; points: number; role: UserRole; permissions: Record<string, boolean> };
  rooms: Room[];
  gifts: Gift[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  serverSettings: ServerSettings;
  token: string | null;
  authLoading: boolean;
  refreshLiveData: () => Promise<void>;
  setSession: (token: string, user: { id: string; displayName: string; username: string; points: number; role?: UserRole; permissions?: Record<string, boolean> }) => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<boolean>;
  sendGift: (conversationId: string, gift: Gift, recipientId?: string, roomId?: string) => Promise<boolean>;
  saveServerSettings: (settings: ServerSettings) => Promise<void>;
};

const SETTINGS_KEY = "chat_buzz_server_settings";
const EMPTY_PROFILE: ChatBuzzContextValue["profile"] = { name: "", handle: "", initials: "؟", points: 0, role: "user", permissions: {} };
const EMPTY_SETTINGS: ServerSettings = { apiBaseUrl: "", liveKitUrl: "" };

const ChatBuzzContext = createContext<ChatBuzzContextValue | null>(null);

export function ChatBuzzProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [serverSettings, setServerSettings] = useState<ServerSettings>(EMPTY_SETTINGS);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((saved) => { if (saved) setServerSettings(JSON.parse(saved)); })
      .finally(() => setAuthLoading(false));
  }, []);

  const refreshLiveData = async () => undefined;
  const setSession = async (newToken: string, user: { id: string; displayName: string; username: string; points: number; role?: UserRole; permissions?: Record<string, boolean> }) => {
    setToken(newToken);
    setProfile({ id: user.id, name: user.displayName, handle: `@${user.username}`, initials: user.displayName.slice(0, 1) || "؟", points: user.points, role: user.role ?? "user", permissions: user.permissions ?? {} });
  };
  const logout = async () => { setToken(null); setProfile(EMPTY_PROFILE); };
  const sendMessage = async (_conversationId: string, text: string) => Boolean(text.trim());
  const sendGift = async () => false;
  const saveServerSettings = async (settings: ServerSettings) => { setServerSettings(settings); await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); };

  const value = useMemo(() => ({
    profile,
    rooms: [] as Room[],
    gifts: [] as Gift[],
    conversations: [] as Conversation[],
    messages: {} as Record<string, ChatMessage[]>,
    serverSettings,
    token,
    authLoading,
    refreshLiveData,
    setSession,
    logout,
    sendMessage,
    sendGift,
    saveServerSettings,
  }), [profile, serverSettings, token, authLoading]);

  return <ChatBuzzContext.Provider value={value}>{children}</ChatBuzzContext.Provider>;
}

export function useChatBuzz() {
  const context = useContext(ChatBuzzContext);
  if (!context) throw new Error("useChatBuzz must be used inside ChatBuzzProvider");
  return context;
}
