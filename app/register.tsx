import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

const ENGLISH_USERNAME = /^[a-zA-Z0-9_]{3,32}$/;

export default function RegisterScreen() {
  const { establish } = useLocalAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const register = trpc.localAuth.register.useMutation();

  const submit = async () => {
    const cleanUsername = username.trim();
    if (!ENGLISH_USERNAME.test(cleanUsername)) {
      Alert.alert("Invalid username", "Use English letters, numbers, or underscore only.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Invalid password", "Password must be at least 8 characters.");
      return;
    }
    try {
      const result = await register.mutateAsync({ username: cleanUsername, password });
      await establish(result.token, result.user);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Could not create account", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><View style={styles.mark}><MaterialIcons name="person-add-alt-1" size={31} color="#FFFFFF" /></View><Text style={styles.title}>Create account</Text><Text style={styles.copy}>English accounts are created from the app using two fields only.</Text><View style={styles.card}><TextInput value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor="#A5A5B5" style={styles.input} autoCapitalize="none" autoCorrect={false} maxLength={32} textAlign="left" /><TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#A5A5B5" style={styles.input} secureTextEntry autoCapitalize="none" maxLength={128} textAlign="left" /><Pressable disabled={register.isPending || !username.trim() || !password} onPress={() => void submit()} style={({ pressed }) => [styles.primary, (register.isPending || !username.trim() || !password) && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="person-add" size={21} color="#FFFFFF" /><Text style={styles.primaryText}>{register.isPending ? "Creating..." : "Create account"}</Text></Pressable></View><Pressable onPress={() => router.replace("/login")} style={styles.back}><Text style={styles.backText}>Back to login</Text></Pressable></ScrollView></KeyboardAvoidingView></ScreenContainer>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 30 },
  mark: { width: 73, height: 73, borderRadius: 25, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" },
  title: { color: buzzColors.ink, fontSize: 29, fontWeight: "900", marginTop: 15 },
  copy: { color: buzzColors.muted, fontSize: 13, lineHeight: 21, marginTop: 7, textAlign: "center" },
  card: { alignSelf: "stretch", marginTop: 22, backgroundColor: "#FFFFFF", borderRadius: 22, padding: 16, borderWidth: 1, borderColor: "#ECECF3", gap: 10 },
  input: { height: 52, borderRadius: 15, backgroundColor: "#F6F6FA", paddingHorizontal: 14, color: buzzColors.ink, fontSize: 14 },
  primary: { height: 52, borderRadius: 15, backgroundColor: buzzColors.indigo, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  back: { marginTop: 15, paddingHorizontal: 18, paddingVertical: 8 },
  backText: { color: buzzColors.indigo, fontSize: 13, fontWeight: "800" },
  disabled: { opacity: 0.56 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
