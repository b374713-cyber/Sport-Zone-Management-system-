// app/gym/index.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

// ✅ USE EXACT FILENAMES YOU HAVE
import SubscriptionTab from "./subscriptionTab";
import WeeklyPlanTab from "./weeklyPlan";
import AiTab from "./aiPlan";
import NutritionTab from "./nutritionPlan";

export default function GymIndex() {
  const router = useRouter();

  const [tab, setTab] = useState<
    "subscription" | "weekly" | "ai" | "nutrition"
  >("subscription");

  return (
    <SafeAreaView style={styles.safe}>
      {/* ✅ Back button (no logout) */}
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.9}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.header}>🏋️ Gym</Text>

      {/* ✅ Tabs row */}
      <View style={styles.tabsWrap}>
        <TabButton
          title="Subscription"
          active={tab === "subscription"}
          onPress={() => setTab("subscription")}
        />
        <TabButton
          title="Weekly Plan"
          active={tab === "weekly"}
          onPress={() => setTab("weekly")}
        />
        <TabButton
          title="AI Plan"
          active={tab === "ai"}
          onPress={() => setTab("ai")}
        />
        <TabButton
          title="Nutrition"
          active={tab === "nutrition"}
          onPress={() => setTab("nutrition")}
        />
      </View>

      {/* ✅ Content (NO commas, NO stray text) */}
      <View style={styles.content}>
        {tab === "subscription" && <SubscriptionTab />}
        {tab === "weekly" && <WeeklyPlanTab />}
        {tab === "ai" && <AiTab />}
        {tab === "nutrition" && <NutritionTab />}
      </View>
    </SafeAreaView>
  );
}

function TabButton({ title, active, onPress }: any) {
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
    backgroundColor: "#F7F9FC",
    paddingTop: 8,
  },

  backBtn: {
    alignSelf: "flex-start",
    marginLeft: 12,
    marginTop: 6,
    backgroundColor: "#E9EEF5",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  backText: {
    fontWeight: "800",
    color: "#0a7ea4",
    fontSize: 13,
  },

  header: {
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
    color: "#0b1a2b",
  },

  tabsWrap: {
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#E9EEF5",
    borderRadius: 14,
    padding: 6,
    gap: 6,
    marginBottom: 10,
  },

  tabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 11,
  },

  tabBtnActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 2,
  },

  tabText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#667085",
  },

  tabTextActive: {
    color: "#0a7ea4",
  },

  content: {
    flex: 1,
  },
});
