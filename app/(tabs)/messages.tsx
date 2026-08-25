import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import { Avatar, IconCircle, SectionTitle, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { type Conversation, useChatBuzz } from "@/lib/chat-buzz-store";

function ConversationRow({ item }: { item: Conversation }) {
  return <Pressable onPress={() => { buzzHaptic(); router.push(`/chat/${item.id}`); }} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><Avatar initials={item.initials} tint={item.tint} size={52} live={item.online} /><View style={styles.content}><View style={styles.nameLine}><Text style={styles.name}>{item.name}</Text><Text style={styles.time}>{item.time}</Text></View><View style={styles.messageLine}><Text numberOfLines={1} style={[styles.lastMessage, item.unread > 0 && styles.unreadMessage]}>{item.lastMessage}</Text>{item.unread > 0 ? <View style={styles.unread}><Text style={styles.unreadText}>{item.unread}</Text></View> : null}</View></View></Pressable>;
}

export default function MessagesScreen() {
  const { conversations } = useChatBuzz();
  const [query, setQuery] = useState("");
  const data = useMemo(() => conversations.filter((item) => `${item.name} ${item.lastMessage}`.includes(query.trim())), [conversations, query]);
  return <ScreenContainer edges={["top", "left", "right"]}><FlatList data={data} keyExtractor={(item) => item.id} renderItem={({ item }) => <ConversationRow item={item} />} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={styles.separator} />} ListHeaderComponent={<><View style={styles.header}><View><Text style={styles.heading}>الرسائل</Text><Text style={styles.subtitle}>تواصل مع من قابلتهم في الغرف</Text></View><IconCircle icon="edit" label="رسالة جديدة" /></View><View style={styles.search}><MaterialIcons name="search" color="#A4A4B4" size={21} /><TextInput value={query} onChangeText={setQuery} placeholder="بحث في الرسائل" placeholderTextColor="#A4A4B4" style={styles.searchInput} textAlign="right" returnKeyType="search" /></View><SectionTitle title="المحادثات" /></>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="forum" color="#B8B8C9" size={42} /><Text style={styles.emptyText}>لا توجد محادثات مطابقة</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 22 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  heading: { color: buzzColors.ink, fontSize: 27, lineHeight: 36, fontWeight: "900", writingDirection: "rtl", textAlign: "right" },
  subtitle: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl", textAlign: "right", marginTop: 1 },
  search: { height: 49, backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: buzzColors.border, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, gap: 7 },
  searchInput: { flex: 1, color: buzzColors.ink, fontSize: 14, writingDirection: "rtl" },
  row: { paddingVertical: 13, flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  content: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  name: { color: buzzColors.ink, fontSize: 16, fontWeight: "800", writingDirection: "rtl", textAlign: "right" },
  time: { color: buzzColors.muted, fontSize: 11 },
  messageLine: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 4, gap: 8 },
  lastMessage: { color: buzzColors.muted, fontSize: 13, writingDirection: "rtl", textAlign: "right", flex: 1 },
  unreadMessage: { color: buzzColors.ink, fontWeight: "700" },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  unreadText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  separator: { height: 1, backgroundColor: "#EFEFF5", marginRight: 64 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 76, gap: 10 },
  emptyText: { color: buzzColors.muted, fontSize: 14, writingDirection: "rtl" },
  pressed: { opacity: 0.7 },
});
