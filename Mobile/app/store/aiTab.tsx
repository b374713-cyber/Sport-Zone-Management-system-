// import React, { useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ActivityIndicator,
//   Alert,
//   FlatList,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { fetchAISuggestionsMobile } from "../../lib/storeApi";

// type Props = { accentColors?: any };

// export default function AITab({ accentColors = ["#FED7AA", "#FB923C", "#9A3412"] }: Props) {
//   const [loading, setLoading] = useState(false);

//   const [occasion, setOccasion] = useState("");
//   const [budget, setBudget] = useState("");
//   const [styleHint, setStyleHint] = useState("");
//   const [category, setCategory] = useState(""); // optional

//   const [suggestions, setSuggestions] = useState<any[]>([]);

//   const runAI = async () => {
//     try {
//       setLoading(true);
//       setSuggestions([]);

//       const maxPrice =
//         budget.trim() === "" ? null : Number(budget.trim());

//       if (maxPrice !== null && !Number.isFinite(maxPrice)) {
//         Alert.alert("Invalid budget", "Please enter a number, e.g. 80");
//         return;
//       }

//       const payload = {
//         user_prompt: `Occasion: ${occasion}. Budget: ${budget}. Style: ${styleHint}.`,
//         category: category.trim() || "", // optional filter
//         maxPrice, // number | null
//       };

//       const ai = await fetchAISuggestionsMobile(payload);

//       const list = ai.suggestions || ai.recommendations || ai.items || [];
//       setSuggestions(Array.isArray(list) ? list : []);

//       if (!Array.isArray(list) || list.length === 0) {
//         Alert.alert("No suggestions", "Try changing the occasion/style/budget/category.");
//       }
//     } catch (e: any) {
//       Alert.alert("Error", e?.message || "Failed to get AI suggestions");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const headerText = useMemo(() => {
//     const a = occasion.trim() ? `for ${occasion.trim()}` : "for your day";
//     return `Outfit ideas ${a}`;
//   }, [occasion]);

//   return (
//     <View style={styles.page}>
//       <View style={styles.top}>
//         <Text style={styles.h1}>AI Stylist</Text>
//         <Text style={styles.h2}>{headerText} • warm boutique mode</Text>
//       </View>

//       <View style={styles.form}>
//         <Field label="Occasion" value={occasion} onChange={setOccasion} placeholder="Wedding, gym, casual..." />
//         <Field label="Budget (optional)" value={budget} onChange={setBudget} placeholder="e.g. 80" />
//         <Field label="Style hint" value={styleHint} onChange={setStyleHint} placeholder="classic, streetwear, minimal..." />
//         <Field label="Category (optional)" value={category} onChange={setCategory} placeholder="Shoes, Hoodies, Pants..." />

//         <TouchableOpacity onPress={runAI} activeOpacity={0.9} disabled={loading}>
//           <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBtn}>
//             {loading ? <ActivityIndicator color="#111827" /> : <Text style={styles.aiBtnText}>Generate Suggestions</Text>}
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>

//       <View style={{ flex: 1, paddingHorizontal: 14 }}>
//         <Text style={styles.section}>Results</Text>

//         <FlatList
//           data={suggestions}
//           keyExtractor={(it, idx) => String(it.product_id || it.id || idx)}
//           contentContainerStyle={{ paddingBottom: 18 }}
//           renderItem={({ item }) => (
//             <View style={styles.resultCard}>
//               <Text style={styles.resultTitle}>{item.name || item.title || "Suggestion"}</Text>
//               {!!item.reason && <Text style={styles.resultSub}>{item.reason}</Text>}
//               {!!item.category && <Text style={styles.resultMeta}>Category: {item.category}</Text>}
//               {item.price !== undefined && item.price !== null && (
//                 <Text style={styles.resultMeta}>Price: ${item.price}</Text>
//               )}
//             </View>
//           )}
//           ListEmptyComponent={
//             <Text style={styles.empty}>
//               {loading ? "" : "No results yet. Fill the form and generate suggestions."}
//             </Text>
//           }
//         />
//       </View>
//     </View>
//   );
// }

// function Field({
//   label,
//   value,
//   onChange,
//   placeholder,
// }: {
//   label: string;
//   value: string;
//   onChange: (s: string) => void;
//   placeholder: string;
// }) {
//   return (
//     <View style={{ marginBottom: 10 }}>
//       <Text style={styles.label}>{label}</Text>
//       <TextInput
//         value={value}
//         onChangeText={onChange}
//         placeholder={placeholder}
//         placeholderTextColor="#6B7280"
//         style={styles.input}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: "#FFF7ED" },

//   top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
//   h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
//   h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

//   form: { paddingHorizontal: 14, paddingBottom: 10 },
//   label: { color: "#374151", fontWeight: "800", fontSize: 12, marginBottom: 6 },
//   input: {
//     height: 44,
//     borderRadius: 14,
//     paddingHorizontal: 12,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//     color: "#111827",
//   },

//   aiBtn: { marginTop: 6, paddingVertical: 12, borderRadius: 16, alignItems: "center" },
//   aiBtnText: { color: "#111827", fontWeight: "900" },

//   section: { color: "#111827", fontWeight: "900", marginTop: 6, marginBottom: 10 },

//   resultCard: {
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//     borderRadius: 18,
//     padding: 12,
//     marginBottom: 10,
//   },
//   resultTitle: { color: "#111827", fontWeight: "900", fontSize: 14 },
//   resultSub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
//   resultMeta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },

//   empty: { color: "#6B7280", fontWeight: "700" },
// });

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// IMPORTANT: use the mobile endpoint + reserveItems
import { fetchAISuggestionsMobile, reserveItems } from "../../lib/storeApi";

// same API_BASE pattern you used in ProductsTab
import { API_BASE } from "../config/api";

type Props = { accentColors?: any };

const toImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
};

const OCCASIONS = ["Sport", "Classic"] as const;
const TYPES = ["Shoes", "Clothes", "Accessories"] as const;

export default function AITab({ accentColors = ["#FED7AA", "#FB923C", "#9A3412"] }: Props) {
  const [loading, setLoading] = useState(false);

  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number]>("Sport");
  const [type, setType] = useState<(typeof TYPES)[number]>("Clothes");
  const [budget, setBudget] = useState("");

  const [suggestions, setSuggestions] = useState<any[]>([]);

  // cart: product_id -> quantity (like ProductsTab)
  const [cart, setCart] = useState<Record<number, number>>({});
  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const clearCart = () => setCart({});

  const addOne = (product_id: number) => {
    setCart((prev) => ({ ...prev, [product_id]: (prev[product_id] || 0) + 1 }));
  };

  const removeOne = (product_id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const q = (next[product_id] || 0) - 1;
      if (q <= 0) delete next[product_id];
      else next[product_id] = q;
      return next;
    });
  };

  const runAI = async () => {
    try {
      setLoading(true);
      setSuggestions([]);
      clearCart();

      const maxPrice = budget.trim() === "" ? null : Number(budget.trim());
      if (maxPrice !== null && !Number.isFinite(maxPrice)) {
        Alert.alert("Invalid budget", "Please enter a number, e.g. 80");
        return;
      }

      // We use "type" as category filter (depends on how your Products.category values look).
      // If your DB uses different category names, adjust mapping here.
      const payload = {
        user_prompt: `Occasion: ${occasion}. Type: ${type}. Budget: ${budget || "any"}.`,
        category: type,     // filter in backend
        maxPrice,           // number | null
      };

      const ai = await fetchAISuggestionsMobile(payload);

      const list = ai?.suggestions || ai?.recommendations || ai?.items || [];
      const safe = Array.isArray(list) ? list : [];
      setSuggestions(safe);

      if (!safe.length) {
        Alert.alert("No suggestions", "Try changing type or budget.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to get AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  const reserveCart = async () => {
    try {
      const stored = await AsyncStorage.getItem("customer");
      const customer = stored ? JSON.parse(stored) : null;

      if (!customer?.customer_id) {
        Alert.alert("Login required", "Please login to reserve items.");
        return;
      }

      const items = Object.entries(cart).map(([pid, qty]) => ({
        product_id: Number(pid),
        quantity: Number(qty),
      }));

      if (items.length === 0) return;

      const res = await reserveItems(customer.customer_id, items);

      if (res?.message?.toLowerCase?.().includes("error") || res?.error) {
        Alert.alert("Reserve failed", res?.message || res?.error || "Unknown error");
        return;
      }

      Alert.alert(
        "Reserved ✅",
        `Reservation code: ${res?.reservation?.reservation_code || res?.reservation_code || "SZ-?????"}\nFee: $5 (per reservation)\nReserved for 48 hours.`
      );

      clearCart();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to reserve items");
    }
  };

  const headerText = useMemo(() => {
    return `Outfit ideas for ${occasion.toLowerCase()} • warm boutique mode`;
  }, [occasion]);

  return (
    <View style={styles.page}>
      <View style={styles.top}>
        <Text style={styles.h1}>AI Stylist</Text>
        <Text style={styles.h2}>{headerText}</Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <Text style={styles.label}>Occasion</Text>
        <Segment
          values={OCCASIONS as any}
          value={occasion}
          onChange={setOccasion as any}
          accentColors={accentColors}
        />

        <Text style={[styles.label, { marginTop: 10 }]}>Type</Text>
        <Segment
          values={TYPES as any}
          value={type}
          onChange={setType as any}
          accentColors={accentColors}
        />

        <Text style={[styles.label, { marginTop: 10 }]}>Budget (optional)</Text>
        <TextInput
          value={budget}
          onChangeText={setBudget}
          placeholder="e.g. 80"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity onPress={runAI} activeOpacity={0.9} disabled={loading} style={{ marginTop: 10 }}>
          <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiBtn}>
            {loading ? <ActivityIndicator color="#111827" /> : <Text style={styles.aiBtnText}>Generate Suggestions</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* RESULTS */}
      <View style={{ flex: 1, paddingHorizontal: 14 }}>
        <Text style={styles.section}>Results</Text>

        <FlatList
          data={suggestions}
          keyExtractor={(it, idx) => String(it.product_id || it.id || idx)}
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 110 : 18 }}
          renderItem={({ item }) => {
            const pid = Number(item.product_id);
            const qty = cart[pid] || 0;
            const out = Number(item.stock_qty || 0) <= 0;

            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  if (out) return;
                  addOne(pid);
                }}
                style={styles.resultCard}
              >
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Image
                    source={{ uri: toImageUrl(item.image_url) }}
                    style={styles.img}
                  />

                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle} numberOfLines={1}>
                      {item.name || item.title || "Suggestion"}
                    </Text>

                    {!!item.reason && <Text style={styles.resultSub} numberOfLines={3}>{item.reason}</Text>}

                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                      <Text style={styles.resultMeta}>Category: {item.category || "-"}</Text>
                      <Text style={styles.resultMeta}>${item.price ?? "-"}</Text>
                    </View>

                    <Text style={[styles.stock, out && { color: "#B91C1C" }]}>
                      {out ? "Out of stock" : `${item.stock_qty ?? ""} left`}
                    </Text>

                    {/* qty controls */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 }}>
                      {qty === 0 ? (
                        <Text style={{ color: "#6B7280", fontWeight: "800" }}>
                          Tap card to add
                        </Text>
                      ) : (
                        <>
                          <TouchableOpacity onPress={() => removeOne(pid)} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>-</Text>
                          </TouchableOpacity>

                          <Text style={{ fontWeight: "900", color: "#111827" }}>{qty}</Text>

                          <TouchableOpacity onPress={() => addOne(pid)} style={styles.qtyBtn}>
                            <Text style={styles.qtyBtnText}>+</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {loading ? "" : "No results yet. Choose options and generate suggestions."}
            </Text>
          }
        />
      </View>

      {/* CART BAR */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <Text style={styles.cartText}>{cartCount} item(s) selected</Text>

          <TouchableOpacity onPress={reserveCart} activeOpacity={0.9}>
            <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.reserveBtn}>
              <Text style={styles.reserveText}>Reserve</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Simple segmented control */
function Segment({
  values,
  value,
  onChange,
  accentColors,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  accentColors: any;
}) {
  return (
    <View style={styles.segmentWrap}>
      {values.map((v) => {
        const active = v === value;
        return (
          <TouchableOpacity key={v} onPress={() => onChange(v)} activeOpacity={0.9} style={{ flex: 1 }}>
            <LinearGradient
              colors={active ? accentColors : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.65)"] as any)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.segmentBtn, active && { borderColor: "rgba(0,0,0,0.10)" }]}
            >
              <Text style={[styles.segmentText, active && { color: "#111827" }]}>{v}</Text>
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF7ED" },

  top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
  h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

  form: { paddingHorizontal: 14, paddingBottom: 10 },
  label: { color: "#374151", fontWeight: "800", fontSize: 12, marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    color: "#111827",
  },

  segmentWrap: { flexDirection: "row", gap: 10 },
  segmentBtn: {
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  segmentText: { color: "#6B7280", fontWeight: "900" },

  aiBtn: { paddingVertical: 12, borderRadius: 16, alignItems: "center" },
  aiBtnText: { color: "#111827", fontWeight: "900" },

  section: { color: "#111827", fontWeight: "900", marginTop: 6, marginBottom: 10 },

  resultCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  img: {
    width: 78,
    height: 78,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  resultTitle: { color: "#111827", fontWeight: "900", fontSize: 14 },
  resultSub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
  resultMeta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },
  stock: { marginTop: 6, color: "#6B7280", fontWeight: "800", fontSize: 12 },

  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  qtyBtnText: { fontSize: 18, fontWeight: "900", color: "#111827" },

  empty: { color: "#6B7280", fontWeight: "700" },

  cartBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartText: { color: "#111827", fontWeight: "900" },
  reserveBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
  reserveText: { color: "#111827", fontWeight: "900" },
});
