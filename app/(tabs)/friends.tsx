import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar, buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function FriendsScreen() {
  const { isAuthenticated, loading } = useAuth();
  const friendsQuery = trpc.social.friends.list.useQuery(undefined, { enabled: isAuthenticated });
  const createConversation = trpc.social.conversations.create.useMutation();

  const openConversation = async (friendId: number) => {
    try {
      const conversation = await createConversation.mutateAsync({ userId: friendId });
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      Alert.alert("تعذر فتح المحادثة", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;
  if (!isAuthenticated) return <ScreenContainer className="px-6 items-center justify-center"><Text style={styles.emptyTitle}>سجّل الدخول أولًا</Text><Text style={styles.emptyCopy}>أضف أصدقاء حقيقيين وتواصل معهم بعد الدخول إلى حسابك.</Text><Pressable onPress={() => void startOAuthLogin()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>تسجيل الدخول</Text></Pressable></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right"]}><FlatList data={friendsQuery.data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list} renderItem={({ item }) => <Pressable onPress={() => void openConversation(item.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><Avatar initials={item.name.slice(0, 1) || "؟"} tint={buzzColors.indigo} size={55} /><View style={styles.copy}><Text style={styles.name}>{item.name}</Text><Text style={styles.caption}>صديق في شات باز</Text></View><MaterialIcons name="chat-bubble-outline" color={buzzColors.indigo} size={22} /></Pressable>} ListHeaderComponent={<View style={styles.header}><Pressable onPress={() => router.push("/add-friend")} style={({ pressed }) => [styles.add, pressed && styles.pressed]}><MaterialIcons name="person-add-alt-1" size={21} color="#FFFFFF" /><Text style={styles.addText}>إضافة صديق</Text></Pressable><Text style={styles.heading}>الأصدقاء</Text></View>} ListEmptyComponent={friendsQuery.isLoading ? <ActivityIndicator style={{ marginTop: 55 }} color={buzzColors.indigo} /> : <View style={styles.empty}><View style={styles.emptyIcon}><MaterialIcons name="group-add" size={34} color={buzzColors.indigo} /></View><Text style={styles.emptyTitle}>لا يوجد أصدقاء بعد</Text><Text style={styles.emptyCopy}>ابحث عن حساب حقيقي باسمه ثم أرسل له طلب صداقة.</Text><Pressable onPress={() => router.push("/add-friend")} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>إضافة صديق</Text></Pressable></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ list: { paddingHorizontal: 17, paddingBottom: 30 }, header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingTop: 7, marginBottom: 18 }, heading: { color: buzzColors.ink, fontSize: 29, fontWeight: "900", writingDirection: "rtl" }, add: { flexDirection: "row-reverse", alignItems: "center", gap: 6, borderRadius: 14, backgroundColor: buzzColors.indigo, paddingHorizontal: 12, height: 42 }, addText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", writingDirection: "rtl" }, row: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", borderRadius: 19, padding: 12, marginBottom: 9 }, copy: { flex: 1, alignItems: "flex-end" }, name: { color: buzzColors.ink, fontSize: 16, fontWeight: "900", writingDirection: "rtl" }, caption: { color: buzzColors.muted, fontSize: 11, marginTop: 3, writingDirection: "rtl" }, empty: { alignItems: "center", paddingTop: 76, paddingHorizontal: 25 }, emptyIcon: { width: 74, height: 74, borderRadius: 28, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" }, emptyTitle: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", marginTop: 16, writingDirection: "rtl", textAlign: "center" }, emptyCopy: { color: buzzColors.muted, fontSize: 13, lineHeight: 22, marginTop: 7, textAlign: "center", writingDirection: "rtl" }, primary: { marginTop: 18, height: 49, paddingHorizontal: 20, borderRadius: 16, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" }, primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900", writingDirection: "rtl" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] } });
