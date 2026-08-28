import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

import { buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { trpc } from "@/lib/trpc";

type Destination = { conversationId: string; roomId?: never } | { roomId: string; conversationId?: never };

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MESSAGE_COLORS = ["#111827", "#2F6BFF", "#0F9F79", "#C2417A", "#F97316", "#7C3AED", "#E11D48"] as const;

export function ChatComposer({ destination, onSent }: { destination: Destination; onSent: () => Promise<unknown> | void }) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(MESSAGE_COLORS[0]);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const upload = trpc.social.media.upload.useMutation();
  const send = trpc.social.messages.send.useMutation();

  const deliver = async (input: { kind: "text" | "image" | "audio"; body?: string; textColor?: string; attachmentUrl?: string; attachmentName?: string; durationSeconds?: number }) => {
    setSending(true);
    try {
      await send.mutateAsync({ ...destination, ...input });
      setDraft("");
      buzzHaptic();
      await onSent();
    } catch (error) {
      Alert.alert("تعذر إرسال الرسالة", error instanceof Error ? error.message : "تحقق من اتصالك ثم حاول مجددًا.");
    } finally {
      setSending(false);
    }
  };

  const sendText = () => {
    if (!draft.trim() || sending) return;
    void deliver({ kind: "text", body: draft, textColor: selectedColor });
  };

  const chooseImage = async () => {
    if (sending) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("إذن الصور مطلوب", "اسمح بالوصول إلى الصور لإرسال مرفق.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.72, base64: true });
      if (result.canceled || !result.assets[0]?.base64) return;
      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64) return;
      const sourceMimeType = asset.mimeType ?? "image/jpeg";
      const mimeType = imageMimes.has(sourceMimeType) ? sourceMimeType as "image/jpeg" | "image/png" | "image/webp" : "image/jpeg";
      setSending(true);
      const attachment = await upload.mutateAsync({ base64, name: asset.fileName || `photo-${Date.now()}.jpg`, mimeType });
      await send.mutateAsync({ ...destination, kind: "image", attachmentUrl: attachment.url, attachmentName: attachment.name });
      buzzHaptic();
      await onSent();
    } catch (error) {
      Alert.alert("تعذر إرسال الصورة", error instanceof Error ? error.message : "حاول اختيار صورة أصغر.");
    } finally {
      setSending(false);
    }
  };

  const toggleRecording = async () => {
    if (sending) return;
    try {
      if (!recorderState.isRecording) {
        const permission = await requestRecordingPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("إذن الميكروفون مطلوب", "اسمح بالوصول إلى الميكروفون لإرسال بصمة صوتية.");
          return;
        }
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
        return;
      }

      const durationSeconds = Math.max(1, Math.round(recorderState.durationMillis / 1000));
      await recorder.stop();
      if (!recorder.uri) throw new Error("تعذر حفظ البصمة الصوتية.");
      if (Platform.OS === "web") throw new Error("إرسال البصمة الصوتية متاح في تطبيق الهاتف.");
      setSending(true);
      const base64 = await FileSystem.readAsStringAsync(recorder.uri, { encoding: FileSystem.EncodingType.Base64 });
      const attachment = await upload.mutateAsync({ base64, name: `voice-${Date.now()}.m4a`, mimeType: "audio/m4a" });
      await send.mutateAsync({ ...destination, kind: "audio", attachmentUrl: attachment.url, attachmentName: attachment.name, durationSeconds });
      buzzHaptic();
      await onSent();
    } catch (error) {
      Alert.alert("تعذر إرسال البصمة الصوتية", error instanceof Error ? error.message : "حاول مرة أخرى.");
    } finally {
      setSending(false);
    }
  };

  return <View style={styles.composer}><View style={styles.colorRow}>{MESSAGE_COLORS.map((color) => <Pressable key={color} accessibilityLabel={`لون الرسالة ${color}`} onPress={() => setSelectedColor(color)} style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color && styles.colorSwatchSelected]} />)}</View><View style={styles.actionRow}><Pressable disabled={sending} onPress={() => void toggleRecording()} style={({ pressed }) => [styles.tool, recorderState.isRecording && styles.recording, sending && styles.disabled, pressed && styles.pressed]}><MaterialIcons name={recorderState.isRecording ? "stop" : "mic"} color={recorderState.isRecording ? "#FFFFFF" : buzzColors.ink} size={23} /></Pressable><Pressable disabled={sending} onPress={() => void chooseImage()} style={({ pressed }) => [styles.tool, sending && styles.disabled, pressed && styles.pressed]}><MaterialIcons name="attach-file" color={buzzColors.ink} size={23} /></Pressable><View style={styles.inputShell}><TextInput value={draft} onChangeText={setDraft} placeholder={recorderState.isRecording ? "جارٍ تسجيل بصمة صوتية..." : "الرسالة"} placeholderTextColor="#A5A5B5" style={styles.input} textAlign="right" multiline editable={!sending && !recorderState.isRecording} returnKeyType="default" /></View><Pressable disabled={!draft.trim() || sending || recorderState.isRecording} onPress={sendText} style={({ pressed }) => [styles.send, (!draft.trim() || sending || recorderState.isRecording) && styles.sendDisabled, pressed && styles.pressed]}>{sending ? <ActivityIndicator color="#FFFFFF" size="small" /> : <MaterialIcons name="send" color="#FFFFFF" size={21} />}</Pressable></View></View>;
  }

const styles = StyleSheet.create({ composer: { minHeight: 102, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#EDEDF3", paddingHorizontal: 12, paddingVertical: 8 }, colorRow: { height: 25, flexDirection: "row-reverse", alignItems: "center", justifyContent: "flex-start", gap: 9, paddingHorizontal: 3, marginBottom: 5 }, colorSwatch: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: "#FFFFFF" }, colorSwatchSelected: { width: 22, height: 22, borderRadius: 11, borderColor: "#111827" }, actionRow: { minHeight: 54, flexDirection: "row-reverse", alignItems: "flex-end", gap: 7 }, tool: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F5FA" }, recording: { backgroundColor: "#D65361" }, inputShell: { flex: 1, minHeight: 42, maxHeight: 98, backgroundColor: "#F5F5FA", borderRadius: 15, paddingHorizontal: 11, justifyContent: "center" }, input: { color: buzzColors.ink, fontSize: 14, minHeight: 39, maxHeight: 88, writingDirection: "rtl", paddingTop: 8, paddingBottom: 6 }, send: { width: 42, height: 42, borderRadius: 14, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" }, sendDisabled: { backgroundColor: "#C7C7D8" }, disabled: { opacity: 0.52 }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] } });
