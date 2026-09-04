import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ChatComposer } from "@/components/chat-composer";
import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

const roleLabels = { owner: "مالك الغرفة", moderator: "مشرف", member: "عضو" } as const;

export default function RoomChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useLocalAuth();
  const [membersOpen, setMembersOpen] = useState(false);
  const messages = trpc.social.rooms.messages.useQuery({ roomId: id ?? "" }, { enabled: isAuthenticated && Boolean(id) });
  const members = trpc.social.rooms.members.useQuery({ roomId: id ?? "" }, { enabled: isAuthenticated && Boolean(id) });
  const setMemberRole = trpc.social.rooms.setMemberRole.useMutation();
  if (!id) return null;

  const currentMembership = members.data?.find((member) => member.userId === user?.id);
  const canManage = currentMembership?.role === "owner";
  const changeRole = async (member: { userId: number; role: "owner" | "moderator" | "member" }) => {
    if (!canManage || member.role === "owner") return;
    try {
      await setMemberRole.mutateAsync({ roomId: id, userId: member.userId, role: member.role === "moderator" ? "member" : "moderator" });
      await members.refetch();
    } catch (error) {
      Alert.alert("تعذر تغيير الدور", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={23} color={buzzColors.ink} /></Pressable><View style={styles.titleWrap}><Text style={styles.title}>دردشة الغرفة</Text><Text style={styles.subtitle}>أعضاء حقيقيون فقط</Text></View><Pressable onPress={() => setMembersOpen(true)} style={styles.membersButton}><MaterialIcons name="groups" size={22} color={buzzColors.indigo} /></Pressable></View><FlatList data={messages.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <ChatMessageBubble message={item} mine={item.senderId === user?.id} />} ListEmptyComponent={messages.isLoading ? <ActivityIndicator color={buzzColors.indigo} style={{ marginTop: 60 }} /> : <View style={styles.empty}><MaterialIcons name="chat-bubble-outline" color={buzzColors.indigo} size={36} /><Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text><Text style={styles.emptyCopy}>كن أول عضو يكتب في هذه الغرفة.</Text></View>} /><ChatComposer destination={{ roomId: id }} onSent={() => messages.refetch()} /></View><Modal visible={membersOpen} transparent animationType="slide" onRequestClose={() => setMembersOpen(false)}><View style={styles.shade}><View style={styles.sheet}><View style={styles.sheetHeader}><Pressable onPress={() => setMembersOpen(false)} style={styles.close}><MaterialIcons name="close" size={21} color={buzzColors.ink} /></Pressable><Text style={styles.sheetTitle}>أعضاء الغرفة</Text><View style={{ width: 36 }} /></View><FlatList data={members.data ?? []} keyExtractor={(item) => String(item.userId)} contentContainerStyle={styles.membersList} ListEmptyComponent={<Text style={styles.emptyCopy}>لا توجد عضوية متاحة.</Text>} renderItem={({ item }) => <View style={styles.memberRow}><View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{item.name.slice(0, 1)}</Text></View><View style={styles.memberCopy}><Pressable onPress={() => { setMembersOpen(false); router.push({ pathname: "/profile/[id]", params: { id: String(item.userId) } }); }}><Text style={styles.memberName}>{item.name}</Text><Text style={styles.memberUsername}>@{item.username || "—"}</Text></Pressable></View><Pressable disabled={!canManage || item.role === "owner" || setMemberRole.isPending} onPress={() => void changeRole(item)} style={({ pressed }) => [styles.roleButton, (!canManage || item.role === "owner") && styles.roleDisabled, pressed && styles.pressed]}><Text style={styles.roleText}>{roleLabels[item.role]}</Text>{canManage && item.role !== "owner" ? <MaterialIcons name="swap-vert" size={16} color={buzzColors.indigo} /> : null}</Pressable></View>} /><Text style={styles.ownerHint}>{canManage ? "اضغط على دور عضو لتعيينه مشرفًا أو إعادته عضوًا." : "مالك الغرفة فقط يستطيع تغيير أدوار الأعضاء."}</Text></View></View></Modal></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { height: 67, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#ECECF3", paddingHorizontal: 18, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#F6F6FA", alignItems: "center", justifyContent: "center" },
  membersButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" },
  titleWrap: { alignItems: "center" },
  title: { color: buzzColors.ink, fontSize: 17, fontWeight: "900", writingDirection: "rtl" },
  subtitle: { color: buzzColors.muted, fontSize: 10, marginTop: 2, writingDirection: "rtl" },
  list: { flexGrow: 1, padding: 15 },
  empty: { alignItems: "center", paddingTop: 100, gap: 8 },
  emptyTitle: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl" },
  emptyCopy: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl" },
  shade: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15,15,30,0.48)" },
  sheet: { maxHeight: "78%", backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 18, paddingBottom: 30 },
  sheetHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  close: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#F6F6FA", alignItems: "center", justifyContent: "center" },
  sheetTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", writingDirection: "rtl" },
  membersList: { paddingVertical: 14 },
  memberRow: { flexDirection: "row-reverse", alignItems: "center", gap: 9, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F1F5" },
  memberAvatar: { width: 41, height: 41, borderRadius: 14, backgroundColor: "#E5E2FF", alignItems: "center", justifyContent: "center" },
  memberAvatarText: { color: buzzColors.indigo, fontWeight: "900", fontSize: 17 },
  memberCopy: { flex: 1, alignItems: "flex-end" },
  memberName: { color: buzzColors.ink, fontSize: 14, fontWeight: "900", textAlign: "right", writingDirection: "rtl" },
  memberUsername: { color: buzzColors.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  roleButton: { minWidth: 91, minHeight: 34, borderRadius: 12, backgroundColor: "#EFEEFF", paddingHorizontal: 8, flexDirection: "row-reverse", gap: 3, alignItems: "center", justifyContent: "center" },
  roleDisabled: { backgroundColor: "#F3F3F6" },
  roleText: { color: buzzColors.indigo, fontSize: 11, fontWeight: "800", writingDirection: "rtl" },
  ownerHint: { color: buzzColors.muted, textAlign: "center", fontSize: 11, lineHeight: 18, writingDirection: "rtl" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
