import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, PointsPill, SectionTitle, Tag, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useChatBuzz } from "@/lib/chat-buzz-store";

function SettingRow({ icon, title, subtitle, onPress, accent = buzzColors.indigo }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string; onPress?: () => void; accent?: string }) {
  return <Pressable onPress={() => { buzzHaptic(); onPress?.(); }} style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}><View style={[styles.settingIcon, { backgroundColor: `${accent}15` }]}><MaterialIcons name={icon} size={20} color={accent} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text><Text numberOfLines={1} style={styles.settingSubtitle}>{subtitle}</Text></View><MaterialIcons name="chevron-left" size={23} color="#ACACBC" /></Pressable>;
}

export default function ProfileScreen() {
  const { profile, serverSettings, token, logout } = useChatBuzz();
  const connected = Boolean(serverSettings.apiBaseUrl);
  return <ScreenContainer edges={["top", "left", "right"]}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><View style={styles.header}><Text style={styles.heading}>ملفي</Text><Pressable onPress={() => { buzzHaptic(); router.push("/settings"); }} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}><MaterialIcons name="settings" size={22} color={buzzColors.indigo} /></Pressable></View><View style={styles.profileCard}><View style={styles.profileTop}><Avatar initials={profile.initials} tint={buzzColors.indigo} size={70} live /><View style={styles.profileCopy}><Text style={styles.profileName}>{profile.name}</Text><Text style={styles.handle}>{profile.handle}</Text><View style={styles.badgeRow}><Tag color={buzzColors.coral}>عضو مبكر</Tag><Tag color={buzzColors.indigo}>مستكشف</Tag>{["owner", "admin", "assistant"].includes(profile.role) ? <Tag color={buzzColors.green}>{profile.role === "owner" ? "مالك التطبيق" : profile.role === "admin" ? "مدير" : "مساعد"}</Tag> : null}</View></View></View><View style={styles.divider} /><View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>غرفة زرتها</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statValue}>4</Text><Text style={styles.statLabel}>أصدقاء جدد</Text></View><View style={styles.statDivider} /><View style={styles.stat}><Text style={styles.statValue}>7</Text><Text style={styles.statLabel}>شارات</Text></View></View></View><View style={styles.pointsCard}><View style={styles.pointsIcon}><MaterialIcons name="diamond" size={23} color="#D79815" /></View><View style={styles.pointsCopy}><Text style={styles.pointsTitle}>رصيدك في شات بوز</Text><Text style={styles.pointsCaption}>استخدم النقاط لإرسال الهدايا</Text></View><PointsPill points={profile.points} /></View><SectionTitle title="إعداداتك" /><View style={styles.settingsCard}>{token && ["owner", "admin", "assistant"].includes(profile.role) ? <><SettingRow icon="admin-panel-settings" title="لوحة الإدارة" subtitle={profile.role === "owner" ? "إدارة المستخدمين والغرف والصلاحيات" : "أدوات الإدارة المتاحة لك"} onPress={() => router.push("/admin")} accent={buzzColors.green} /><View style={styles.line} /></> : null}<SettingRow icon={token ? "logout" : "login"} title={token ? "تسجيل الخروج" : "تسجيل الدخول"} subtitle={token ? `متصل بالحساب ${profile.handle}` : "استخدم حسابك لمزامنة النقاط والغرف"} onPress={() => token ? void logout() : router.push("/login")} accent={token ? buzzColors.coral : buzzColors.indigo} /><View style={styles.line} /><SettingRow icon="dns" title="السيرفر الخاص" subtitle={connected ? "تم حفظ عنوان الخادم" : "أضف API وخدمة الصوت"} onPress={() => router.push("/settings")} accent={connected ? buzzColors.green : buzzColors.indigo} /><View style={styles.line} /><SettingRow icon="notifications-none" title="الإشعارات" subtitle="الغرف والرسائل والهدايا" onPress={() => undefined} /><View style={styles.line} /><SettingRow icon="help-outline" title="المساعدة والخصوصية" subtitle="قواعد المجتمع وإدارة الحساب" onPress={() => undefined} accent={buzzColors.coral} /></View><View style={styles.serverHint}><MaterialIcons name={connected ? "check-circle" : "info-outline"} size={17} color={connected ? buzzColors.green : buzzColors.indigo} /><Text style={styles.serverHintText}>{token ? "الجلسة محفوظة بأمان على هذا الجهاز." : connected ? "الخادم مضبوط؛ سجّل الدخول لمزامنة حسابك." : "أضف عنوان سيرفرك لربط شات بوز بالخدمة الخاصة."}</Text></View></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 30 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  heading: { fontSize: 27, lineHeight: 36, fontWeight: "900", color: buzzColors.ink, writingDirection: "rtl" },
  headerButton: { width: 42, height: 42, borderWidth: 1, borderColor: buzzColors.border, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  profileCard: { backgroundColor: "#FFFFFF", borderRadius: 23, padding: 18, borderWidth: 1, borderColor: "#ECECF3" },
  profileTop: { flexDirection: "row-reverse", alignItems: "center", gap: 13 },
  profileCopy: { alignItems: "flex-end", flex: 1 },
  profileName: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", writingDirection: "rtl" },
  handle: { color: buzzColors.muted, fontSize: 13, marginTop: 2 },
  badgeRow: { marginTop: 9, flexDirection: "row-reverse", gap: 6 },
  divider: { height: 1, backgroundColor: "#F0F0F5", marginVertical: 17 },
  stats: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  stat: { alignItems: "center", flex: 1 },
  statValue: { color: buzzColors.ink, fontSize: 18, fontWeight: "900" },
  statLabel: { color: buzzColors.muted, fontSize: 10, marginTop: 3, writingDirection: "rtl" },
  statDivider: { width: 1, height: 27, backgroundColor: "#EEEEF4" },
  pointsCard: { marginTop: 13, flexDirection: "row-reverse", alignItems: "center", gap: 11, backgroundColor: "#FFF8E8", borderRadius: 19, padding: 14, borderWidth: 1, borderColor: "#F8E8BE" },
  pointsIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  pointsCopy: { flex: 1, alignItems: "flex-end" },
  pointsTitle: { color: "#5E4B1F", fontSize: 14, fontWeight: "800", writingDirection: "rtl", textAlign: "right" },
  pointsCaption: { color: "#9A7A35", fontSize: 11, marginTop: 2, writingDirection: "rtl", textAlign: "right" },
  settingsCard: { borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", overflow: "hidden" },
  settingRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12, padding: 14 },
  settingIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  settingCopy: { flex: 1, alignItems: "flex-end" },
  settingTitle: { color: buzzColors.ink, fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  settingSubtitle: { color: buzzColors.muted, fontSize: 11, marginTop: 2, writingDirection: "rtl", textAlign: "right" },
  line: { height: 1, backgroundColor: "#F0F0F5", marginRight: 65 },
  serverHint: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 7, backgroundColor: "#F2F1FF", borderRadius: 15, padding: 12, marginTop: 13 },
  serverHintText: { color: "#55549C", lineHeight: 19, fontSize: 12, flex: 1, writingDirection: "rtl", textAlign: "right" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
