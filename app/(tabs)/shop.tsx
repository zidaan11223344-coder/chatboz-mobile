import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";
import { useLocalAuth } from "@/hooks/use-local-auth";
import { trpc } from "@/lib/trpc";

export default function ShopScreen() {
  const { user, isAuthenticated, updateUser } = useLocalAuth();
  const products = trpc.social.store.products.useQuery(undefined, { enabled: isAuthenticated });
  const owned = trpc.social.store.owned.useQuery(undefined, { enabled: isAuthenticated });
  const purchase = trpc.social.store.purchase.useMutation();

  const buy = async (productId: string) => {
    try {
      const result = await purchase.mutateAsync({ productId });
      await updateUser({ points: result.points });
      await owned.refetch();
      Alert.alert("تم الشراء", "تمت إضافة اللون إلى حسابك لمدة 30 يومًا.");
    } catch (error) {
      Alert.alert("تعذر الشراء", error instanceof Error ? error.message : "تحقق من رصيد النقاط وحاول مرة أخرى.");
    }
  };

  if (!isAuthenticated) return <ScreenContainer className="items-center justify-center px-6"><MaterialIcons name="lock-outline" color={buzzColors.indigo} size={42} /><Text style={styles.emptyTitle}>سجّل الدخول أولًا</Text><Text style={styles.emptyCopy}>يظهر المتجر ورصيد النقاط للحسابات الحقيقية فقط.</Text><Pressable onPress={() => router.push("/login")} style={styles.primary}><Text style={styles.primaryText}>تسجيل الدخول</Text></Pressable></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right"]}><FlatList data={products.data ?? []} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListHeaderComponent={<><View style={styles.header}><Text style={styles.heading}>المتجر</Text><MaterialIcons name="storefront" color={buzzColors.indigo} size={27} /></View><View style={styles.balance}><Text style={styles.balanceValue}>{user?.points ?? 0} TCoins</Text><Text style={styles.balanceLabel}>الرصيد الحالي</Text></View><View style={styles.monthRow}><View style={styles.monthCard}><Text style={styles.monthValue}>{owned.data?.length ?? 0}</Text><Text style={styles.monthLabel}>ألوان مملوكة</Text></View><View style={styles.monthCard}><Text style={styles.monthValue}>30</Text><Text style={styles.monthLabel}>صلاحية الأيام</Text></View></View><Text style={styles.sectionTitle}>ألوان الكتابة داخل الغرف</Text></>} renderItem={({ item }) => { const ownedItem = owned.data?.some(({ product }) => product.id === item.id); return <View style={styles.product}><View style={[styles.colorBlock, { backgroundColor: item.colorHex }]} /><View style={styles.productCopy}><Text style={[styles.productCode, { color: item.colorHex }] }>{item.code}</Text><Text style={styles.productLabel}>{item.pointsCost} TCoins · صلاحية: {item.validityDays} يوم</Text></View><Pressable disabled={ownedItem || purchase.isPending} onPress={() => void buy(item.id)} style={({ pressed }) => [styles.buy, ownedItem && styles.owned, pressed && styles.pressed]}><Text style={[styles.buyText, ownedItem && styles.ownedText]}>{ownedItem ? "مملوك" : "+"}</Text></Pressable></View>; }} ListEmptyComponent={products.isLoading ? <ActivityIndicator color={buzzColors.indigo} style={{ marginTop: 50 }} /> : <View style={styles.empty}><Text style={styles.emptyTitle}>المتجر غير متاح</Text><Text style={styles.emptyCopy}>سيتم عرض المنتجات التي يضيفها المدير.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 17, paddingBottom: 35 },
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingTop: 7, marginBottom: 15 },
  heading: { color: buzzColors.ink, fontSize: 30, fontWeight: "900", writingDirection: "rtl" },
  balance: { backgroundColor: "#5A7882", borderRadius: 15, paddingVertical: 20, alignItems: "center" },
  balanceValue: { color: "#FFFFFF", fontSize: 35, fontWeight: "900" },
  balanceLabel: { color: "#E7F0F2", fontSize: 18, marginTop: 4, writingDirection: "rtl" },
  monthRow: { flexDirection: "row-reverse", gap: 10, marginTop: 14 },
  monthCard: { flex: 1, backgroundColor: "#DCE4E7", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  monthValue: { color: "#111827", fontSize: 23, fontWeight: "900" },
  monthLabel: { color: "#111827", fontSize: 12, marginTop: 3, writingDirection: "rtl" },
  sectionTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", textAlign: "right", marginTop: 21, marginBottom: 7, writingDirection: "rtl" },
  product: { minHeight: 79, flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: "#F7F4FA", borderBottomWidth: 1, borderBottomColor: "#E8E2EC", paddingHorizontal: 8 },
  colorBlock: { width: 49, height: 49, borderRadius: 3 },
  productCopy: { flex: 1, alignItems: "flex-end" },
  productCode: { fontSize: 20, fontWeight: "900" },
  productLabel: { color: "#31313B", fontSize: 13, marginTop: 4 },
  buy: { width: 35, height: 35, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  buyText: { color: "#30303A", fontSize: 29, lineHeight: 31 },
  owned: { backgroundColor: "#DDEFE7" },
  ownedText: { color: buzzColors.green, fontSize: 10, fontWeight: "900" },
  empty: { alignItems: "center", paddingTop: 70 },
  emptyTitle: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", marginTop: 14, textAlign: "center", writingDirection: "rtl" },
  emptyCopy: { color: buzzColors.muted, fontSize: 13, lineHeight: 22, marginTop: 7, textAlign: "center", writingDirection: "rtl" },
  primary: { marginTop: 18, height: 49, paddingHorizontal: 20, borderRadius: 16, backgroundColor: buzzColors.indigo, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
