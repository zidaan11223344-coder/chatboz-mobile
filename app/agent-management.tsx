import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";
import { AGENT_PERMISSION_KEYS, AGENT_PERMISSION_LABELS, type AgentPermissionKey, type AgentPermissions } from "@/shared/agent-permissions";

const emptyPermissions = (): AgentPermissions => Object.fromEntries(AGENT_PERMISSION_KEYS.map((key) => [key, false])) as AgentPermissions;

type Agent = { id: number; username: string | null; name: string | null; permissions: AgentPermissions };

export default function AgentManagementScreen() {
  const { user } = useLocalAuth();
  const agentsQuery = trpc.admin.agents.useQuery(undefined, { enabled: user?.role === "admin" });
  const savePermissions = trpc.admin.setAgentPermissions.useMutation();
  const [drafts, setDrafts] = useState<Record<number, AgentPermissions>>({});

  useEffect(() => {
    if (!agentsQuery.data) return;
    setDrafts(Object.fromEntries(agentsQuery.data.map((agent) => [agent.id, { ...emptyPermissions(), ...agent.permissions }])));
  }, [agentsQuery.data]);

  const updatePermission = (agentId: number, key: AgentPermissionKey, value: boolean) => {
    setDrafts((current) => ({ ...current, [agentId]: { ...(current[agentId] ?? emptyPermissions()), [key]: value } }));
  };

  const saveAgent = async (agent: Agent) => {
    try {
      await savePermissions.mutateAsync({ userId: agent.id, permissions: drafts[agent.id] ?? agent.permissions });
      await agentsQuery.refetch();
      Alert.alert("تم الحفظ", `تم تحديث صلاحيات ${agent.name || agent.username || "الوكيل"}.`);
    } catch (error) {
      Alert.alert("تعذر الحفظ", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  if (user?.role !== "admin") {
    return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="items-center justify-center px-6"><MaterialIcons name="lock-outline" color={buzzColors.muted} size={42} /><Text style={styles.denied}>هذه الصفحة متاحة للمدير فقط.</Text><Pressable onPress={() => router.replace("/login")} style={styles.primary}><Text style={styles.primaryText}>تسجيل الدخول</Text></Pressable></ScreenContainer>;
  }

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><FlatList
    data={(agentsQuery.data ?? []) as Agent[]}
    keyExtractor={(agent) => String(agent.id)}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={buzzColors.ink} /></Pressable><View style={styles.headerCopy}><Text style={styles.title}>إدارة الوكلاء</Text><Text style={styles.subtitle}>حدد صلاحيات كل وكيل بشكل مستقل</Text></View></View>}
    ListEmptyComponent={agentsQuery.isLoading ? <Text style={styles.empty}>جارٍ تحميل الوكلاء...</Text> : <View style={styles.emptyBox}><MaterialIcons name="group-off" size={32} color={buzzColors.muted} /><Text style={styles.empty}>لا توجد حسابات وكلاء حقيقية حاليًا.</Text></View>}
    renderItem={({ item: agent }) => <View style={styles.card}><View style={styles.agentHeader}><View style={styles.agentAvatar}><Text style={styles.avatarText}>{(agent.name || agent.username || "و").slice(0, 1)}</Text></View><View style={styles.agentCopy}><Text style={styles.agentName}>{agent.name || "وكيل"}</Text><Text style={styles.agentUsername}>@{agent.username || "—"}</Text></View><MaterialIcons name="verified-user" size={20} color={buzzColors.green} /></View><View style={styles.permissions}>{AGENT_PERMISSION_KEYS.map((key) => <View key={key} style={styles.permissionRow}><Text style={styles.permissionLabel}>{AGENT_PERMISSION_LABELS[key]}</Text><Switch value={Boolean(drafts[agent.id]?.[key] ?? agent.permissions[key])} onValueChange={(value) => updatePermission(agent.id, key, value)} trackColor={{ false: "#D8D8E2", true: "#B7B1FF" }} thumbColor={(drafts[agent.id]?.[key] ?? agent.permissions[key]) ? buzzColors.indigo : "#FFFFFF"} /></View>)}</View><Pressable disabled={savePermissions.isPending} onPress={() => void saveAgent(agent)} style={({ pressed }) => [styles.save, savePermissions.isPending && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="save" size={18} color="#FFFFFF" /><Text style={styles.saveText}>{savePermissions.isPending ? "جارٍ الحفظ..." : "حفظ صلاحيات الوكيل"}</Text></Pressable></View>}
  /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { padding: 17, paddingBottom: 40 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 18 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  title: { color: buzzColors.ink, fontSize: 24, fontWeight: "900", writingDirection: "rtl" },
  subtitle: { color: buzzColors.muted, fontSize: 12, marginTop: 3, writingDirection: "rtl" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 1, borderColor: "#ECECF3", padding: 15, marginBottom: 13 },
  agentHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: "#F0F0F5" },
  agentAvatar: { width: 45, height: 45, borderRadius: 16, backgroundColor: "#E5E2FF", alignItems: "center", justifyContent: "center" },
  avatarText: { color: buzzColors.indigo, fontSize: 19, fontWeight: "900" },
  agentCopy: { flex: 1, alignItems: "flex-end" },
  agentName: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl" },
  agentUsername: { color: buzzColors.muted, fontSize: 11, marginTop: 2 },
  permissions: { marginTop: 8 },
  permissionRow: { minHeight: 46, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F4F4F7" },
  permissionLabel: { color: buzzColors.ink, fontSize: 13, fontWeight: "700", writingDirection: "rtl" },
  save: { height: 46, borderRadius: 14, marginTop: 13, backgroundColor: buzzColors.indigo, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", writingDirection: "rtl" },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 70 },
  empty: { color: buzzColors.muted, textAlign: "center", marginTop: 10, writingDirection: "rtl" },
  denied: { color: buzzColors.ink, fontSize: 17, fontWeight: "900", textAlign: "center", marginTop: 12, writingDirection: "rtl" },
  primary: { height: 48, borderRadius: 14, paddingHorizontal: 20, marginTop: 14, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", writingDirection: "rtl" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
