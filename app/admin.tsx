import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { liveApi, type AdminSummary, type ApiUser } from "@/lib/chat-buzz-api";
import { useChatBuzz } from "@/lib/chat-buzz-store";

export default function AdminScreen() {
  const { profile, token, serverSettings } = useChatBuzz();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const allowed = ["owner", "admin", "assistant"].includes(profile.role);

  useEffect(() => {
    if (!allowed || !token) { setLoading(false); return; }
    Promise.all([
      liveApi.adminSummary(serverSettings.apiBaseUrl, token),
      profile.permissions.manage_users || profile.role !== "assistant" ? liveApi.adminUsers(serverSettings.apiBaseUrl, token) : Promise.resolve({ users: [] as ApiUser[] }),
    ]).then(([summaryResult, usersResult]) => {
      setSummary(summaryResult.summary);
      setUsers(usersResult.users);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : "تعذر تحميل لوحة الإدارة.")).finally(() => setLoading(false));
  }, [allowed, token, serverSettings.apiBaseUrl, profile.permissions.manage_users, profile.role]);

  if (!allowed || !token) return <ScreenContainer className="items-center justify-center p-6"><Text style={styles.denied}>هذه الصفحة متاحة للحسابات الإدارية فقط.</Text><Pressable onPress={() => router.replace("/login")} style={styles.button}><Text style={styles.buttonText}>تسجيل الدخول</Text></Pressable></ScreenContainer>;
  return <ScreenContainer><FlatList data={users} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<>
    <View style={styles.header}><Pressable onPress={() => router.back()}><MaterialIcons name="arrow-forward" size={25} color={buzzColors.ink} /></Pressable><View style={styles.headerCopy}><Text style={styles.title}>لوحة الإدارة</Text><Text style={styles.subtitle}>{profile.role === "owner" ? "مالك التطبيق" : "حساب إداري"}</Text></View></View>
    {loading ? <ActivityIndicator color={buzzColors.indigo} style={styles.loader} /> : <>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.cards}>{[["المستخدمون", summary?.users ?? 0, "people"], ["الغرف", summary?.rooms ?? 0, "meeting-room"], ["غرف مباشرة", summary?.liveRooms ?? 0, "podcasts"]].map(([label, value, icon]) => <View key={String(label)} style={styles.stat}><MaterialIcons name={icon as keyof typeof MaterialIcons.glyphMap} size={21} color={buzzColors.indigo} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}</View>
      <Text style={styles.section}>المستخدمون</Text>
    </>}</>} renderItem={({ item }) => <View style={styles.userRow}><View style={styles.avatar}><Text style={styles.avatarText}>{item.displayName.slice(0, 1)}</Text></View><View style={styles.userCopy}><Text style={styles.userName}>{item.displayName}</Text><Text style={styles.userHandle}>@{item.username} · {item.role === "owner" ? "المالك" : item.role === "assistant" ? "مساعد" : item.role === "admin" ? "مدير" : "مستخدم"}</Text></View>{item.role !== "user" ? <MaterialIcons name="verified" size={19} color={buzzColors.indigo} /> : null}</View>} ListEmptyComponent={!loading ? <Text style={styles.empty}>لا توجد بيانات مستخدمين متاحة لهذا الحساب.</Text> : null} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 18, paddingBottom: 35 }, header: { flexDirection: "row-reverse", alignItems: "center", gap: 14, marginBottom: 20 }, headerCopy: { flex: 1, alignItems: "flex-end" }, title: { fontSize: 27, fontWeight: "900", color: buzzColors.ink, writingDirection: "rtl" }, subtitle: { color: buzzColors.muted, marginTop: 3, writingDirection: "rtl" }, loader: { marginVertical: 25 }, cards: { flexDirection: "row-reverse", gap: 8, marginBottom: 25 }, stat: { flex: 1, alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#ECECF3" }, statValue: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", marginTop: 6 }, statLabel: { color: buzzColors.muted, fontSize: 11, marginTop: 2, writingDirection: "rtl" }, section: { textAlign: "right", color: buzzColors.ink, fontSize: 17, fontWeight: "900", marginBottom: 10, writingDirection: "rtl" }, userRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#ECECF3" }, avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#E9E7FF", alignItems: "center", justifyContent: "center" }, avatarText: { color: buzzColors.indigo, fontSize: 18, fontWeight: "900" }, userCopy: { flex: 1, alignItems: "flex-end" }, userName: { color: buzzColors.ink, fontWeight: "800", writingDirection: "rtl" }, userHandle: { color: buzzColors.muted, fontSize: 11, marginTop: 2, writingDirection: "rtl" }, error: { color: buzzColors.coral, textAlign: "right", marginBottom: 15, writingDirection: "rtl" }, empty: { color: buzzColors.muted, textAlign: "center", marginTop: 20, writingDirection: "rtl" }, denied: { color: buzzColors.ink, textAlign: "center", marginBottom: 15, writingDirection: "rtl" }, button: { backgroundColor: buzzColors.indigo, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 12 }, buttonText: { color: "#FFFFFF", fontWeight: "800" } });
