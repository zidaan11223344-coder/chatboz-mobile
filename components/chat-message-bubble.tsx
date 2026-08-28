import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { buzzColors } from "@/components/buzz-ui";
import { getApiBaseUrl } from "@/constants/oauth";

export type RealChatMessage = { id: string; senderId: number; kind: "text" | "image" | "audio"; body: string | null; textColor: string | null; attachmentUrl: string | null; durationSeconds: number | null; createdAt: Date };

function toMediaUrl(url: string | null) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${getApiBaseUrl()}${url}`;
}

export function ChatMessageBubble({ message, mine }: { message: RealChatMessage; mine: boolean }) {
  const source = message.kind === "audio" ? toMediaUrl(message.attachmentUrl) : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const time = new Date(message.createdAt).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });

  return <View style={[styles.row, mine ? styles.mineRow : styles.otherRow]}><View style={[styles.bubble, mine ? styles.mineBubble : styles.otherBubble, message.kind === "image" && styles.imageBubble]}>{message.kind === "image" && message.attachmentUrl ? <Image source={{ uri: toMediaUrl(message.attachmentUrl) }} style={styles.image} /> : null}{message.kind === "audio" ? <Pressable onPress={() => { if (status.playing) player.pause(); else player.play(); }} style={styles.audio}><View style={[styles.play, mine && styles.minePlay]}><MaterialIcons name={status.playing ? "pause" : "play-arrow"} color={mine ? buzzColors.indigo : "#FFFFFF"} size={20} /></View><View style={styles.audioCopy}><Text style={[styles.audioTitle, mine && styles.mineText]}>بصمة صوتية</Text><Text style={[styles.audioTime, mine && styles.mineSubtext]}>{message.durationSeconds ?? 0} ث</Text></View><MaterialIcons name="graphic-eq" color={mine ? "#D7D6FF" : buzzColors.indigo} size={24} /></Pressable> : null}{message.kind === "text" ? <Text style={[styles.text, mine && styles.mineText, message.textColor ? { color: message.textColor } : null]}>{message.body}</Text> : null}<Text style={[styles.timestamp, mine && styles.mineSubtext]}>{time}</Text></View></View>;
}

const styles = StyleSheet.create({ row: { marginBottom: 9, flexDirection: "row" }, mineRow: { justifyContent: "flex-end" }, otherRow: { justifyContent: "flex-start" }, bubble: { maxWidth: "82%", minWidth: 84, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }, mineBubble: { backgroundColor: buzzColors.indigo, borderBottomRightRadius: 5 }, otherBubble: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 5, borderWidth: 1, borderColor: "#EDEDF4" }, imageBubble: { padding: 4, overflow: "hidden" }, image: { width: 208, height: 208, borderRadius: 14, resizeMode: "cover" }, text: { color: buzzColors.ink, fontSize: 14, lineHeight: 20, writingDirection: "rtl", textAlign: "right" }, mineText: { color: "#FFFFFF" }, timestamp: { color: "#9999A8", fontSize: 9, alignSelf: "flex-end", marginTop: 4 }, mineSubtext: { color: "#D7D6FF" }, audio: { minWidth: 190, flexDirection: "row-reverse", gap: 9, alignItems: "center" }, play: { width: 34, height: 34, borderRadius: 17, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" }, minePlay: { backgroundColor: "#FFFFFF" }, audioCopy: { flex: 1, alignItems: "flex-end" }, audioTitle: { color: buzzColors.ink, fontSize: 13, fontWeight: "800", writingDirection: "rtl" }, audioTime: { color: buzzColors.muted, fontSize: 10, marginTop: 2, writingDirection: "rtl" } });
