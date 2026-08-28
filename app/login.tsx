import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function LoginScreen() {
  const { establish } = useLocalAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.localAuth.login.useMutation();

  const submit = async () => {
    try {
      const result = await login.mutateAsync({ username: username.trim(), password });
      await establish(result.token, result.user);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "راجع اسم المستخدم وكلمة المرور.");
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><View style={styles.mark}><MaterialIcons name="record-voice-over" size={31} color="#FFFFFF" /></View><Text style={styles.title}>شات باز</Text><Text style={styles.copy}>سجّل الدخول إلى حسابك الحقيقي باستخدام اسم المستخدم وكلمة المرور.</Text><View style={styles.card}><TextInput value={username} onChangeText={setUsername} placeholder="اسم المستخدم" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" autoCapitalize="none" autoCorrect={false} maxLength={64} /><TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" secureTextEntry autoCapitalize="none" maxLength={128} /><Pressable disabled={login.isPending || !username.trim() || !password} onPress={() => void submit()} style={({ pressed }) => [styles.primary, (login.isPending || !username.trim() || !password) && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="login" size={21} color="#FFFFFF" /><Text style={styles.primaryText}>{login.isPending ? "جارٍ التحقق..." : "تسجيل الدخول"}</Text></Pressable></View><Text style={styles.note}>إنشاء الحسابات يتم من داخل البرنامج بواسطة المدير أو الوكيل المصرّح له فقط.</Text><Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>العودة</Text></Pressable></ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, page: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 30 }, mark: { width: 73, height: 73, borderRadius: 25, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" }, title: { color: buzzColors.ink, fontSize: 29, fontWeight: "900", marginTop: 15, writingDirection: "rtl" }, copy: { color: buzzColors.muted, fontSize: 13, lineHeight: 21, marginTop: 7, textAlign: "center", writingDirection: "rtl" }, card: { alignSelf: "stretch", marginTop: 22, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#ECECF3", gap: 10 }, input: { height: 52, borderRadius: 15, backgroundColor: "#F6F6FA", paddingHorizontal: 14, color: buzzColors.ink, fontSize: 14, writingDirection: "rtl" }, primary: { height: 52, borderRadius: 15, backgroundColor: buzzColors.indigo, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }, primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", writingDirection: "rtl" }, note: { color: buzzColors.muted, fontSize: 11, lineHeight: 18, textAlign: "center", marginTop: 14, writingDirection: "rtl" }, back: { marginTop: 11, paddingHorizontal: 18, paddingVertical: 8 }, backText: { color: buzzColors.indigo, fontSize: 13, fontWeight: "800", writingDirection: "rtl" }, disabled: { opacity: 0.56 }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] } });
