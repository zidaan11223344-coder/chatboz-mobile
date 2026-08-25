import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Avatar, GiftPicker, IconCircle, PointsPill, Tag, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { liveApi } from "@/lib/chat-buzz-api";
import { useChatBuzz } from "@/lib/chat-buzz-store";

const audience = [
  { name: "عمر", initials: "ع", tint: "#4F9CDC" },
  { name: "عبير", initials: "ع", tint: "#ED819C" },
  { name: "راكان", initials: "ر", tint: "#8A6BD1" },
  { name: "سارة", initials: "س", tint: "#4CAD87" },
  { name: "مازن", initials: "م", tint: "#C9824B" },
  { name: "شهد", initials: "ش", tint: "#CF70AB" },
];

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { rooms, profile, token, serverSettings } = useChatBuzz();
  const room = useMemo(() => rooms.find((item) => item.id === id) ?? rooms[0], [id, rooms]);
  const [raisedHand, setRaisedHand] = useState(false);
  const [muted, setMuted] = useState(true);
  const [giftsOpen, setGiftsOpen] = useState(false);

  useEffect(() => {
    if (!token || !serverSettings.apiBaseUrl || !room?.id) return;
    void liveApi.joinRoom(serverSettings.apiBaseUrl, token, room.id).catch(() => undefined);
    return () => { void liveApi.leaveRoom(serverSettings.apiBaseUrl, token, room.id).catch(() => undefined); };
  }, [token, serverSettings.apiBaseUrl, room?.id]);

  const toggleHand = () => {
    buzzHaptic();
    const next = !raisedHand;
    setRaisedHand(next);
    if (next) Alert.alert("تم رفع يدك", "سيظهر طلبك للمضيف. عند قبول الطلب تستطيع التحدث من الميكروفون الحقيقي بعد ربط السيرفر.");
  };

  if (!room) return null;
  return <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><View style={styles.page}>
    <View style={styles.topbar}><IconCircle icon="arrow-forward" label="العودة" onPress={() => router.back()} /><View style={styles.topMeta}><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>مباشر</Text></View><PointsPill points={profile.points} /></View></View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.roomHero, { backgroundColor: room.tint }]}><View style={styles.roomHeroCopy}><Text style={styles.roomTitle}>{room.title}</Text><Text style={styles.roomTopic}>{room.topic}</Text><View style={styles.hostLine}><Avatar initials={room.speakers[0]?.initials ?? "ل"} tint={room.speakers[0]?.tint ?? buzzColors.indigo} size={26} /><Text style={styles.hostText}>تقديم {room.host}</Text></View></View><View style={styles.audienceCount}><MaterialIcons name="headset-mic" size={20} color={buzzColors.indigo} /><Text style={styles.audienceNumber}>{room.audienceCount}</Text><Text style={styles.audienceLabel}>مستمع</Text></View></View>
      <View style={styles.stageHeader}><Text style={styles.stageTitle}>المسرح</Text><Text style={styles.stageHint}>اضغط على مقعد لمعرفة حالة المتحدث</Text></View>
      <View style={styles.seatGrid}>{room.speakers.map((speaker) => <Pressable key={speaker.id} onPress={() => Alert.alert(speaker.name, speaker.speaking ? "يتحدث الآن في الغرفة" : "ينتظر دوره للحديث")} style={({ pressed }) => [styles.seat, speaker.speaking && styles.activeSeat, pressed && styles.pressed]}><View style={speaker.speaking ? styles.speakingRing : undefined}><Avatar initials={speaker.initials} tint={speaker.tint} size={57} /></View><Text style={styles.speakerName}>{speaker.name}</Text><Text style={[styles.speakerStatus, speaker.speaking && styles.speakingStatus]}>{speaker.speaking ? "يتحدث الآن" : "متحدث"}</Text></Pressable>)}</View>
      <View style={styles.audienceHeader}><Text style={styles.stageTitle}>في الغرفة</Text><Tag color={buzzColors.green}>+ {room.audienceCount - room.speakers.length} مستمع</Tag></View>
      <View style={styles.audienceList}>{audience.map((person) => <View key={person.name} style={styles.audiencePerson}><Avatar initials={person.initials} tint={person.tint} size={38} /><Text style={styles.audienceName}>{person.name}</Text></View>)}</View>
      <View style={styles.quickChat}><View style={styles.quickChatHead}><Text style={styles.quickChatTitle}>دردشة الغرفة</Text><Text style={styles.quickChatCount}>12 رسالة جديدة</Text></View><Text style={styles.quickChatMessage}><Text style={styles.quickChatName}>نور: </Text>الجو في الغرفة لطيف جداً، استمروا!</Text><Pressable onPress={() => { buzzHaptic(); Alert.alert("دردشة الغرفة", "ستتصل هذه الدردشة بالسيرفر عند إعداد API الخاص بك."); }} style={({ pressed }) => [styles.openChat, pressed && styles.pressed]}><Text style={styles.openChatText}>فتح الدردشة</Text><MaterialIcons name="chat-bubble-outline" size={18} color={buzzColors.indigo} /></Pressable></View>
    </ScrollView>
    <View style={styles.controls}><Pressable onPress={() => { buzzHaptic(); setGiftsOpen(true); }} style={({ pressed }) => [styles.smallControl, pressed && styles.pressed]}><MaterialIcons name="redeem" size={22} color={buzzColors.coral} /><Text style={styles.controlCaption}>هدية</Text></Pressable><Pressable onPress={toggleHand} style={({ pressed }) => [styles.handControl, raisedHand && styles.handControlActive, pressed && styles.pressed]}><MaterialIcons name={raisedHand ? "back-hand" : "front-hand"} size={23} color={raisedHand ? "#FFFFFF" : buzzColors.indigo} /><Text style={[styles.handText, raisedHand && styles.handTextActive]}>{raisedHand ? "تم رفع اليد" : "رفع اليد"}</Text></Pressable><Pressable onPress={() => { buzzHaptic(); setMuted((current) => !current); }} style={({ pressed }) => [styles.micControl, !muted && styles.micControlActive, pressed && styles.pressed]}><MaterialIcons name={muted ? "mic-off" : "mic"} size={24} color={muted ? buzzColors.indigo : "#FFFFFF"} /></Pressable><Pressable onPress={() => { buzzHaptic(); router.back(); }} style={({ pressed }) => [styles.leaveControl, pressed && styles.pressed]}><MaterialIcons name="logout" size={22} color="#CF4056" /></Pressable></View>
    <GiftPicker visible={giftsOpen} onClose={() => setGiftsOpen(false)} conversationId={`room-${room.id}`} recipient={room.host} recipientId={room.speakers[0]?.id} roomId={room.id} />
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topbar: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 10, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  topMeta: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  livePill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 15, backgroundColor: "#E8FAF3" },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: buzzColors.green },
  liveText: { color: buzzColors.green, fontSize: 11, fontWeight: "900", writingDirection: "rtl" },
  scroll: { paddingHorizontal: 18, paddingBottom: 104 },
  roomHero: { minHeight: 136, borderRadius: 23, padding: 18, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  roomHeroCopy: { alignItems: "flex-end", flex: 1, paddingLeft: 12 },
  roomTitle: { color: buzzColors.ink, fontSize: 21, fontWeight: "900", lineHeight: 29, writingDirection: "rtl", textAlign: "right" },
  roomTopic: { color: buzzColors.muted, fontSize: 12, lineHeight: 18, marginTop: 3, writingDirection: "rtl", textAlign: "right" },
  hostLine: { flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 11 },
  hostText: { color: buzzColors.ink, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  audienceCount: { width: 78, height: 78, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.75)", alignItems: "center", justifyContent: "center" },
  audienceNumber: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", marginTop: 1 },
  audienceLabel: { color: buzzColors.muted, fontSize: 10, writingDirection: "rtl" },
  stageHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 23, marginBottom: 11 },
  stageTitle: { color: buzzColors.ink, fontSize: 18, fontWeight: "900", writingDirection: "rtl" },
  stageHint: { color: buzzColors.muted, fontSize: 11, writingDirection: "rtl" },
  seatGrid: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  seat: { width: "48%", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3", borderRadius: 20, paddingVertical: 13 },
  activeSeat: { borderColor: "#B9B8FF", backgroundColor: "#FAFAFF" },
  speakingRing: { borderWidth: 3, borderColor: "#8E8DFF", borderRadius: 35, padding: 3 },
  speakerName: { color: buzzColors.ink, fontSize: 14, fontWeight: "800", marginTop: 7, writingDirection: "rtl" },
  speakerStatus: { color: buzzColors.muted, fontSize: 10, marginTop: 2, writingDirection: "rtl" },
  speakingStatus: { color: buzzColors.indigo, fontWeight: "800" },
  audienceHeader: { marginTop: 25, marginBottom: 11, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  audienceList: { flexDirection: "row-reverse", justifyContent: "space-between", backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 12, borderWidth: 1, borderColor: "#ECECF3" },
  audiencePerson: { alignItems: "center", width: 44 },
  audienceName: { color: buzzColors.muted, fontSize: 10, marginTop: 5, writingDirection: "rtl" },
  quickChat: { marginTop: 20, borderRadius: 20, padding: 15, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECECF3" },
  quickChatHead: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  quickChatTitle: { color: buzzColors.ink, fontSize: 15, fontWeight: "900", writingDirection: "rtl" },
  quickChatCount: { color: buzzColors.muted, fontSize: 10, writingDirection: "rtl" },
  quickChatMessage: { color: buzzColors.muted, fontSize: 12, lineHeight: 19, writingDirection: "rtl", textAlign: "right", marginTop: 9 },
  quickChatName: { color: buzzColors.indigo, fontWeight: "800" },
  openChat: { marginTop: 12, flexDirection: "row-reverse", gap: 6, alignSelf: "flex-end", alignItems: "center" },
  openChatText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  controls: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#ECECF3", paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  smallControl: { width: 47, height: 51, justifyContent: "center", alignItems: "center", borderRadius: 15, backgroundColor: "#FFF1ED" },
  controlCaption: { color: buzzColors.coral, fontSize: 9, marginTop: 2, fontWeight: "800", writingDirection: "rtl" },
  handControl: { height: 51, paddingHorizontal: 15, borderRadius: 15, backgroundColor: "#EFEEFF", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6, flex: 1 },
  handControlActive: { backgroundColor: buzzColors.indigo },
  handText: { color: buzzColors.indigo, fontSize: 13, fontWeight: "900", writingDirection: "rtl" },
  handTextActive: { color: "#FFFFFF" },
  micControl: { width: 51, height: 51, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#EFEEFF" },
  micControlActive: { backgroundColor: buzzColors.indigo },
  leaveControl: { width: 45, height: 51, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F2" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
