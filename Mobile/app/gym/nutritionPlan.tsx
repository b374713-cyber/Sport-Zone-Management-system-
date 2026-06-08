import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// dynamic requires
let PrintComp: any = null;
let FileSystemComp: any = null;
let SharingComp: any = null;

try { PrintComp = require("expo-print"); } catch {}
try { FileSystemComp = require("expo-file-system/legacy"); } catch {}
try { SharingComp = require("expo-sharing"); } catch {}
import { API_BASE } from "../config/api";

type NutritionPlan = any;

// ✅ Helper function moved OUTSIDE component
function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(birth.getTime())) return null;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export default function NutritionTab() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    goal: "fat_loss",
    days_per_week: "3",
    plan_duration_weeks: "4",
    diet_type: "normal",
    allergies: "",
  });

  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [pdfUri, setPdfUri] = useState("");

useEffect(() => {
  (async () => {
    const customerRaw = await AsyncStorage.getItem("customer");
    const customer = customerRaw ? JSON.parse(customerRaw) : null;
    setUser(customer);

    if (!customer?.customer_id) return;

    try {
      // ✅ fetch profile from DB
      const profRes = await fetch(`${API_BASE}/api/gym/profile/${customer.customer_id}`);
      const prof = await profRes.json();

      // ✅ auto-fill
      setForm((f) => ({
        ...f,
        full_name: customer.name || "",
        gender: customer.gender || "",
        height: prof.height_cm != null ? String(prof.height_cm) : "",
        weight: prof.weight_kg != null ? String(prof.weight_kg) : "",
        age: prof.age != null ? String(prof.age) : "",
      }));
    } catch (e) {
      console.log("profile load error:", e);
    }
  })();
}, []);
  const generateNutritionPlan = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login first.");
      return;
    }

    const age = Number(form.age);
    const weight = Number(form.weight);
    const height = Number(form.height);

    if (!age || !weight || !height || !form.goal) {
      Alert.alert("Missing fields", "age, weight, height, goal are required.");
      return;
    }

    setLoading(true);
    setPlan(null);
    setPdfUri("");

    const payload = {
      full_name: form.full_name || user.name,
      age,
      weight,
      height,
      gender: form.gender || null,
      goal: form.goal,
      days_per_week: Number(form.days_per_week || 3),
      plan_duration_weeks: Number(form.plan_duration_weeks || 4),
      diet_type: form.diet_type,
      allergies: form.allergies || null,
    };

    // ✅ timeout
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 25000);

    try {
      let res;
      try {
        res = await fetch(`${API_BASE}/api/gym/nutrition-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch {
        clearTimeout(t);
        Alert.alert(
          "Network Error",
          "Backend unreachable.\nMake sure phone & laptop are on SAME WiFi.\nCheck API_BASE IP."
        );
        return;
      }

      clearTimeout(t);

      const rawText = await res.text();
      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch {
        Alert.alert(
          "Backend Error",
          "Backend did not return JSON.\n\nRaw:\n" + rawText.slice(0, 400)
        );
        return;
      }

      if (!res.ok) {
        Alert.alert("AI Error", data.error || "Failed to generate nutrition plan");
        return;
      }

      if (!data.plan) {
        Alert.alert("AI Warning", data.warning || "AI did not return valid plan JSON.");
        return;
      }

      setPlan(data.plan);
      Alert.alert("✅ Success", "Nutrition plan generated!");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        Alert.alert("Timeout", "Request took too long. Try again.");
        return;
      }
      Alert.alert("Error", e.message || "Failed to generate nutrition plan");
    } finally {
      setLoading(false);
    }
  };












  
  // ✅ Nutrition PDF different template
  const makePdf = async () => {
    if (!plan) return;

    if (!PrintComp || !FileSystemComp) {
      Alert.alert("Missing packages", "Install expo-print & expo-file-system");
      return;
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial; padding: 20px; font-size: 15px; }
            h1 { color: #1a7f5a; }
            h2 { margin-top: 14px; color: #0b3b2e; }
            .dayCard {
              border: 1px solid #e5e7eb; padding: 10px; border-radius: 10px;
              margin-top: 8px; background: #f8fafc;
            }
            .meal { margin-left: 8px; }
          </style>
        </head>
        <body>
          <h1>🥗 AI Nutrition Plan</h1>
          <p><b>Name:</b> ${form.full_name}</p>
          <p>
            <b>Goal:</b> ${plan.summary?.goal}<br/>
            <b>Duration:</b> ${plan.summary?.duration_weeks} weeks<br/>
            <b>Meals/day:</b> ${plan.summary?.meals_per_day}<br/>
            <b>Calories target:</b> ${plan.summary?.calories_target}<br/>
            <b>Diet type:</b> ${plan.summary?.diet_type}
          </p>

          ${
            (plan.weekly_nutrition || []).map((w: any) => `
              <h2>Week ${w.week}</h2>
              ${(w.days || []).map((d: any) => `
                <div class="dayCard">
                  <b>${d.day}</b>
                  ${(d.meals || []).map((m: any) => `
                    <div class="meal">
                      • <b>${m.title}</b> (${m.calories} cal)
                      <ul>
                        ${(m.items || []).map((it: string) => `<li>${it}</li>`).join("")}
                      </ul>
                    </div>
                  `).join("")}
                  <p>${d.notes || ""}</p>
                </div>
              `).join("")}
            `).join("")
          }

          ${
            plan.tips?.length ? `
              <h2>Tips</h2>
              <ul>${plan.tips.map((t: string) => `<li>${t}</li>`).join("")}</ul>
            ` : ""
          }

          <p style="margin-top:18px;color:#777;">
            ${plan.disclaimer || ""}
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await PrintComp.printToFileAsync({
        html,
        width: 595,
        height: 842,
      });

      const baseDir =
        FileSystemComp.documentDirectory ||
        FileSystemComp.cacheDirectory ||
        uri.substring(0, uri.lastIndexOf("/") + 1);

      const newPath = `${baseDir}nutrition-plan-${Date.now()}.pdf`;
      await FileSystemComp.copyAsync({ from: uri, to: newPath });

      setPdfUri(newPath);
      Alert.alert("✅ PDF Ready", "Nutrition PDF created!");
    } catch (e: any) {
      console.log("pdf error:", e);
      Alert.alert("PDF Error", e.message || "Failed to create PDF");
    }
  };

  const sharePdf = async () => {
    if (!pdfUri) return;
    if (!SharingComp) {
      Alert.alert("Missing package", "Install expo-sharing");
      return;
    }
    await SharingComp.shareAsync(pdfUri);
  };

  const openPdfExternal = async () => {
    if (!pdfUri) return;
    try {
      await Linking.openURL(pdfUri);
    } catch {
      Alert.alert("Open Error", "Install a PDF viewer app.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
      {/* ✅ BIG GIF header */}
      <View style={styles.hero}>
        <Image
          source={require("../../assets/animations/nutrition.gif")}
          style={styles.heroGif}
          resizeMode="contain"
        />
        <Text style={styles.heroTitle}>Nutrition AI</Text>
        <Text style={styles.heroSub}>
          Personalized food plan for your goal 🍽️
        </Text>
      </View>

      {/* Form */}
      <Text style={styles.label}>Age *</Text>
      <TextInput
        style={styles.input}
        value={form.age}
        onChangeText={(t) => setForm({ ...form, age: t })}
        keyboardType="numeric"
        placeholder="e.g. 22"
      />

      <Text style={styles.label}>Weight (kg) *</Text>
      <TextInput
        style={styles.input}
        value={form.weight}
        onChangeText={(t) => setForm({ ...form, weight: t })}
        keyboardType="numeric"
        placeholder="e.g. 80"
      />

      <Text style={styles.label}>Height (cm) *</Text>
      <TextInput
        style={styles.input}
        value={form.height}
        onChangeText={(t) => setForm({ ...form, height: t })}
        keyboardType="numeric"
        placeholder="e.g. 175"
      />

      <Text style={styles.label}>Goal *</Text>
      <View style={styles.rowWrap}>
        {[
          { key: "fat_loss", label: "Fat Loss" },
          { key: "muscle_gain", label: "Muscle Gain" },
          { key: "maintenance", label: "Maintain" },
        ].map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[
              styles.goalChip,
              form.goal === g.key && styles.goalChipActive,
            ]}
            onPress={() => setForm({ ...form, goal: g.key })}
          >
            <Text
              style={[
                styles.goalChipText,
                form.goal === g.key && styles.goalChipTextActive,
              ]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Diet type</Text>
      <View style={styles.rowWrap}>
        {["normal", "keto", "vegetarian"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.dietChip,
              form.diet_type === t && styles.dietChipActive,
            ]}
            onPress={() => setForm({ ...form, diet_type: t })}
          >
            <Text
              style={[
                styles.dietChipText,
                form.diet_type === t && styles.dietChipTextActive,
              ]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Allergies (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.allergies}
        onChangeText={(t) => setForm({ ...form, allergies: t })}
        placeholder="e.g. peanuts, lactose..."
      />

      {/* Generate button */}
      <TouchableOpacity
        style={styles.generateBtn}
        onPress={generateNutritionPlan}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.generateText}>Generate Nutrition Plan</Text>
        )}
      </TouchableOpacity>

      {/* Result section */}
      {plan && (
        <View style={styles.resultCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Image
              source={require("../../assets/animations/abaketo.gif")}
              style={{ width: 55, height: 55 }}
            />
            <Text style={styles.resultTitle}>Plan Ready ✅</Text>
          </View>

          <TouchableOpacity style={styles.btnSecondary} onPress={makePdf}>
            <Text style={styles.btnSecondaryText}>Create PDF</Text>
          </TouchableOpacity>

          {pdfUri ? (
            <>
              <TouchableOpacity style={styles.btnSecondary} onPress={sharePdf}>
                <Text style={styles.btnSecondaryText}>Share PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={openPdfExternal}
              >
                <Text style={styles.btnSecondaryText}>Open PDF</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#0b1a2b",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  heroGif: {
    width: "100%",
    height: 190,
  },
  heroTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 6,
  },
  heroSub: {
    color: "#cbd5e1",
    marginTop: 4,
    textAlign: "center",
  },

  label: { marginTop: 10, fontWeight: "800", color: "#1f2937" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },

  goalChip: {
    backgroundColor: "#ecfeff",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  goalChipActive: { backgroundColor: "#10b981" },
  goalChipText: { fontWeight: "800", color: "#0f172a" },
  goalChipTextActive: { color: "white" },

  dietChip: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dietChipActive: { backgroundColor: "#0ea5e9" },
  dietChipText: { fontWeight: "800", color: "#0f172a" },
  dietChipTextActive: { color: "white" },

  generateBtn: {
    marginTop: 16,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  generateText: { color: "white", fontWeight: "900", fontSize: 16 },

  resultCard: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  resultTitle: { fontWeight: "900", fontSize: 16 },

  btnSecondary: {
    marginTop: 8,
    backgroundColor: "#E9EEF5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondaryText: { fontWeight: "800", color: "#0b1a2b" },
});