import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const login = async () => {
    try {
      await startOAuthLogin();
    } catch (error) {
      Alert.alert("تعذر فتح تسجيل الدخول", error instanceof Error ? error.message : "حاول مرة أخرى.");
    }
  };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><View style={styles.page}><View style={styles.mark}><MaterialIcons name="record-voice-over" size={31} color="#FFFFFF" /></View><Text style={styles.title}>شات باز</Text><Text style={styles.copy}>سجّل الدخول بحساب موثّق لإنشاء غرفة وإضافة أصدقاء وإرسال الرسائل والمرفقات.</Text><Pressable onPress={() => void login()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><MaterialIcons name="login" size={21} color="#FFFFFF" /><Text style={styles.primaryText}>تسجيل الدخول أو إنشاء حساب</Text></Pressable><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>العودة</Text></Pressable></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }, mark: { width: 76, height: 76, borderRadius: 26, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" }, title: { color: buzzColors.ink, fontSize: 29, fontWeight: "900", marginTop: 16, writingDirection: "rtl" }, copy: { color: buzzColors.muted, fontSize: 14, lineHeight: 23, marginTop: 8, textAlign: "center", writingDirection: "rtl" }, primary: { marginTop: 25, width: "100%", height: 53, borderRadius: 16, backgroundColor: buzzColors.indigo, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", writingDirection: "rtl" }, secondary: { marginTop: 12, height: 46, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }, secondaryText: { color: buzzColors.indigo, fontSize: 14, fontWeight: "800", writingDirection: "rtl" }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] } });
