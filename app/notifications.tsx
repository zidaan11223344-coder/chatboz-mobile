import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function NotificationsScreen() {
  const { isAuthenticated } = useLocalAuth();
  const notifications = trpc.social.notifications.list.useQuery(undefined, { enabled: isAuthenticated });
  const markRead = trpc.social.notifications.markRead.useMutation();

  if (!isAuthenticated) return <ScreenContainer className="items-center justify-center px-6"><Text style={styles.emptyTitle}>سجّل الدخول أولًا</Text><Text style={styles.emptyCopy}>ستظهر إشعارات طلبات الصداقة بعد تسجيل الدخول.</Text></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right"]}><FlatList data={notifications.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={buzzColors.ink} /></Pressable><Text style={styles.heading}>الإشعارات</Text><View style={{ width: 42 }} /></View>} renderItem={({ item }) => <Pressable onPress={() => { if (!item.readAt) void markRead.mutateAsync({ notificationId: item.id }).then(() => notifications.refetch()); }} style={[styles.row, !item.readAt && styles.unread]}><View style={styles.icon}><MaterialIcons name={item.kind === "friend_request" ? "person-add" : "check-circle-outline"} color={item.kind === "friend_request" ? "#D84E68" : buzzColors.green} size={21} /></View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })}</Text></View>{!item.readAt ? <View style={styles.dot} /> : null}</Pressable>} ListEmptyComponent={notifications.isLoading ? <ActivityIndicator color={buzzColors.indigo} style={{ marginTop: 60 }} /> : <View style={styles.empty}><MaterialIcons name="notifications-none" color="#9A9AA8" size={42} /><Text style={styles.emptyTitle}>لا توجد إشعارات</Text><Text style={styles.emptyCopy}>ستظهر هنا طلبات الصداقة والتنبيهات الجديدة.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 17, paddingBottom: 30 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingTop: 7, marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" },
  heading: { color: buzzColors.ink, fontSize: 27, fontWeight: "900", writingDirection: "rtl" },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", borderRadius: 18, padding: 13, marginBottom: 8 },
  unread: { borderColor: "#DDD9FF", backgroundColor: "#FBFAFF" },
  icon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#F1F0FF", alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "flex-end" },
  title: { color: buzzColors.ink, fontSize: 14, fontWeight: "900", writingDirection: "rtl" },
  body: { color: buzzColors.muted, fontSize: 12, lineHeight: 19, marginTop: 3, textAlign: "right", writingDirection: "rtl" },
  time: { color: "#A4A4B2", fontSize: 9, marginTop: 5, writingDirection: "rtl" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D84E68" },
  empty: { alignItems: "center", paddingTop: 72, paddingHorizontal: 25 },
  emptyTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", marginTop: 13, textAlign: "center", writingDirection: "rtl" },
  emptyCopy: { color: buzzColors.muted, fontSize: 13, lineHeight: 22, marginTop: 6, textAlign: "center", writingDirection: "rtl" },
});
