import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

const roleLabels = { admin: "مدير", agent: "وكيل", user: "مستخدم" } as const;

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useLocalAuth();
  const userId = Number(id);
  const profile = trpc.social.profiles.get.useQuery({ userId }, { enabled: Number.isInteger(userId) && userId > 0 });
  const blockStatus = trpc.social.profiles.blockStatus.useQuery({ userId }, { enabled: Number.isInteger(userId) && userId > 0 && userId !== user?.id });
  const requestFriend = trpc.social.friends.request.useMutation();
  const createConversation = trpc.social.conversations.create.useMutation();
  const setBlocked = trpc.social.profiles.setBlocked.useMutation();

  if (profile.isLoading) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;
  if (!profile.data) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-6"><Text style={styles.error}>تعذر العثور على الملف الشخصي.</Text></ScreenContainer>;

  const item = profile.data;
  const isSelf = item.id === user?.id;
  const blockedByMe = blockStatus.data?.blockedByMe ?? false;
  const blockedMe = blockStatus.data?.blockedMe ?? false;

  const sendFriendRequest = async () => {
    try { await requestFriend.mutateAsync({ userId: item.id }); Alert.alert("تم الإرسال", "تم إرسال طلب الصداقة."); }
    catch (error) { Alert.alert("تعذر إرسال الطلب", error instanceof Error ? error.message : "حاول مرة أخرى."); }
  };
  const openChat = async () => {
    try { const conversation = await createConversation.mutateAsync({ userId: item.id }); router.replace({ pathname: "/chat/[id]", params: { id: conversation.id } }); }
    catch (error) { Alert.alert("تعذر فتح المحادثة", error instanceof Error ? error.message : "تأكد من قبول الصداقة وعدم وجود حظر."); }
  };
  const toggleBlock = async () => {
    try { await setBlocked.mutateAsync({ userId: item.id, blocked: !blockedByMe }); await blockStatus.refetch(); Alert.alert(blockedByMe ? "تم فك الحظر" : "تم الحظر", blockedByMe ? "يمكنك التفاعل مع المستخدم الآن." : "تم منع الرسائل والتفاعل مع هذا المستخدم."); }
    catch (error) { Alert.alert("تعذر تنفيذ الحظر", error instanceof Error ? error.message : "حاول مرة أخرى."); }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={buzzColors.ink} /></Pressable><Text style={styles.headerTitle}>الملف الشخصي</Text><View style={{ width: 42 }} /></View><View style={styles.hero}><Avatar initials={(item.name || "م").slice(0, 1)} tint={item.role === "admin" ? "#C58A13" : buzzColors.indigo} size={88} /><Text style={styles.name}>{item.name}</Text><Text style={styles.username}>@{item.username || "—"}</Text><View style={styles.badge}><MaterialIcons name="verified-user" size={15} color={buzzColors.indigo} /><Text style={styles.badgeText}>{roleLabels[item.role]}</Text></View></View><View style={styles.actions}>{!isSelf ? <><Pressable disabled={blockedByMe || blockedMe || requestFriend.isPending} onPress={() => void sendFriendRequest()} style={({ pressed }) => [styles.action, styles.primaryAction, (blockedByMe || blockedMe) && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="person-add" size={19} color="#FFFFFF" /><Text style={styles.primaryText}>طلب صداقة</Text></Pressable><Pressable disabled={blockedByMe || blockedMe || createConversation.isPending} onPress={() => void openChat()} style={({ pressed }) => [styles.action, styles.secondaryAction, (blockedByMe || blockedMe) && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="chat" size={19} color={buzzColors.indigo} /><Text style={styles.secondaryText}>محادثة</Text></Pressable><Pressable disabled={setBlocked.isPending} onPress={() => void toggleBlock()} style={({ pressed }) => [styles.action, styles.blockAction, pressed && styles.pressed]}><MaterialIcons name={blockedByMe ? "lock-open" : "block"} size={19} color="#C94458" /><Text style={styles.blockText}>{blockedByMe ? "فك الحظر" : "حظر"}</Text></Pressable></> : null}</View>{blockedMe ? <Text style={styles.blockedNote}>هذا المستخدم قام بحظرك، لذلك أُوقفت خيارات التفاعل.</Text> : null}<View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{item.friendsCount}</Text><Text style={styles.statLabel}>الأصدقاء</Text></View><View style={styles.stat}><Text style={styles.statValue}>{new Date(item.createdAt).toLocaleDateString("ar")}</Text><Text style={styles.statLabel}>تاريخ الانضمام</Text></View></View><Text style={styles.note}>رصيد النقاط لا يظهر في الملف العام حفاظًا على الخصوصية.</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, padding: 17 }, header: { height: 52, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" }, headerTitle: { color: buzzColors.ink, fontSize: 18, fontWeight: "900", writingDirection: "rtl" }, hero: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#ECECF3", paddingVertical: 25, marginTop: 14 }, name: { color: buzzColors.ink, fontSize: 23, fontWeight: "900", marginTop: 12, writingDirection: "rtl" }, username: { color: buzzColors.muted, fontSize: 13, marginTop: 3 }, badge: { flexDirection: "row-reverse", alignItems: "center", gap: 5, backgroundColor: "#EFEEFF", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 12 }, badgeText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "800", writingDirection: "rtl" }, actions: { flexDirection: "row-reverse", gap: 7, marginTop: 12 }, action: { flex: 1, minHeight: 46, borderRadius: 14, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 5 }, primaryAction: { backgroundColor: buzzColors.indigo }, secondaryAction: { backgroundColor: "#EFEEFF" }, blockAction: { backgroundColor: "#FFF0F2" }, primaryText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", writingDirection: "rtl" }, secondaryText: { color: buzzColors.indigo, fontSize: 11, fontWeight: "900", writingDirection: "rtl" }, blockText: { color: "#C94458", fontSize: 11, fontWeight: "900", writingDirection: "rtl" }, blockedNote: { color: "#C94458", backgroundColor: "#FFF0F2", borderRadius: 12, padding: 10, textAlign: "center", marginTop: 10, fontSize: 11, writingDirection: "rtl" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, stats: { flexDirection: "row-reverse", gap: 10, marginTop: 12 }, stat: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", paddingVertical: 15 }, statValue: { color: buzzColors.ink, fontSize: 15, fontWeight: "900" }, statLabel: { color: buzzColors.muted, fontSize: 11, marginTop: 4, writingDirection: "rtl" }, note: { color: buzzColors.muted, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 16, writingDirection: "rtl" }, error: { color: buzzColors.ink, fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
});
