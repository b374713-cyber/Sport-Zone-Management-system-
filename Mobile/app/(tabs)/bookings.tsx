// // // import React, { useEffect, useMemo, useState } from "react";
// // // import {
// // //   View,
// // //   Text,
// // //   StyleSheet,
// // //   TouchableOpacity,
// // //   ActivityIndicator,
// // //   FlatList,
// // //   RefreshControl,
// // //   Linking,
// // //   Image,
// // // } from "react-native";
// // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // import { LinearGradient } from "expo-linear-gradient";
// // // import { fetchBookingsSummary } from "../../lib/storeApi";

// // // type TabKey = "sports" | "gaming" | "store" | "payments";

// // // const TABS: { key: TabKey; label: string }[] = [
// // //   { key: "sports", label: "Sports" },
// // //   { key: "gaming", label: "Gaming" },
// // //   { key: "store", label: "Store" },
// // //   { key: "payments", label: "Payments" },
// // // ];

// // // export default function BookingsTab() {
// // //   const [tab, setTab] = useState<TabKey>("sports");
// // //   const [loading, setLoading] = useState(true);
// // //   const [refreshing, setRefreshing] = useState(false);

// // //   const [data, setData] = useState<any>(null);
// // //   const [error, setError] = useState<string>("");

// // //   const customerId = 1; // your case: always 1

// // //   const load = async (opts?: { refresh?: boolean }) => {
// // //     try {
// // //       if (opts?.refresh) setRefreshing(true);
// // //       else setLoading(true);

// // //       setError("");

// // //       // Try to read customer from AsyncStorage (if exists)
// // //       let cid = customerId;
// // //       try {
// // //         const stored = await AsyncStorage.getItem("customer");
// // //         const customer = stored ? JSON.parse(stored) : null;
// // //         if (customer?.customer_id) cid = Number(customer.customer_id);
// // //       } catch {
// // //         // ignore
// // //       }

// // //       const res = await fetchBookingsSummary(cid);
// // //       setData(res);
// // //     } catch (e: any) {
// // //       setError(e?.message || "Failed to load history");
// // //     } finally {
// // //       setLoading(false);
// // //       setRefreshing(false);
// // //     }
// // //   };

// // //   useEffect(() => {
// // //     load();
// // //   }, []);

// // //   const totals = data?.totals || {};
// // //   const grand = Number(totals?.grand_total_paid || 0);
// // //   const sportsTotal = Number(totals?.sports_total_paid || 0);
// // //   const gamingTotal = Number(totals?.gaming_total_paid || 0);
// // //   const storeTotal = Number(totals?.store_total_paid || 0);

// // //   const list = useMemo(() => {
// // //     if (!data) return [];
// // //     if (tab === "sports") return data.sports || [];
// // //     if (tab === "gaming") return data.gaming || [];
// // //     if (tab === "store") return data.store || [];
// // //     if (tab === "payments") return data.payments || [];
// // //     return [];
// // //   }, [data, tab]);

// // //   const accentColors = ["#FED7AA", "#FB923C", "#9A3412"];

// // //   const openInvoice = async (url?: string) => {
// // //     if (!url) return;
// // //     try {
// // //       const ok = await Linking.canOpenURL(url);
// // //       if (ok) await Linking.openURL(url);
// // //     } catch {
// // //       // ignore
// // //     }
// // //   };

// // //   return (
// // //     <View style={styles.page}>
// // //       {/* Header */}
// // //       <View style={styles.top}>
// // //         <Text style={styles.h1}>My Bookings</Text>
// // //         <Text style={styles.h2}>History • Payments • Store Orders</Text>

// // //         <View style={styles.summaryRow}>
// // //           <View style={styles.summaryCard}>
// // //             <Text style={styles.sumLabel}>Total Paid</Text>
// // //             <Text style={styles.sumValue}>${grand.toFixed(2)}</Text>
// // //           </View>

// // //           <View style={styles.summaryCard}>
// // //             <Text style={styles.sumLabel}>Sports</Text>
// // //             <Text style={styles.sumValue}>${sportsTotal.toFixed(2)}</Text>
// // //           </View>

// // //           <View style={styles.summaryCard}>
// // //             <Text style={styles.sumLabel}>Gaming</Text>
// // //             <Text style={styles.sumValue}>${gamingTotal.toFixed(2)}</Text>
// // //           </View>

// // //           <View style={styles.summaryCard}>
// // //             <Text style={styles.sumLabel}>Store</Text>
// // //             <Text style={styles.sumValue}>${storeTotal.toFixed(2)}</Text>
// // //           </View>
// // //         </View>
// // //       </View>

// // //       {/* Tabs */}
// // //       <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
// // //         <View style={styles.tabsRow}>
// // //           {TABS.map((t) => {
// // //             const active = tab === t.key;
// // //             return (
// // //               <TouchableOpacity
// // //                 key={t.key}
// // //                 onPress={() => setTab(t.key)}
// // //                 activeOpacity={0.9}
// // //                 style={{ flex: 1 }}
// // //               >
// // //                 <LinearGradient
// // //                   colors={
// // //                     active
// // //                       ? accentColors
// // //                       : (["rgba(255,255,255,0.95)", "rgba(255,255,255,0.70)"] as any)
// // //                   }
// // //                   start={{ x: 0, y: 0 }}
// // //                   end={{ x: 1, y: 1 }}
// // //                   style={styles.tabBtn}
// // //                 >
// // //                   <Text style={[styles.tabText, active && { color: "#111827" }]}>
// // //                     {t.label}
// // //                   </Text>
// // //                 </LinearGradient>
// // //               </TouchableOpacity>
// // //             );
// // //           })}
// // //         </View>
// // //       </View>

// // //       {/* Content */}
// // //       {loading ? (
// // //         <View style={styles.center}>
// // //           <ActivityIndicator />
// // //           <Text style={styles.muted}>Loading history…</Text>
// // //         </View>
// // //       ) : error ? (
// // //         <View style={styles.center}>
// // //           <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text>
// // //           <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
// // //             <Text style={styles.retryText}>Retry</Text>
// // //           </TouchableOpacity>
// // //         </View>
// // //       ) : (
// // //         <FlatList
// // //           data={list}
// // //           // ✅ FIX DUPLICATE KEY ERROR:
// // //           keyExtractor={(it, idx) => {
// // //             const base =
// // //               it?.reservation_id ??
// // //               it?.session_id ??
// // //               it?.payment_id ??
// // //               it?.sports_payment_id ??
// // //               it?.id ??
// // //               idx;
// // //             return `${tab}-${String(base)}-${idx}`;
// // //           }}
// // //           refreshControl={
// // //             <RefreshControl
// // //               refreshing={refreshing}
// // //               onRefresh={() => load({ refresh: true })}
// // //             />
// // //           }
// // //           contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
// // //           ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
// // //           renderItem={({ item }) => {
// // //             if (tab === "sports") {
// // //               return (
// // //                 <Card>
// // //                   <Text style={styles.title} numberOfLines={1}>
// // //                     {item.stadium_name
// // //                       ? `Stadium: ${item.stadium_name}`
// // //                       : "Sports Reservation"}
// // //                   </Text>

// // //                   <Text style={styles.sub}>
// // //                     Date: {formatDate(item.reservation_date)} •{" "}
// // //                     {item.start_time || ""} - {item.end_time || ""}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Sport: {item.sport_name || "-"} • Status:{" "}
// // //                     {item.reservation_status || "-"}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Total: ${num(item.total_price)} • Paid: $
// // //                     {num(item.payment_amount)}
// // //                   </Text>

// // //                   {!!item.hosted_invoice_url && (
// // //                     <TouchableOpacity
// // //                       onPress={() => openInvoice(item.hosted_invoice_url)}
// // //                       style={styles.linkBtn}
// // //                     >
// // //                       <Text style={styles.linkText}>Open invoice</Text>
// // //                     </TouchableOpacity>
// // //                   )}
// // //                 </Card>
// // //               );
// // //             }

// // //             if (tab === "gaming") {
// // //               return (
// // //                 <Card>
// // //                   <Text style={styles.title} numberOfLines={1}>
// // //                     Gaming Session • {item.room_name ? item.room_name : "Room"}
// // //                   </Text>

// // //                   <Text style={styles.sub}>
// // //                     Device: {item.device_name || "-"} • Type:{" "}
// // //                     {item.device_type || "-"}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Start: {formatDateTime(item.start_time)} • End:{" "}
// // //                     {formatDateTime(item.end_time)}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Hours: {num(item.hours_played)} • Amount: $
// // //                     {num(item.final_amount)}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: $
// // //                     {num(item.payment_amount)}
// // //                   </Text>

// // //                   {!!item.hosted_invoice_url && (
// // //                     <TouchableOpacity
// // //                       onPress={() => openInvoice(item.hosted_invoice_url)}
// // //                       style={styles.linkBtn}
// // //                     >
// // //                       <Text style={styles.linkText}>Open invoice</Text>
// // //                     </TouchableOpacity>
// // //                   )}
// // //                 </Card>
// // //               );
// // //             }

// // //             if (tab === "store") {
// // //               const items = Array.isArray(item.items) ? item.items : [];

// // //               return (
// // //                 <Card>
// // //                   <Text style={styles.title} numberOfLines={1}>
// // //                     Store Order •{" "}
// // //                     {item.reservation_code || `#${item.reservation_id}`}
// // //                   </Text>

// // //                   <Text style={styles.sub}>
// // //                     Status: {item.status || "-"} • Reserved:{" "}
// // //                     {formatDateTime(item.reserved_at)}
// // //                   </Text>

// // //                   {!!item.expires_at && (
// // //                     <Text style={styles.meta}>
// // //                       Expires: {formatDateTime(item.expires_at)}
// // //                     </Text>
// // //                   )}

// // //                   <Text style={styles.meta}>
// // //                     Fee: ${num(item.fee_amount)} • Total: $
// // //                     {num(item.final_price)}
// // //                   </Text>

// // //                   <Text style={styles.meta}>
// // //                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: $
// // //                     {num(item.payment_amount)}
// // //                   </Text>

// // //                   {/* ✅ Items inside + images */}
// // //                   {items.length > 0 && (
// // //                     <View style={{ marginTop: 10 }}>
// // //                       <Text style={styles.itemsHeader}>Items</Text>

// // //                       {items.slice(0, 6).map((it: any, idx: number) => (
// // //                         <View
// // //                           key={`${item.reservation_id}-${it.product_id}-${idx}`}
// // //                           style={styles.itemRow}
// // //                         >
// // //                           {!!it.image_url ? (
// // //                             <Image
// // //                               source={{ uri: it.image_url }}
// // //                               style={styles.itemImg}
// // //                               resizeMode="cover"
// // //                             />
// // //                           ) : (
// // //                             <View style={styles.itemImgPlaceholder}>
// // //                               <Text
// // //                                 style={{
// // //                                   color: "#6B7280",
// // //                                   fontWeight: "800",
// // //                                 }}
// // //                               >
// // //                                 No
// // //                               </Text>
// // //                             </View>
// // //                           )}

// // //                           <View style={{ flex: 1 }}>
// // //                             <Text style={styles.itemName} numberOfLines={1}>
// // //                               {it.name || "Item"}
// // //                             </Text>
// // //                             <Text style={styles.itemLine} numberOfLines={1}>
// // //                               Qty: {it.quantity || 1} • $
// // //                               {num(it.unit_price || it.price)}
// // //                             </Text>
// // //                           </View>
// // //                         </View>
// // //                       ))}

// // //                       {items.length > 6 && (
// // //                         <Text style={styles.more}>
// // //                           +{items.length - 6} more…
// // //                         </Text>
// // //                       )}
// // //                     </View>
// // //                   )}

// // //                   {!!item.hosted_invoice_url && (
// // //                     <TouchableOpacity
// // //                       onPress={() => openInvoice(item.hosted_invoice_url)}
// // //                       style={styles.linkBtn}
// // //                     >
// // //                       <Text style={styles.linkText}>Open invoice</Text>
// // //                     </TouchableOpacity>
// // //                   )}
// // //                 </Card>
// // //               );
// // //             }

// // //             // payments tab
// // //             return (
// // //               <Card>
// // //                 <Text style={styles.title}>
// // //                   {String(item.module || "payment").toUpperCase()} payment
// // //                 </Text>

// // //                 <Text style={styles.sub}>
// // //                   Amount: ${num(item.amount)}{" "}
// // //                   {item.currency ? `(${item.currency})` : ""}
// // //                 </Text>

// // //                 <Text style={styles.meta}>
// // //                   Status: {item.payment_status || "-"} • Stripe:{" "}
// // //                   {item.stripe_status || "-"}
// // //                 </Text>

// // //                 <Text style={styles.meta}>
// // //                   Date: {formatDateTime(item.created_at)} • Ref:{" "}
// // //                   {item.ref_id || "-"}
// // //                 </Text>

// // //                 {!!item.hosted_invoice_url && (
// // //                   <TouchableOpacity
// // //                     onPress={() => openInvoice(item.hosted_invoice_url)}
// // //                     style={styles.linkBtn}
// // //                   >
// // //                     <Text style={styles.linkText}>Open invoice</Text>
// // //                   </TouchableOpacity>
// // //                 )}
// // //               </Card>
// // //             );
// // //           }}
// // //         />
// // //       )}
// // //     </View>
// // //   );
// // // }

// // // /* Small reusable card */
// // // function Card({ children }: { children: React.ReactNode }) {
// // //   return <View style={styles.card}>{children}</View>;
// // // }

// // // function num(x: any) {
// // //   const n = Number(x);
// // //   if (!Number.isFinite(n)) return "0.00";
// // //   return n.toFixed(2);
// // // }

// // // function formatDate(v: any) {
// // //   if (!v) return "-";
// // //   const d = new Date(v);
// // //   if (Number.isNaN(d.getTime())) return String(v);
// // //   return d.toISOString().slice(0, 10);
// // // }

// // // function formatDateTime(v: any) {
// // //   if (!v) return "-";
// // //   const d = new Date(v);
// // //   if (Number.isNaN(d.getTime())) return String(v);
// // //   return d.toISOString().replace("T", " ").slice(0, 16);
// // // }

// // // const styles = StyleSheet.create({
// // //   page: { flex: 1, backgroundColor: "#FFF7ED" },

// // //   top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
// // //   h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
// // //   h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

// // //   summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
// // //   summaryCard: {
// // //     backgroundColor: "rgba(255,255,255,0.92)",
// // //     borderWidth: 1,
// // //     borderColor: "rgba(0,0,0,0.06)",
// // //     borderRadius: 16,
// // //     padding: 10,
// // //     minWidth: 120,
// // //   },
// // //   sumLabel: { color: "#6B7280", fontWeight: "900", fontSize: 11 },
// // //   sumValue: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 4 },

// // //   tabsRow: { flexDirection: "row", gap: 10 },
// // //   tabBtn: {
// // //     paddingVertical: 10,
// // //     borderRadius: 14,
// // //     alignItems: "center",
// // //     borderWidth: 1,
// // //     borderColor: "rgba(0,0,0,0.06)",
// // //   },
// // //   tabText: { color: "#6B7280", fontWeight: "900", fontSize: 12 },

// // //   card: {
// // //     backgroundColor: "rgba(255,255,255,0.92)",
// // //     borderWidth: 1,
// // //     borderColor: "rgba(0,0,0,0.06)",
// // //     borderRadius: 18,
// // //     padding: 12,
// // //     marginBottom: 10,
// // //   },
// // //   title: { color: "#111827", fontWeight: "900", fontSize: 14 },
// // //   sub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
// // //   meta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },

// // //   itemsHeader: { color: "#111827", fontWeight: "900", marginBottom: 8 },

// // //   itemRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
// // //   itemImg: { width: 52, height: 52, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)" },
// // //   itemImgPlaceholder: {
// // //     width: 52,
// // //     height: 52,
// // //     borderRadius: 12,
// // //     backgroundColor: "rgba(0,0,0,0.05)",
// // //     alignItems: "center",
// // //     justifyContent: "center",
// // //   },
// // //   itemName: { color: "#111827", fontWeight: "900" },
// // //   itemLine: { color: "#374151", fontWeight: "800" },

// // //   more: { color: "#6B7280", fontWeight: "700", marginTop: 6 },

// // //   linkBtn: { marginTop: 10, alignSelf: "flex-start" },
// // //   linkText: { color: "#2563EB", fontWeight: "900" },

// // //   center: { flex: 1, justifyContent: "center", alignItems: "center" },
// // //   muted: { marginTop: 10, color: "#6B7280", fontWeight: "700" },
// // //   empty: { color: "#6B7280", fontWeight: "700", padding: 14 },

// // //   retryBtn: {
// // //     marginTop: 10,
// // //     paddingHorizontal: 14,
// // //     paddingVertical: 10,
// // //     borderRadius: 12,
// // //     backgroundColor: "rgba(255,255,255,0.92)",
// // //     borderWidth: 1,
// // //     borderColor: "rgba(0,0,0,0.06)",
// // //   },
// // //   retryText: { fontWeight: "900", color: "#111827" },
// // // });
// // import React, { useEffect, useMemo, useState } from "react";
// // import {
// //   View,
// //   Text,
// //   StyleSheet,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   FlatList,
// //   RefreshControl,
// //   Linking,
// //   Image,
// // } from "react-native";
// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { fetchBookingsSummary } from "../../lib/storeApi";

// // type TabKey = "sports" | "gaming" | "store" | "payments";

// // const TABS: { key: TabKey; label: string }[] = [
// //   { key: "sports", label: "Sports" },
// //   { key: "gaming", label: "Gaming" },
// //   { key: "store", label: "Store" },
// //   { key: "payments", label: "Payments" },
// // ];

// // export default function BookingsTab() {
// //   const [tab, setTab] = useState<TabKey>("sports");
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);

// //   const [data, setData] = useState<any>(null);
// //   const [error, setError] = useState<string>("");

// //   const customerId = 1;

// //   const load = async (opts?: { refresh?: boolean }) => {
// //     try {
// //       if (opts?.refresh) setRefreshing(true);
// //       else setLoading(true);

// //       setError("");

// //       let cid = customerId;
// //       try {
// //         const stored = await AsyncStorage.getItem("customer");
// //         const customer = stored ? JSON.parse(stored) : null;
// //         if (customer?.customer_id) cid = Number(customer.customer_id);
// //       } catch {}

// //       const res = await fetchBookingsSummary(cid);
// //       setData(res);
// //     } catch (e: any) {
// //       setError(e?.message || "Failed to load history");
// //     } finally {
// //       setLoading(false);
// //       setRefreshing(false);
// //     }
// //   };

// //   useEffect(() => {
// //     load();
// //   }, []);

// //   const totals = data?.totals || {};
// //   const grand = Number(totals?.grand_total_paid || 0);
// //   const sportsTotal = Number(totals?.sports_total_paid || 0);
// //   const gamingTotal = Number(totals?.gaming_total_paid || 0);
// //   const storeTotal = Number(totals?.store_total_paid || 0);

// //   const list = useMemo(() => {
// //     if (!data) return [];
// //     if (tab === "sports") return data.sports || [];
// //     if (tab === "gaming") return data.gaming || [];
// //     if (tab === "store") return data.store || [];
// //     if (tab === "payments") return data.payments || [];
// //     return [];
// //   }, [data, tab]);

// //   const accentColors = ["#FED7AA", "#FB923C", "#9A3412"];

// //   const openInvoice = async (url?: string) => {
// //     if (!url) return;
// //     try {
// //       const ok = await Linking.canOpenURL(url);
// //       if (ok) await Linking.openURL(url);
// //     } catch {}
// //   };

// //   // ✅ Payment label helper
// //   const PaymentBadge = ({ hosted_invoice_url }: { hosted_invoice_url?: string }) => {
// //     const paidOnline = !!hosted_invoice_url;

// //     if (paidOnline) {
// //       return (
// //         <View style={styles.payRow}>
// //           <Text style={styles.payStripe}>Paid online (Stripe)</Text>
// //           <TouchableOpacity onPress={() => openInvoice(hosted_invoice_url)} style={styles.linkBtn}>
// //             <Text style={styles.linkText}>Open invoice</Text>
// //           </TouchableOpacity>
// //         </View>
// //       );
// //     }

// //     return (
// //       <View style={styles.payCashWrap}>
// //         <Text style={styles.payCash}>Paid in cash</Text>
// //       </View>
// //     );
// //   };

// //   return (
// //     <View style={styles.page}>
// //       {/* Header */}
// //       <View style={styles.top}>
// //         <Text style={styles.h1}>My Bookings</Text>
// //         <Text style={styles.h2}>History • Payments • Store Orders</Text>

// //         <View style={styles.summaryRow}>
// //           <View style={styles.summaryCard}>
// //             <Text style={styles.sumLabel}>Total Paid</Text>
// //             <Text style={styles.sumValue}>${grand.toFixed(2)}</Text>
// //           </View>

// //           <View style={styles.summaryCard}>
// //             <Text style={styles.sumLabel}>Sports</Text>
// //             <Text style={styles.sumValue}>${sportsTotal.toFixed(2)}</Text>
// //           </View>

// //           <View style={styles.summaryCard}>
// //             <Text style={styles.sumLabel}>Gaming</Text>
// //             <Text style={styles.sumValue}>${gamingTotal.toFixed(2)}</Text>
// //           </View>

// //           <View style={styles.summaryCard}>
// //             <Text style={styles.sumLabel}>Store</Text>
// //             <Text style={styles.sumValue}>${storeTotal.toFixed(2)}</Text>
// //           </View>
// //         </View>
// //       </View>

// //       {/* Tabs */}
// //       <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
// //         <View style={styles.tabsRow}>
// //           {TABS.map((t) => {
// //             const active = tab === t.key;
// //             return (
// //               <TouchableOpacity
// //                 key={t.key}
// //                 onPress={() => setTab(t.key)}
// //                 activeOpacity={0.9}
// //                 style={{ flex: 1 }}
// //               >
// //                 <LinearGradient
// //                   colors={
// //                     active
// //                       ? accentColors
// //                       : (["rgba(255,255,255,0.95)", "rgba(255,255,255,0.70)"] as any)
// //                   }
// //                   start={{ x: 0, y: 0 }}
// //                   end={{ x: 1, y: 1 }}
// //                   style={styles.tabBtn}
// //                 >
// //                   <Text style={[styles.tabText, active && { color: "#111827" }]}>{t.label}</Text>
// //                 </LinearGradient>
// //               </TouchableOpacity>
// //             );
// //           })}
// //         </View>
// //       </View>

// //       {/* Content */}
// //       {loading ? (
// //         <View style={styles.center}>
// //           <ActivityIndicator />
// //           <Text style={styles.muted}>Loading history…</Text>
// //         </View>
// //       ) : error ? (
// //         <View style={styles.center}>
// //           <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text>
// //           <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
// //             <Text style={styles.retryText}>Retry</Text>
// //           </TouchableOpacity>
// //         </View>
// //       ) : (
// //         <FlatList
// //           data={list}
// //           keyExtractor={(it, idx) => {
// //             const base =
// //               it?.reservation_id ??
// //               it?.session_id ??
// //               it?.payment_id ??
// //               it?.sports_payment_id ??
// //               it?.id ??
// //               idx;
// //             return `${tab}-${String(base)}-${idx}`;
// //           }}
// //           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} />}
// //           contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
// //           ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
// //           renderItem={({ item }) => {
// //             if (tab === "sports") {
// //               return (
// //                 <Card>
// //                   <Text style={styles.title} numberOfLines={1}>
// //                     {item.stadium_name ? `Stadium: ${item.stadium_name}` : "Sports Reservation"}
// //                   </Text>

// //                   <Text style={styles.sub}>
// //                     Date: {formatDate(item.reservation_date)} • {item.start_time || ""} - {item.end_time || ""}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Sport: {item.sport_name || "-"} • Status: {item.reservation_status || "-"}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Total: ${num(item.total_price)} • Paid: ${num(item.payment_amount)}
// //                   </Text>

// //                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
// //                 </Card>
// //               );
// //             }

// //             if (tab === "gaming") {
// //               return (
// //                 <Card>
// //                   <Text style={styles.title} numberOfLines={1}>
// //                     Gaming Session • {item.room_name ? item.room_name : "Room"}
// //                   </Text>

// //                   <Text style={styles.sub}>
// //                     Device: {item.device_name || "-"} • Type: {item.device_type || "-"}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Start: {formatDateTime(item.start_time)} • End: {formatDateTime(item.end_time)}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Hours: {num(item.hours_played)} • Amount: ${num(item.final_amount)}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
// //                   </Text>

// //                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
// //                 </Card>
// //               );
// //             }

// //             if (tab === "store") {
// //               const items = Array.isArray(item.items) ? item.items : [];

// //               return (
// //                 <Card>
// //                   <Text style={styles.title} numberOfLines={1}>
// //                     Store Order • {item.reservation_code || `#${item.reservation_id}`}
// //                   </Text>

// //                   <Text style={styles.sub}>
// //                     Status: {item.status || "-"} • Reserved: {formatDateTime(item.reserved_at)}
// //                   </Text>

// //                   {!!item.expires_at && (
// //                     <Text style={styles.meta}>Expires: {formatDateTime(item.expires_at)}</Text>
// //                   )}

// //                   <Text style={styles.meta}>
// //                     Fee: ${num(item.fee_amount)} • Total: ${num(item.final_price)}
// //                   </Text>

// //                   <Text style={styles.meta}>
// //                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
// //                   </Text>

// //                   {items.length > 0 && (
// //                     <View style={{ marginTop: 10 }}>
// //                       <Text style={styles.itemsHeader}>Items</Text>

// //                       {items.slice(0, 6).map((it: any, idx: number) => (
// //                         <View
// //                           key={`${item.reservation_id}-${it.product_id}-${idx}`}
// //                           style={styles.itemRow}
// //                         >
// //                           {!!it.image_url ? (
// //                             <Image source={{ uri: it.image_url }} style={styles.itemImg} resizeMode="cover" />
// //                           ) : (
// //                             <View style={styles.itemImgPlaceholder}>
// //                               <Text style={{ color: "#6B7280", fontWeight: "800" }}>No</Text>
// //                             </View>
// //                           )}

// //                           <View style={{ flex: 1 }}>
// //                             <Text style={styles.itemName} numberOfLines={1}>
// //                               {it.name || "Item"}
// //                             </Text>
// //                             <Text style={styles.itemLine} numberOfLines={1}>
// //                               Qty: {it.quantity || 1} • ${num(it.unit_price || it.price)}
// //                             </Text>
// //                           </View>
// //                         </View>
// //                       ))}

// //                       {items.length > 6 && <Text style={styles.more}>+{items.length - 6} more…</Text>}
// //                     </View>
// //                   )}

// //                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
// //                 </Card>
// //               );
// //             }

// //             // payments tab
// //             return (
// //               <Card>
// //                 <Text style={styles.title}>{String(item.module || "payment").toUpperCase()} payment</Text>

// //                 <Text style={styles.sub}>
// //                   Amount: ${num(item.amount)} {item.currency ? `(${item.currency})` : ""}
// //                 </Text>

// //                 <Text style={styles.meta}>
// //                   Status: {item.payment_status || "-"} • Stripe: {item.stripe_status || "-"}
// //                 </Text>

// //                 <Text style={styles.meta}>
// //                   Date: {formatDateTime(item.created_at)} • Ref: {item.ref_id || "-"}
// //                 </Text>

// //                 <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
// //               </Card>
// //             );
// //           }}
// //         />
// //       )}
// //     </View>
// //   );
// // }

// // /* Small reusable card */
// // function Card({ children }: { children: React.ReactNode }) {
// //   return <View style={styles.card}>{children}</View>;
// // }

// // function num(x: any) {
// //   const n = Number(x);
// //   if (!Number.isFinite(n)) return "0.00";
// //   return n.toFixed(2);
// // }

// // function formatDate(v: any) {
// //   if (!v) return "-";
// //   const d = new Date(v);
// //   if (Number.isNaN(d.getTime())) return String(v);
// //   return d.toISOString().slice(0, 10);
// // }

// // function formatDateTime(v: any) {
// //   if (!v) return "-";
// //   const d = new Date(v);
// //   if (Number.isNaN(d.getTime())) return String(v);
// //   return d.toISOString().replace("T", " ").slice(0, 16);
// // }

// // const styles = StyleSheet.create({
// //   page: { flex: 1, backgroundColor: "#FFF7ED" },

// //   top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
// //   h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
// //   h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

// //   summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
// //   summaryCard: {
// //     backgroundColor: "rgba(255,255,255,0.92)",
// //     borderWidth: 1,
// //     borderColor: "rgba(0,0,0,0.06)",
// //     borderRadius: 16,
// //     padding: 10,
// //     minWidth: 120,
// //   },
// //   sumLabel: { color: "#6B7280", fontWeight: "900", fontSize: 11 },
// //   sumValue: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 4 },

// //   tabsRow: { flexDirection: "row", gap: 10 },
// //   tabBtn: {
// //     paddingVertical: 10,
// //     borderRadius: 14,
// //     alignItems: "center",
// //     borderWidth: 1,
// //     borderColor: "rgba(0,0,0,0.06)",
// //   },
// //   tabText: { color: "#6B7280", fontWeight: "900", fontSize: 12 },

// //   card: {
// //     backgroundColor: "rgba(255,255,255,0.92)",
// //     borderWidth: 1,
// //     borderColor: "rgba(0,0,0,0.06)",
// //     borderRadius: 18,
// //     padding: 12,
// //     marginBottom: 10,
// //   },
// //   title: { color: "#111827", fontWeight: "900", fontSize: 14 },
// //   sub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
// //   meta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },

// //   // ✅ payment label styles
// //   payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
// //   payStripe: { color: "#111827", fontWeight: "900", fontSize: 12 },
// //   payCashWrap: { marginTop: 10, alignItems: "center", justifyContent: "center" },
// //   payCash: { color: "#111827", fontWeight: "900", fontSize: 12 },

// //   itemsHeader: { color: "#111827", fontWeight: "900", marginBottom: 8 },

// //   itemRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
// //   itemImg: { width: 52, height: 52, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)" },
// //   itemImgPlaceholder: {
// //     width: 52,
// //     height: 52,
// //     borderRadius: 12,
// //     backgroundColor: "rgba(0,0,0,0.05)",
// //     alignItems: "center",
// //     justifyContent: "center",
// //   },
// //   itemName: { color: "#111827", fontWeight: "900" },
// //   itemLine: { color: "#374151", fontWeight: "800" },

// //   more: { color: "#6B7280", fontWeight: "700", marginTop: 6 },

// //   linkBtn: { alignSelf: "flex-start" },
// //   linkText: { color: "#2563EB", fontWeight: "900" },

// //   center: { flex: 1, justifyContent: "center", alignItems: "center" },
// //   muted: { marginTop: 10, color: "#6B7280", fontWeight: "700" },
// //   empty: { color: "#6B7280", fontWeight: "700", padding: 14 },

// //   retryBtn: {
// //     marginTop: 10,
// //     paddingHorizontal: 14,
// //     paddingVertical: 10,
// //     borderRadius: 12,
// //     backgroundColor: "rgba(255,255,255,0.92)",
// //     borderWidth: 1,
// //     borderColor: "rgba(0,0,0,0.06)",
// //   },
// //   retryText: { fontWeight: "900", color: "#111827" },
// // });
// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   Linking,
//   Image,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { LinearGradient } from "expo-linear-gradient";
// import { Video, ResizeMode } from "expo-av";
// import { fetchBookingsSummary } from "../../lib/storeApi";

// type TabKey = "sports" | "gaming" | "store" | "payments";

// const TABS: { key: TabKey; label: string }[] = [
//   { key: "sports", label: "Sports" },
//   { key: "gaming", label: "Gaming" },
//   { key: "store", label: "Store" },
//   { key: "payments", label: "Payments" },
// ];

// // ✅ Your local assets (adjust path if needed)
// const TAB_MEDIA: Record<
//   TabKey,
//   | { type: "video"; src: any }
//   | { type: "image"; src: any }
// > = {
//   sports: { type: "video", src: require("../../assets/animations/ballss.mp4") },
//   gaming: { type: "image", src: require("../../assets/animations/controller_yellow.jpg") }, // ✅ jpg
//   store: { type: "video", src: require("../../assets/animations/store_reciption.mp4") },
//   payments: { type: "video", src: require("../../assets/animations/paymnt_card.mp4") },
// };

// export default function BookingsTab() {
//   const [tab, setTab] = useState<TabKey>("sports");
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   const [data, setData] = useState<any>(null);
//   const [error, setError] = useState<string>("");

//   const customerId = 1;

//   const load = async (opts?: { refresh?: boolean }) => {
//     try {
//       if (opts?.refresh) setRefreshing(true);
//       else setLoading(true);

//       setError("");

//       let cid = customerId;
//       try {
//         const stored = await AsyncStorage.getItem("customer");
//         const customer = stored ? JSON.parse(stored) : null;
//         if (customer?.customer_id) cid = Number(customer.customer_id);
//       } catch {}

//       const res = await fetchBookingsSummary(cid);
//       setData(res);
//     } catch (e: any) {
//       setError(e?.message || "Failed to load history");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const totals = data?.totals || {};
//   const grand = Number(totals?.grand_total_paid || 0);
//   const sportsTotal = Number(totals?.sports_total_paid || 0);
//   const gamingTotal = Number(totals?.gaming_total_paid || 0);
//   const storeTotal = Number(totals?.store_total_paid || 0);

//   const list = useMemo(() => {
//     if (!data) return [];
//     if (tab === "sports") return data.sports || [];
//     if (tab === "gaming") return data.gaming || [];
//     if (tab === "store") return data.store || [];
//     if (tab === "payments") return data.payments || [];
//     return [];
//   }, [data, tab]);

//   const accentColors = ["#FED7AA", "#FB923C", "#9A3412"];

//   const openInvoice = async (url?: string) => {
//     if (!url) return;
//     try {
//       const ok = await Linking.canOpenURL(url);
//       if (ok) await Linking.openURL(url);
//     } catch {}
//   };

//   // ✅ Payment label helper
//   const PaymentBadge = ({ hosted_invoice_url }: { hosted_invoice_url?: string }) => {
//     const paidOnline = !!hosted_invoice_url;

//     if (paidOnline) {
//       return (
//         <View style={styles.payRow}>
//           <Text style={styles.payStripe}>Paid online (Stripe)</Text>
//           <TouchableOpacity onPress={() => openInvoice(hosted_invoice_url)} style={styles.linkBtn}>
//             <Text style={styles.linkText}>Open invoice</Text>
//           </TouchableOpacity>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.payCashWrap}>
//         <Text style={styles.payCash}>Paid in cash</Text>
//       </View>
//     );
//   };

//   const TabMedia = ({ k, active }: { k: TabKey; active: boolean }) => {
//     const item = TAB_MEDIA[k];

//     if (item.type === "image") {
//       return (
//         <Image
//           source={item.src}
//           style={[styles.tabMedia, !active && { opacity: 0.75 }]}
//           resizeMode="cover"
//         />
//       );
//     }

//     return (
//       <Video
//         source={item.src}
//         style={[styles.tabMedia, !active && { opacity: 0.75 }]}
//         resizeMode={ResizeMode.COVER}
//         isLooping
//         shouldPlay
//         isMuted
//       />
//     );
//   };

//   return (
//     <View style={styles.page}>
//       {/* Header */}
//       <View style={styles.top}>
//         <Text style={styles.h1}>My Bookings</Text>
//         <Text style={styles.h2}>History • Payments • Store Orders</Text>

//         <View style={styles.summaryRow}>
//           <View style={styles.summaryCard}>
//             <Text style={styles.sumLabel}>Total Paid</Text>
//             <Text style={styles.sumValue}>${grand.toFixed(2)}</Text>
//           </View>

//           <View style={styles.summaryCard}>
//             <Text style={styles.sumLabel}>Sports</Text>
//             <Text style={styles.sumValue}>${sportsTotal.toFixed(2)}</Text>
//           </View>

//           <View style={styles.summaryCard}>
//             <Text style={styles.sumLabel}>Gaming</Text>
//             <Text style={styles.sumValue}>${gamingTotal.toFixed(2)}</Text>
//           </View>

//           <View style={styles.summaryCard}>
//             <Text style={styles.sumLabel}>Store</Text>
//             <Text style={styles.sumValue}>${storeTotal.toFixed(2)}</Text>
//           </View>
//         </View>
//       </View>

//       {/* Tabs (titles replaced by media) */}
//       <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
//         <View style={styles.tabsRow}>
//           {TABS.map((t) => {
//             const active = tab === t.key;

//             return (
//               <TouchableOpacity
//                 key={t.key}
//                 onPress={() => setTab(t.key)}
//                 activeOpacity={0.9}
//                 style={{ flex: 1 }}
//               >
//                 <LinearGradient
//                   colors={
//                     active
//                       ? accentColors
//                       : (["rgba(255,255,255,0.95)", "rgba(255,255,255,0.70)"] as any)
//                   }
//                   start={{ x: 0, y: 0 }}
//                   end={{ x: 1, y: 1 }}
//                   style={[styles.tabBtn, active && styles.tabBtnActive]}
//                 >
//                   <View style={styles.tabMediaWrap}>
//                     <TabMedia k={t.key} active={active} />
//                   </View>

//                   {/* optional tiny label under media (remove if you want) */}
//                   <Text style={[styles.tabTinyLabel, active && { color: "#111827" }]}>
//                     {t.label}
//                   </Text>
//                 </LinearGradient>
//               </TouchableOpacity>
//             );
//           })}
//         </View>
//       </View>

//       {/* Content */}
//       {loading ? (
//         <View style={styles.center}>
//           <ActivityIndicator />
//           <Text style={styles.muted}>Loading history…</Text>
//         </View>
//       ) : error ? (
//         <View style={styles.center}>
//           <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text>
//           <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={list}
//           keyExtractor={(it, idx) => {
//             const base =
//               it?.reservation_id ??
//               it?.session_id ??
//               it?.payment_id ??
//               it?.sports_payment_id ??
//               it?.id ??
//               idx;
//             return `${tab}-${String(base)}-${idx}`;
//           }}
//           refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} />}
//           contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
//           ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
//           renderItem={({ item }) => {
//             if (tab === "sports") {
//               return (
//                 <Card>
//                   <Text style={styles.title} numberOfLines={1}>
//                     {item.stadium_name ? `Stadium: ${item.stadium_name}` : "Sports Reservation"}
//                   </Text>

//                   <Text style={styles.sub}>
//                     Date: {formatDate(item.reservation_date)} • {item.start_time || ""} - {item.end_time || ""}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Sport: {item.sport_name || "-"} • Status: {item.reservation_status || "-"}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Total: ${num(item.total_price)} • Paid: ${num(item.payment_amount)}
//                   </Text>

//                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
//                 </Card>
//               );
//             }

//             if (tab === "gaming") {
//               return (
//                 <Card>
//                   <Text style={styles.title} numberOfLines={1}>
//                     Gaming Session • {item.room_name ? item.room_name : "Room"}
//                   </Text>

//                   <Text style={styles.sub}>
//                     Device: {item.device_name || "-"} • Type: {item.device_type || "-"}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Start: {formatDateTime(item.start_time)} • End: {formatDateTime(item.end_time)}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Hours: {num(item.hours_played)} • Amount: ${num(item.final_amount)}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
//                   </Text>

//                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
//                 </Card>
//               );
//             }

//             if (tab === "store") {
//               const items = Array.isArray(item.items) ? item.items : [];

//               return (
//                 <Card>
//                   <Text style={styles.title} numberOfLines={1}>
//                     Store Order • {item.reservation_code || `#${item.reservation_id}`}
//                   </Text>

//                   <Text style={styles.sub}>
//                     Status: {item.status || "-"} • Reserved: {formatDateTime(item.reserved_at)}
//                   </Text>

//                   {!!item.expires_at && (
//                     <Text style={styles.meta}>Expires: {formatDateTime(item.expires_at)}</Text>
//                   )}

//                   <Text style={styles.meta}>
//                     Fee: ${num(item.fee_amount)} • Total: ${num(item.final_price)}
//                   </Text>

//                   <Text style={styles.meta}>
//                     Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
//                   </Text>

//                   {items.length > 0 && (
//                     <View style={{ marginTop: 10 }}>
//                       <Text style={styles.itemsHeader}>Items</Text>

//                       {items.slice(0, 6).map((it: any, idx: number) => (
//                         <View key={`${item.reservation_id}-${it.product_id}-${idx}`} style={styles.itemRow}>
//                           {!!it.image_url ? (
//                             <Image source={{ uri: it.image_url }} style={styles.itemImg} resizeMode="cover" />
//                           ) : (
//                             <View style={styles.itemImgPlaceholder}>
//                               <Text style={{ color: "#6B7280", fontWeight: "800" }}>No</Text>
//                             </View>
//                           )}

//                           <View style={{ flex: 1 }}>
//                             <Text style={styles.itemName} numberOfLines={1}>
//                               {it.name || "Item"}
//                             </Text>
//                             <Text style={styles.itemLine} numberOfLines={1}>
//                               Qty: {it.quantity || 1} • ${num(it.unit_price || it.price)}
//                             </Text>
//                           </View>
//                         </View>
//                       ))}

//                       {items.length > 6 && <Text style={styles.more}>+{items.length - 6} more…</Text>}
//                     </View>
//                   )}

//                   <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
//                 </Card>
//               );
//             }

//             // payments tab
//             return (
//               <Card>
//                 <Text style={styles.title}>{String(item.module || "payment").toUpperCase()} payment</Text>

//                 <Text style={styles.sub}>
//                   Amount: ${num(item.amount)} {item.currency ? `(${item.currency})` : ""}
//                 </Text>

//                 <Text style={styles.meta}>
//                   Status: {item.payment_status || "-"} • Stripe: {item.stripe_status || "-"}
//                 </Text>

//                 <Text style={styles.meta}>
//                   Date: {formatDateTime(item.created_at)} • Ref: {item.ref_id || "-"}
//                 </Text>

//                 <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
//               </Card>
//             );
//           }}
//         />
//       )}
//     </View>
//   );
// }

// /* Small reusable card */
// function Card({ children }: { children: React.ReactNode }) {
//   return <View style={styles.card}>{children}</View>;
// }

// function num(x: any) {
//   const n = Number(x);
//   if (!Number.isFinite(n)) return "0.00";
//   return n.toFixed(2);
// }

// function formatDate(v: any) {
//   if (!v) return "-";
//   const d = new Date(v);
//   if (Number.isNaN(d.getTime())) return String(v);
//   return d.toISOString().slice(0, 10);
// }

// function formatDateTime(v: any) {
//   if (!v) return "-";
//   const d = new Date(v);
//   if (Number.isNaN(d.getTime())) return String(v);
//   return d.toISOString().replace("T", " ").slice(0, 16);
// }

// const styles = StyleSheet.create({
//   page: { flex: 1, backgroundColor: "#FFF7ED" },

//   top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
//   h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
//   h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

//   summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
//   summaryCard: {
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//     borderRadius: 16,
//     padding: 10,
//     minWidth: 120,
//   },
//   sumLabel: { color: "#6B7280", fontWeight: "900", fontSize: 11 },
//   sumValue: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 4 },

//   tabsRow: { flexDirection: "row", gap: 10 },
//   tabBtn: {
//     paddingVertical: 10,
//     borderRadius: 16,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//     overflow: "hidden",
//   },
//   tabBtnActive: {
//     borderColor: "rgba(154,52,18,0.30)",
//   },

//   // ✅ media tab “title”
//   tabMediaWrap: {
//     width: 44,
//     height: 44,
//     borderRadius: 14,
//     overflow: "hidden",
//     backgroundColor: "rgba(0,0,0,0.06)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//   },
//   tabMedia: {
//     width: "100%",
//     height: "100%",
//   },
//   tabTinyLabel: {
//     marginTop: 6,
//     color: "#6B7280",
//     fontWeight: "900",
//     fontSize: 11,
//   },

//   card: {
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//     borderRadius: 18,
//     padding: 12,
//     marginBottom: 10,
//   },
//   title: { color: "#111827", fontWeight: "900", fontSize: 14 },
//   sub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
//   meta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },

//   // payment label styles
//   payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
//   payStripe: { color: "#111827", fontWeight: "900", fontSize: 12 },
//   payCashWrap: { marginTop: 10, alignItems: "center", justifyContent: "center" },
//   payCash: { color: "#111827", fontWeight: "900", fontSize: 12 },

//   itemsHeader: { color: "#111827", fontWeight: "900", marginBottom: 8 },

//   itemRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
//   itemImg: { width: 52, height: 52, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)" },
//   itemImgPlaceholder: {
//     width: 52,
//     height: 52,
//     borderRadius: 12,
//     backgroundColor: "rgba(0,0,0,0.05)",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   itemName: { color: "#111827", fontWeight: "900" },
//   itemLine: { color: "#374151", fontWeight: "800" },

//   more: { color: "#6B7280", fontWeight: "700", marginTop: 6 },

//   linkBtn: { alignSelf: "flex-start" },
//   linkText: { color: "#2563EB", fontWeight: "900" },

//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   muted: { marginTop: 10, color: "#6B7280", fontWeight: "700" },
//   empty: { color: "#6B7280", fontWeight: "700", padding: 14 },

//   retryBtn: {
//     marginTop: 10,
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderWidth: 1,
//     borderColor: "rgba(0,0,0,0.06)",
//   },
//   retryText: { fontWeight: "900", color: "#111827" },
// });
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Linking,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import { fetchBookingsSummary } from "../../lib/storeApi";

type TabKey = "sports" | "gaming" | "store" | "payments";

const TABS: { key: TabKey; label: string }[] = [
  { key: "sports", label: "Sports" },
  { key: "gaming", label: "Gaming" },
  { key: "store", label: "Store" },
  { key: "payments", label: "Payments" },
];

// ✅ Your local assets (adjust path if needed)
const TAB_MEDIA: Record<
  TabKey,
  | { type: "video"; src: any }
  | { type: "image"; src: any }
> = {
  sports: { type: "video", src: require("../../assets/animations/ballss.mp4") },
  gaming: { type: "image", src: require("../../assets/animations/controller_yellow.jpg") }, // ✅ jpg
  store: { type: "video", src: require("../../assets/animations/store_reciption.mp4") },
  payments: { type: "video", src: require("../../assets/animations/paymnt_card.mp4") },
};

export default function BookingsTab() {
  const [tab, setTab] = useState<TabKey>("sports");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const customerId = 1;

  const load = async (opts?: { refresh?: boolean }) => {
    try {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      let cid = customerId;
      try {
        const stored = await AsyncStorage.getItem("customer");
        const customer = stored ? JSON.parse(stored) : null;
        if (customer?.customer_id) cid = Number(customer.customer_id);
      } catch {}

      const res = await fetchBookingsSummary(cid);
      setData(res);
    } catch (e: any) {
      setError(e?.message || "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totals = data?.totals || {};
  const grand = Number(totals?.grand_total_paid || 0);
  const sportsTotal = Number(totals?.sports_total_paid || 0);
  const gamingTotal = Number(totals?.gaming_total_paid || 0);
  const storeTotal = Number(totals?.store_total_paid || 0);

  const list = useMemo(() => {
    if (!data) return [];
    if (tab === "sports") return data.sports || [];
    if (tab === "gaming") return data.gaming || [];
    if (tab === "store") return data.store || [];
    if (tab === "payments") return data.payments || [];
    return [];
  }, [data, tab]);

  const accentColors = ["#FED7AA", "#FB923C", "#9A3412"];

  const openInvoice = async (url?: string) => {
    if (!url) return;
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
    } catch {}
  };

  // ✅ Payment label helper
  const PaymentBadge = ({ hosted_invoice_url }: { hosted_invoice_url?: string }) => {
    const paidOnline = !!hosted_invoice_url;

    if (paidOnline) {
      return (
        <View style={styles.payRow}>
          <Text style={styles.payStripe}>Paid online (Stripe)</Text>
          <TouchableOpacity onPress={() => openInvoice(hosted_invoice_url)} style={styles.linkBtn}>
            <Text style={styles.linkText}>Open invoice</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.payCashWrap}>
        <Text style={styles.payCash}>Paid in cash</Text>
      </View>
    );
  };

  const TabMedia = ({ k, active }: { k: TabKey; active: boolean }) => {
    const item = TAB_MEDIA[k];

    if (item.type === "image") {
      return (
        <Image
          source={item.src}
          style={[styles.tabMedia, !active && { opacity: 0.75 }]}
          resizeMode="cover"
        />
      );
    }

    return (
      <Video
        source={item.src}
        style={[styles.tabMedia, !active && { opacity: 0.75 }]}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
      />
    );
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.top}>
        <Text style={styles.h1}>My Bookings</Text>
        <Text style={styles.h2}>History • Payments • Store Orders</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Total Paid</Text>
            <Text style={styles.sumValue}>${grand.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Sports</Text>
            <Text style={styles.sumValue}>${sportsTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Gaming</Text>
            <Text style={styles.sumValue}>${gamingTotal.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Store</Text>
            <Text style={styles.sumValue}>${storeTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Tabs (titles replaced by media) */}
      <View style={{ paddingHorizontal: 14, marginBottom: 8 }}>
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;

            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setTab(t.key)}
                activeOpacity={0.9}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={
                    active
                      ? accentColors
                      : (["rgba(255,255,255,0.95)", "rgba(255,255,255,0.70)"] as any)
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <View style={styles.tabMediaWrap}>
                    <TabMedia k={t.key} active={active} />
                  </View>

                  {/* optional tiny label under media */}
                  <Text style={[styles.tabTinyLabel, active && { color: "#111827" }]}>
                    {t.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading history…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.muted, { color: "#B91C1C" }]}>{error}</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it, idx) => {
            const base =
              it?.reservation_id ??
              it?.session_id ??
              it?.payment_id ??
              it?.sports_payment_id ??
              it?.id ??
              idx;
            return `${tab}-${String(base)}-${idx}`;
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} />}
          contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 18 }}
          ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
          renderItem={({ item }) => {
            if (tab === "sports") {
              return (
                <Card>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.stadium_name ? `Stadium: ${item.stadium_name}` : "Sports Reservation"}
                  </Text>

                  <Text style={styles.sub}>
                    Date: {formatDate(item.reservation_date)} • {item.start_time || ""} - {item.end_time || ""}
                  </Text>

                  <Text style={styles.meta}>
                    Sport: {item.sport_name || "-"} • Status: {item.reservation_status || "-"}
                  </Text>

                  <Text style={styles.meta}>
                    Total: ${num(item.total_price)} • Paid: ${num(item.payment_amount)}
                  </Text>

                  <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
                </Card>
              );
            }

            if (tab === "gaming") {
              return (
                <Card>
                  <Text style={styles.title} numberOfLines={1}>
                    Gaming Session • {item.room_name ? item.room_name : "Room"}
                  </Text>

                  <Text style={styles.sub}>
                    Device: {item.device_name || "-"} • Type: {item.device_type || "-"}
                  </Text>

                  <Text style={styles.meta}>
                    Start: {formatDateTime(item.start_time)} • End: {formatDateTime(item.end_time)}
                  </Text>

                  <Text style={styles.meta}>
                    Hours: {num(item.hours_played)} • Amount: ${num(item.final_amount)}
                  </Text>

                  <Text style={styles.meta}>
                    Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
                  </Text>

                  <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
                </Card>
              );
            }

            if (tab === "store") {
              const items = Array.isArray(item.items) ? item.items : [];

              return (
                <Card>
                  <Text style={styles.title} numberOfLines={1}>
                    Store Order • {item.reservation_code || `#${item.reservation_id}`}
                  </Text>

                  <Text style={styles.sub}>
                    Status: {item.status || "-"} • Reserved: {formatDateTime(item.reserved_at)}
                  </Text>

                  {!!item.expires_at && (
                    <Text style={styles.meta}>Expires: {formatDateTime(item.expires_at)}</Text>
                  )}

                  <Text style={styles.meta}>
                    Fee: ${num(item.fee_amount)} • Total: ${num(item.final_price)}
                  </Text>

                  <Text style={styles.meta}>
                    Paid: {item.is_paid ? "Yes" : "No"} • Paid Amount: ${num(item.payment_amount)}
                  </Text>

                  {items.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.itemsHeader}>Items</Text>

                      {items.slice(0, 6).map((it: any, idx: number) => (
                        <View key={`${item.reservation_id}-${it.product_id}-${idx}`} style={styles.itemRow}>
                          {!!it.image_url ? (
                            <Image source={{ uri: it.image_url }} style={styles.itemImg} resizeMode="cover" />
                          ) : (
                            <View style={styles.itemImgPlaceholder}>
                              <Text style={{ color: "#6B7280", fontWeight: "800" }}>No</Text>
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {it.name || "Item"}
                            </Text>
                            <Text style={styles.itemLine} numberOfLines={1}>
                              Qty: {it.quantity || 1} • ${num(it.unit_price || it.price)}
                            </Text>
                          </View>
                        </View>
                      ))}

                      {items.length > 6 && <Text style={styles.more}>+{items.length - 6} more…</Text>}
                    </View>
                  )}

                  <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
                </Card>
              );
            }

            // payments tab
            if (tab === "payments") {
              const isStorePayment = item.module === "store";
              const storeItems = item.store_items || [];
              
              return (
                <Card>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>
                        {String(item.module || "payment").toUpperCase()} payment
                      </Text>

                      <Text style={styles.sub}>
                        Amount: ${num(item.amount)} {item.currency ? `(${item.currency})` : ""}
                      </Text>

                      <Text style={styles.meta}>
                        Status: {item.payment_status || "-"} • Stripe: {item.stripe_status || "-"}
                      </Text>

                      <Text style={styles.meta}>
                        Date: {formatDateTime(item.created_at)} • Ref: {item.ref_id || "-"}
                      </Text>

                      {/* Show product info for store payments */}
                      {isStorePayment && storeItems.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.storeItemsHeader}>
                            {storeItems.length} item{storeItems.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Show product image for store payments */}
                    {isStorePayment && storeItems.length > 0 && storeItems[0]?.image_url && (
                      <Image 
                        source={{ uri: storeItems[0].image_url }} 
                        style={styles.paymentProductImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  {/* Show all items for store payments */}
                  {isStorePayment && storeItems.length > 0 && (
                    <View style={styles.storeItemsContainer}>
                      {storeItems.slice(0, 3).map((item: any, idx: number) => (
                        <View key={`${item.product_id}-${idx}`} style={styles.storeItemRow}>
                          {item.image_url ? (
                            <Image 
                              source={{ uri: item.image_url }} 
                              style={styles.storeItemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.storeItemImagePlaceholder}>
                              <Text style={styles.storeItemPlaceholderText}>No image</Text>
                            </View>
                          )}
                          <View style={styles.storeItemInfo}>
                            <Text style={styles.storeItemName} numberOfLines={1}>
                              {item.name || "Item"}
                            </Text>
                            <Text style={styles.storeItemDetails} numberOfLines={1}>
                              Qty: {item.quantity || 1} • ${num(item.unit_price)}
                            </Text>
                            {item.category && (
                              <Text style={styles.storeItemCategory} numberOfLines={1}>
                                {item.category}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                      
                      {storeItems.length > 3 && (
                        <Text style={styles.moreItems}>
                          +{storeItems.length - 3} more items...
                        </Text>
                      )}
                    </View>
                  )}

                  <PaymentBadge hosted_invoice_url={item.hosted_invoice_url} />
                </Card>
              );
            }

            return null;
          }}
        />
      )}
    </View>
  );
}

/* Small reusable card */
function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function num(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function formatDate(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().slice(0, 10);
}

function formatDateTime(v: any) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toISOString().replace("T", " ").slice(0, 16);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF7ED" },

  top: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  h1: { color: "#111827", fontSize: 18, fontWeight: "900" },
  h2: { color: "#6B7280", marginTop: 4, fontSize: 12, fontWeight: "700" },

  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 16,
    padding: 10,
    minWidth: 120,
  },
  sumLabel: { color: "#6B7280", fontWeight: "900", fontSize: 11 },
  sumValue: { color: "#111827", fontWeight: "900", fontSize: 16, marginTop: 4 },

  tabsRow: { flexDirection: "row", gap: 10 },
  tabBtn: {
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  tabBtnActive: {
    borderColor: "rgba(154,52,18,0.30)",
  },

  // media tab "title"
  tabMediaWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  tabMedia: {
    width: "100%",
    height: "100%",
  },
  tabTinyLabel: {
    marginTop: 6,
    color: "#6B7280",
    fontWeight: "900",
    fontSize: 11,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  title: { color: "#111827", fontWeight: "900", fontSize: 14 },
  sub: { color: "#6B7280", marginTop: 6, fontWeight: "700" },
  meta: { color: "#9A3412", marginTop: 6, fontWeight: "800", fontSize: 12 },

  // payment label styles
  payRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  payStripe: { color: "#111827", fontWeight: "900", fontSize: 12 },
  payCashWrap: { marginTop: 10, alignItems: "center", justifyContent: "center" },
  payCash: { color: "#111827", fontWeight: "900", fontSize: 12 },

  itemsHeader: { color: "#111827", fontWeight: "900", marginBottom: 8 },

  itemRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 10 },
  itemImg: { width: 52, height: 52, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)" },
  itemImgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { color: "#111827", fontWeight: "900" },
  itemLine: { color: "#374151", fontWeight: "800" },

  more: { color: "#6B7280", fontWeight: "700", marginTop: 6 },

  linkBtn: { alignSelf: "flex-start" },
  linkText: { color: "#2563EB", fontWeight: "900" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  muted: { marginTop: 10, color: "#6B7280", fontWeight: "700" },
  empty: { color: "#6B7280", fontWeight: "700", padding: 14 },

  retryBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  retryText: { fontWeight: "900", color: "#111827" },

  // Payment product image
  paymentProductImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  // Store items in payments tab
  storeItemsHeader: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 13,
    marginBottom: 6,
  },

  storeItemsContainer: {
    marginTop: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  storeItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
    padding: 8,
  },

  storeItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  storeItemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  storeItemPlaceholderText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "700",
  },

  storeItemInfo: {
    flex: 1,
    marginLeft: 10,
  },

  storeItemName: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 13,
  },

  storeItemDetails: {
    color: "#374151",
    fontWeight: "800",
    fontSize: 11,
    marginTop: 2,
  },

  storeItemCategory: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 10,
    marginTop: 2,
    fontStyle: "italic",
  },

  moreItems: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
});