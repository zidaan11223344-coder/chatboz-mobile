import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const roleLabels = { admin: "مدير", agent: "وكيل", user: "مستخدم" } as const;

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = trpc.social.profiles.get.useQuery({ userId: Number(id) }, { enabled: Number.isInteger(Number(id)) && Number(id) > 0 });

  if (profile.isLoading) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;
  if (!profile.data) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-6"><Text style={styles.error}>تعذر العثور على الملف الشخصي.</Text></ScreenContainer>;

  const item = profile.data;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={buzzColors.ink} /></Pressable><Text style={styles.headerTitle}>الملف الشخصي</Text><View style={{ width: 42 }} /></View><View style={styles.hero}><Avatar initials={(item.name || "م").slice(0, 1)} tint={item.role === "admin" ? "#C58A13" : buzzColors.indigo} size={82} /><Text style={styles.name}>{item.name}</Text><Text style={styles.username}>@{item.username || "—"}</Text><View style={styles.badge}><MaterialIcons name="verified-user" size={15} color={buzzColors.indigo} /><Text style={styles.badgeText}>{roleLabels[item.role]}</Text></View></View><View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{item.friendsCount}</Text><Text style={styles.statLabel}>الأصدقاء</Text></View><View style={styles.stat}><Text style={styles.statValue}>{new Date(item.createdAt).toLocaleDateString("ar")}</Text><Text style={styles.statLabel}>تاريخ الانضمام</Text></View></View><Text style={styles.note}>رصيد النقاط لا يظهر في الملف العام حفاظًا على الخصوصية.</Text></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 17 },
  header: { height: 52, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: buzzColors.ink, fontSize: 18, fontWeight: "900", writingDirection: "rtl" },
  hero: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#ECECF3", paddingVertical: 25, marginTop: 14 },
  name: { color: buzzColors.ink, fontSize: 23, fontWeight: "900", marginTop: 12, writingDirection: "rtl" },
  username: { color: buzzColors.muted, fontSize: 13, marginTop: 3 },
  badge: { flexDirection: "row-reverse", alignItems: "center", gap: 5, backgroundColor: "#EFEEFF", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, marginTop: 12 },
  badgeText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  stats: { flexDirection: "row-reverse", gap: 10, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", paddingVertical: 15 },
  statValue: { color: buzzColors.ink, fontSize: 15, fontWeight: "900" },
  statLabel: { color: buzzColors.muted, fontSize: 11, marginTop: 4, writingDirection: "rtl" },
  note: { color: buzzColors.muted, textAlign: "center", fontSize: 12, lineHeight: 19, marginTop: 16, writingDirection: "rtl" },
  error: { color: buzzColors.ink, fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
});
