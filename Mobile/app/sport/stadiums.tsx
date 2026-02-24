import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { API_BASE } from "../config/api";

//const API_BASE = "http://10.1.1.53:5000";
const STADIUMS_URL = `${API_BASE}/api/sports/stadiums`;

export default function StadiumsScreen() {
  const router = useRouter();
  const { sport_id, sport_name } = useLocalSearchParams();

  const [stadiums, setStadiums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStadiums();
  }, [sport_id]);

  const loadStadiums = async () => {
    try {
      setLoading(true);
      const res = await axios.get(STADIUMS_URL);
      const all = res.data.stadiums || [];

      const filtered = all.filter(
        (s: any) => String(s.sport_id) === String(sport_id)
      );

      setStadiums(filtered);
    } catch (err) {
      console.log("stadiums load error", err);
    } finally {
      setLoading(false);
    }
  };
const openStadium = (stadium: any) => {
  router.push({
    pathname: `/sport/stadium/${stadium.stadium_id}`,
    params: { stadium_name: stadium.stadium_name },
  } as any);
};



  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading stadiums...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
        {/* Title */}
        <Text style={{ fontSize: 24, fontWeight: "800", marginBottom: 10 }}>
          {sport_name || "Stadiums"}
        </Text>

        {/* Stadium cards */}
        {stadiums.map((st) => (
          <TouchableOpacity
            key={st.stadium_id}
            onPress={() => openStadium(st)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "white",
              padding: 16,
              borderRadius: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700" }}>
              {st.stadium_name}
            </Text>

            <Text style={{ color: "#666", marginTop: 4 }}>
              Price/hour: {st.price_per_hour} $
            </Text>

            <Text style={{ color: "#0a7ea4", marginTop: 6, fontWeight: "600" }}>
              View Schedule →
            </Text>
          </TouchableOpacity>
        ))}

        {/* Empty state */}
        {stadiums.length === 0 && (
          <Text style={{ color: "#888", marginTop: 20 }}>
            No stadiums found for this sport.
          </Text>
        )}
      </ScrollView>

      {/* Bottom Back Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 12,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#eee",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#f1f1f1",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700" }}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
