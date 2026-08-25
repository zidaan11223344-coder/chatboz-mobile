import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { type ApiGift, type ApiRoom, liveApi, tokenStorage } from "@/lib/chat-buzz-api";

export type Room = { id: string; title: string; topic: string; host: string; audienceCount: number; speakers: { id: string; name: string; initials: string; tint: string; speaking?: boolean }[]; tags: string[]; live: boolean; tint: string };
export type Gift = { id: string; title: string; emoji: string; price: number; tint: string };
export type Conversation = { id: string; name: string; initials: string; tint: string; lastMessage: string; time: string; unread: number; online: boolean; userId?: string };
export type ChatMessage = { id: string; text: string; mine: boolean; time: string; type: "text" | "gift" };
type ServerSettings = { apiBaseUrl: string; liveKitUrl: string };
type UserRole = "user" | "assistant" | "admin" | "owner";

type ChatBuzzContextValue = {
  profile: { id?: string; name: string; handle: string; initials: string; points: number; role: "user" | "assistant" | "admin" | "owner"; permissions: Record<string, boolean> };
  rooms: Room[]; gifts: Gift[]; conversations: Conversation[]; messages: Record<string, ChatMessage[]>; serverSettings: ServerSettings; token: string | null; authLoading: boolean;
  refreshLiveData: () => Promise<void>;
  setSession: (token: string, user: { id: string; displayName: string; username: string; points: number; role?: "user" | "assistant" | "admin" | "owner"; permissions?: Record<string, boolean> }) => Promise<void>;
  logout: () => Promise<void>;
  sendMessage: (conversationId: string, text: string) => Promise<boolean>;
  sendGift: (conversationId: string, gift: Gift, recipientId?: string, roomId?: string) => Promise<boolean>;
  saveServerSettings: (settings: ServerSettings) => Promise<void>;
};

const rooms: Room[] = [
  { id: "midnight", title: "سهرة شات باز", topic: "موسيقى، أحاديث جميلة، وناس لطيفة", host: "ليان", audienceCount: 248, speakers: [{ id: "l", name: "ليان", initials: "ل", tint: "#5B5CE2", speaking: true }, { id: "s", name: "سامي", initials: "س", tint: "#FF8A65" }, { id: "n", name: "نور", initials: "ن", tint: "#2BB7A9" }, { id: "r", name: "ريم", initials: "ر", tint: "#F4AE4E" }], tags: ["اجتماعي", "موسيقى"], live: true, tint: "#EDEBFF" },
  { id: "games", title: "تحدي الأسئلة السريع", topic: "جاوب بسرعة وخذ مكانك على المسرح", host: "فارس", audienceCount: 96, speakers: [{ id: "f", name: "فارس", initials: "ف", tint: "#FF7A59", speaking: true }, { id: "a", name: "أصيل", initials: "أ", tint: "#3D98EA" }, { id: "m", name: "مها", initials: "م", tint: "#A66CF0" }], tags: ["ألعاب", "تحديات"], live: true, tint: "#FFF1EC" },
  { id: "writers", title: "مساحة الأقلام", topic: "نقرأ معاً ونشارك نصوصنا القصيرة", host: "هند", audienceCount: 72, speakers: [{ id: "h", name: "هند", initials: "ه", tint: "#BB79CB", speaking: true }, { id: "y", name: "يزن", initials: "ي", tint: "#499F69" }], tags: ["كتابة", "ثقافة"], live: true, tint: "#F7EDFA" },
  { id: "coffee", title: "قهوة الصباح", topic: "حديث هادئ قبل بداية اليوم", host: "زياد", audienceCount: 41, speakers: [{ id: "z", name: "زياد", initials: "ز", tint: "#805840", speaking: true }, { id: "d", name: "دعاء", initials: "د", tint: "#D69340" }], tags: ["حياة", "هادئ"], live: true, tint: "#FFF6E9" },
];
const gifts: Gift[] = [{ id: "rose", title: "وردة", emoji: "🌹", price: 50, tint: "#FFE6ED" }, { id: "spark", title: "شرارة", emoji: "✨", price: 120, tint: "#FFF4CF" }, { id: "heart", title: "قلب", emoji: "💜", price: 250, tint: "#EFE5FF" }, { id: "crown", title: "تاج", emoji: "👑", price: 600, tint: "#FFF0CC" }, { id: "rocket", title: "صاروخ", emoji: "🚀", price: 1000, tint: "#E6F0FF" }];
const initialConversations: Conversation[] = [{ id: "layla", name: "ليان", initials: "ل", tint: "#5B5CE2", lastMessage: "نلتقي في الغرفة بعد قليل", time: "الآن", unread: 2, online: true }, { id: "sami", name: "سامي", initials: "س", tint: "#FF8A65", lastMessage: "أرسل لي رابط الغرفة", time: "10:42", unread: 0, online: true }, { id: "nour", name: "نور", initials: "ن", tint: "#2BB7A9", lastMessage: "شكراً على الهدية الجميلة", time: "أمس", unread: 0, online: false }, { id: "yazan", name: "يزن", initials: "ي", tint: "#3D98EA", lastMessage: "النص الجديد جاهز للنقاش", time: "أمس", unread: 0, online: false }];
const initialMessages: Record<string, ChatMessage[]> = { layla: [{ id: "l1", text: "أهلاً بك في شات باز، يسعدني وجودك معنا.", mine: false, time: "10:38", type: "text" }, { id: "l2", text: "شكراً ليان، الغرفة اليوم جميلة جداً.", mine: true, time: "10:40", type: "text" }, { id: "l3", text: "نلتقي في الغرفة بعد قليل", mine: false, time: "الآن", type: "text" }], sami: [{ id: "s1", text: "أرسل لي رابط الغرفة", mine: false, time: "10:42", type: "text" }], nour: [{ id: "n1", text: "شكراً على الهدية الجميلة", mine: false, time: "أمس", type: "text" }], yazan: [{ id: "y1", text: "النص الجديد جاهز للنقاش", mine: false, time: "أمس", type: "text" }] };
const DEFAULT_SETTINGS: ServerSettings = { apiBaseUrl: "https://hhaa-just-elegance.up.railway.app", liveKitUrl: "" };
const SETTINGS_KEY = "chat_buzz_server_settings";

function mapRoom(room: ApiRoom): Room { return { id: room.id, title: room.name, topic: room.description || room.category, host: room.owner.displayName, audienceCount: room.memberCount, speakers: [{ id: room.owner.id, name: room.owner.displayName, initials: room.owner.displayName.slice(0, 1), tint: "#5B5CE2", speaking: true }], tags: [room.category], live: room.isLive, tint: "#F3F3F8" }; }
function mapGift(gift: ApiGift): Gift { return { id: gift.id, title: gift.name, emoji: gift.emoji, price: gift.price, tint: "#FFF0EB" }; }

const ChatBuzzContext = createContext<ChatBuzzContextValue | null>(null);
export function ChatBuzzProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<{ name: string; handle: string; initials: string; points: number; id?: string; role: UserRole; permissions: Record<string, boolean> }>({ name: "أحمد", handle: "@ahmad", initials: "أ", points: 12450, id: undefined, role: "user", permissions: {} });
  const [liveRooms, setLiveRooms] = useState<Room[]>([]); const [liveGifts, setLiveGifts] = useState<Gift[]>([]); const [conversations, setConversations] = useState(initialConversations); const [messages, setMessages] = useState(initialMessages); const [serverSettings, setServerSettings] = useState(DEFAULT_SETTINGS); const [token, setToken] = useState<string | null>(null); const [authLoading, setAuthLoading] = useState(true);
  const refreshLiveData = async () => { if (!serverSettings.apiBaseUrl) return; try { const [roomResult, giftResult] = await Promise.all([liveApi.rooms(serverSettings.apiBaseUrl), liveApi.gifts(serverSettings.apiBaseUrl)]); setLiveRooms(roomResult.rooms.map(mapRoom)); setLiveGifts(giftResult.gifts.map(mapGift)); if (token) { const me = await liveApi.me(serverSettings.apiBaseUrl, token); setProfile({ id: me.user.id, name: me.user.displayName, handle: `@${me.user.username}`, initials: me.user.displayName.slice(0, 1), points: me.user.points, role: me.user.role || "user", permissions: me.user.permissions || {} }); } } catch { setLiveRooms([]); setLiveGifts([]); } };
  useEffect(() => { Promise.all([AsyncStorage.getItem(SETTINGS_KEY), tokenStorage.get()]).then(([settingsValue, savedToken]) => { if (settingsValue) setServerSettings(JSON.parse(settingsValue)); if (savedToken) setToken(savedToken); setAuthLoading(false); }).catch(() => setAuthLoading(false)); }, []);
  useEffect(() => { if (!authLoading) void refreshLiveData(); }, [authLoading, serverSettings.apiBaseUrl, token]);
  const setSession = async (newToken: string, user: { id: string; displayName: string; username: string; points: number; role?: "user" | "assistant" | "admin" | "owner"; permissions?: Record<string, boolean> }) => { await tokenStorage.save(newToken); setToken(newToken); setProfile({ id: user.id, name: user.displayName, handle: `@${user.username}`, initials: user.displayName.slice(0, 1), points: user.points, role: user.role || "user", permissions: user.permissions || {} }); };
  const logout = async () => { await tokenStorage.clear(); setToken(null); setProfile({ name: "أحمد", handle: "@ahmad", initials: "أ", points: 12450, id: undefined, role: "user", permissions: {} }); };
  const sendMessage = async (conversationId: string, rawText: string) => { const text = rawText.trim(); if (!text) return false; if (token && serverSettings.apiBaseUrl && conversations.find((item) => item.id === conversationId)?.userId) return false; const message = { id: `${Date.now()}`, text, mine: true, time: "الآن", type: "text" as const }; setMessages((current) => ({ ...current, [conversationId]: [...(current[conversationId] ?? []), message] })); setConversations((current) => current.map((item) => item.id === conversationId ? { ...item, lastMessage: text, time: "الآن", unread: 0 } : item)); return true; };
  const sendGift = async (conversationId: string, gift: Gift, recipientId?: string, roomId?: string) => { if (profile.points < gift.price) return false; if (token && serverSettings.apiBaseUrl && recipientId) { try { const result = await liveApi.sendGift(serverSettings.apiBaseUrl, token, gift.id, recipientId, roomId); setProfile((current) => ({ ...current, points: result.transaction.remainingPoints })); } catch { return false; } } else setProfile((current) => ({ ...current, points: current.points - gift.price })); const text = `أرسل لك ${gift.emoji} ${gift.title}`; setMessages((current) => ({ ...current, [conversationId]: [...(current[conversationId] ?? []), { id: `${Date.now()}-gift`, text, mine: true, time: "الآن", type: "gift" }] })); return true; };
  const saveServerSettings = async (settings: ServerSettings) => { setServerSettings(settings); await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); void refreshLiveData(); };
  const value = useMemo(() => ({ profile, rooms: liveRooms.length ? liveRooms : rooms, gifts: liveGifts.length ? liveGifts : gifts, conversations, messages, serverSettings, token, authLoading, refreshLiveData, setSession, logout, sendMessage, sendGift, saveServerSettings }), [profile, liveRooms, liveGifts, conversations, messages, serverSettings, token, authLoading]);
  return <ChatBuzzContext.Provider value={value}>{children}</ChatBuzzContext.Provider>;
}
export function useChatBuzz() { const context = useContext(ChatBuzzContext); if (!context) throw new Error("useChatBuzz must be used inside ChatBuzzProvider"); return context; }
