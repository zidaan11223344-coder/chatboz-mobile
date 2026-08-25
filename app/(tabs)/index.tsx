import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Avatar, IconCircle, PointsPill, SectionTitle, Tag, buzzColors, buzzHaptic } from "@/components/buzz-ui";
import { ScreenContainer } from "@/components/screen-container";
import { type Room, useChatBuzz } from "@/lib/chat-buzz-store";

const categories = ["الكل", "اجتماعي", "ألعاب", "موسيقى", "ثقافة"];

function RoomCard({ room }: { room: Room }) {
  return (
    <Pressable onPress={() => { buzzHaptic(); router.push(`/room/${room.id}`); }} style={({ pressed }) => [styles.roomCard, { backgroundColor: room.tint }, pressed && styles.pressed]}>
      <View style={styles.roomTop}><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>مباشر</Text></View><View style={styles.peopleCount}><MaterialIcons name="headset-mic" color={buzzColors.muted} size={16} /><Text style={styles.peopleText}>{room.audienceCount}</Text></View></View>
      <Text numberOfLines={1} style={styles.roomTitle}>{room.title}</Text>
      <Text numberOfLines={1} style={styles.roomTopic}>{room.topic}</Text>
      <View style={styles.speakerRow}>
        <View style={styles.avatarStack}>{room.speakers.slice(0, 4).map((speaker, index) => <View key={speaker.id} style={{ marginRight: index === 0 ? 0 : -10 }}><Avatar initials={speaker.initials} tint={speaker.tint} size={31} /></View>)}</View>
        <View style={styles.hostRow}><Text style={styles.hostText}>إدارة {room.host}</Text><MaterialIcons name="chevron-left" color={buzzColors.indigo} size={19} /></View>
      </View>
    </Pressable>
  );
}

export default function RoomsScreen() {
  const { rooms, profile } = useChatBuzz();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const filteredRooms = useMemo(() => rooms.filter((room) => (activeCategory === "الكل" || room.tags.includes(activeCategory)) && `${room.title} ${room.topic}`.includes(query.trim())), [rooms, query, activeCategory]);

  return (
    <ScreenContainer edges={["top", "left", "right"]} containerClassName="bg-background">
      <FlatList data={filteredRooms} keyExtractor={(item) => item.id} renderItem={({ item }) => <RoomCard room={item} />} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} ListHeaderComponent={<>
        <View style={styles.header}><View style={styles.brandBlock}><View style={styles.brandMark}><MaterialIcons name="record-voice-over" size={22} color="#FFFFFF" /></View><View><Text style={styles.brandName}>شات باز</Text><Text style={styles.brandSub}>صوتك.. مكانه هنا</Text></View></View><View style={styles.headerActions}><PointsPill points={profile.points} /><IconCircle icon="notifications-none" label="التنبيهات" /></View></View>
        <View style={styles.hero}><View style={styles.heroTextWrap}><Text style={styles.heroEyebrow}>اكتشف الآن</Text><Text style={styles.heroTitle}>تحدث، استمع، وتعرّف على ناس يشبهونك.</Text><Pressable onPress={() => { buzzHaptic(); router.push("/room/midnight"); }} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}><Text style={styles.heroButtonText}>انضم إلى غرفة حية</Text><MaterialIcons name="arrow-back" color="#FFFFFF" size={18} /></Pressable></View><View style={styles.heroArt}><View style={styles.heroBubbleLarge}><MaterialIcons name="graphic-eq" color="#FFFFFF" size={35} /></View><View style={styles.heroBubbleSmall}><MaterialIcons name="mic" color={buzzColors.indigo} size={18} /></View></View></View>
        <View style={styles.search}><MaterialIcons name="search" color="#A4A4B4" size={22} /><TextInput value={query} onChangeText={setQuery} placeholder="ابحث عن غرفة أو موضوع" placeholderTextColor="#A4A4B4" style={styles.searchInput} textAlign="right" returnKeyType="search" /></View>
        <SectionTitle title="الغرف المباشرة" action="عرض الكل" />
        <View style={styles.categoryRow}>{categories.map((category) => <Pressable key={category} onPress={() => { buzzHaptic(); setActiveCategory(category); }} style={({ pressed }) => [styles.category, activeCategory === category && styles.categoryActive, pressed && styles.pressed]}><Text style={[styles.categoryText, activeCategory === category && styles.categoryTextActive]}>{category}</Text></Pressable>)}</View>
      </>} ListEmptyComponent={<View style={styles.empty}><MaterialIcons name="search-off" color="#A4A4B4" size={38} /><Text style={styles.emptyText}>لا توجد غرف مطابقة لبحثك</Text></View>} ListFooterComponent={<View style={styles.footer}><Text style={styles.footerText}>غرف جديدة تُفتح باستمرار في شات بوز</Text><Tag color={buzzColors.coral}>+ إنشاء غرفة قريباً</Tag></View>} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: 18, paddingBottom: 26 },
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingTop: 8, marginBottom: 22 },
  brandBlock: { flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  brandMark: { width: 41, height: 41, borderRadius: 14, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center", shadowColor: buzzColors.indigo, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 },
  brandName: { color: buzzColors.ink, fontSize: 19, fontWeight: "900", writingDirection: "rtl", textAlign: "right" },
  brandSub: { color: buzzColors.muted, fontSize: 11, marginTop: 1, writingDirection: "rtl", textAlign: "right" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  hero: { minHeight: 171, borderRadius: 25, backgroundColor: buzzColors.indigo, overflow: "hidden", padding: 20, flexDirection: "row-reverse", justifyContent: "space-between", shadowColor: buzzColors.indigo, shadowOpacity: 0.16, shadowRadius: 15, elevation: 4 },
  heroTextWrap: { width: "68%", zIndex: 2, alignItems: "flex-end" },
  heroEyebrow: { color: "#DAD9FF", fontSize: 12, fontWeight: "700", writingDirection: "rtl", textAlign: "right" },
  heroTitle: { color: "#FFFFFF", fontSize: 20, lineHeight: 29, fontWeight: "900", writingDirection: "rtl", textAlign: "right", marginTop: 4 },
  heroButton: { marginTop: 13, backgroundColor: "rgba(255,255,255,0.19)", minHeight: 35, borderRadius: 11, paddingHorizontal: 11, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 5 },
  heroButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  heroArt: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroBubbleLarge: { width: 71, height: 71, borderRadius: 26, backgroundColor: "#7777F0", alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  heroBubbleSmall: { width: 36, height: 36, borderRadius: 13, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginTop: -12, marginRight: 36 },
  search: { marginTop: 19, height: 50, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: buzzColors.border, flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 14, gap: 7 },
  searchInput: { color: buzzColors.ink, fontSize: 14, flex: 1, writingDirection: "rtl" },
  categoryRow: { flexDirection: "row-reverse", gap: 7, marginBottom: 14 },
  category: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: buzzColors.border },
  categoryActive: { backgroundColor: buzzColors.indigo, borderColor: buzzColors.indigo },
  categoryText: { color: buzzColors.muted, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  categoryTextActive: { color: "#FFFFFF" },
  roomCard: { borderRadius: 21, padding: 16, marginBottom: 12, minHeight: 153 },
  roomTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  livePill: { backgroundColor: "rgba(24,168,115,0.13)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: buzzColors.green },
  liveText: { color: buzzColors.green, fontSize: 10, fontWeight: "900", writingDirection: "rtl" },
  peopleCount: { flexDirection: "row-reverse", alignItems: "center", gap: 4 },
  peopleText: { color: buzzColors.muted, fontSize: 12, fontWeight: "700" },
  roomTitle: { color: buzzColors.ink, fontSize: 17, lineHeight: 24, fontWeight: "900", writingDirection: "rtl", textAlign: "right" },
  roomTopic: { color: buzzColors.muted, fontSize: 13, lineHeight: 19, writingDirection: "rtl", textAlign: "right", marginTop: 3 },
  speakerRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 15 },
  avatarStack: { flexDirection: "row-reverse", alignItems: "center" },
  hostRow: { flexDirection: "row-reverse", alignItems: "center" },
  hostText: { color: buzzColors.indigo, fontSize: 12, fontWeight: "800", writingDirection: "rtl" },
  footer: { paddingVertical: 14, alignItems: "center", gap: 9 },
  footerText: { color: buzzColors.muted, fontSize: 12, writingDirection: "rtl" },
  empty: { height: 190, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyText: { color: buzzColors.muted, fontSize: 14, writingDirection: "rtl" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
