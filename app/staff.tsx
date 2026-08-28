import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { buzzColors } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function StaffScreen() {
  const { user, loading } = useLocalAuth();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const createUser = trpc.admin.createUser.useMutation();

  const submit = async () => {
    if (!username.trim() || !displayName.trim() || password.length < 8) return;
    try {
      await createUser.mutateAsync({ username: username.trim(), name: displayName.trim(), password });
      setUsername("");
      setDisplayName("");
      setPassword("");
      Alert.alert("Account created", "The real user account is ready for login.");
    } catch (error) {
      Alert.alert("Could not create account", error instanceof Error ? error.message : "Please try again.");
    }
  };

  if (loading) return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={buzzColors.indigo} /></ScreenContainer>;
  if (!user || (user.role !== "admin" && user.role !== "agent")) return <ScreenContainer className="items-center justify-center px-6"><Text style={styles.title}>Staff access only</Text><Text style={styles.copy}>An administrator or an approved agent must sign in.</Text></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right"]}><View style={styles.page}><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-forward" size={22} color={buzzColors.ink} /></Pressable><View style={styles.headerCopy}><Text style={styles.heading}>Create account</Text><Text style={styles.subheading}>English account setup</Text></View></View><View style={styles.card}><Text style={styles.cardTitle}>New real user</Text><Text style={styles.cardCopy}>Arabic display names and decorative characters are supported. This form is English-only.</Text><Text style={styles.label}>Username</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="unique_username" placeholderTextColor="#A5A5B5" style={styles.input} /><Text style={styles.label}>Display name</Text><TextInput value={displayName} onChangeText={setDisplayName} placeholder="Arabic name or decorated name" placeholderTextColor="#A5A5B5" style={styles.input} /><Text style={styles.label}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#A5A5B5" style={styles.input} /><Pressable disabled={createUser.isPending || !username.trim() || !displayName.trim() || password.length < 8} onPress={() => void submit()} style={({ pressed }) => [styles.button, (createUser.isPending || !username.trim() || !displayName.trim() || password.length < 8) && styles.disabled, pressed && styles.pressed]}><Text style={styles.buttonText}>{createUser.isPending ? "Creating..." : "Create account"}</Text></Pressable></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 18 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 24 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  heading: { color: buzzColors.ink, fontSize: 27, fontWeight: "900" },
  subheading: { color: buzzColors.muted, fontSize: 12, marginTop: 3 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 24, borderWidth: 1, borderColor: "#ECECF3", padding: 20 },
  cardTitle: { color: buzzColors.ink, fontSize: 19, fontWeight: "900" },
  cardCopy: { color: buzzColors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 },
  label: { color: buzzColors.ink, fontSize: 12, fontWeight: "800", marginTop: 16 },
  input: { height: 50, backgroundColor: "#F6F6FA", borderRadius: 14, paddingHorizontal: 13, color: buzzColors.ink, fontSize: 14, marginTop: 7 },
  button: { height: 50, marginTop: 22, borderRadius: 15, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  title: { color: buzzColors.ink, fontSize: 20, fontWeight: "900" },
  copy: { color: buzzColors.muted, fontSize: 13, marginTop: 8 },
});
