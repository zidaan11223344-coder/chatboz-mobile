import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { type ReactNode, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { type Gift, useChatBuzz } from "@/lib/chat-buzz-store";

export const buzzColors = {
  indigo: "#5B5CE2",
  coral: "#FF7A59",
  ink: "#17172A",
  muted: "#78788C",
  canvas: "#F7F7FC",
  border: "#E7E7F0",
  green: "#18A873",
};

export function buzzHaptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function Avatar({ initials, tint, size = 44, live = false }: { initials: string; tint: string; size?: number; live?: boolean }) {
  return (
    <View style={[styles.avatarOuter, { width: size, height: size, borderRadius: size / 2, backgroundColor: live ? "#E8FAF3" : "transparent" }]}>
      <View style={[styles.avatar, { width: size - (live ? 6 : 0), height: size - (live ? 6 : 0), borderRadius: (size - (live ? 6 : 0)) / 2, backgroundColor: tint }]}>
        <Text style={[styles.avatarText, { fontSize: Math.max(14, size * 0.38) }]}>{initials}</Text>
      </View>
      {live ? <View style={styles.onlineDot} /> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={() => { buzzHaptic(); onAction?.(); }} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}><Text style={styles.linkText}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function IconCircle({ icon, tint = buzzColors.indigo, onPress, label }: { icon: keyof typeof MaterialIcons.glyphMap; tint?: string; onPress?: () => void; label?: string }) {
  return (
    <Pressable accessibilityLabel={label} onPress={() => { buzzHaptic(); onPress?.(); }} style={({ pressed }) => [styles.iconCircle, pressed && styles.pressed]}>
      <MaterialIcons name={icon} size={22} color={tint} />
    </Pressable>
  );
}

export function Tag({ children, color = buzzColors.indigo }: { children: ReactNode; color?: string }) {
  return <View style={[styles.tag, { backgroundColor: `${color}14` }]}><Text style={[styles.tagText, { color }]}>{children}</Text></View>;
}

export function PointsPill({ points }: { points: number }) {
  return <View style={styles.pointsPill}><MaterialIcons name="diamond" size={16} color="#E59E16" /><Text style={styles.pointsText}>{points.toLocaleString("en-US")}</Text></View>;
}

export function GiftPicker({ visible, onClose, conversationId, recipient, recipientId, roomId }: { visible: boolean; onClose: () => void; conversationId: string; recipient: string; recipientId?: string; roomId?: string }) {
  const { gifts, profile, sendGift } = useChatBuzz();
  const [selected, setSelected] = useState<Gift | null>(gifts[0] ?? null);
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    if (!selected || busy) return;
    setBusy(true);
    const sent = await sendGift(conversationId, selected, recipientId, roomId);
    setBusy(false);
    if (!sent) {
      Alert.alert("تعذر إرسال الهدية", "تحقق من رصيد النقاط واتصال الخادم، ثم حاول مرة أخرى.");
      return;
    }
    buzzHaptic();
    Alert.alert("تم الإرسال", `أرسلت ${selected.emoji} ${selected.title} إلى ${recipient}.`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.giftSheet}>
        <View style={styles.sheetHandle} />
        <View style={styles.giftHeader}><View><Text style={styles.sheetTitle}>أرسل هدية</Text><Text style={styles.sheetSub}>إلى {recipient}</Text></View><PointsPill points={profile.points} /></View>
        <View style={styles.giftGrid}>
          {gifts.map((gift) => {
            const isSelected = selected?.id === gift.id;
            return <Pressable key={gift.id} onPress={() => { buzzHaptic(); setSelected(gift); }} style={({ pressed }) => [styles.giftCell, { backgroundColor: gift.tint, borderColor: isSelected ? buzzColors.indigo : "transparent" }, pressed && styles.pressed]}><Text style={styles.giftEmoji}>{gift.emoji}</Text><Text style={styles.giftName}>{gift.title}</Text><Text style={styles.giftPrice}>{gift.price}</Text></Pressable>;
          })}
        </View>
        <Pressable disabled={busy} onPress={handleSend} style={({ pressed }) => [styles.primaryButton, busy && { opacity: 0.6 }, pressed && styles.pressed]}><MaterialIcons name="send" size={19} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{busy ? "جارٍ الإرسال..." : "إرسال الهدية"}</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatarOuter: { alignItems: "center", justifyContent: "center", position: "relative" },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "800", writingDirection: "rtl" },
  onlineDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: buzzColors.green, borderWidth: 2, borderColor: "#FFFFFF", position: "absolute", right: 0, bottom: 1 },
  sectionTitleRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 25, marginBottom: 12 },
  sectionTitle: { color: buzzColors.ink, fontSize: 19, lineHeight: 26, fontWeight: "800", writingDirection: "rtl" },
  linkButton: { paddingVertical: 5, paddingHorizontal: 1 },
  linkText: { color: buzzColors.indigo, fontSize: 14, fontWeight: "700", writingDirection: "rtl" },
  iconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: buzzColors.border, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagText: { fontSize: 12, lineHeight: 16, fontWeight: "700", writingDirection: "rtl" },
  pointsPill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EDE4C8", paddingHorizontal: 10, height: 33, borderRadius: 17 },
  pointsText: { color: "#705622", fontSize: 13, fontWeight: "800" },
  backdrop: { flex: 1, backgroundColor: "rgba(23,23,42,0.35)" },
  giftSheet: { backgroundColor: "#FFFFFF", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetHandle: { alignSelf: "center", height: 5, width: 42, borderRadius: 9, backgroundColor: "#D9D9E5", marginBottom: 17 },
  giftHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 17 },
  sheetTitle: { color: buzzColors.ink, fontSize: 20, lineHeight: 27, fontWeight: "800", textAlign: "right", writingDirection: "rtl" },
  sheetSub: { color: buzzColors.muted, fontSize: 13, marginTop: 2, writingDirection: "rtl", textAlign: "right" },
  giftGrid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginBottom: 20 },
  giftCell: { width: "31%", minHeight: 104, borderRadius: 17, borderWidth: 2, alignItems: "center", justifyContent: "center", gap: 3 },
  giftEmoji: { fontSize: 31 },
  giftName: { color: buzzColors.ink, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  giftPrice: { color: buzzColors.muted, fontSize: 12, fontWeight: "700" },
  primaryButton: { height: 52, borderRadius: 16, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", writingDirection: "rtl" },
});
