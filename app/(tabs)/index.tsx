import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { ActivityIndicator, Alert, FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

const categories = ["عامة", "غرف صوتية", "موسيقى", "ألعاب", "ثقافة"];

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }) });

export default function RoomsScreen() {
  const { user, isAuthenticated, loading } = useLocalAuth();
  const roomsQuery = trpc.social.rooms.list.useQuery(undefined, { enabled: isAuthenticated });
  const createRoom = trpc.social.rooms.create.useMutation();
  const joinRoom = trpc.social.rooms.join.useMutation();
  const unreadNotifications = trpc.social.notifications.unreadCount.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 15000 });
  const lastUnread = useRef(0);
  const hasLoadedUnread = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || unreadNotifications.data === undefined) return;
    const count = unreadNotifications.data;
    if (hasLoadedUnread.current && count > lastUnread.current && Platform.OS !== "web") {
      void Notifications.scheduleNotificationAsync({ content: { title: "طلب صداقة جديد", body: "لديك إشعار جديد في شات باز.", data: { href: "/notifications" } }, trigger: null });
    }
    lastUnread.current = count;
    hasLoadedUnread.current = true;
  }, [isAuthenticated, unreadNotifications.data]);
  useEffect(() => {
    if (!isAuthenticated || Platform.OS === "web") return;
    void (async () => { const current = await Notifications.getPermissionsAsync(); if (current.status !== "granted") await Notifications.requestPermissionsAsync(); })();
  }, [isAuthenticated]);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);

  const beginLogin = () => router.push("/login");

  const create = async () => {
    try {
      const roomId = await createRoom.mutateAsync({ title, description, category });
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      buzzHaptic();
      await roomsQuery.refetch();
      router.push(`/room/${roomId}`);
    } catch (error) {
      Alert.alert("تعذر إنشاء الغرفة", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  const openRoom = async (room: NonNullable<typeof roomsQuery.data>[number]) => {
    try {
      if (!room.joined) await joinRoom.mutateAsync({ roomId: room.id });
      buzzHaptic();
      router.push(`/room/${room.id}`);
    } catch (error) {
      Alert.alert("تعذر دخول الغرفة", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;

  if (!isAuthenticated) {
    return <ScreenContainer className="px-6 items-center justify-center"><View style={styles.authIcon}><MaterialIcons name="lock-outline" color="#FFFFFF" size={31} /></View><Text style={styles.emptyTitle}>ادخل إلى شات باز</Text><Text style={styles.emptyCopy}>سجّل الدخول بحسابك الحقيقي لعرض الغرف أو إنشائها والتواصل مع الآخرين.</Text><Pressable onPress={() => void beginLogin()} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><MaterialIcons name="login" color="#FFFFFF" size={20} /><Text style={styles.primaryActionText}>تسجيل الدخول</Text></Pressable></ScreenContainer>;
  }

  return <ScreenContainer edges={["top", "left", "right"]}>
    <FlatList
      data={roomsQuery.data ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <Pressable onPress={() => void openRoom(item)} style={({ pressed }) => [styles.roomCard, pressed && styles.pressed]}><View style={styles.roomRank}><Text style={styles.roomRankText}>{item.memberCount || "—"}</Text><MaterialIcons name="groups" size={18} color="#9B9BAB" /></View><Avatar initials={item.owner.name.slice(0, 1) || "؟"} tint={buzzColors.indigo} size={60} live={item.isLive} /><View style={styles.roomCopy}><View style={styles.roomTitleRow}><Text style={styles.roomTitle}>{item.title}</Text>{item.isLive ? <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>مباشر</Text></View> : null}</View><Text numberOfLines={1} style={styles.roomDescription}>{item.description || "غرفة من إنشاء عضو في شات باز"}</Text><Text style={styles.roomMeta}>{item.category} · إدارة {item.owner.name}</Text></View><MaterialIcons name="chevron-left" color="#A2A2B2" size={24} /></Pressable>}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.push("/(tabs)/profile")} style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]} accessibilityLabel="ملفي"><Avatar initials={user?.name?.slice(0, 1) || "؟"} tint={buzzColors.indigo} size={42} /></Pressable><Text style={styles.heading}>الغرف</Text><View style={styles.headerActions}><Pressable onPress={() => setCreateOpen(true)} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityLabel="إنشاء غرفة"><MaterialIcons name="add" size={27} color={buzzColors.ink} /></Pressable><Pressable onPress={() => undefined} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityLabel="بحث"><MaterialIcons name="search" size={25} color={buzzColors.ink} /></Pressable><View style={styles.notificationWrap}><Pressable onPress={() => router.push("/notifications")} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityLabel="التنبيهات"><MaterialIcons name="notifications-none" size={23} color={buzzColors.ink} /></Pressable>{(unreadNotifications.data ?? 0) > 0 ? <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadNotifications.data}</Text></View> : null}</View><Pressable onPress={() => router.push("/add-friend")} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} accessibilityLabel="إضافة صديق"><MaterialIcons name="person-add-alt-1" size={21} color={buzzColors.ink} /></Pressable></View></View><View style={styles.chips}>{categories.map((item) => <View key={item} style={[styles.chip, item === categories[0] && styles.chipActive]}><Text style={[styles.chipText, item === categories[0] && styles.chipTextActive]}>{item}</Text></View>)}</View></>}
      ListEmptyComponent={roomsQuery.isLoading ? <ActivityIndicator color={buzzColors.indigo} style={{ marginTop: 56 }} /> : <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name="record-voice-over" color={buzzColors.indigo} size={34} /></View><Text style={styles.emptyTitle}>لا توجد غرف بعد</Text><Text style={styles.emptyCopy}>أنشئ أول غرفة وابدأ مجتمعك. ستظهر الغرف التي ينشئها الأعضاء الحقيقيون هنا فقط.</Text><Pressable onPress={() => setCreateOpen(true)} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><MaterialIcons name="add" color="#FFFFFF" size={21} /><Text style={styles.primaryActionText}>إنشاء غرفة</Text></Pressable></View>}
    />
    <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}><View style={styles.modalShade}><View style={styles.sheet}><View style={styles.sheetHeader}><Pressable onPress={() => setCreateOpen(false)} style={styles.closeButton}><MaterialIcons name="close" color={buzzColors.ink} size={22} /></Pressable><Text style={styles.sheetTitle}>إنشاء غرفة</Text></View><Text style={styles.sheetCopy}>لن تظهر الغرفة إلا بعد أن تنشئها بحسابك الحقيقي.</Text><TextInput value={title} onChangeText={setTitle} placeholder="اسم الغرفة" placeholderTextColor="#A5A5B5" style={styles.field} textAlign="right" maxLength={90} /><TextInput value={description} onChangeText={setDescription} placeholder="وصف مختصر (اختياري)" placeholderTextColor="#A5A5B5" style={[styles.field, styles.descriptionField]} textAlign="right" multiline maxLength={600} /><View style={styles.categoryGrid}>{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={({ pressed }) => [styles.categoryChoice, category === item && styles.categoryChoiceActive, pressed && styles.pressed]}><Text style={[styles.categoryChoiceText, category === item && styles.categoryChoiceTextActive]}>{item}</Text></Pressable>)}</View><Pressable disabled={createRoom.isPending || title.trim().length < 3} onPress={() => void create()} style={({ pressed }) => [styles.primaryAction, (!title.trim() || createRoom.isPending) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryActionText}>{createRoom.isPending ? "جارٍ الإنشاء..." : "إنشاء الغرفة"}</Text></Pressable></View></View></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingBottom: 30 }, header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingTop: 6, paddingBottom: 15 }, heading: { color: buzzColors.ink, fontSize: 30, fontWeight: "900", writingDirection: "rtl" }, headerActions: { flexDirection: "row", gap: 5 }, notificationWrap: { position: "relative" }, notificationBadge: { position: "absolute", top: -4, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#D84E68", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" }, notificationBadgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900" }, avatarButton: { borderRadius: 22, overflow: "hidden" }, iconButton: { width: 38, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3" }, chips: { flexDirection: "row-reverse", gap: 8, marginBottom: 15, flexWrap: "wrap" }, chip: { borderWidth: 1, borderColor: "#D9D9E3", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: "#FFFFFF" }, chipActive: { backgroundColor: "#DDF5FA", borderColor: "#DDF5FA" }, chipText: { color: buzzColors.ink, fontSize: 13, fontWeight: "700", writingDirection: "rtl" }, chipTextActive: { color: "#176B7C" }, roomCard: { minHeight: 102, flexDirection: "row-reverse", alignItems: "center", gap: 12, padding: 13, backgroundColor: "#FFFFFF", borderRadius: 21, borderWidth: 1, borderColor: "#EDEDF3", marginBottom: 10 }, roomRank: { width: 34, alignItems: "center", gap: 3 }, roomRankText: { color: "#7F7F90", fontSize: 12, fontWeight: "800" }, roomCopy: { flex: 1, minWidth: 0, alignItems: "flex-end" }, roomTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 7 }, roomTitle: { color: buzzColors.ink, fontSize: 17, fontWeight: "900", writingDirection: "rtl" }, roomDescription: { color: buzzColors.muted, fontSize: 12, marginTop: 4, writingDirection: "rtl", textAlign: "right" }, roomMeta: { color: "#8A8A9A", fontSize: 10, marginTop: 6, writingDirection: "rtl" }, livePill: { flexDirection: "row-reverse", gap: 4, alignItems: "center", paddingHorizontal: 7, paddingVertical: 4, borderRadius: 99, backgroundColor: "#E8FAF3" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: buzzColors.green }, liveText: { color: buzzColors.green, fontSize: 9, fontWeight: "900", writingDirection: "rtl" }, empty: { alignItems: "center", paddingHorizontal: 25, paddingTop: 75 }, emptyIcon: { width: 74, height: 74, borderRadius: 28, alignItems: "center", justifyContent: "center", backgroundColor: "#EFEEFF" }, emptyTitle: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", marginTop: 16, writingDirection: "rtl", textAlign: "center" }, emptyCopy: { color: buzzColors.muted, fontSize: 13, lineHeight: 22, marginTop: 7, writingDirection: "rtl", textAlign: "center" }, primaryAction: { marginTop: 18, minHeight: 49, paddingHorizontal: 18, borderRadius: 16, backgroundColor: buzzColors.indigo, flexDirection: "row-reverse", gap: 7, alignItems: "center", justifyContent: "center" }, primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", writingDirection: "rtl" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, modalShade: { flex: 1, backgroundColor: "rgba(18,18,34,0.46)", justifyContent: "flex-end" }, sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 31 }, sheetHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, closeButton: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F4F8" }, sheetTitle: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", writingDirection: "rtl" }, sheetCopy: { color: buzzColors.muted, fontSize: 12, lineHeight: 19, writingDirection: "rtl", textAlign: "right", marginTop: 10 }, field: { marginTop: 12, height: 52, borderRadius: 15, backgroundColor: "#F6F6FA", paddingHorizontal: 14, color: buzzColors.ink, fontSize: 14, writingDirection: "rtl" }, descriptionField: { height: 75, paddingTop: 12 }, categoryGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 12 }, categoryChoice: { borderWidth: 1, borderColor: "#E0E0E9", borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8 }, categoryChoiceActive: { backgroundColor: "#EFEEFF", borderColor: buzzColors.indigo }, categoryChoiceText: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl" }, categoryChoiceTextActive: { color: buzzColors.indigo, fontWeight: "800" }, disabled: { opacity: 0.52 }, authIcon: { width: 74, height: 74, borderRadius: 27, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" },
});
