import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAISuggestions, fetchProducts, reserveItems } from "../../lib/storeApi";

type Props = { accentColors?: any };

export default function ProductsTab({ accentColors = ["#FDE68A", "#FDBA74", "#F59E0B"] }: Props) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  // cart: product_id -> quantity
  const [cart, setCart] = useState<Record<number, number>>({});
  const cartCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
//const API_BASE =
  //process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

const toImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
};

 useEffect(() => {
  (async () => {
    try {
      setLoading(true);

      const d = await fetchProducts();
      const list = Array.isArray(d) ? d : (d.products || []);

      setProducts(list);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  })();
}, []);


  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !s || String(p.name || "").toLowerCase().includes(s);
      const matchesCat = activeCat === "All" || p.category === activeCat;
      return matchesSearch && matchesCat;
    });
  }, [products, search, activeCat]);

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

  const clearCart = () => setCart({});

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

  return (
    <View style={styles.page}>
      {/* Search + chips */}
      <View style={styles.topTools}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search items..."
          placeholderTextColor="#6B7280"
          style={styles.search}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(c) => c}
          contentContainerStyle={{ paddingVertical: 10, gap: 10 }}
          renderItem={({ item }) => {
            const active = item === activeCat;
            return (
              <TouchableOpacity onPress={() => setActiveCat(item)} activeOpacity={0.9}>
                <LinearGradient
                  colors={
                    active
                      ? (accentColors as any)
                      : (["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"] as any)
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.chip, active && { borderColor: "rgba(0,0,0,0.10)" }]}
                >
                  <Text style={[styles.chipText, active && { color: "#111827" }]}>{item}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Products */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(p) => String(p.product_id)}
          contentContainerStyle={{ paddingBottom: cartCount > 0 ? 110 : 18, paddingTop: 6 }}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 14 }}
          renderItem={({ item }) => {
            const pid = Number(item.product_id);
            const qty = cart[pid] || 0;

            return (
              <View style={styles.card}>
                <Image source={{ uri: toImageUrl(item.image_url) }} style={styles.img} />

                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.price}>${item.price}</Text>
                  <Text style={styles.stock}>{Number(item.stock_qty) > 0 ? `${item.stock_qty} left` : "Out"}</Text>
                </View>

                {qty === 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => addOne(pid)}
                    disabled={Number(item.stock_qty) <= 0}
                  >
                    <LinearGradient
                      colors={Number(item.stock_qty) > 0 ? accentColors : (["#E5E7EB", "#D1D5DB"] as any)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.addBtn, Number(item.stock_qty) <= 0 && { opacity: 0.7 }]}
                    >
                      <Text style={styles.addBtnText}>
                        {Number(item.stock_qty) > 0 ? "Add to Reserve" : "Unavailable"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => removeOne(pid)} activeOpacity={0.9} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{qty}</Text>

                    <TouchableOpacity onPress={() => addOne(pid)} activeOpacity={0.9} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}

      {/* Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartWrap}>
          <LinearGradient
            colors={accentColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cartBar}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cartTitle}>Reserve Cart</Text>
              <Text style={styles.cartSub}>{cartCount} item(s) • Fee $5 (per reservation)</Text>
            </View>

            <TouchableOpacity onPress={reserveCart} activeOpacity={0.9} style={styles.cartAction}>
              <Text style={styles.cartActionText}>Reserve</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearCart} activeOpacity={0.9} style={styles.cartClear}>
              <Text style={styles.cartClearText}>Clear</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF7ED" },

  topTools: { paddingHorizontal: 14, paddingTop: 12 },
  search: {
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    color: "#111827",
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  chipText: { color: "#374151", fontWeight: "800", fontSize: 12 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  card: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  img: { width: "100%", height: 120, borderRadius: 14, backgroundColor: "#E5E7EB" },
  name: { marginTop: 8, color: "#111827", fontWeight: "900" },

  priceRow: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { color: "#9A3412", fontWeight: "900" },
  stock: { color: "#6B7280", fontSize: 11, fontWeight: "700" },

  addBtn: { marginTop: 10, paddingVertical: 10, borderRadius: 14, alignItems: "center" },
  addBtnText: { color: "#111827", fontWeight: "900", fontSize: 12 },

  qtyRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
    padding: 6,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  qtyBtnText: { color: "#111827", fontWeight: "900", fontSize: 18 },
  qtyText: { color: "#111827", fontWeight: "900" },

  cartWrap: { position: "absolute", left: 14, right: 14, bottom: 14 },
  cartBar: {
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cartTitle: { color: "#111827", fontWeight: "900", fontSize: 14 },
  cartSub: { color: "#1F2937", marginTop: 2, fontWeight: "700", fontSize: 11 },

  cartAction: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  cartActionText: { color: "#111827", fontWeight: "900" },

  cartClear: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 999 },
  cartClearText: { color: "#111827", fontWeight: "900", opacity: 0.9 },
});
