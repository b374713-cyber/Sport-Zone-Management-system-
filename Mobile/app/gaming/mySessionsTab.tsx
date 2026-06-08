// // // app/gaming/mySessionsTab.tsx
// // import React, { useEffect, useState, useCallback, useRef } from "react";
// // import {
// //   View,
// //   Text,
// //   ScrollView,
// //   TouchableOpacity,
// //   ActivityIndicator,
// //   StyleSheet,
// //   Alert,
// //   RefreshControl,
// //   Animated,
// //   Easing,
// //   Linking, // ✅ add this
// // } from "react-native";

// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import { LinearGradient } from "expo-linear-gradient";
// // import { API_BASE } from "../config/api";

// // //const API_BASE =
// //   //process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

// // type Session = any;

// // /* -------------------------
// //    ✅ Neon RGB Button
// // -------------------------- */
// // function NeonButton({
// //   title,
// //   onPress,
// //   variant = "cyan", // "cyan" | "red" | "green"
// // }: {
// //   title: string;
// //   onPress: () => void;
// //   variant?: "cyan" | "red" | "green";
// // }) {
// //   const glow = useRef(new Animated.Value(0)).current;

// //   useEffect(() => {
// //     Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(glow, {
// //           toValue: 1,
// //           duration: 1200,
// //           easing: Easing.inOut(Easing.quad),
// //           useNativeDriver: true,
// //         }),
// //         Animated.timing(glow, {
// //           toValue: 0,
// //           duration: 1200,
// //           easing: Easing.inOut(Easing.quad),
// //           useNativeDriver: true,
// //         }),
// //       ])
// //     ).start();
// //   }, []);

// //   const scale = glow.interpolate({
// //     inputRange: [0, 1],
// //     outputRange: [1, 1.03],
// //   });

// //   const opacity = glow.interpolate({
// //     inputRange: [0, 1],
// //     outputRange: [0.6, 1],
// //   });

// //     const gradientColors =
// //     (variant === "red"
// //       ? ["#ff005d", "#ff7a00", "#ff005d"]
// //       : variant === "green"
// //       ? ["#00ffb2", "#00c2ff", "#00ffb2"]
// //       : ["#00f0ff", "#8a2be2", "#00f0ff"]) as [
// //         string,
// //         string,
// //         ...string[]
// //       ];

// //   const innerBg =
// //     variant === "red"
// //       ? "#2a0b16"
// //       : variant === "green"
// //       ? "#06261f"
// //       : "#071b2a";

// //   return (
// //     <Animated.View style={{ transform: [{ scale }], opacity }}>
// //       <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
// //         <LinearGradient
// //           colors={gradientColors}
// //           start={{ x: 0, y: 0 }}
// //           end={{ x: 1, y: 1 }}
// //           style={styles.neonOuter}
// //         >
// //           <View style={[styles.neonInner, { backgroundColor: innerBg }]}>
// //             <Text style={styles.neonText}>{title}</Text>
// //           </View>
// //         </LinearGradient>
// //       </TouchableOpacity>
// //     </Animated.View>
// //   );
// // }

// // export default function MySessionsTab() {
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [user, setUser] = useState<any>(null);
// //   const [sessions, setSessions] = useState<Session[]>([]);

// //   useEffect(() => {
// //     (async () => {
// //       const raw = await AsyncStorage.getItem("customer");
// //       const c = raw ? JSON.parse(raw) : null;
// //       setUser(c);
// //       loadSessions(c);
// //     })();
// //   }, []);

// //   const loadSessions = async (cUser = user) => {
// //     try {
// //       setLoading(true);

// //       const res = await fetch(`${API_BASE}/api/gaming/sessions/active`);
// //       const data = await res.json();

// //       const all = data.sessions || [];

// //       const filtered = all.filter((s: any) => {
// //         if (!cUser) return false;

// //         const sameMember =
// //           String(s.member_id || "") === String(cUser.customer_id || "");

// //         const sameName =
// //           String(s.player_name || "").toLowerCase() ===
// //           String(cUser.name || "").toLowerCase();

// //         return sameMember || sameName;
// //       });

// //       setSessions(filtered);
// //     } catch (err) {
// //       console.log("load sessions error", err);
// //       Alert.alert("Error", "Failed to load your sessions.");
// //     } finally {
// //       setLoading(false);
// //       setRefreshing(false);
// //     }
// //   };

// //   const onRefresh = useCallback(() => {
// //     setRefreshing(true);
// //     loadSessions();
// //   }, [user]);
// // const payOnline = async (session_id: number) => {
// //   try {
// //     setLoading(true);

// //     const res = await fetch(`${API_BASE}/api/gaming/payments/create-invoice`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         session_id,
// //         customer_id: user?.customer_id || null,
// //       }),
// //     });

// //     const data = await res.json().catch(() => ({}));
// //     if (!res.ok) {
// //       Alert.alert("Payment error", data.error || "Failed to create invoice");
// //       return;
// //     }

// //     if (!data.hosted_invoice_url) {
// //       Alert.alert("Payment error", "Missing Stripe hosted invoice url");
// //       return;
// //     }

// //     await Linking.openURL(data.hosted_invoice_url);

// //     Alert.alert(
// //       "After Payment",
// //       "After you finish payment on Stripe, come back and press 'Check Payment'."
// //     );
// //   } catch (e: any) {
// //     Alert.alert("Network error", e.message || "Failed");
// //   } finally {
// //     setLoading(false);
// //   }
// // };

// // const payCash = async (session_id: number) => {
// //   try {
// //     setLoading(true);

// //     const res = await fetch(`${API_BASE}/api/gaming/payments/pay-cash`, {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({
// //         session_id,
// //         customer_id: user?.customer_id || null,
// //       }),
// //     });

// //     const data = await res.json().catch(() => ({}));
// //     if (!res.ok) {
// //       Alert.alert("Cash error", data.error || "Failed to set cash payment");
// //       return;
// //     }

// //     Alert.alert("✅ Cash Selected", "Pay at the center to confirm your session.");
// //   } catch (e: any) {
// //     Alert.alert("Network error", e.message || "Failed");
// //   } finally {
// //     setLoading(false);
// //   }
// // };

// // const checkPayment = async (session_id: number) => {
// //   try {
// //     setLoading(true);

// //     const res = await fetch(`${API_BASE}/api/gaming/payments/status/${session_id}`);
// //     const data = await res.json().catch(() => ({}));

// //     if (!res.ok) {
// //       Alert.alert("Status error", data.error || "Failed to check status");
// //       return;
// //     }

// //     if (data.is_paid) {
// //       Alert.alert("✅ Paid", "Payment confirmed. No need to pay in center.");
// //     } else {
// //       Alert.alert("⏳ Not Paid", "Payment not completed yet.");
// //     }
// //   } catch (e: any) {
// //     Alert.alert("Network error", e.message || "Failed");
// //   } finally {
// //     setLoading(false);
// //   }
// // };

// //   const endSession = (session_id: number) => {
// //     Alert.alert(
// //       "End Session?",
// //       "This will stop the session and calculate billing.",
// //       [
// //         { text: "Cancel", style: "cancel" },
// //         {
// //           text: "End Now",
// //           style: "destructive",
// //           onPress: async () => {
// //             try {
// //               setLoading(true);
// //               const res = await fetch(`${API_BASE}/api/gaming/sessions/end`, {
// //                 method: "POST",
// //                 headers: { "Content-Type": "application/json" },
// //                 body: JSON.stringify({ session_id }),
// //               });

// //               const data = await res.json();

// //               if (!res.ok) {
// //                 Alert.alert("Error", data.error || "Failed to end session");
// //                 return;
// //               }

// //               Alert.alert(
// //                 "✅ Session Ended",
// //                 `Hours: ${data.hours_played}\nAmount: ${data.final_amount}`
// //               );

// //               loadSessions();
// //             } catch (err) {
// //               console.log("end session error", err);
// //               Alert.alert("Error", "Failed to end session.");
// //             } finally {
// //               setLoading(false);
// //             }
// //           },
// //         },
// //       ]
// //     );
// //   };

// //   const deleteSession = (session_id: number) => {
// //     Alert.alert(
// //       "Delete Session?",
// //       "This will permanently delete the session.",
// //       [
// //         { text: "Cancel", style: "cancel" },
// //         {
// //           text: "Delete",
// //           style: "destructive",
// //           onPress: async () => {
// //             try {
// //               setLoading(true);

// //               const res = await fetch(
// //                 `${API_BASE}/api/gaming/sessions/${session_id}`,
// //                 { method: "DELETE" }
// //               );

// //               const data = await res.json();

// //               if (!res.ok) {
// //                 Alert.alert("Error", data.error || "Failed to delete session");
// //                 return;
// //               }

// //               Alert.alert("✅ Deleted", "Session removed successfully.");
// //               loadSessions();
// //             } catch (err) {
// //               console.log("delete session error", err);
// //               Alert.alert("Error", "Failed to delete session.");
// //             } finally {
// //               setLoading(false);
// //             }
// //           },
// //         },
// //       ]
// //     );
// //   };

// //   if (loading && sessions.length === 0) {
// //     return (
// //       <View style={styles.center}>
// //         <ActivityIndicator size="large" color="#22d3ee" />
// //         <Text style={{ color: "#9ca3af", marginTop: 8 }}>
// //           Loading your sessions...
// //         </Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <ScrollView
// //       contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
// //       refreshControl={
// //         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
// //       }
// //     >
// //       <Text style={styles.title}>🎫 My Sessions</Text>

// //       {sessions.length === 0 && (
// //         <Text style={styles.empty}>No sessions yet.</Text>
// //       )}






// //       {
// //   sessions.map((s) => (
// //     <View key={s.session_id} style={styles.card}>
// //       <Text style={styles.cardTitle}>
// //         Room {s.section}-{s.room_number} • {s.device_name}
// //       </Text>

// //       <Text style={styles.line}>
// //         Device: {s.device_type} | Slot #{s.slot_number}
// //       </Text>

// //       <Text style={styles.line}>
// //         Status:{" "}
// //         <Text
// //           style={{
// //             fontWeight: "900",
// //             color:
// //               s.status === "Active"
// //                 ? "#22c55e"
// //                 : s.status === "Reserved"
// //                 ? "#f59e0b"
// //                 : "#94a3b8",
// //           }}
// //         >
// //           {s.status}
// //         </Text>
// //       </Text>

// //       {s.planned_start_time && (
// //         <Text style={styles.line}>
// //           Planned: {String(s.planned_start_time).replace("T", " ").slice(0, 16)}
// //         </Text>
// //       )}

// //       {s.start_time && (
// //         <Text style={styles.line}>
// //           Started: {String(s.start_time).replace("T", " ").slice(0, 16)}
// //         </Text>
// //       )}

// //       {/* ✅ ACTIONS */}
// //       <View style={styles.actionsRow}>
// //         {s.status === "Active" && (
// //           <View style={{ flex: 1 }}>
// //             <NeonButton
// //               title="End Session"
// //               variant="green"
// //               onPress={() => endSession(s.session_id)}
// //             />
// //           </View>
// //         )}

// //         {s.status === "Reserved" && (
// //           <View style={{ flex: 1 }}>
// //             <NeonButton
// //               title="Cancel Reservation"
// //               variant="red"
// //               onPress={() => deleteSession(s.session_id)}
// //             />
// //           </View>
// //         )}
// //       </View>

// //       {/* ✅ PAYMENT ACTIONS */}
// //       <View style={{ marginTop: 12, gap: 10 }}>
// //         {(s.status === "Reserved" || s.status === "Active") && (
// //           <>
// //             <NeonButton
// //               title="Pay Online (Stripe)"
// //               variant="cyan"
// //               onPress={() => payOnline(s.session_id)}
// //             />

// //             <NeonButton
// //               title="Pay Cash in Center"
// //               variant="green"
// //               onPress={() => payCash(s.session_id)}
// //             />

// //             <NeonButton
// //               title="Check Payment"
// //               variant="cyan"
// //               onPress={() => checkPayment(s.session_id)}
// //             />
// //           </>
// //         )}
// //       </View>

// //       {s.status === "Completed" && (
// //         <View style={{ marginTop: 10 }}>
// //           <NeonButton
// //             title="Delete History"
// //             variant="cyan"
// //             onPress={() => deleteSession(s.session_id)}
// //           />
// //         </View>
// //       )}
// //     </View>
// //   ))
// // }


// //     </ScrollView>
// //   );


// // }

// // const styles = StyleSheet.create({
// //   center: {
// //     flex: 1,
// //     alignItems: "center",
// //     justifyContent: "center",
// //   },
// //   title: {
// //     color: "white",
// //     fontSize: 18,
// //     fontWeight: "900",
// //     marginBottom: 10,
// //   },
// //   empty: {
// //     color: "#9ca3af",
// //     marginTop: 20,
// //     textAlign: "center",
// //   },
// //   card: {
// //     backgroundColor: "#0f172a",
// //     borderRadius: 16,
// //     padding: 14,
// //     marginBottom: 12,
// //     borderWidth: 1,
// //     borderColor: "#1f2937",
// //   },
// //   cardTitle: {
// //     color: "white",
// //     fontWeight: "900",
// //     fontSize: 15,
// //     marginBottom: 6,
// //   },
// //   line: {
// //     color: "#cbd5e1",
// //     marginTop: 3,
// //     fontSize: 13,
// //   },
// //   actionsRow: {
// //     flexDirection: "row",
// //     gap: 10,
// //     marginTop: 12,
// //   },

// //   /* ---- Neon button styles ---- */
// //   neonOuter: {
// //     borderRadius: 14,
// //     padding: 2, // RGB border thickness
// //     shadowColor: "#00f0ff",
// //     shadowOpacity: 0.6,
// //     shadowRadius: 12,
// //     elevation: 6,
// //   },
// //   neonInner: {
// //     borderRadius: 12,
// //     paddingVertical: 12,
// //     alignItems: "center",
// //   },
// //   neonText: {
// //     color: "white",
// //     fontWeight: "900",
// //     fontSize: 13,
// //     letterSpacing: 0.5,
// //   },
// // });
// // app/gaming/mySessionsTab.tsx








// import React, { useEffect, useState, useCallback, useRef } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   StyleSheet,
//   Alert,
//   RefreshControl,
//   Animated,
//   Easing,
//   Linking,
//   AppState,
// } from "react-native";

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { LinearGradient } from "expo-linear-gradient";
// import { API_BASE } from "../config/api";

// type Session = any;

// /* -------------------------
//    ✅ Neon RGB Button
// -------------------------- */
// function NeonButton({
//   title,
//   onPress,
//   variant = "cyan", // "cyan" | "red" | "green"
// }: {
//   title: string;
//   onPress: () => void;
//   variant?: "cyan" | "red" | "green";
// }) {
//   const glow = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     const anim = Animated.loop(
//       Animated.sequence([
//         Animated.timing(glow, {
//           toValue: 1,
//           duration: 1200,
//           easing: Easing.inOut(Easing.quad),
//           useNativeDriver: true,
//         }),
//         Animated.timing(glow, {
//           toValue: 0,
//           duration: 1200,
//           easing: Easing.inOut(Easing.quad),
//           useNativeDriver: true,
//         }),
//       ])
//     );
//     anim.start();
//     return () => anim.stop();
//   }, [glow]);

//   const scale = glow.interpolate({
//     inputRange: [0, 1],
//     outputRange: [1, 1.03],
//   });

//   const opacity = glow.interpolate({
//     inputRange: [0, 1],
//     outputRange: [0.6, 1],
//   });

//   const gradientColors =
//     (variant === "red"
//       ? ["#ff005d", "#ff7a00", "#ff005d"]
//       : variant === "green"
//       ? ["#00ffb2", "#00c2ff", "#00ffb2"]
//       : ["#00f0ff", "#8a2be2", "#00f0ff"]) as [string, string, ...string[]];

//   const innerBg =
//     variant === "red" ? "#2a0b16" : variant === "green" ? "#06261f" : "#071b2a";

//   return (
//     <Animated.View style={{ transform: [{ scale }], opacity }}>
//       <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
//         <LinearGradient
//           colors={gradientColors}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.neonOuter}
//         >
//           <View style={[styles.neonInner, { backgroundColor: innerBg }]}>
//             <Text style={styles.neonText}>{title}</Text>
//           </View>
//         </LinearGradient>
//       </TouchableOpacity>
//     </Animated.View>
//   );
// }

// export default function MySessionsTab() {
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [user, setUser] = useState<any>(null);
//   const [sessions, setSessions] = useState<Session[]>([]);

//   // ✅ remembers last Stripe session we opened
//   const [pendingStripeSessionId, setPendingStripeSessionId] = useState<number | null>(null);

//   useEffect(() => {
//     (async () => {
//       const raw = await AsyncStorage.getItem("customer");
//       const c = raw ? JSON.parse(raw) : null;
//       setUser(c);
//       loadSessions(c);
//     })();
//   }, []);

//   // ✅ Auto-check payment when app returns from Stripe
//   useEffect(() => {
//     const sub = AppState.addEventListener("change", async (state) => {
//       if (state === "active" && pendingStripeSessionId) {
//         // user came back from Stripe -> check payment automatically
//         await checkPayment(pendingStripeSessionId, { silentReload: true, autoNotify: true });
//       }
//     });
//     return () => sub.remove();
//   }, [pendingStripeSessionId]);

//   const loadSessions = async (cUser = user) => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${API_BASE}/api/gaming/sessions/active`);
//       const data = await res.json();

//       const all = data.sessions || [];

//       const filtered = all.filter((s: any) => {
//         if (!cUser) return false;

//         const sameMember =
//           String(s.member_id || "") === String(cUser.customer_id || "");

//         const sameName =
//           String(s.player_name || "").toLowerCase() ===
//           String(cUser.name || "").toLowerCase();

//         return sameMember || sameName;
//       });

//       setSessions(filtered);
//     } catch (err) {
//       console.log("load sessions error", err);
//       Alert.alert("Error", "Failed to load your sessions.");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     loadSessions();
//   }, [user]);

//   const payOnline = async (session_id: number) => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${API_BASE}/api/gaming/payments/create-invoice`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id,
//           customer_id: user?.customer_id || null,
//         }),
//       });

//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         Alert.alert("Payment error", data.error || "Failed to create invoice");
//         return;
//       }

//       if (!data.hosted_invoice_url) {
//         Alert.alert("Payment error", "Missing Stripe hosted invoice url");
//         return;
//       }

//       // ✅ remember which session we sent to Stripe
//       setPendingStripeSessionId(session_id);

//       await Linking.openURL(data.hosted_invoice_url);

//       Alert.alert(
//         "Stripe Opened",
//         "After you finish payment, return to the app — it will confirm automatically."
//       );
//     } catch (e: any) {
//       Alert.alert("Network error", e.message || "Failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const payCash = async (session_id: number) => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${API_BASE}/api/gaming/payments/pay-cash`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id,
//           customer_id: user?.customer_id || null,
//           confirm: false, // mobile = just choose cash (not paid yet)
//         }),
//       });

//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         Alert.alert("Cash error", data.error || "Failed to set cash payment");
//         return;
//       }

//       Alert.alert("✅ Cash Selected", "Pay at the center to confirm your session.");
//       loadSessions();
//     } catch (e: any) {
//       Alert.alert("Network error", e.message || "Failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ supports auto notify + silent reload
//   const checkPayment = async (
//     session_id: number,
//     opts?: { silentReload?: boolean; autoNotify?: boolean }
//   ) => {
//     try {
//       if (!opts?.silentReload) setLoading(true);

//       const res = await fetch(`${API_BASE}/api/gaming/payments/status/${session_id}`);
//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         if (!opts?.silentReload) Alert.alert("Status error", data.error || "Failed to check status");
//         return;
//       }

//       if (data.is_paid) {
//         // ✅ clear pending when paid
//         setPendingStripeSessionId(null);

//         if (opts?.autoNotify) {
//           Alert.alert("✅ Paid", "Payment confirmed. Reservation is now confirmed ✅");
//         } else {
//           Alert.alert("✅ Paid", "Reservation confirmed. No need to pay in center.");
//         }
//       } else {
//         if (!opts?.silentReload) {
//           Alert.alert("⏳ Not Paid", "Payment not completed yet.");
//         }
//       }

//       loadSessions();
//     } catch (e: any) {
//       if (!opts?.silentReload) Alert.alert("Network error", e.message || "Failed");
//     } finally {
//       if (!opts?.silentReload) setLoading(false);
//     }
//   };

//   const endSession = (session_id: number) => {
//     Alert.alert(
//       "End Session?",
//       "This will stop the session and calculate billing.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "End Now",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setLoading(true);
//               const res = await fetch(`${API_BASE}/api/gaming/sessions/end`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ session_id }),
//               });

//               const data = await res.json();

//               if (!res.ok) {
//                 Alert.alert("Error", data.error || "Failed to end session");
//                 return;
//               }

//               Alert.alert(
//                 "✅ Session Ended",
//                 `Hours: ${data.hours_played}\nAmount: ${data.final_amount}`
//               );

//               loadSessions();
//             } catch (err) {
//               console.log("end session error", err);
//               Alert.alert("Error", "Failed to end session.");
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const deleteSession = (session_id: number) => {
//     Alert.alert(
//       "Delete Session?",
//       "This will permanently delete the session.",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             try {
//               setLoading(true);

//               const res = await fetch(`${API_BASE}/api/gaming/sessions/${session_id}`, {
//                 method: "DELETE",
//               });

//               const data = await res.json();

//               if (!res.ok) {
//                 Alert.alert("Error", data.error || "Failed to delete session");
//                 return;
//               }

//               Alert.alert("✅ Deleted", "Session removed successfully.");
//               loadSessions();
//             } catch (err) {
//               console.log("delete session error", err);
//               Alert.alert("Error", "Failed to delete session.");
//             } finally {
//               setLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   if (loading && sessions.length === 0) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#22d3ee" />
//         <Text style={{ color: "#9ca3af", marginTop: 8 }}>
//           Loading your sessions...
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView
//       contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//       }
//     >
//       <Text style={styles.title}>🎫 My Sessions</Text>

//       {sessions.length === 0 && (
//         <Text style={styles.empty}>No sessions yet.</Text>
//       )}

//       {sessions.map((s) => (
//         <View key={s.session_id} style={styles.card}>
//           <Text style={styles.cardTitle}>
//             Room {s.section}-{s.room_number} • {s.device_name}
//           </Text>

//           <Text style={styles.line}>
//             Device: {s.device_type} | Slot #{s.slot_number}
//           </Text>

//           <Text style={styles.line}>
//             Status:{" "}
//             <Text
//               style={{
//                 fontWeight: "900",
//                 color:
//                   s.status === "Active"
//                     ? "#22c55e"
//                     : s.status === "Reserved"
//                     ? "#f59e0b"
//                     : "#94a3b8",
//               }}
//             >
//               {s.status}
//             </Text>
//           </Text>

//           <Text style={styles.line}>
//             Payment:{" "}
//             <Text
//               style={{
//                 fontWeight: "900",
//                 color: s.payment_is_paid ? "#22c55e" : "#f59e0b",
//               }}
//             >
//               {s.payment_is_paid
//                 ? "Paid ✅"
//                 : s.payment_stripe_status === "cash"
//                 ? "Cash (Center) ⏳"
//                 : "Pending ⏳"}
//             </Text>
//           </Text>

//           {s.planned_start_time && (
//             <Text style={styles.line}>
//               Planned: {String(s.planned_start_time).replace("T", " ").slice(0, 16)}
//             </Text>
//           )}

//           {s.start_time && (
//             <Text style={styles.line}>
//               Started: {String(s.start_time).replace("T", " ").slice(0, 16)}
//             </Text>
//           )}

//           <View style={styles.actionsRow}>
//             {s.status === "Active" && (
//               <View style={{ flex: 1 }}>
//                 <NeonButton
//                   title="End Session"
//                   variant="green"
//                   onPress={() => endSession(s.session_id)}
//                 />
//               </View>
//             )}

//             {s.status === "Reserved" && (
//               <View style={{ flex: 1 }}>
//                 <NeonButton
//                   title="Cancel Reservation"
//                   variant="red"
//                   onPress={() => deleteSession(s.session_id)}
//                 />
//               </View>
//             )}
//           </View>

//           <View style={{ marginTop: 12, gap: 10 }}>
//             {(s.status === "Reserved" || s.status === "Active") && (
//               <>
//                 {!s.payment_is_paid && (
//                   <>
//                     <NeonButton
//                       title="Pay Online (Stripe)"
//                       variant="cyan"
//                       onPress={() => payOnline(s.session_id)}
//                     />

//                     <NeonButton
//                       title="Pay Cash in Center"
//                       variant="green"
//                       onPress={() => payCash(s.session_id)}
//                     />
//                   </>
//                 )}

//                 <NeonButton
//                   title="Check Payment"
//                   variant="cyan"
//                   onPress={() => checkPayment(s.session_id)}
//                 />

//                 {s.payment_invoice_pdf_url && (
//                   <NeonButton
//                     title="Open Invoice PDF"
//                     variant="cyan"
//                     onPress={() => Linking.openURL(s.payment_invoice_pdf_url)}
//                   />
//                 )}

//                 {s.payment_hosted_invoice_url && !s.payment_is_paid && (
//                   <NeonButton
//                     title="Open Stripe Payment Page"
//                     variant="cyan"
//                     onPress={() => Linking.openURL(s.payment_hosted_invoice_url)}
//                   />
//                 )}
//               </>
//             )}
//           </View>

//           {s.status === "Completed" && (
//             <View style={{ marginTop: 10 }}>
//               <NeonButton
//                 title="Delete History"
//                 variant="cyan"
//                 onPress={() => deleteSession(s.session_id)}
//               />
//             </View>
//           )}
//         </View>
//       ))}
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, alignItems: "center", justifyContent: "center" },
//   title: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 10 },
//   empty: { color: "#9ca3af", marginTop: 20, textAlign: "center" },
//   card: {
//     backgroundColor: "#0f172a",
//     borderRadius: 16,
//     padding: 14,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#1f2937",
//   },
//   cardTitle: { color: "white", fontWeight: "900", fontSize: 15, marginBottom: 6 },
//   line: { color: "#cbd5e1", marginTop: 3, fontSize: 13 },
//   actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },

//   neonOuter: {
//     borderRadius: 14,
//     padding: 2,
//     shadowColor: "#00f0ff",
//     shadowOpacity: 0.6,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   neonInner: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
//   neonText: { color: "white", fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
// });
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Animated,
  Easing,
  Linking,
  AppState,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

import { API_BASE } from "../config/api";

type Session = any;

const REWARD_OFFER_CODE = "FREE_3H";

/* -------------------------
   ✅ Neon RGB Button
-------------------------- */
function NeonButton({
  title,
  onPress,
  variant = "cyan",
}: {
  title: string;
  onPress: () => void;
  variant?: "cyan" | "red" | "green";
}) {
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [glow]);

  const scale = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const opacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const gradientColors =
    (variant === "red"
      ? ["#ff005d", "#ff7a00", "#ff005d"]
      : variant === "green"
      ? ["#00ffb2", "#00c2ff", "#00ffb2"]
      : ["#00f0ff", "#8a2be2", "#00f0ff"]) as [string, string, ...string[]];

  const innerBg =
    variant === "red" ? "#2a0b16" : variant === "green" ? "#06261f" : "#071b2a";

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.neonOuter}
        >
          <View style={[styles.neonInner, { backgroundColor: innerBg }]}>
            <Text style={styles.neonText}>{title}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MySessionsTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [pendingStripeSessionId, setPendingStripeSessionId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("customer");
      const c = raw ? JSON.parse(raw) : null;
      setUser(c);
      loadSessions(c);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && pendingStripeSessionId) {
        await checkPayment(pendingStripeSessionId, { silentReload: true, autoNotify: true });
      }
    });
    return () => sub.remove();
  }, [pendingStripeSessionId]);

  const isFreeWinnerSession = (s: any) => {
    return String(s?.offer_code || "") === REWARD_OFFER_CODE;
  };

  const loadSessions = async (cUser = user) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/gaming/sessions/active`);
      const data = await res.json();

      const all = data.sessions || [];

      const filtered = all.filter((s: any) => {
        if (!cUser) return false;

        const sameMember =
          String(s.member_id || "") === String(cUser.customer_id || "");

        const sameName =
          String(s.player_name || "").toLowerCase() ===
          String(cUser.name || "").toLowerCase();

        return sameMember || sameName;
      });

      setSessions(filtered);
    } catch (err) {
      console.log("load sessions error", err);
      Alert.alert("Error", "Failed to load your sessions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, [user]);

  const payOnline = async (session_id: number) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/gaming/payments/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          customer_id: user?.customer_id || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert("Payment error", data.error || "Failed to create invoice");
        return;
      }

      if (!data.hosted_invoice_url) {
        Alert.alert("Payment error", "Missing Stripe hosted invoice url");
        return;
      }

      setPendingStripeSessionId(session_id);
     // ✅ open Stripe inside the app (like Sport)
await WebBrowser.openBrowserAsync(data.hosted_invoice_url);

// ✅ when user closes Stripe page, auto-check payment
await checkPayment(session_id, { silentReload: true, autoNotify: true });

      Alert.alert(
        "Stripe Opened",
        "After you finish payment, return to the app — it will confirm automatically."
      );
    } catch (e: any) {
      Alert.alert("Network error", e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const payCash = async (session_id: number) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/gaming/payments/pay-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          customer_id: user?.customer_id || null,
          confirm: false,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert("Cash error", data.error || "Failed to set cash payment");
        return;
      }

      Alert.alert("✅ Cash Selected", "Pay at the center to confirm your session.");
      loadSessions();
    } catch (e: any) {
      Alert.alert("Network error", e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async (
    session_id: number,
    opts?: { silentReload?: boolean; autoNotify?: boolean }
  ) => {
    try {
      if (!opts?.silentReload) setLoading(true);

      const res = await fetch(`${API_BASE}/api/gaming/payments/status/${session_id}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (!opts?.silentReload) Alert.alert("Status error", data.error || "Failed to check status");
        return;
      }

      if (data.is_paid) {
        setPendingStripeSessionId(null);

        if (opts?.autoNotify) {
          Alert.alert("✅ Paid", "Payment confirmed. Reservation is now confirmed ✅");
        } else {
          Alert.alert("✅ Paid", "Reservation confirmed. No need to pay in center.");
        }
      } else {
        if (!opts?.silentReload) {
          Alert.alert("⏳ Not Paid", "Payment not completed yet.");
        }
      }

      loadSessions();
    } catch (e: any) {
      if (!opts?.silentReload) Alert.alert("Network error", e.message || "Failed");
    } finally {
      if (!opts?.silentReload) setLoading(false);
    }
  };

  const endSession = (session_id: number) => {
    Alert.alert(
      "End Session?",
      "This will stop the session and calculate billing.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Now",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await fetch(`${API_BASE}/api/gaming/sessions/end`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id }),
              });

              const data = await res.json();

              if (!res.ok) {
                Alert.alert("Error", data.error || "Failed to end session");
                return;
              }

              Alert.alert(
                "✅ Session Ended",
                `Hours: ${data.hours_played}\nAmount: ${data.final_amount}`
              );

              loadSessions();
            } catch (err) {
              console.log("end session error", err);
              Alert.alert("Error", "Failed to end session.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteSession = (session_id: number) => {
    Alert.alert(
      "Delete Session?",
      "This will permanently delete the session.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const res = await fetch(`${API_BASE}/api/gaming/sessions/${session_id}`, {
                method: "DELETE",
              });

              const data = await res.json();

              if (!res.ok) {
                Alert.alert("Error", data.error || "Failed to delete session");
                return;
              }

              Alert.alert("✅ Deleted", "Session removed successfully.");
              loadSessions();
            } catch (err) {
              console.log("delete session error", err);
              Alert.alert("Error", "Failed to delete session.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && sessions.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={{ color: "#9ca3af", marginTop: 8 }}>
          Loading your sessions...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: 120 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>🎫 My Sessions</Text>

      {sessions.length === 0 && (
        <Text style={styles.empty}>No sessions yet.</Text>
      )}

      {sessions.map((s) => {
        const isFree = isFreeWinnerSession(s);

        return (
          <View key={s.session_id} style={styles.card}>
            <Text style={styles.cardTitle}>
              Room {s.section}-{s.room_number} • {s.device_name}
            </Text>

            <Text style={styles.line}>
              Device: {s.device_type} | Slot #{s.slot_number}
            </Text>

            <Text style={styles.line}>
              Status:{" "}
              <Text
                style={{
                  fontWeight: "900",
                  color:
                    s.status === "Active"
                      ? "#22c55e"
                      : s.status === "Reserved"
                      ? "#f59e0b"
                      : "#94a3b8",
                }}
              >
                {s.status}
              </Text>
            </Text>

            {/* ✅ Payment line: if FREE -> remove pending */}
            <Text style={styles.line}>
              Payment:{" "}
              <Text
                style={{
                  fontWeight: "900",
                  color: isFree ? "#ffd700" : s.payment_is_paid ? "#22c55e" : "#f59e0b",
                }}
              >
                {isFree
                  ? "FREE 🎉"
                  : s.payment_is_paid
                  ? "Paid ✅"
                  : s.payment_stripe_status === "cash"
                  ? "Cash (Center) ⏳"
                  : "Pending ⏳"}
              </Text>
            </Text>

            {s.planned_start_time && (
              <Text style={styles.line}>
                Planned: {String(s.planned_start_time).replace("T", " ").slice(0, 16)}
              </Text>
            )}

            {s.start_time && (
              <Text style={styles.line}>
                Started: {String(s.start_time).replace("T", " ").slice(0, 16)}
              </Text>
            )}

            <View style={styles.actionsRow}>
              {s.status === "Active" && (
                <View style={{ flex: 1 }}>
                  <NeonButton
                    title="End Session"
                    variant="green"
                    onPress={() => endSession(s.session_id)}
                  />
                </View>
              )}

              {/* ✅ keep cancel for reserved (even if free) */}
              {s.status === "Reserved" && (
                <View style={{ flex: 1 }}>
                  <NeonButton
                    title="Cancel Reservation"
                    variant="red"
                    onPress={() => deleteSession(s.session_id)}
                  />
                </View>
              )}
            </View>

            {/* ✅ PAYMENT BUTTONS (hide if FREE) */}
            {!isFree && (
              <View style={{ marginTop: 12, gap: 10 }}>
                {(s.status === "Reserved" || s.status === "Active") && (
                  <>
                    {!s.payment_is_paid && (
                      <>
                        <NeonButton
                          title="Pay Online (Stripe)"
                          variant="cyan"
                          onPress={() => payOnline(s.session_id)}
                        />

                        <NeonButton
                          title="Pay Cash in Center"
                          variant="green"
                          onPress={() => payCash(s.session_id)}
                        />
                      </>
                    )}

                    <NeonButton
                      title="Check Payment"
                      variant="cyan"
                      onPress={() => checkPayment(s.session_id)}
                    />

                    {s.payment_invoice_pdf_url && (
                      <NeonButton
                        title="Open Invoice PDF"
                        variant="cyan"
                        onPress={() => Linking.openURL(s.payment_invoice_pdf_url)}
                      />
                    )}

                    {s.payment_hosted_invoice_url && !s.payment_is_paid && (
                      <NeonButton
                        title="Open Stripe Payment Page"
                        variant="cyan"
                        onPress={() => Linking.openURL(s.payment_hosted_invoice_url)}
                      />
                    )}
                  </>
                )}
              </View>
            )}

            {s.status === "Completed" && (
              <View style={{ marginTop: 10 }}>
                <NeonButton
                  title="Delete History"
                  variant="cyan"
                  onPress={() => deleteSession(s.session_id)}
                />
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  empty: { color: "#9ca3af", marginTop: 20, textAlign: "center" },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardTitle: { color: "white", fontWeight: "900", fontSize: 15, marginBottom: 6 },
  line: { color: "#cbd5e1", marginTop: 3, fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },

  neonOuter: {
    borderRadius: 14,
    padding: 2,
    shadowColor: "#00f0ff",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  neonInner: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  neonText: { color: "white", fontWeight: "900", fontSize: 13, letterSpacing: 0.5 },
});
