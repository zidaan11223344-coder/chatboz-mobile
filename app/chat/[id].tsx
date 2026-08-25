import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, GiftPicker, IconCircle, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { type ChatMessage, useChatBuzz } from "@/lib/chat-buzz-store";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, messages, sendMessage } = useChatBuzz();
  const conversation = useMemo(() => conversations.find((item) => item.id === id) ?? conversations[0], [conversations, id]);
  const [draft, setDraft] = useState("");
  const [giftsOpen, setGiftsOpen] = useState(false);
  const data = messages[conversation?.id ?? ""] ?? [];
  if (!conversation) return null;
  const submit = () => { sendMessage(conversation.id, draft); setDraft(""); buzzHaptic(); };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.header}><IconCircle icon="arrow-forward" label="العودة" onPress={() => router.back()} /><View style={styles.contact}><Avatar initials={conversation.initials} tint={conversation.tint} size={41} live={conversation.online} /><View><Text style={styles.name}>{conversation.name}</Text><Text style={styles.status}>{conversation.online ? "متصل الآن" : "آخر ظهور مؤخراً"}</Text></View></View><IconCircle icon="more-horiz" label="المزيد" onPress={() => undefined} /></View><FlatList data={data} keyExtractor={(item) => item.id} renderItem={({ item }) => <MessageBubble item={item} />} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false} ListHeaderComponent={<View style={styles.encryption}><MaterialIcons name="lock-outline" size={14} color="#83839A" /><Text style={styles.encryptionText}>هذه محادثة خاصة في شات بوز</Text></View>} /><View style={styles.composer}><Pressable onPress={() => { buzzHaptic(); setGiftsOpen(true); }} style={({ pressed }) => [styles.giftButton, pressed && styles.pressed]}><MaterialIcons name="redeem" size={22} color={buzzColors.coral} /></Pressable><View style={styles.inputShell}><TextInput value={draft} onChangeText={setDraft} placeholder="اكتب رسالة..." placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" multiline returnKeyType="default" /></View><Pressable onPress={submit} disabled={!draft.trim()} style={({ pressed }) => [styles.sendButton, !draft.trim() && styles.sendDisabled, pressed && styles.pressed]}><MaterialIcons name="send" size={21} color="#FFFFFF" /></Pressable></View><GiftPicker visible={giftsOpen} onClose={() => setGiftsOpen(false)} conversationId={conversation.id} recipient={conversation.name} /></KeyboardAvoidingView></ScreenContainer>;
}

function MessageBubble({ item }: { item: ChatMessage }) {
  return <View style={[styles.messageRow, item.mine ? styles.mineRow : styles.theirRow]}><View style={[styles.bubble, item.mine ? styles.mineBubble : styles.theirBubble, item.type === "gift" && styles.giftBubble]}>{item.type === "gift" ? <MaterialIcons name="redeem" size={18} color={item.mine ? "#FFFFFF" : buzzColors.coral} /> : null}<Text style={[styles.messageText, item.mine && styles.mineText]}>{item.text}</Text><Text style={[styles.time, item.mine && styles.mineTime]}>{item.time}</Text></View></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { height: 68, paddingHorizontal: 18, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECECF3" },
  contact: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  name: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl", textAlign: "right" },
  status: { color: buzzColors.green, fontSize: 11, marginTop: 2, writingDirection: "rtl", textAlign: "right" },
  messages: { paddingHorizontal: 18, paddingTop: 13, paddingBottom: 14 },
  encryption: { flexDirection: "row-reverse", alignItems: "center", alignSelf: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#EEEEF6", borderRadius: 99, marginBottom: 17 },
  encryptionText: { color: "#77778C", fontSize: 10, writingDirection: "rtl" },
  messageRow: { marginBottom: 9, flexDirection: "row" },
  mineRow: { justifyContent: "flex-end" },
  theirRow: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row-reverse", alignItems: "flex-end", gap: 7 },
  mineBubble: { backgroundColor: buzzColors.indigo, borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#EDEDF4" },
  giftBubble: { backgroundColor: "#FFF0EB" },
  messageText: { color: buzzColors.ink, fontSize: 14, lineHeight: 20, writingDirection: "rtl", textAlign: "right", flexShrink: 1 },
  mineText: { color: "#FFFFFF" },
  time: { color: "#9A9AAA", fontSize: 9, marginBottom: 1 },
  mineTime: { color: "#D4D3FF" },
  composer: { backgroundColor: "#FFFFFF", paddingHorizontal: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#ECECF3", flexDirection: "row-reverse", gap: 8, alignItems: "flex-end" },
  giftButton: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EB" },
  inputShell: { flex: 1, minHeight: 43, maxHeight: 96, backgroundColor: "#F5F5FA", borderRadius: 14, paddingHorizontal: 11, justifyContent: "center" },
  input: { color: buzzColors.ink, fontSize: 14, minHeight: 39, maxHeight: 86, writingDirection: "rtl", paddingTop: 9, paddingBottom: 7 },
  sendButton: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: buzzColors.indigo },
  sendDisabled: { backgroundColor: "#C7C7D8" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
