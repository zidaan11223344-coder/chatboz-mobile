import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function AddFriendScreen() {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");
  const search = trpc.social.friends.search.useQuery({ query: query.trim() }, { enabled: isAuthenticated && query.trim().length >= 2 });
  const request = trpc.social.friends.request.useMutation();

  const sendRequest = async (userId: number) => {
    try {
      await request.mutateAsync({ userId });
      Alert.alert("تم إرسال الطلب", "سيظهر هذا الحساب ضمن أصدقائك بعد قبول الطلب.");
    } catch (error) {
      Alert.alert("تعذر إرسال الطلب", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  return <ScreenContainer edges={["top", "left", "right", "bottom"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={23} color={buzzColors.ink} /></Pressable><Text style={styles.heading}>إضافة صديق</Text><View style={{ width: 42 }} /></View><Text style={styles.copy}>ابحث بالاسم عن حساب مسجّل بالفعل. لا تظهر هنا أي حسابات وهمية.</Text><View style={styles.search}><MaterialIcons name="search" size={22} color="#9A9AAC" /><TextInput value={query} onChangeText={setQuery} placeholder="اكتب اسم المستخدم" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" autoFocus returnKeyType="search" /></View>{query.trim().length < 2 ? <View style={styles.hint}><MaterialIcons name="person-search" size={31} color={buzzColors.indigo} /><Text style={styles.hintText}>اكتب حرفين على الأقل للبحث عن حساب حقيقي.</Text></View> : search.isLoading ? <ActivityIndicator style={{ marginTop: 50 }} color={buzzColors.indigo} /> : <FlatList data={search.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.results} renderItem={({ item }) => <View style={styles.result}><Avatar initials={item.name?.slice(0, 1) || "؟"} tint={buzzColors.indigo} size={48} /><View style={styles.resultCopy}><Text style={styles.name}>{item.name || "مستخدم"}</Text><Text style={styles.email}>{item.email || "حساب شات باز"}</Text></View><Pressable disabled={request.isPending} onPress={() => void sendRequest(item.id)} style={({ pressed }) => [styles.request, request.isPending && styles.disabled, pressed && styles.pressed]}><Text style={styles.requestText}>إضافة</Text></Pressable></View>} ListEmptyComponent={<View style={styles.hint}><MaterialIcons name="person-off" size={31} color="#A5A5B5" /><Text style={styles.hintText}>لا يوجد حساب مسجّل بهذا الاسم.</Text></View>} />}</View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, paddingHorizontal: 18 }, header: { height: 58, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }, back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" }, heading: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", writingDirection: "rtl" }, copy: { color: buzzColors.muted, fontSize: 12, lineHeight: 20, writingDirection: "rtl", textAlign: "right", marginTop: 9 }, search: { marginTop: 16, height: 53, borderRadius: 16, borderWidth: 1, borderColor: "#E4E4EE", backgroundColor: "#FFFFFF", paddingHorizontal: 13, flexDirection: "row-reverse", alignItems: "center", gap: 7 }, input: { flex: 1, color: buzzColors.ink, fontSize: 14, writingDirection: "rtl" }, hint: { alignItems: "center", gap: 9, paddingTop: 70, paddingHorizontal: 35 }, hintText: { color: buzzColors.muted, fontSize: 13, lineHeight: 21, textAlign: "center", writingDirection: "rtl" }, results: { paddingTop: 16, paddingBottom: 20 }, result: { flexDirection: "row-reverse", alignItems: "center", gap: 11, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#ECECF3", padding: 11, marginBottom: 9 }, resultCopy: { flex: 1, alignItems: "flex-end" }, name: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl" }, email: { color: buzzColors.muted, fontSize: 10, marginTop: 3 }, request: { height: 36, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" }, requestText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "900", writingDirection: "rtl" }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] } });
