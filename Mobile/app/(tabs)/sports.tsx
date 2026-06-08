import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { Image } from "expo-image";

//const API_BASE = "http://10.1.1.53:5000";
import { API_BASE } from "../config/api";

//const API_BASE = "http://172.20.10.9:5000";

const API_URL = `${API_BASE}/api/sports/sports`;

const sportMedia: Record<string, any> = {
  Football: require("../../assets/animations/ftb_ball.gif"),
  Basketball: require("../../assets/animations/basketball.gif"),
  Tennis: require("../../assets/animations/tennis.gif"),
  Pedalo: require("../../assets/animations/pedalo.gif"),
  Padel: require("../../assets/animations/pedalo.gif"),
};

const sportColors: Record<string, string> = {
  Football: "#0a7ea4",
  Basketball: "#ff7a00",
  Tennis: "#21b66f",
  Pedalo: "#8b5cf6",
  Padel: "#8b5cf6",
};

export default function SportsTab() {
  const router = useRouter();
  const [sports, setSports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      const res = await axios.get(API_URL);
      setSports(res.data.sports || []);
    } catch (err) {
      console.log("sports load error", err);
    } finally {
      setLoading(false);
    }
  };

  const openSport = (sport: any) => {
    router.push({
      pathname: "/sport/stadiums",
      params: { sport_id: sport.sport_id, sport_name: sport.sport_name },
    } as any);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading sports...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {/* Big Header */}
      <View
        style={{
          backgroundColor: "#111827",
          borderRadius: 20,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "white", fontSize: 26, fontWeight: "900" }}>
          Reserve a Match
        </Text>
        <Text style={{ color: "#cbd5e1", marginTop: 6, fontSize: 14 }}>
          Choose a sport, pick a stadium, and book your slot.
        </Text>
      </View>

      {/* Sport Cards */}
      {sports.map((sport) => {
        const media = sportMedia[sport.sport_name];
        const color = sportColors[sport.sport_name] || "#0a7ea4";

        return (
          <TouchableOpacity
            key={sport.sport_id}
            onPress={() => openSport(sport)}
            activeOpacity={0.9}
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 14,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderLeftWidth: 6,
              borderLeftColor: color,
            }}
          >
            {/* GIF Box */}
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 14,
                backgroundColor: "#0f172a",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
                overflow: "hidden",
              }}
            >
              {media && (
                <Image
                  source={media}
                  style={{ width: 90, height: 90 }}
                  contentFit="contain"
                />
              )}
            </View>

            {/* Text */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "800" }}>
                {sport.sport_name}
              </Text>
              <Text style={{ color: "#64748b", marginTop: 4 }}>
                View stadiums • Check schedule
              </Text>

              <View
                style={{
                  marginTop: 8,
                  backgroundColor: color,
                  alignSelf: "flex-start",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  Reserve Now
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 22, color }}>›</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
