import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

import { ScreenContainer } from "@/components/screen-container";
import { IconCircle, buzzColors } from "@/components/buzz-ui";

export default function LudoScreen() {
  // quick WebView integration for Ludo game; replace URL if you have a preferred hosted game
  const url = "https://www.ludo-online.org/";

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <IconCircle icon="arrow-forward" onPress={() => { /* navigation handled by router in parent */ }} />
        <Text style={styles.title}>لعبة لودو</Text>
        <View style={{ width: 42 }} />
      </View>
      <View style={styles.container}>
        <WebView source={{ uri: url }} style={styles.webview} startInLoadingState />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12 },
  title: { color: buzzColors.ink, fontSize: 18, fontWeight: "900" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  webview: { flex: 1 },
});
