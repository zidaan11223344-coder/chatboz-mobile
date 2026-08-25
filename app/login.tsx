import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { login, register } from "@/lib/chat-buzz-api";
import { useChatBuzz } from "@/lib/chat-buzz-store";

export default function LoginScreen() {
  const { serverSettings, setSession } = useChatBuzz();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (username.trim().length < 3 || password.length < 6 || (isRegister && displayName.trim().length < 2)) {
      Alert.alert("بيانات غير مكتملة", isRegister ? "اكتب الاسم الظاهر واسم مستخدم من 3 أحرف وكلمة مرور من 6 أحرف." : "اكتب اسم المستخدم وكلمة المرور بشكل صحيح.");
      return;
    }
    setBusy(true);
    try {
      const result = isRegister ? await register(serverSettings.apiBaseUrl, username, displayName, password) : await login(serverSettings.apiBaseUrl, username, password);
      await setSession(result.token, result.user);
      buzzHaptic();
      router.back();
    } catch (error) {
      Alert.alert("تعذر تسجيل الدخول", error instanceof Error ? error.message : "حاول مرة أخرى بعد التأكد من إعداد DATABASE_URL في Railway.");
    } finally { setBusy(false); }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.page}><View style={styles.brand}><View style={styles.mark}><MaterialIcons name="record-voice-over" size={28} color="#FFFFFF" /></View><Text style={styles.title}>شات بوز</Text><Text style={styles.subtitle}>{isRegister ? "أنشئ حسابك وابدأ المحادثة" : "سجّل دخولك إلى عالمك الصوتي"}</Text></View><View style={styles.card}>{isRegister ? <TextInput value={displayName} onChangeText={setDisplayName} placeholder="الاسم الظاهر" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" /> : null}<TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="اسم المستخدم" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" /><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="كلمة المرور" placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" /><Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, busy && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{busy ? "جارٍ الاتصال..." : isRegister ? "إنشاء الحساب" : "تسجيل الدخول"}</Text></Pressable><Pressable onPress={() => setIsRegister((current) => !current)} style={styles.switch}><Text style={styles.switchText}>{isRegister ? "لديك حساب؟ تسجيل الدخول" : "ليس لديك حساب؟ إنشاء حساب"}</Text></Pressable></View><Text style={styles.endpoint}>الخادم: {serverSettings.apiBaseUrl}</Text></KeyboardAvoidingView></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, justifyContent: "center", paddingHorizontal: 22 }, brand: { alignItems: "center", marginBottom: 28 }, mark: { width: 64, height: 64, borderRadius: 20, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", marginBottom: 12 }, title: { color: buzzColors.ink, fontSize: 28, fontWeight: "900" }, subtitle: { color: buzzColors.muted, fontSize: 13, marginTop: 6, writingDirection: "rtl" }, card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 18, gap: 12, borderWidth: 1, borderColor: buzzColors.border }, input: { height: 52, borderRadius: 15, backgroundColor: "#F6F6FA", paddingHorizontal: 14, color: buzzColors.ink, fontSize: 15, writingDirection: "rtl" }, button: { height: 52, borderRadius: 15, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", marginTop: 4 }, buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", writingDirection: "rtl" }, switch: { alignItems: "center", paddingVertical: 8 }, switchText: { color: buzzColors.indigo, fontSize: 13, fontWeight: "800", writingDirection: "rtl" }, endpoint: { color: buzzColors.muted, fontSize: 10, textAlign: "center", marginTop: 18 }, disabled: { opacity: 0.6 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] } });
