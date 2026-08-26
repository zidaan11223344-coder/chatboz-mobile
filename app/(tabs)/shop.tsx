import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { buzzColors } from "@/components/buzz-ui";

export default function ShopScreen() {
  return <ScreenContainer edges={["top", "left", "right"]}><View style={styles.page}><Text style={styles.heading}>المتجر</Text><View style={styles.empty}><View style={styles.icon}><MaterialIcons name="storefront" size={34} color={buzzColors.indigo} /></View><Text style={styles.title}>لا توجد عناصر في المتجر بعد</Text><Text style={styles.copy}>ستظهر هنا العناصر التي يضيفها مالك التطبيق، من دون عناصر أو أسعار تجريبية.</Text></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({ page: { flex: 1, paddingHorizontal: 18, paddingTop: 10 }, heading: { color: buzzColors.ink, fontSize: 29, fontWeight: "900", writingDirection: "rtl", textAlign: "right" }, empty: { alignItems: "center", paddingTop: 105, paddingHorizontal: 30 }, icon: { width: 76, height: 76, borderRadius: 28, backgroundColor: "#EFEEFF", alignItems: "center", justifyContent: "center" }, title: { color: buzzColors.ink, fontSize: 20, fontWeight: "900", marginTop: 16, writingDirection: "rtl", textAlign: "center" }, copy: { color: buzzColors.muted, fontSize: 13, lineHeight: 22, marginTop: 7, writingDirection: "rtl", textAlign: "center" } });
