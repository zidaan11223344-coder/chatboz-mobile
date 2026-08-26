import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ChatComposer } from "@/components/chat-composer";
import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function RoomChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useLocalAuth();
  const messages = trpc.social.rooms.messages.useQuery({ roomId: id ?? "" }, { enabled: isAuthenticated && Boolean(id) });
  if (!id) return null;
  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={23} color={buzzColors.ink} /></Pressable><View style={styles.titleWrap}><Text style={styles.title}>دردشة الغرفة</Text><Text style={styles.subtitle}>أعضاء حقيقيون فقط</Text></View><View style={{ width: 42 }} /></View><FlatList data={messages.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ChatMessageBubble message={item} mine={item.senderId === user?.id} />} ListEmptyComponent={messages.isLoading ? <ActivityIndicator color={buzzColors.indigo} style={{ marginTop: 60 }} /> : <View style={styles.empty}><MaterialIcons name="chat-bubble-outline" color={buzzColors.indigo} size={36} /><Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text><Text style={styles.emptyCopy}>كن أول عضو يكتب في هذه الغرفة.</Text></View>} /><ChatComposer destination={{ roomId: id }} onSent={() => messages.refetch()} /></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, header: { height: 67, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECECF3", paddingHorizontal: 18, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F6F6FA", alignItems: "center", justifyContent: "center" }, titleWrap: { alignItems: "center" }, title: { color: buzzColors.ink, fontSize: 17, fontWeight: "900", writingDirection: "rtl" }, subtitle: { color: buzzColors.muted, fontSize: 10, marginTop: 2, writingDirection: "rtl" }, list: { flexGrow: 1, padding: 15 }, empty: { alignItems: "center", paddingTop: 100, gap: 8 }, emptyTitle: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl" }, emptyCopy: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl" } });
