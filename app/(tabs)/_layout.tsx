import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { buzzColors } from "@/components/buzz-ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const tabBarHeight = 61 + bottomPadding;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: buzzColors.indigo, tabBarInactiveTintColor: "#A0A0B1", tabBarButton: HapticTab, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" }, tabBarStyle: { height: tabBarHeight, paddingTop: 8, paddingBottom: bottomPadding, backgroundColor: "#FFFFFF", borderTopColor: "#EBEBF2", borderTopWidth: 1 } }}>
      <Tabs.Screen name="index" options={{ title: "الغرف", tabBarIcon: ({ color, size }) => <MaterialIcons name="hub" size={size} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: "الدردشات", tabBarIcon: ({ color, size }) => <MaterialIcons name="chat-bubble-outline" size={size - 1} color={color} /> }} />
      <Tabs.Screen name="friends" options={{ title: "الأصدقاء", tabBarIcon: ({ color, size }) => <MaterialIcons name="group" size={size} color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: "المتجر", tabBarIcon: ({ color, size }) => <MaterialIcons name="storefront" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
