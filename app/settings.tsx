import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { IconCircle, Tag, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { checkServerHealth } from "@/lib/chat-buzz-api";
import { useChatBuzz } from "@/lib/chat-buzz-store";
import { validateServerSettings } from "@/lib/chat-buzz-utils";

export default function ServerSettingsScreen() {
  const { serverSettings, saveServerSettings } = useChatBuzz();
  const [apiBaseUrl, setApiBaseUrl] = useState(serverSettings.apiBaseUrl);
  const [liveKitUrl, setLiveKitUrl] = useState(serverSettings.liveKitUrl);
  const [saved, setSaved] = useState(Boolean(serverSettings.apiBaseUrl));
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setApiBaseUrl(serverSettings.apiBaseUrl);
    setLiveKitUrl(serverSettings.liveKitUrl);
  }, [serverSettings]);

  const save = async () => {
    const validation = validateServerSettings({ apiBaseUrl, liveKitUrl });
    if (!validation.valid) {
      Alert.alert("صيغة غير صحيحة", validation.message);
      return;
    }
    await saveServerSettings(validation.value);
    setSaved(true);
    buzzHaptic();
    Alert.alert("تم الحفظ", "حُفظ عنوان Railway على جهازك. استخدم زر فحص اتصال API للتأكد من أن قاعدة PostgreSQL جاهزة.");
  };

  const checkConnection = async () => {
    const validation = validateServerSettings({ apiBaseUrl, liveKitUrl });
    if (!validation.valid) {
      Alert.alert("صيغة غير صحيحة", validation.message);
      return;
    }
    setChecking(true);
    const result = await checkServerHealth(validation.value.apiBaseUrl);
    setChecking(false);
    Alert.alert(result.ok ? "نجح الفحص" : "تعذر الاتصال", result.detail);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <IconCircle icon="arrow-forward" label="العودة" onPress={() => router.back()} />
          <Text style={styles.title}>السيرفر الخاص</Text>
          <View style={styles.blank} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}><MaterialIcons name="dns" size={29} color="#FFFFFF" /></View>
          <Text style={styles.heroTitle}>اربط شات باز بسيرفرك</Text>
          <Text style={styles.heroDescription}>لن تُحفظ مفاتيح الإدارة أو مفاتيح LiveKit في الهاتف. يتصل التطبيق فقط بـ API آمن يصدر رموز المستخدمين المؤقتة.</Text>
          <Tag color={saved ? buzzColors.green : buzzColors.indigo}>{saved ? "العنوان محفوظ محلياً" : "لم يُربط خادم بعد"}</Tag>
        </View>

        <Text style={styles.sectionTitle}>عنوان API الخاص بك</Text>
        <Text style={styles.help}>مثال: https://api.chatbuzz.example</Text>
        <TextInput value={apiBaseUrl} onChangeText={(value) => { setApiBaseUrl(value); setSaved(false); }} placeholder="https://api.example.com" placeholderTextColor="#A5A5B5" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} textAlign="left" />

        <Text style={styles.sectionTitle}>عنوان خدمة الصوت</Text>
        <Text style={styles.help}>مثال: wss://voice.chatbuzz.example</Text>
        <TextInput value={liveKitUrl} onChangeText={(value) => { setLiveKitUrl(value); setSaved(false); }} placeholder="wss://voice.example.com" placeholderTextColor="#A5A5B5" autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} textAlign="left" />

        <View style={styles.info}>
          <MaterialIcons name="security" size={20} color={buzzColors.indigo} />
          <Text style={styles.infoText}>يطلب التطبيق من API رمز دخول قصير المدة عند دخول الغرفة. احتفظ بمفاتيح الخادم داخل السيرفر فقط.</Text>
        </View>

        <Pressable onPress={save} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <MaterialIcons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.saveText}>حفظ إعدادات السيرفر</Text>
        </Pressable>
        <Pressable disabled={checking} onPress={checkConnection} style={({ pressed }) => [styles.checkButton, checking && styles.checkDisabled, pressed && styles.pressed]}>
          <MaterialIcons name={checking ? "hourglass-top" : "wifi-tethering"} size={20} color={buzzColors.indigo} />
          <Text style={styles.checkText}>{checking ? "جارٍ فحص الاتصال..." : "فحص اتصال API"}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/hosting")} style={({ pressed }) => [styles.guideButton, pressed && styles.pressed]}>
          <MaterialIcons name="menu-book" size={20} color={buzzColors.indigo} />
          <Text style={styles.guideText}>دليل اختيار السيرفر المجاني</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 28 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 17 },
  title: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", writingDirection: "rtl" },
  blank: { width: 42 },
  hero: { alignItems: "center", backgroundColor: "#EFEEFF", padding: 21, borderRadius: 23 },
  heroIcon: { width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: buzzColors.indigo },
  heroTitle: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", marginTop: 12, writingDirection: "rtl" },
  heroDescription: { color: "#5A5A79", fontSize: 12, lineHeight: 19, textAlign: "center", writingDirection: "rtl", marginTop: 6, marginBottom: 12 },
  sectionTitle: { color: buzzColors.ink, textAlign: "right", writingDirection: "rtl", fontSize: 15, fontWeight: "900", marginTop: 23 },
  help: { color: buzzColors.muted, textAlign: "right", writingDirection: "rtl", fontSize: 11, marginTop: 4, marginBottom: 8 },
  input: { height: 51, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E4EF", borderRadius: 15, paddingHorizontal: 14, color: buzzColors.ink, fontSize: 13 },
  info: { marginTop: 19, backgroundColor: "#F4F3FF", borderRadius: 16, padding: 13, flexDirection: "row-reverse", gap: 9, alignItems: "flex-start" },
  infoText: { flex: 1, color: "#57568B", fontSize: 11, lineHeight: 18, writingDirection: "rtl", textAlign: "right" },
  saveButton: { marginTop: 19, height: 52, borderRadius: 16, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8 },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", writingDirection: "rtl" },
  checkButton: { marginTop: 10, height: 49, borderRadius: 16, borderWidth: 1, borderColor: "#D9D8FB", alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8, backgroundColor: "#FFFFFF" },
  checkText: { color: buzzColors.indigo, fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  checkDisabled: { opacity: 0.55 },
  guideButton: { marginTop: 10, height: 49, borderRadius: 16, borderWidth: 1, borderColor: "#D9D8FB", alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8, backgroundColor: "#FFFFFF" },
  guideText: { color: buzzColors.indigo, fontSize: 14, fontWeight: "800", writingDirection: "rtl" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
