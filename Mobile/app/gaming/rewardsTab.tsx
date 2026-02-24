// app/gaming/rewardsTab.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video, ResizeMode } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { API_BASE } from "../config/api";

type PlayerRow = {
  player_id: number;
  player_name: string;
  member_id: number | null;
  total_points: number;
  total_hours: number;
};

type Summary = {
  totalSessions: number;
  totalHours: number;
  totalSpent: number;
};

export default function RewardsTab() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerRow | null>(null);

  // ✅ we use summary instead of history to avoid “all 0”
  const [summary, setSummary] = useState<Summary>({
    totalSessions: 0,
    totalHours: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const stored = await AsyncStorage.getItem("customer");
      const customer = stored ? JSON.parse(stored) : null;

      if (!customer) {
        setPlayer(null);
        setSummary({ totalSessions: 0, totalHours: 0, totalSpent: 0 });
        return;
      }

      // 1) load all players (this is where points come from)
      const playersRes = await fetch(`${API_BASE}/api/gaming/players`);
      const playersJson = await playersRes.json().catch(() => ({}));
      const players: PlayerRow[] = Array.isArray(playersJson.players)
        ? playersJson.players
        : [];

      // Try to match the logged-in customer to a player row
      const byMember =
        players.find(
          (p) =>
            p.member_id != null &&
            String(p.member_id) === String(customer.customer_id)
        ) || null;

      const lowerCustomerName = String(customer.name || "").trim().toLowerCase();
      const byName =
        players.find(
          (p) => String(p.player_name || "").trim().toLowerCase() === lowerCustomerName
        ) || null;

      const chosen = byMember || byName || null;
      setPlayer(chosen);

      if (!chosen) {
        setSummary({ totalSessions: 0, totalHours: 0, totalSpent: 0 });
        return;
      }

      // 2) load summary stats from backend (sessions/hours/spent)
      // Endpoint: GET /api/gaming/rewards/summary/:playerName
      const sumRes = await fetch(
        `${API_BASE}/api/gaming/rewards/summary/${encodeURIComponent(
          chosen.player_name
        )}`
      );

      const sumJson = await sumRes.json().catch(() => ({}));

      setSummary({
        totalSessions: Number(sumJson.total_sessions || 0),
        totalHours: Number(sumJson.total_hours || 0),
        totalSpent: Number(sumJson.total_spent || 0),
      });
    } catch (err: any) {
      console.log("Rewards load error:", err);
      Alert.alert("Error", err?.message || "Failed to load rewards data");
      setPlayer(null);
      setSummary({ totalSessions: 0, totalHours: 0, totalSpent: 0 });
    } finally {
      setLoading(false);
    }
  };

  const currentPoints = player ? Number(player.total_points || 0) : 0;
  const hoursTracked = player ? Number(player.total_hours || 0) : 0;

  const totalSessions = summary.totalSessions;
  const totalHours = summary.totalHours;
  const totalSpent = summary.totalSpent;

  const progressTo25 = Math.min(1, currentPoints / 25);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22d3ee" />
        <Text style={{ color: "#e5e7eb", marginTop: 8 }}>
          Loading your rewards...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
      style={{ flex: 1, backgroundColor: "#020617" }}
    >
      {/* HERO VIDEO */}
      <View style={styles.hero}>
        <Video
          source={require("../../assets/animations/gaming_contoller_and_pc.mp4")}
          style={styles.heroVideo}
          resizeMode={ResizeMode.COVER}
          isLooping
          isMuted
          shouldPlay
        />

        <LinearGradient
          colors={["rgba(2,6,23,0.15)", "rgba(2,6,23,0.85)"] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroOverlay}
        >
          <Text style={styles.heroTitle}>Rewards & Points</Text>
          <Text style={styles.heroSub}>
            Your gaming progress — hours, sessions & spending.
          </Text>
        </LinearGradient>
      </View>

      {/* Highlight card */}
      <View style={styles.highlightCard}>
        <View style={styles.highlightVideoWrap}>
          <Video
            source={require("../../assets/animations/gaming_contoller_num2.mp4")}
            style={styles.highlightVideo}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
        </View>

        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.highlightTitle}>Level Up</Text>
          <Text style={styles.highlightText}>
            Earn points automatically from your playtime and see your progress here.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎮 {currentPoints} pts</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⏱️ {totalHours.toFixed(1)} h</Text>
            </View>
          </View>
        </View>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatCard
          label="Total Hours"
          value={totalHours.toFixed(1)}
          highlight={`${hoursTracked.toFixed(1)} h tracked`}
        />
        <StatCard
          label="Sessions"
          value={String(totalSessions)}
          highlight="Completed"
        />
        <StatCard
          label="Money Spent"
          value={`${totalSpent.toFixed(2)} SAR`}
          highlight="All time"
        />
      </View>

      {/* POINTS CARD */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsTitle}>{player?.player_name || "Player"}</Text>

        <Text style={styles.pointsValue}>{currentPoints}</Text>
        <Text style={styles.pointsLabel}>Points</Text>

        <View style={styles.progressBarOuter}>
          <View
            style={[
              styles.progressBarInner,
              { width: `${Math.min(100, progressTo25 * 100)}%` },
            ]}
          />
        </View>

        <Text style={styles.pointsHint}>
          {currentPoints >= 25
            ? "You reached 25 points 🎉 (Spin is available on the web only)."
            : `Reach 25 points to unlock the monthly spin on the web. (${Math.max(
                0,
                25 - currentPoints
              )} more pts)`}
        </Text>

        {(totalSessions === 0 && totalHours === 0 && totalSpent === 0) && (
          <Text style={styles.noData}>
            No completed sessions yet. Start playing to see your stats!
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {highlight ? <Text style={styles.statHighlight}>{highlight}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  heroVideo: {
    width: "100%",
    height: 190,
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 12,
  },
  heroTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroSub: {
    color: "#e5e7eb",
    fontSize: 12,
    marginTop: 4,
  },

  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#22d3ee33",
  },
  highlightVideoWrap: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  highlightVideo: {
    width: "100%",
    height: "100%",
  },
  highlightTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
    fontSize: 14,
  },
  highlightText: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
  },
  badgeText: {
    color: "#cbd5f5",
    fontSize: 12,
    fontWeight: "800",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#020617",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  statLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
  },
  statValue: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  statHighlight: {
    color: "#38bdf8",
    fontSize: 11,
    marginTop: 4,
  },

  pointsCard: {
    marginTop: 4,
    backgroundColor: "#020617",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  pointsTitle: {
    color: "#e5e7eb",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  pointsValue: {
    color: "#22d3ee",
    fontSize: 30,
    fontWeight: "900",
  },
  pointsLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  progressBarOuter: {
    height: 7,
    borderRadius: 999,
    backgroundColor: "#0b1220",
    overflow: "hidden",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  progressBarInner: {
    height: "100%",
    backgroundColor: "#22d3ee",
  },
  pointsHint: {
    marginTop: 10,
    color: "#e5e7eb",
    fontSize: 12,
    lineHeight: 16,
  },
  noData: {
    marginTop: 10,
    color: "#94a3b8",
    fontSize: 12,
  },
});
