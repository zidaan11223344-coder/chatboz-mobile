import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image, Pressable, StyleSheet, Text, View, Animated, useColorScheme } from "react-native";

import { buzzColors } from "@/components/buzz-ui";
import { getApiBaseUrl } from "@/constants/oauth";

export type RealChatMessage = { id: string; senderId: number; senderName?: string | null; kind: "text" | "image" | "audio"; body: string | null; textColor: string | null; attachmentUrl: string | null; durationSeconds: number; createdAt: string };

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
  const sender = (message as any).senderName ?? (message as any).sender?.name ?? (message as any).displayName ?? "مستخدم";

  const mounted = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(mounted, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, []);

  const translateY = mounted.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const translateX = mounted.interpolate({ inputRange: [0, 1], outputRange: [mine ? 10 : -10, 0] });
  const opacity = mounted;

  return (
    <Animated.View style={[styles.row, mine ? styles.mineRow : styles.otherRow, { transform: [{ translateY }, { translateX }], opacity }]}>
      <View style={styles.meta}>
        <Text style={[styles.senderName, mine ? styles.senderMine : styles.senderOther]} numberOfLines={1}>{sender}</Text>
      </View>
      <Animated.View style={[styles.bubble, mine ? styles.mineBubble : styles.otherBubble, message.kind === "image" && styles.imageBubble]}>
        {message.kind === "text" && <Text style={[styles.body, message.textColor ? { color: message.textColor } : mine ? undefined : { color: "#111" }]}>{message.body}</Text>}
        {message.kind === "image" && message.attachmentUrl ? <Image source={{ uri: toMediaUrl(message.attachmentUrl) }} style={styles.image} /> : null}
        {message.kind === "audio" && (
          <Pressable onPress={() => player.playAsync?.()} style={styles.audioRow}>
            <MaterialIcons name={status?.isPlaying ? "pause" : "play-arrow"} size={18} color={mine ? "#FFFFFF" : buzzColors.indigo} />
            <Text style={[styles.audioLabel, mine ? { color: "#FFFFFF" } : undefined]}>{Math.max(0, Math.round(message.durationSeconds || 0))}s</Text>
          </Pressable>
        )}
        <Text style={[styles.time, mine ? { color: "rgba(255,255,255,0.85)" } : { color: "#9B9B9B" }]}>{time}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10, flexDirection: "row", alignItems: "flex-end" },
  mineRow: { justifyContent: "flex-end" },
  otherRow: { justifyContent: "flex-start" },
  meta: { maxWidth: "18%", alignItems: "flex-end", paddingHorizontal: 6 },
  senderName: { fontSize: 11, color: "#5A5A79", marginBottom: 2, writingDirection: "rtl" },
  senderMine: { textAlign: "right", color: "#DDEFF3" },
  senderOther: { textAlign: "left" },
  bubble: { maxWidth: "82%", minHeight: 36, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  mineBubble: { backgroundColor: buzzColors.indigo, alignSelf: "flex-end" },
  otherBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3" },
  imageBubble: { padding: 6 },
  body: { color: "#FFFFFF", fontSize: 15, lineHeight: 20 },
  image: { width: 180, height: 120, borderRadius: 12 },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  audioLabel: { marginLeft: 8 },
  time: { fontSize: 10, marginTop: 6, alignSelf: "flex-end" },
});
