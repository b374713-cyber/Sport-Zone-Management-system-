import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import ProductsTab from "./productsTab";
import AITab from "./aiTab";
import MyReservedTab from "./myReservedTab";

type TabKey = "products" | "ai" | "reserved";

const THEMES = [
  ["#FDE68A", "#FDBA74", "#F59E0B"], // yellow → orange
  ["#FED7AA", "#FB923C", "#9A3412"], // peach → orange → brown
  ["#FFF7ED", "#FDBA74", "#C2410C"], // cream → orange → deep
  ["#FFEDD5", "#F59E0B", "#92400E"], // light → amber → brown
] as any;

export default function StoreIndex() {
  const [tab, setTab] = useState<TabKey>("products");

  const colors = useMemo(() => {
    if (tab === "ai") return THEMES[1];
    if (tab === "reserved") return THEMES[3];
    return THEMES[0];
  }, [tab]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.title}>Boutique Store</Text>
        <Text style={styles.sub}>
          Reserve clothes for <Text style={{ fontWeight: "900" }}>48h</Text> • Fee{" "}
          <Text style={{ fontWeight: "900" }}>$5</Text> per reservation
        </Text>

        <View style={styles.tabRow}>
          <TabButton label="Products" active={tab === "products"} onPress={() => setTab("products")} />
          <TabButton label="AI Suggestions" active={tab === "ai"} onPress={() => setTab("ai")} />
          <TabButton label="My Reserved" active={tab === "reserved"} onPress={() => setTab("reserved")} />
        </View>
      </LinearGradient>

      <View style={{ flex: 1 }}>
        {tab === "products" && <ProductsTab accentColors={THEMES[0]} />}
        {tab === "ai" && <AITab accentColors={THEMES[1]} />}
        {tab === "reserved" && <MyReservedTab accentColors={THEMES[3]} />}
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },

  header: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  title: {
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  sub: {
    color: "#374151",
    fontSize: 12,
    marginTop: 4,
  },

  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(0,0,0,0.12)",
  },
  tabText: {
    color: "#374151",
    fontWeight: "800",
    fontSize: 12,
  },
  tabTextActive: {
    color: "#111827",
    fontWeight: "900",
  },
});
