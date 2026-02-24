// app/gaming/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

import ReserveTab from "./reserveTab";
import MySessionsTab from "./mySessionsTab";

// Rewards tab (optional)
let RewardsTabComp: any = null;
try {
  RewardsTabComp = require("./rewardsTab").default;
} catch {
  RewardsTabComp = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ color: "white" }}>
        Rewards tab (optional) not added yet.
      </Text>
    </View>
  );
}

export default function GamingIndex() {
  const router = useRouter();
  const [tab, setTab] = useState<"reserve" | "sessions" | "rewards">("reserve");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.9}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>🎮 Gaming Zone</Text>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <TabButton
          title="Reserve"
          active={tab === "reserve"}
          onPress={() => setTab("reserve")}
        />
        <TabButton
          title="My Sessions"
          active={tab === "sessions"}
          onPress={() => setTab("sessions")}
        />
        <TabButton
          title="Rewards"
          active={tab === "rewards"}
          onPress={() => setTab("rewards")}
        />
      </View>

      {/* Content (SAFE RENDERING) */}
      <View style={styles.content}>
        {tab === "reserve" ? <ReserveTab /> : null}
        {tab === "sessions" ? <MySessionsTab /> : null}
        {tab === "rewards" ? <RewardsTabComp /> : null}
      </View>
    </SafeAreaView>
  );
}

function TabButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#05060A",
    paddingTop: 8,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginLeft: 12,
    marginTop: 6,
    backgroundColor: "#111827",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  backText: {
    fontWeight: "800",
    color: "#7dd3fc",
    fontSize: 13,
  },

  header: {
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
    color: "white",
    letterSpacing: 0.6,
  },

  tabsWrap: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 6,
    gap: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
  },

  tabBtnActive: {
    backgroundColor: "#111827",
    shadowColor: "#00f0ff",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#22d3ee",
  },

  tabText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#94a3b8",
  },

  tabTextActive: {
    color: "#22d3ee",
  },

  content: {
    flex: 1,
  },
});
