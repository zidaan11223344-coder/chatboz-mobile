import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, buzzColors } from "@/components/buzz-ui";
import { ChatComposer } from "@/components/chat-composer";
import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useLocalAuth();
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const conversations = trpc.social.conversations.list.useQuery(undefined, { enabled: isAuthenticated });
  const messages = trpc.social.conversations.messages.useQuery({ conversationId: id ?? "" }, { enabled: isAuthenticated && Boolean(id) });
  const conversation = conversations.data?.find((item) => item.id === id);

  const startCall = (type: "audio" | "video") => {
    setCallType(type);
    Alert.alert(type === "audio" ? "مكالمة صوتية" : "مكالمة فيديو", "تم تجهيز طلب الاتصال. ستُفعّل قناة الاتصال المباشر عند ربط WebRTC بالخادم.");
  };

  if (messages.isLoading || conversations.isLoading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;
  if (!conversation?.user || !id) return <ScreenContainer className="items-center justify-center px-6"><MaterialIcons name="chat-bubble-outline" size={38} color="#A0A0AF" /><Text style={styles.missingTitle}>المحادثة غير متاحة</Text><Text style={styles.missingCopy}>لا يمكن فتح محادثة إلا بين حسابين حقيقيين مرتبطين كأصدقاء.</Text><Pressable onPress={() => router.back()} style={styles.returnButton}><Text style={styles.returnText}>العودة</Text></Pressable></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}><MaterialIcons name="arrow-forward" size={23} color={buzzColors.ink} /></Pressable>
        <View style={styles.contact}><Avatar initials={conversation.user.name.slice(0, 1) || "؟"} tint={buzzColors.indigo} size={42} /><View style={styles.contactCopy}><Text style={styles.name}>{conversation.user.name}</Text><Text style={styles.status}>محادثة خاصة</Text></View></View>
        <View style={styles.callActions}><Pressable onPress={() => startCall("audio")} style={styles.callButton}><MaterialIcons name="call" size={19} color={buzzColors.indigo} /></Pressable><Pressable onPress={() => startCall("video")} style={styles.callButton}><MaterialIcons name="videocam" size={20} color={buzzColors.indigo} /></Pressable><Pressable onPress={() => router.push({ pathname: "/profile/[id]", params: { id: String(conversation.user.id) } })} style={styles.iconButton}><MaterialIcons name="more-vert" size={22} color={buzzColors.ink} /></Pressable></View>
      </View>
      <FlatList data={messages.data ?? []} keyExtractor={(item) => item.id} renderItem={({ item }) => <ChatMessageBubble message={item} mine={item.senderId === user?.id} />} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="chat-bubble-outline" color={buzzColors.indigo} size={35} /><Text style={styles.emptyTitle}>ابدأ المحادثة</Text><Text style={styles.emptyCopy}>لا توجد رسائل بعد بينكما.</Text></View>} />
      <ChatComposer destination={{ conversationId: id }} onSent={() => messages.refetch()} />
    </View>
    <Modal visible={Boolean(callType)} transparent animationType="fade" onRequestClose={() => setCallType(null)}><View style={styles.callShade}><View style={styles.callCard}><MaterialIcons name={callType === "video" ? "videocam" : "call"} size={34} color={buzzColors.indigo} /><Text style={styles.callTitle}>{callType === "video" ? "مكالمة فيديو" : "مكالمة صوتية"}</Text><Text style={styles.callCopy}>طلب الاتصال جاهز للمستخدم {conversation.user.name}.</Text><Pressable onPress={() => setCallType(null)} style={styles.cancel}><Text style={styles.cancelText}>إلغاء</Text></Pressable></View></View></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1 }, header: { height: 66, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECECF3", paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 41, height: 41, borderRadius: 14, backgroundColor: "#F6F6FA", alignItems: "center", justifyContent: "center" }, callActions: { flexDirection: "row", alignItems: "center", gap: 5 }, callButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" }, contact: { flexDirection: "row-reverse", alignItems: "center", gap: 9 }, contactCopy: { alignItems: "flex-end" }, name: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl" }, status: { color: buzzColors.green, fontSize: 10, marginTop: 2, writingDirection: "rtl" }, list: { flexGrow: 1, padding: 15 }, empty: { alignItems: "center", paddingTop: 95, gap: 7 }, emptyTitle: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl" }, emptyCopy: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl" }, missingTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", marginTop: 14, writingDirection: "rtl" }, missingCopy: { color: buzzColors.muted, fontSize: 13, lineHeight: 21, textAlign: "center", marginTop: 7, writingDirection: "rtl" }, returnButton: { marginTop: 20, backgroundColor: buzzColors.indigo, borderRadius: 14, paddingHorizontal: 17, paddingVertical: 12 }, returnText: { color: "#FFFFFF", fontWeight: "900", writingDirection: "rtl" }, callShade: { flex: 1, backgroundColor: "rgba(15,15,30,0.48)", justifyContent: "center", alignItems: "center", padding: 24 }, callCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 25, alignItems: "center", width: "100%" }, callTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", marginTop: 9, writingDirection: "rtl" }, callCopy: { color: buzzColors.muted, fontSize: 12, textAlign: "center", lineHeight: 19, marginTop: 7, writingDirection: "rtl" }, cancel: { marginTop: 17, paddingHorizontal: 25, paddingVertical: 10, borderRadius: 13, backgroundColor: "#EFEEFF" }, cancelText: { color: buzzColors.indigo, fontWeight: "900", writingDirection: "rtl" } });
