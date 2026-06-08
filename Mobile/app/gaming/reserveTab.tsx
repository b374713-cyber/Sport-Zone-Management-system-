// // app/gaming/reserveTab.tsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   TextInput,
//   Alert,
//   Linking,
//   AppState,
//   AppStateStatus,
// } from "react-native";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// // DateTime Picker (Expo compatible)
// let DateTimePicker: any = null;
// try {
//   DateTimePicker = require("@react-native-community/datetimepicker").default;
// } catch {}

// // dynamic video (optional)
// let VideoComp: any = null;
// try {
//   VideoComp = require("expo-video").VideoView;
// } catch {}
// try {
//   if (!VideoComp) VideoComp = require("expo-av").Video;
// } catch {}

// import { API_BASE } from "../config/api";

// const FIXED_OFFERS = [
//   { code: "1H", label: "1 Hour", minutes: 60 },
//   { code: "2H", label: "2 Hours", minutes: 120 },
//   { code: "2H+1FREE", label: "2H + 1H Free", minutes: 180 },
// ];

// export default function ReserveTab() {
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(false);

//   const [rooms, setRooms] = useState<any[]>([]);
//   const [devices, setDevices] = useState<any[]>([]);
//   const [showDevices, setShowDevices] = useState(false);

//   const [availableTimes, setAvailableTimes] = useState<string[]>([]);
//   const [loadingTimes, setLoadingTimes] = useState(false);

//   // ✅ calendar state
//   const [showPicker, setShowPicker] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);

//   const [form, setForm] = useState({
//     player_name: "",
//     session_type: "Open", // Open | Fixed
//     room_id: "",
//     device_id: "",
//     offer_code: "1H",
//     planned_start_time: "", // ISO without seconds
//   });

//   // ✅ Stripe “come back and auto-check” state
//   const [pendingStripeSessionId, setPendingStripeSessionId] = useState<number | null>(null);
//   const appStateRef = useRef<AppStateStatus>(AppState.currentState);

//   useEffect(() => {
//     (async () => {
//       const raw = await AsyncStorage.getItem("customer");
//       const c = raw ? JSON.parse(raw) : null;
//       setUser(c);

//       if (c?.name) {
//         setForm((f) => ({ ...f, player_name: c.name }));
//       }

//       await loadRooms();
//       await loadDevices();
//     })();
//   }, []);

//   // ✅ When app becomes active again (user returns from Stripe), auto-check payment
//   useEffect(() => {
//     const sub = AppState.addEventListener("change", async (nextState) => {
//       const prevState = appStateRef.current;
//       appStateRef.current = nextState;

//       if (
//         (prevState === "inactive" || prevState === "background") &&
//         nextState === "active" &&
//         pendingStripeSessionId
//       ) {
//         await checkGamingPaymentStatus(pendingStripeSessionId, true);
//       }
//     });

//     return () => sub.remove();
//   }, [pendingStripeSessionId]);

//   const loadRooms = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/gaming/rooms`);
//       const data = await res.json();
//       setRooms(data.rooms || data || []);
//     } catch (e) {
//       console.log("rooms error", e);
//     }
//   };

//   const loadDevices = async () => {
//     try {
//       const res = await fetch(`${API_BASE}/api/gaming/devices`);
//       const data = await res.json();
//       setDevices(data.devices || data || []);
//     } catch (e) {
//       console.log("devices error", e);
//     }
//   };

//   const formatRoomLabel = (r: any) => {
//     const sectionLetter = String(r.section) === "1" ? "A" : "B";
//     return `${sectionLetter} - Room ${r.room_number}`;
//   };

//   const filteredDevices = useMemo(() => {
//     if (!form.room_id) return [];
//     return devices.filter((d) => String(d.room_id) === String(form.room_id));
//   }, [devices, form.room_id]);

//   // ✅ load free times for selected device + selected date
//   const loadAvailableTimes = async (deviceId: string, date?: Date | null) => {
//     if (!deviceId) return;

//     setLoadingTimes(true);
//     setAvailableTimes([]);

//     try {
//       const dayStr = date ? date.toISOString().slice(0, 10) : null;

//       const url = dayStr
//         ? `${API_BASE}/api/gaming/available-times/${deviceId}?date=${dayStr}`
//         : `${API_BASE}/api/gaming/available-times/${deviceId}`;

//       const res = await fetch(url);
//       const data = await res.json().catch(() => ({}));

//       if (res.ok && Array.isArray(data.times)) {
//         setAvailableTimes(data.times);
//       } else {
//         setAvailableTimes([]);
//       }
//     } catch (e) {
//       console.log("available times error", e);
//       setAvailableTimes([]);
//     } finally {
//       setLoadingTimes(false);
//     }
//   };

//   const onPickDate = (event: any, date?: Date) => {
//     setShowPicker(false);
//     if (!date) return;

//     setSelectedDate(date);

//     const isoNoSeconds = date.toISOString().slice(0, 16); // yyyy-mm-ddThh:mm
//     setForm((f) => ({ ...f, planned_start_time: isoNoSeconds }));

//     // reload free times for this day
//     if (form.device_id) {
//       loadAvailableTimes(form.device_id, date);
//     }
//   };

//   const createInvoiceAndOpenStripe = async (sessionId: number) => {
//     try {
//       setLoading(true);

//       const res = await fetch(`${API_BASE}/api/gaming/payments/create-invoice`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id: sessionId,
//           customer_id: user?.customer_id || null,
//         }),
//       });

//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         Alert.alert("Payment error", data.error || "Failed to create Stripe invoice");
//         return;
//       }

//       if (!data.hosted_invoice_url) {
//         Alert.alert("Payment error", "Stripe hosted invoice url is missing.");
//         return;
//       }

//       // ✅ remember session so when user returns to app we auto-check
//       setPendingStripeSessionId(sessionId);

//       // Open Stripe payment page
//       await Linking.openURL(data.hosted_invoice_url);

//       // (Optional) quick hint
//       Alert.alert("Stripe Opened", "Complete payment then return to the app.");
//     } catch (e: any) {
//       Alert.alert("Network error", e.message || "Payment request failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ checks backend payment status
//   // silent=true means no “Pending” alert spam, only show success or one message
//   const checkGamingPaymentStatus = async (sessionId: number, fromReturn = false) => {
//     try {
//       const res = await fetch(`${API_BASE}/api/gaming/payments/status/${sessionId}`);
//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         if (!fromReturn) Alert.alert("Status error", data.error || "Failed to check payment status");
//         return;
//       }

//       if (data.is_paid) {
//         Alert.alert("Paid ✅", "Payment confirmed. Your reservation is confirmed.");
//         setPendingStripeSessionId(null); // ✅ stop auto-check
//       } else {
//         if (!fromReturn) {
//           Alert.alert("Pending ⏳", "Payment not completed yet.");
//         } else {
//           // coming back from Stripe but payment not done
//           Alert.alert("Pending ⏳", "Payment is not completed yet. If you paid, wait a moment then try again.");
//         }
//       }
//     } catch (e: any) {
//       if (!fromReturn) Alert.alert("Network error", e.message || "Failed to check payment status");
//     }
//   };

//   // ✅ cash selection (pending) — this is for MOBILE only (not confirming paid)
//   const setCashPending = async (sessionId: number) => {
//     try {
//       setLoading(true);

//       const r = await fetch(`${API_BASE}/api/gaming/payments/pay-cash`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           session_id: sessionId,
//           customer_id: user?.customer_id || null,
//           confirm: false, // ✅ important: only pending cash choice
//         }),
//       });

//       const j = await r.json().catch(() => ({}));
//       if (!r.ok) {
//         Alert.alert("Cash payment error", j.error || "Failed to set cash payment");
//         return;
//       }

//       Alert.alert("Cash Selected ✅", "Your session is reserved. Pay at the center to confirm.");
//     } catch (e: any) {
//       Alert.alert("Network error", e.message || "Failed to set cash payment");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const reserveNow = async () => {
//     if (!user) {
//       Alert.alert("Login required", "Please login first.");
//       return;
//     }

//     if (!form.player_name || !form.device_id) {
//       Alert.alert("Missing fields", "player name and device are required.");
//       return;
//     }

//     if (!form.planned_start_time) {
//       Alert.alert("Pick time", "Please select date/time first.");
//       return;
//     }

//     setLoading(true);

//     const payload: any = {
//       player_name: form.player_name.trim(),
//       session_type: form.session_type,
//       device_id: Number(form.device_id),

//       member_id: user?.member_id || null,
//       customer_id: user?.customer_id || null,

//       offer_code: form.session_type === "Fixed" ? form.offer_code : null,
//       planned_start_time: form.planned_start_time + ":00",
//     };

//     try {
//       const res = await fetch(`${API_BASE}/api/gaming/sessions/start`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json().catch(() => ({}));

//       if (!res.ok) {
//         Alert.alert("Reserve failed", data.error || "Unknown error");
//         return;
//       }

//       const sessionId = data?.session?.session_id;

//       Alert.alert("✅ Reserved", "Your session is reserved. Choose payment method:", [
//         {
//           text: "Pay Cash in Center",
//           onPress: async () => {
//             if (!sessionId) {
//               Alert.alert("Error", "Missing session id from server response.");
//               return;
//             }
//             await setCashPending(sessionId);
//           },
//         },
//         {
//           text: "Pay Online (Stripe)",
//           onPress: () => {
//             if (!sessionId) {
//               Alert.alert("Error", "Missing session id from server response.");
//               return;
//             }
//             createInvoiceAndOpenStripe(sessionId);
//           },
//         },
//         {
//           text: "Check Payment",
//           onPress: async () => {
//             if (!sessionId) {
//               Alert.alert("Error", "Missing session id from server response.");
//               return;
//             }
//             await checkGamingPaymentStatus(sessionId, false);
//           },
//         },
//         { text: "Close", style: "cancel" },
//       ]);

//       // reset UI
//       setForm((f) => ({
//         ...f,
//         device_id: "",
//         planned_start_time: "",
//       }));
//       setSelectedDate(null);
//       setAvailableTimes([]);
//       setShowDevices(false);
//     } catch (e: any) {
//       Alert.alert("Network error", e.message || "Failed request");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
//       {/* HERO */}
//       <View style={styles.hero}>
//         {VideoComp ? (
//           <View style={styles.videoWrap}>
//             <VideoComp
//               source={require("../../assets/animations/ps5.mp4")}
//               style={styles.video}
//               resizeMode="cover"
//               shouldPlay
//               isLooping
//               isMuted
//             />
//             <View style={styles.videoOverlay} />
//           </View>
//         ) : (
//           <View style={styles.heroFallback} />
//         )}

//         <Text style={styles.heroTitle}>Reserve Your Gaming Session</Text>
//         <Text style={styles.heroSub}>Choose room, device, and free slot 🎮</Text>
//       </View>

//       {/* Player name */}
//       <Text style={styles.label}>Player Name *</Text>
//       <TextInput
//         style={styles.input}
//         value={form.player_name}
//         onChangeText={(t) => setForm({ ...form, player_name: t })}
//         placeholder="Your name"
//         placeholderTextColor="#64748b"
//       />

//       {/* Session type */}
//       <Text style={styles.label}>Session Type</Text>
//       <View style={styles.rowWrap}>
//         {["Open", "Fixed"].map((t) => (
//           <TouchableOpacity
//             key={t}
//             style={[styles.chip, form.session_type === t && styles.chipActive]}
//             onPress={() => setForm({ ...form, session_type: t })}
//           >
//             <Text style={[styles.chipText, form.session_type === t && styles.chipTextActive]}>
//               {t}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Offer if fixed */}
//       {form.session_type === "Fixed" && (
//         <>
//           <Text style={styles.label}>Offer</Text>
//           <View style={styles.rowWrap}>
//             {FIXED_OFFERS.map((o) => (
//               <TouchableOpacity
//                 key={o.code}
//                 style={[styles.offerChip, form.offer_code === o.code && styles.offerChipActive]}
//                 onPress={() => setForm({ ...form, offer_code: o.code })}
//               >
//                 <Text
//                   style={[
//                     styles.offerChipText,
//                     form.offer_code === o.code && styles.offerChipTextActive,
//                   ]}
//                 >
//                   {o.label}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </>
//       )}

//       {/* Rooms */}
//       <Text style={styles.label}>Room</Text>
//       <View style={styles.rowWrap}>
//         {rooms.map((r) => {
//           const key = String(r.room_id);
//           return (
//             <TouchableOpacity
//               key={key}
//               style={[styles.roomChip, form.room_id === key && styles.roomChipActive]}
//               onPress={() => {
//                 setForm({
//                   ...form,
//                   room_id: key,
//                   device_id: "",
//                   planned_start_time: "",
//                 });
//                 setSelectedDate(null);
//                 setShowDevices(true);
//                 setAvailableTimes([]);
//               }}
//             >
//               <Text style={[styles.roomChipText, form.room_id === key && styles.roomChipTextActive]}>
//                 {formatRoomLabel(r)}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* Device dropdown */}
//       {form.room_id && (
//         <View style={{ marginTop: 10 }}>
//           <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDevices((v) => !v)}>
//             <Text style={styles.dropdownText}>
//               {form.device_id ? `Device Selected #${form.device_id}` : "Choose Device ▼"}
//             </Text>
//           </TouchableOpacity>

//           {showDevices && (
//             <View style={styles.dropdownList}>
//               {filteredDevices.map((d) => {
//                 const busy = d.is_busy || d.status === "Active";
//                 return (
//                   <TouchableOpacity
//                     key={d.device_id}
//                     disabled={busy}
//                     style={[styles.dropdownItem, busy && { opacity: 0.4 }]}
//                     onPress={() => {
//                       const id = String(d.device_id);
//                       setForm({
//                         ...form,
//                         device_id: id,
//                         planned_start_time: "",
//                       });
//                       setSelectedDate(null);
//                       setShowDevices(false);
//                       setAvailableTimes([]);
//                     }}
//                   >
//                     <Text style={styles.dropdownItemText}>
//                       {d.device_type} #{d.slot_number} {busy ? "(Busy)" : ""}
//                     </Text>
//                   </TouchableOpacity>
//                 );
//               })}

//               {filteredDevices.length === 0 && (
//                 <Text style={{ color: "#94a3b8", padding: 8 }}>No devices for this room.</Text>
//               )}
//             </View>
//           )}
//         </View>
//       )}

//       {/* Pick Date Button */}
//       {form.device_id && (
//         <View style={{ marginTop: 14 }}>
//           <Text style={styles.label}>Pick Date & Time</Text>

//           <TouchableOpacity
//             style={styles.pickBtn}
//             onPress={() => {
//               if (!DateTimePicker) {
//                 Alert.alert("Missing package", "Install @react-native-community/datetimepicker");
//                 return;
//               }
//               setShowPicker(true);
//             }}
//           >
//             <Text style={styles.pickText}>
//               {selectedDate ? selectedDate.toLocaleString() : "Open Calendar 📅"}
//             </Text>
//           </TouchableOpacity>

//           {showPicker && DateTimePicker && (
//             <DateTimePicker value={selectedDate || new Date()} mode="datetime" display="default" onChange={onPickDate} />
//           )}
//         </View>
//       )}

//       {/* Free times after picking day */}
//       {form.device_id && selectedDate ? (
//         <View style={{ marginTop: 12 }}>
//           <Text style={styles.label}>Available Slots</Text>

//           {loadingTimes ? (
//             <ActivityIndicator color="white" style={{ marginTop: 8 }} />
//           ) : availableTimes.length === 0 ? (
//             <Text style={{ color: "#94a3b8", marginTop: 6 }}>No free slots for this day.</Text>
//           ) : (
//             <View style={styles.rowWrap}>
//               {availableTimes.map((t) => (
//                 <TouchableOpacity
//                   key={t}
//                   style={[styles.timeChip, form.planned_start_time === t && styles.timeChipActive]}
//                   onPress={() => setForm({ ...form, planned_start_time: t })}
//                 >
//                   <Text
//                     style={[
//                       styles.timeChipText,
//                       form.planned_start_time === t && styles.timeChipTextActive,
//                     ]}
//                   >
//                     {new Date(t).toLocaleTimeString()}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </View>
//       ) : null}

//       {/* Reserve Button */}
//       <TouchableOpacity
//         style={styles.reserveBtn}
//         onPress={reserveNow}
//         activeOpacity={0.9}
//         disabled={loading}
//       >
//         {loading ? <ActivityIndicator color="white" /> : <Text style={styles.reserveText}>Reserve Now</Text>}
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   hero: {
//     backgroundColor: "#0b1020",
//     borderRadius: 18,
//     padding: 14,
//     alignItems: "center",
//     marginBottom: 14,
//     borderWidth: 1,
//     borderColor: "#1e293b",
//     shadowColor: "#8b5cf6",
//     shadowOpacity: 0.55,
//     shadowRadius: 20,
//     elevation: 8,
//     overflow: "hidden",
//   },
//   videoWrap: {
//     width: "100%",
//     height: 190,
//     borderRadius: 14,
//     overflow: "hidden",
//     marginBottom: 6,
//   },
//   video: { width: "100%", height: "100%" },
//   videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
//   heroFallback: {
//     width: "100%",
//     height: 190,
//     borderRadius: 14,
//     backgroundColor: "#111827",
//     borderWidth: 1,
//     borderColor: "#22d3ee",
//     marginBottom: 6,
//   },
//   heroTitle: { color: "white", fontSize: 20, fontWeight: "900", marginTop: 4, textAlign: "center" },
//   heroSub: { color: "#a5b4fc", marginTop: 4, fontSize: 12 },

//   label: { marginTop: 10, fontWeight: "800", color: "#e2e8f0" },
//   input: {
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#1f2937",
//     padding: 12,
//     borderRadius: 12,
//     marginTop: 6,
//     color: "white",
//   },

//   rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },

//   chip: {
//     backgroundColor: "#0f172a",
//     borderRadius: 999,
//     paddingVertical: 8,
//     paddingHorizontal: 14,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   chipActive: { backgroundColor: "#1d4ed8", borderColor: "#22d3ee" },
//   chipText: { fontWeight: "800", color: "#cbd5e1" },
//   chipTextActive: { color: "white" },

//   offerChip: {
//     backgroundColor: "#111827",
//     borderRadius: 999,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#374151",
//   },
//   offerChipActive: { backgroundColor: "#7c3aed", borderColor: "#22d3ee" },
//   offerChipText: { fontWeight: "800", color: "#cbd5e1" },
//   offerChipTextActive: { color: "white" },

//   roomChip: {
//     backgroundColor: "#0f172a",
//     borderRadius: 12,
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   roomChipActive: { borderColor: "#22d3ee", backgroundColor: "#111827" },
//   roomChipText: { fontWeight: "800", color: "#cbd5e1", fontSize: 12 },
//   roomChipTextActive: { color: "#22d3ee" },

//   dropdownBtn: {
//     backgroundColor: "#111827",
//     borderWidth: 1,
//     borderColor: "#22d3ee",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//   },
//   dropdownText: { color: "white", fontWeight: "800" },

//   dropdownList: {
//     marginTop: 6,
//     backgroundColor: "#0f172a",
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#1f2937",
//     overflow: "hidden",
//   },
//   dropdownItem: {
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#1f2937",
//   },
//   dropdownItemText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },

//   pickBtn: {
//     marginTop: 6,
//     backgroundColor: "#0f172a",
//     borderWidth: 1,
//     borderColor: "#22d3ee",
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   pickText: { color: "white", fontWeight: "900" },

//   timeChip: {
//     backgroundColor: "#0b1020",
//     borderRadius: 10,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: "#334155",
//   },
//   timeChipActive: { borderColor: "#22d3ee", backgroundColor: "#111827" },
//   timeChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
//   timeChipTextActive: { color: "#22d3ee" },

//   reserveBtn: {
//     marginTop: 18,
//     backgroundColor: "#22d3ee",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//     shadowColor: "#22d3ee",
//     shadowOpacity: 0.7,
//     shadowRadius: 12,
//     elevation: 6,
//   },
//   reserveText: { color: "#05060A", fontWeight: "900", fontSize: 16 },
// });
// app/gaming/reserveTab.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

// DateTime Picker (Expo compatible)
let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {}

// dynamic video (optional)
let VideoComp: any = null;
try {
  VideoComp = require("expo-video").VideoView;
} catch {}
try {
  if (!VideoComp) VideoComp = require("expo-av").Video;
} catch {}

import { API_BASE } from "../config/api";
import * as WebBrowser from "expo-web-browser";

const FIXED_OFFERS = [
  { code: "1H", label: "1 Hour", minutes: 60 },
  { code: "2H", label: "2 Hours", minutes: 120 },
  { code: "2H+1FREE", label: "2H + 1H Free", minutes: 180 },
];

// ✅ Winner reward offer code
const REWARD_OFFER_CODE = "FREE_3H";

export default function ReserveTab() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [showDevices, setShowDevices] = useState(false);

  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // ✅ calendar state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // ✅ reward state
  const [hasReward, setHasReward] = useState(false);

  const [form, setForm] = useState({
    player_name: "",
    session_type: "Open", // Open | Fixed
    room_id: "",
    device_id: "",
    offer_code: "1H",
    planned_start_time: "", // ISO without seconds
  });

  // ✅ Stripe “come back and auto-check” state
  const [pendingStripeSessionId, setPendingStripeSessionId] = useState<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("customer");
      const c = raw ? JSON.parse(raw) : null;
      setUser(c);

      if (c?.name) {
        setForm((f) => ({ ...f, player_name: c.name }));
      }

      await loadRooms();
      await loadDevices();

      // ✅ load reward once we have user
      if (c?.customer_id) {
        await loadRewardStatus(Number(c.customer_id));
      }
    })();
  }, []);

  // ✅ When app becomes active again (user returns from Stripe), auto-check payment
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prevState === "inactive" || prevState === "background") &&
        nextState === "active" &&
        pendingStripeSessionId
      ) {
        await checkGamingPaymentStatus(pendingStripeSessionId, true);
      }
    });

    return () => sub.remove();
  }, [pendingStripeSessionId]);

  const loadRewardStatus = async (customerId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/gaming/rewards/active/${customerId}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setHasReward(!!data?.has_reward);
      else setHasReward(false);
    } catch {
      setHasReward(false);
    }
  };

  const loadRooms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gaming/rooms`);
      const data = await res.json();
      setRooms(data.rooms || data || []);
    } catch (e) {
      console.log("rooms error", e);
    }
  };

  const loadDevices = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/gaming/devices`);
      const data = await res.json();
      setDevices(data.devices || data || []);
    } catch (e) {
      console.log("devices error", e);
    }
  };

  const formatRoomLabel = (r: any) => {
    const sectionLetter = String(r.section) === "1" ? "A" : "B";
    return `${sectionLetter} - Room ${r.room_number}`;
  };

  const filteredDevices = useMemo(() => {
    if (!form.room_id) return [];
    return devices.filter((d) => String(d.room_id) === String(form.room_id));
  }, [devices, form.room_id]);

  // ✅ load free times for selected device + selected date
  const loadAvailableTimes = async (deviceId: string, date?: Date | null) => {
    if (!deviceId) return;

    setLoadingTimes(true);
    setAvailableTimes([]);

    try {
      const dayStr = date ? date.toISOString().slice(0, 10) : null;

      const url = dayStr
        ? `${API_BASE}/api/gaming/available-times/${deviceId}?date=${dayStr}`
        : `${API_BASE}/api/gaming/available-times/${deviceId}`;

      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (res.ok && Array.isArray(data.times)) {
        setAvailableTimes(data.times);
      } else {
        setAvailableTimes([]);
      }
    } catch (e) {
      console.log("available times error", e);
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const onPickDate = (event: any, date?: Date) => {
    setShowPicker(false);
    if (!date) return;

    setSelectedDate(date);

    const isoNoSeconds = date.toISOString().slice(0, 16); // yyyy-mm-ddThh:mm
    setForm((f) => ({ ...f, planned_start_time: isoNoSeconds }));

    // reload free times for this day
    if (form.device_id) {
      loadAvailableTimes(form.device_id, date);
    }
  };

  const createInvoiceAndOpenStripe = async (sessionId: number) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/gaming/payments/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: user?.customer_id || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert("Payment error", data.error || "Failed to create Stripe invoice");
        return;
      }

      if (!data.hosted_invoice_url) {
        Alert.alert("Payment error", "Stripe hosted invoice url is missing.");
        return;
      }

      setPendingStripeSessionId(sessionId);
// ✅ open Stripe inside the app (like Sport)
await WebBrowser.openBrowserAsync(data.hosted_invoice_url);

// ✅ when user closes Stripe page, auto-check payment
await checkGamingPaymentStatus(sessionId, true);
      Alert.alert("Stripe Opened", "Complete payment then return to the app.");
    } catch (e: any) {
      Alert.alert("Network error", e.message || "Payment request failed");
    } finally {
      setLoading(false);
    }
  };

  const checkGamingPaymentStatus = async (sessionId: number, fromReturn = false) => {
    try {
      const res = await fetch(`${API_BASE}/api/gaming/payments/status/${sessionId}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (!fromReturn) Alert.alert("Status error", data.error || "Failed to check payment status");
        return;
      }

      if (data.is_paid) {
        Alert.alert("Paid ✅", "Payment confirmed. Your reservation is confirmed.");
        setPendingStripeSessionId(null);
      } else {
        if (!fromReturn) Alert.alert("Pending ⏳", "Payment not completed yet.");
        else Alert.alert("Pending ⏳", "Not completed yet. If you paid, wait then try again.");
      }
    } catch (e: any) {
      if (!fromReturn) Alert.alert("Network error", e.message || "Failed to check payment status");
    }
  };

  const setCashPending = async (sessionId: number) => {
    try {
      setLoading(true);

      const r = await fetch(`${API_BASE}/api/gaming/payments/pay-cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: user?.customer_id || null,
          confirm: false,
        }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        Alert.alert("Cash payment error", j.error || "Failed to set cash payment");
        return;
      }

      Alert.alert("Cash Selected ✅", "Your session is reserved. Pay at the center to confirm.");
    } catch (e: any) {
      Alert.alert("Network error", e.message || "Failed to set cash payment");
    } finally {
      setLoading(false);
    }
  };

  const resetUI = () => {
    setForm((f) => ({
      ...f,
      device_id: "",
      planned_start_time: "",
    }));
    setSelectedDate(null);
    setAvailableTimes([]);
    setShowDevices(false);
  };

  const reserveNow = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login first.");
      return;
    }

    if (!form.player_name || !form.device_id) {
      Alert.alert("Missing fields", "player name and device are required.");
      return;
    }

    if (!form.planned_start_time) {
      Alert.alert("Pick time", "Please select date/time first.");
      return;
    }

    // ✅ if user tries FREE_3H but doesn't have reward, block it
    if (form.session_type === "Fixed" && form.offer_code === REWARD_OFFER_CODE && !hasReward) {
      Alert.alert("Not eligible", "You don't have an active reward yet.");
      return;
    }

    setLoading(true);

    const payload: any = {
      player_name: form.player_name.trim(),
      session_type: form.session_type,
      device_id: Number(form.device_id),

      member_id: user?.member_id || null,
      customer_id: user?.customer_id || null,

      offer_code: form.session_type === "Fixed" ? form.offer_code : null,
      planned_start_time: form.planned_start_time + ":00",
    };

    try {
      const res = await fetch(`${API_BASE}/api/gaming/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Reserve failed", data.error || "Unknown error");
        return;
      }

      const sessionId = data?.session?.session_id;

      // ✅ FREE WINNER FLOW (NO PAYMENT POPUP)
      if (form.session_type === "Fixed" && form.offer_code === REWARD_OFFER_CODE) {
        Alert.alert("🎉 Reserved FREE", "Your winner session is reserved for FREE ✅");
        resetUI();

        // ✅ refresh reward status (backend should mark it as used after start)
        if (user?.customer_id) await loadRewardStatus(Number(user.customer_id));
        return;
      }

      // ✅ NORMAL FLOW (show payment options)
      Alert.alert("✅ Reserved", "Your session is reserved. Choose payment method:", [
        {
          text: "Pay Cash in Center",
          onPress: async () => {
            if (!sessionId) return Alert.alert("Error", "Missing session id from server response.");
            await setCashPending(sessionId);
          },
        },
        {
          text: "Pay Online (Stripe)",
          onPress: () => {
            if (!sessionId) return Alert.alert("Error", "Missing session id from server response.");
            createInvoiceAndOpenStripe(sessionId);
          },
        },
        {
          text: "Check Payment",
          onPress: async () => {
            if (!sessionId) return Alert.alert("Error", "Missing session id from server response.");
            await checkGamingPaymentStatus(sessionId, false);
          },
        },
        { text: "Close", style: "cancel" },
      ]);

      resetUI();
    } catch (e: any) {
      Alert.alert("Network error", e.message || "Failed request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
      {/* HERO */}
      <View style={styles.hero}>
        {VideoComp ? (
          <View style={styles.videoWrap}>
            <VideoComp
              source={require("../../assets/animations/ps5.mp4")}
              style={styles.video}
              resizeMode="cover"
              shouldPlay
              isLooping
              isMuted
            />
            <View style={styles.videoOverlay} />
          </View>
        ) : (
          <View style={styles.heroFallback} />
        )}

        <Text style={styles.heroTitle}>Reserve Your Gaming Session</Text>
        <Text style={styles.heroSub}>Choose room, device, and free slot 🎮</Text>
      </View>

      {/* Player name */}
      <Text style={styles.label}>Player Name *</Text>
      <TextInput
        style={styles.input}
        value={form.player_name}
        onChangeText={(t) => setForm({ ...form, player_name: t })}
        placeholder="Your name"
        placeholderTextColor="#64748b"
      />

      {/* Session type */}
      <Text style={styles.label}>Session Type</Text>
      <View style={styles.rowWrap}>
        {["Open", "Fixed"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, form.session_type === t && styles.chipActive]}
            onPress={() =>
              setForm((prev) => ({
                ...prev,
                session_type: t,
                offer_code: t === "Fixed" ? prev.offer_code || "1H" : prev.offer_code,
              }))
            }
          >
            <Text style={[styles.chipText, form.session_type === t && styles.chipTextActive]}>
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Offer if fixed */}
      {form.session_type === "Fixed" && (
        <>
          <Text style={styles.label}>Offer</Text>
          <View style={styles.rowWrap}>
            {FIXED_OFFERS.map((o) => (
              <TouchableOpacity
                key={o.code}
                style={[styles.offerChip, form.offer_code === o.code && styles.offerChipActive]}
                onPress={() => setForm({ ...form, offer_code: o.code })}
              >
                <Text
                  style={[
                    styles.offerChipText,
                    form.offer_code === o.code && styles.offerChipTextActive,
                  ]}
                >
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* ✅ Winner gold offer */}
            {hasReward && (
              <TouchableOpacity
                style={[
                  styles.goldOfferChip,
                  form.offer_code === REWARD_OFFER_CODE && styles.goldOfferChipActive,
                ]}
                onPress={() => setForm({ ...form, offer_code: REWARD_OFFER_CODE })}
              >
                <Text
                  style={[
                    styles.goldOfferText,
                    form.offer_code === REWARD_OFFER_CODE && styles.goldOfferTextActive,
                  ]}
                >
                  🎉 3 Hours FREE
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* Rooms */}
      <Text style={styles.label}>Room</Text>
      <View style={styles.rowWrap}>
        {rooms.map((r) => {
          const key = String(r.room_id);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.roomChip, form.room_id === key && styles.roomChipActive]}
              onPress={() => {
                setForm({
                  ...form,
                  room_id: key,
                  device_id: "",
                  planned_start_time: "",
                });
                setSelectedDate(null);
                setShowDevices(true);
                setAvailableTimes([]);
              }}
            >
              <Text style={[styles.roomChipText, form.room_id === key && styles.roomChipTextActive]}>
                {formatRoomLabel(r)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Device dropdown */}
      {form.room_id && (
        <View style={{ marginTop: 10 }}>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setShowDevices((v) => !v)}>
            <Text style={styles.dropdownText}>
              {form.device_id ? `Device Selected #${form.device_id}` : "Choose Device ▼"}
            </Text>
          </TouchableOpacity>

          {showDevices && (
            <View style={styles.dropdownList}>
              {filteredDevices.map((d) => {
                const busy = d.is_busy || d.status === "Active";
                return (
                  <TouchableOpacity
                    key={d.device_id}
                    disabled={busy}
                    style={[styles.dropdownItem, busy && { opacity: 0.4 }]}
                    onPress={() => {
                      const id = String(d.device_id);
                      setForm({
                        ...form,
                        device_id: id,
                        planned_start_time: "",
                      });
                      setSelectedDate(null);
                      setShowDevices(false);
                      setAvailableTimes([]);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {d.device_type} #{d.slot_number} {busy ? "(Busy)" : ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {filteredDevices.length === 0 && (
                <Text style={{ color: "#94a3b8", padding: 8 }}>No devices for this room.</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Pick Date Button */}
      {form.device_id && (
        <View style={{ marginTop: 14 }}>
          <Text style={styles.label}>Pick Date & Time</Text>

          <TouchableOpacity
            style={styles.pickBtn}
            onPress={() => {
              if (!DateTimePicker) {
                Alert.alert("Missing package", "Install @react-native-community/datetimepicker");
                return;
              }
              setShowPicker(true);
            }}
          >
            <Text style={styles.pickText}>
              {selectedDate ? selectedDate.toLocaleString() : "Open Calendar 📅"}
            </Text>
          </TouchableOpacity>

          {showPicker && DateTimePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="datetime"
              display="default"
              onChange={onPickDate}
            />
          )}
        </View>
      )}

      {/* Free times after picking day */}
      {form.device_id && selectedDate ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Available Slots</Text>

          {loadingTimes ? (
            <ActivityIndicator color="white" style={{ marginTop: 8 }} />
          ) : availableTimes.length === 0 ? (
            <Text style={{ color: "#94a3b8", marginTop: 6 }}>No free slots for this day.</Text>
          ) : (
            <View style={styles.rowWrap}>
              {availableTimes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, form.planned_start_time === t && styles.timeChipActive]}
                  onPress={() => setForm({ ...form, planned_start_time: t })}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      form.planned_start_time === t && styles.timeChipTextActive,
                    ]}
                  >
                    {new Date(t).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {/* Reserve Button */}
      <TouchableOpacity
        style={styles.reserveBtn}
        onPress={reserveNow}
        activeOpacity={0.9}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.reserveText}>Reserve Now</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: "#0b1020",
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 8,
    overflow: "hidden",
  },
  videoWrap: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 6,
  },
  video: { width: "100%", height: "100%" },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  heroFallback: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#22d3ee",
    marginBottom: 6,
  },
  heroTitle: { color: "white", fontSize: 20, fontWeight: "900", marginTop: 4, textAlign: "center" },
  heroSub: { color: "#a5b4fc", marginTop: 4, fontSize: 12 },

  label: { marginTop: 10, fontWeight: "800", color: "#e2e8f0" },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
    color: "white",
  },

  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },

  chip: {
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#22d3ee" },
  chipText: { fontWeight: "800", color: "#cbd5e1" },
  chipTextActive: { color: "white" },

  offerChip: {
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  offerChipActive: { backgroundColor: "#7c3aed", borderColor: "#22d3ee" },
  offerChipText: { fontWeight: "800", color: "#cbd5e1" },
  offerChipTextActive: { color: "white" },

  // ✅ gold offer styles
  goldOfferChip: {
    backgroundColor: "#1a1402",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#ffb300",
  },
  goldOfferChipActive: {
    backgroundColor: "#ffcc00",
    borderColor: "#ffea00",
  },
  goldOfferText: { fontWeight: "900", color: "#ffdd55" },
  goldOfferTextActive: { color: "#111827" },

  roomChip: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  roomChipActive: { borderColor: "#22d3ee", backgroundColor: "#111827" },
  roomChipText: { fontWeight: "800", color: "#cbd5e1", fontSize: 12 },
  roomChipTextActive: { color: "#22d3ee" },

  dropdownBtn: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#22d3ee",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  dropdownText: { color: "white", fontWeight: "800" },

  dropdownList: {
    marginTop: 6,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  dropdownItemText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },

  pickBtn: {
    marginTop: 6,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#22d3ee",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  pickText: { color: "white", fontWeight: "900" },

  timeChip: {
    backgroundColor: "#0b1020",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  timeChipActive: { borderColor: "#22d3ee", backgroundColor: "#111827" },
  timeChipText: { color: "#cbd5e1", fontWeight: "800", fontSize: 12 },
  timeChipTextActive: { color: "#22d3ee" },

  reserveBtn: {
    marginTop: 18,
    backgroundColor: "#22d3ee",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 6,
  },
  reserveText: { color: "#05060A", fontWeight: "900", fontSize: 16 },
});
