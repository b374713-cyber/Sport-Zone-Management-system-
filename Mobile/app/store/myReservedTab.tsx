// import React, { useEffect, useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   TouchableOpacity,
//   Alert,
//   Image,
//   Modal,
//   TextInput,
//   Pressable,
//   AppState,
//   RefreshControl,
// } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { LinearGradient } from "expo-linear-gradient";
// import * as WebBrowser from "expo-web-browser";

// // expo-router optional
// let useLocalSearchParams: any = null;
// try {
//   useLocalSearchParams = require("expo-router").useLocalSearchParams;
// } catch {}

// import { fetchMyReservations } from "../../lib/storeApi";
// import { API_BASE } from "../config/api";

// const colors = ["#0ea5e9", "#1d4ed8"];

// const resolveImage = (path?: string) => {
//   if (!path) return "";
//   if (path.startsWith("http://") || path.startsWith("https://")) return path;
//   return `${API_BASE}${path}`;
// };

// const formatRemaining = (remaining_seconds?: number) => {
//   const s = Number(remaining_seconds || 0);
//   if (!s || s <= 0) return "Expired";
//   const hrs = Math.floor(s / 3600);
//   const mins = Math.floor((s % 3600) / 60);
//   return `${hrs}h ${mins}m`;
// };

// const getPaymentStatus = (r: any) => {
//   const st = String(r?.payment_stripe_status || "").trim().toLowerCase();
//   const paid = !!r?.payment_is_paid;

//   if (paid || st === "paid" || st === "cash") {
//     return { status: "paid", text: "Paid", color: "#22c55e", bgColor: "#14532d" };
//   }

//   if (st === "open" || st === "draft" || st === "pending") {
//     return { status: "pending", text: "Payment Pending", color: "#f59e0b", bgColor: "#78350f" };
//   }

//   return { status: "unpaid", text: "Not Paid", color: "#ef4444", bgColor: "#7f1d1d" };
// };

// // FIXED: Properly extract customer_id from AsyncStorage
// const getCustomerIdFromStorage = async (): Promise<number | null> => {
//   try {
//     // First, check the 'customer' key which is most likely
//     const customerRaw = await AsyncStorage.getItem('customer');
//     if (customerRaw) {
//       try {
//         const customer = JSON.parse(customerRaw);
        
//         // Try customer_id first (most important)
//         if (customer?.customer_id) {
//           const id = Number(customer.customer_id);
//           if (Number.isFinite(id) && id > 0) {
//             console.log("Found customer_id from customer:", id);
//             return id;
//           }
//         }
        
//         // Try user_id as fallback
//         if (customer?.user_id) {
//           const id = Number(customer.user_id);
//           if (Number.isFinite(id) && id > 0) {
//             console.log("Found user_id from customer:", id);
//             return id;
//           }
//         }
        
//         // Try id as last resort
//         if (customer?.id) {
//           const id = Number(customer.id);
//           if (Number.isFinite(id) && id > 0) {
//             console.log("Found id from customer:", id);
//             return id;
//           }
//         }
//       } catch (e) {
//         console.log("Failed to parse customer data");
//       }
//     }
    
//     // Check other common keys
//     const commonKeys = ['user', 'auth', 'session', 'profile', 'userData'];
//     for (const key of commonKeys) {
//       const raw = await AsyncStorage.getItem(key);
//       if (raw) {
//         try {
//           const obj = JSON.parse(raw);
          
//           // Look for customer_id in nested objects
//           if (obj?.customer_id) {
//             const id = Number(obj.customer_id);
//             if (Number.isFinite(id) && id > 0) return id;
//           }
          
//           if (obj?.customer?.customer_id) {
//             const id = Number(obj.customer.customer_id);
//             if (Number.isFinite(id) && id > 0) return id;
//           }
          
//           if (obj?.user_id) {
//             const id = Number(obj.user_id);
//             if (Number.isFinite(id) && id > 0) return id;
//           }
          
//           if (obj?.id) {
//             const id = Number(obj.id);
//             if (Number.isFinite(id) && id > 0) return id;
//           }
//         } catch (e) {
//           // Not JSON, skip
//         }
//       }
//     }
    
//     console.log("No customer ID found in storage");
//     return null;
//   } catch (error) {
//     console.error("Error getting customer ID:", error);
//     return null;
//   }
// };

// // Check receive request status
// const getReceiveRequestStatus = (r: any) => {
//   const st = String(r?.receive_request_status || "").trim().toLowerCase();
  
//   if (st === "pending") {
//     return { status: "pending", text: "Waiting for staff confirmation", color: "#f59e0b", bgColor: "#78350f" };
//   }
  
//   if (st === "confirmed") {
//     return { status: "confirmed", text: "Ready for pickup", color: "#3b82f6", bgColor: "#1e3a8a" };
//   }
  
//   if (st === "approved") {
//     return { status: "approved", text: "Received", color: "#22c55e", bgColor: "#14532d" };
//   }
  
//   return { status: "none", text: "No request", color: "#94a3b8", bgColor: "#374151" };
// };

// export default function MyReservedTab() {
//   const params = useLocalSearchParams ? useLocalSearchParams() : {};
  
//   const [reservations, setReservations] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [requesting, setRequesting] = useState(false);
//   const [paying, setPaying] = useState(false);
//   const [approving, setApproving] = useState(false);
  
//   // Track which reservation is being paid so we can refresh when user returns
//   const [pendingPaymentReservationId, setPendingPaymentReservationId] = useState<number | null>(null);

//   // Modal states
//   const [approveOpen, setApproveOpen] = useState(false);
//   const [approveReservationId, setApproveReservationId] = useState<number | null>(null);
//   const [pickupCodeInput, setPickupCodeInput] = useState("");

//   const load = async (showLoading = true) => {
//     try {
//       if (showLoading) setLoading(true);
      
//       const customerId = await getCustomerIdFromStorage();
      
//       if (!customerId) {
//         setReservations([]);
//         Alert.alert("Login Required", "Please login to view your reservations.");
//         return;
//       }
      
//       console.log("Loading reservations for customer ID:", customerId);
      
//       const data = await fetchMyReservations(customerId);
//       const list = Array.isArray(data)
//         ? data
//         : Array.isArray(data?.reservations)
//         ? data.reservations
//         : [];

//       console.log("Found reservations:", list.length);
//       setReservations(list);
//     } catch (e: any) {
//       console.error("fetchMyReservations error:", e);
//       setReservations([]);
//       Alert.alert("Error", e?.message || "Failed to load reservations.");
//     } finally {
//       if (showLoading) setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     load(false);
//   };

//   const checkPaymentStatus = async (reservationId: number) => {
//     try {
//       console.log("Checking payment status for reservation:", reservationId);
//       const resp = await fetch(`${API_BASE}/api/store/payments/status/${reservationId}`);
//       const data = await resp.json();
//       console.log("Payment status check result:", data);
//       return data;
//     } catch (e) {
//       console.log("checkPaymentStatus error", e);
//       return null;
//     }
//   };

//   const payOnline = async (reservation: any) => {
//     try {
//       if (!reservation?.reservation_id) return;

//       setPaying(true);

//       const customerId = await getCustomerIdFromStorage();
//       if (!customerId) {
//         Alert.alert("Error", "User not found. Please login again.");
//         return;
//       }

//       const resp = await fetch(`${API_BASE}/api/store/payments/create-invoice`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           reservation_id: reservation.reservation_id,
//           customer_id: reservation.customer_id || customerId,
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok) throw new Error(data?.error || data?.message || "Failed");

//       const url = data?.hosted_invoice_url || reservation?.payment_hosted_invoice_url;
//       if (!url) {
//         Alert.alert("Payment", "Invoice created but no URL returned.");
//         return;
//       }

//       // Mark which reservation we should refresh when user comes back
//       setPendingPaymentReservationId(reservation.reservation_id);
      
//       console.log("Opening Stripe URL, will check status when user returns");
//       await WebBrowser.openBrowserAsync(url);
      
//       // Check payment status immediately after browser closes
//       await checkPaymentStatus(reservation.reservation_id);
//       await load();
      
//     } catch (e: any) {
//       Alert.alert("Payment Error", e?.message || "Failed to start payment.");
//     } finally {
//       setPaying(false);
//     }
//   };

//   const requestReceiving = async (reservation: any) => {
//     try {
//       if (requesting) return;
//       setRequesting(true);

//       const paymentStatus = getPaymentStatus(reservation);
//       if (paymentStatus.status !== "paid") {
//         Alert.alert("Payment Required", "Please complete payment before requesting receiving.");
//         return;
//       }

//       const rawCustomer = await AsyncStorage.getItem("customer");
//       const customerObj = rawCustomer ? JSON.parse(rawCustomer) : null;

//       const resp = await fetch(`${API_BASE}/api/store/receive-requests/request`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           reservation_id: reservation.reservation_id,
//           customer_name: customerObj?.name || customerObj?.full_name || "Customer",
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok) throw new Error(data?.message || "Failed");

//       Alert.alert("Request Sent", "Your request has been sent to staff. Wait for them to confirm and give you a pickup code.");
//       await load();
//     } catch (e: any) {
//       Alert.alert("Error", e?.message || "Failed to request receiving");
//     } finally {
//       setRequesting(false);
//     }
//   };

//   const openApproveModal = (reservation_id: number) => {
//     setApproveReservationId(reservation_id);
//     setPickupCodeInput("");
//     setApproveOpen(true);
//   };

//   const approvePickupCode = async () => {
//     try {
//       if (!approveReservationId) return;

//       const code = pickupCodeInput.trim();
//       if (!code) {
//         Alert.alert("Missing code", "Please enter the pickup code.");
//         return;
//       }

//       if (code.length !== 6 || !/^\d+$/.test(code)) {
//         Alert.alert("Invalid Code", "Pickup code must be 6 digits.");
//         return;
//       }

//       setApproving(true);

//       const resp = await fetch(`${API_BASE}/api/store/receive-requests/approve`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           reservation_id: approveReservationId,
//           request_code: code,
//         }),
//       });

//       const data = await resp.json();
//       if (!resp.ok) throw new Error(data?.message || "Failed");

//       setApproveOpen(false);
//       Alert.alert("Success", "Items received! Thank you for your purchase.");
//       await load();
//     } catch (e: any) {
//       Alert.alert("Error", e?.message || "Failed to approve code");
//     } finally {
//       setApproving(false);
//     }
//   };

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Listen for when user returns to app from Stripe payment
//   useEffect(() => {
//     const subscription = AppState.addEventListener("change", async (state) => {
//       // When user returns to the app (state becomes 'active')
//       if (state === "active" && pendingPaymentReservationId) {
//         console.log("User returned to app, checking payment status for:", pendingPaymentReservationId);
        
//         // Give it a small delay to ensure network is ready
//         setTimeout(async () => {
//           try {
//             // Check payment status (this updates DB and sends push notification)
//             await checkPaymentStatus(pendingPaymentReservationId);
            
//             // Reload reservations to update UI
//             await load();
            
//             // Clear the pending payment flag
//             setPendingPaymentReservationId(null);
            
//             console.log("Payment status refreshed successfully");
//           } catch (error) {
//             console.error("Failed to refresh payment status:", error);
//           }
//         }, 1000);
//       }
//     });

//     return () => subscription.remove();
//   }, [pendingPaymentReservationId]);

//   const liveReservations = useMemo(() => {
//     return (Array.isArray(reservations) ? reservations : []).filter((r) => {
//       const st = String(r.status || "").trim().toLowerCase();
//       return st === "reserved";
//     });
//   }, [reservations]);

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" />
//         <Text style={{ marginTop: 10, color: "#94a3b8" }}>Loading…</Text>
//       </View>
//     );
//   }

//   return (
//     <ScrollView 
//       style={{ flex: 1, backgroundColor: "#020617" }} 
//       contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
//       refreshControl={
//         <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
//       }
//     >
//       <LinearGradient colors={colors as any} style={styles.header}>
//         <Text style={styles.headerTitle}>My Reserved Items</Text>
//         <Text style={styles.headerSub}>Reservations expire after 48 hours.</Text>

//         <TouchableOpacity onPress={() => load()} style={styles.refreshBtn}>
//           <Text style={styles.refreshText}>Refresh</Text>
//         </TouchableOpacity>
//       </LinearGradient>

//       {liveReservations.length === 0 ? (
//         <View style={styles.empty}>
//           <Text style={styles.emptyText}>No active reservations.</Text>
//         </View>
//       ) : (
//         liveReservations.map((r) => {
//           const paymentStatus = getPaymentStatus(r);
//           const receiveStatus = getReceiveRequestStatus(r);

//           return (
//             <View key={r.reservation_id} style={styles.card}>
//               <View style={styles.cardTop}>
//                 <Text style={styles.code}>Code: {r.reservation_code}</Text>
//                 <Text style={styles.timeLeft}>{formatRemaining(r.remaining_seconds)} left</Text>
//               </View>

//               <View style={styles.cardBottom}>
//                 <Text style={styles.total}>Total: ${Number(r.total_final_price || 0).toFixed(2)}</Text>

//                 <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.bgColor }]}>
//                   <Text style={[styles.paymentText, { color: paymentStatus.color }]}>{paymentStatus.text}</Text>
//                 </View>
//               </View>

//               {/* Receive Request Status */}
//               {receiveStatus.status !== "none" && (
//                 <View style={[styles.receiveStatusBadge, { backgroundColor: receiveStatus.bgColor }]}>
//                   <Text style={[styles.receiveStatusText, { color: receiveStatus.color }]}>
//                     {receiveStatus.text}
//                   </Text>
//                 </View>
//               )}

//               {/* Payment Button - Only show if not paid */}
//               {paymentStatus.status !== "paid" && (
//                 <View style={styles.paymentRow}>
//                   <TouchableOpacity 
//                     style={[styles.payBtnAlt, { opacity: paying ? 0.6 : 1 }]} 
//                     disabled={paying} 
//                     onPress={() => payOnline(r)}
//                   >
//                     <Text style={styles.payBtnText}>{paying ? "Opening..." : "Pay Online"}</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Actions based on payment and receive status */}
//               {paymentStatus.status === "paid" && receiveStatus.status === "none" && (
//                 <View style={styles.actionsRow}>
//                   <TouchableOpacity 
//                     style={[styles.actionBtn, { opacity: requesting ? 0.6 : 1 }]} 
//                     disabled={requesting} 
//                     onPress={() => requestReceiving(r)}
//                   >
//                     <Text style={styles.actionText}>{requesting ? "Requesting..." : "Request Receiving"}</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {receiveStatus.status === "confirmed" && (
//                 <View style={styles.actionsRow}>
//                   <TouchableOpacity 
//                     style={[styles.actionBtnAlt, { opacity: approving ? 0.6 : 1 }]} 
//                     disabled={approving} 
//                     onPress={() => openApproveModal(r.reservation_id)}
//                   >
//                     <Text style={styles.actionTextAlt}>Enter Pickup Code</Text>
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* Items List */}
//               <View style={styles.itemsWrap}>
//                 {(r.items || []).map((it: any) => (
//                   <View key={`${it.product_id}-${it.name}`} style={styles.itemRow}>
//                     {it.image_url ? <Image source={{ uri: resolveImage(it.image_url) }} style={styles.itemImg} /> : <View style={[styles.itemImg, styles.imgPlaceholder]} />}
//                     <View style={{ flex: 1 }}>
//                       <Text style={styles.itemName}>{it.name}</Text>
//                       <Text style={styles.itemMeta}>
//                         Qty: {it.quantity} • ${Number(it.unit_price || 0).toFixed(2)}
//                       </Text>
//                     </View>
//                   </View>
//                 ))}
//               </View>

//               {/* Instructions based on status */}
//               <View style={styles.instructions}>
//                 {paymentStatus.status === "unpaid" && (
//                   <Text style={styles.instructionText}>
//                     ⚠️ Pay within 48 hours to keep your reservation
//                   </Text>
//                 )}
//                 {paymentStatus.status === "pending" && (
//                   <Text style={styles.instructionText}>
//                     ⏳ Payment is pending. Complete payment to request receiving.
//                   </Text>
//                 )}
//                 {paymentStatus.status === "paid" && receiveStatus.status === "pending" && (
//                   <Text style={styles.instructionText}>
//                     ✅ Paid! Staff will confirm your pickup request shortly.
//                   </Text>
//                 )}
//                 {receiveStatus.status === "confirmed" && (
//                   <Text style={styles.instructionText}>
//                     📦 Go to store and ask staff for pickup code, then enter it above.
//                   </Text>
//                 )}
//               </View>
//             </View>
//           );
//         })
//       )}

//       {/* Pickup Code Modal */}
//       <Modal
//         transparent
//         visible={approveOpen}
//         animationType="fade"
//         onRequestClose={() => setApproveOpen(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Enter Pickup Code</Text>
//             <Text style={styles.modalSub}>
//               Ask the employee for the 6-digit pickup code, then enter it below.
//             </Text>

//             <TextInput
//               value={pickupCodeInput}
//               onChangeText={setPickupCodeInput}
//               placeholder="6-digit code"
//               placeholderTextColor="#94a3b8"
//               keyboardType="number-pad"
//               maxLength={6}
//               style={styles.modalInput}
//               autoFocus
//             />

//             <View style={styles.modalActions}>
//               <Pressable style={styles.modalCancel} onPress={() => setApproveOpen(false)}>
//                 <Text style={styles.modalCancelText}>Cancel</Text>
//               </Pressable>

//               <Pressable
//                 style={[styles.modalOk, { opacity: approving ? 0.7 : 1 }]}
//                 onPress={approvePickupCode}
//                 disabled={approving || pickupCodeInput.length !== 6}
//               >
//                 <Text style={styles.modalOkText}>
//                   {approving ? "Approving..." : "Approve"}
//                 </Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" },

//   header: { padding: 16, borderRadius: 18 },
//   headerTitle: { color: "white", fontWeight: "900", fontSize: 22 },
//   headerSub: { color: "rgba(255,255,255,0.8)", marginTop: 6 },

//   refreshBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)" },
//   refreshText: { color: "white", fontWeight: "900", textAlign: "center" },

//   empty: { marginTop: 20, padding: 18, borderRadius: 18, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
//   emptyText: { color: "#94a3b8", fontWeight: "800", textAlign: "center" },

//   card: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
//   cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   code: { color: "#f9fafb", fontWeight: "900" },
//   timeLeft: { color: "#38bdf8", fontWeight: "900" },

//   cardBottom: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
//   total: { color: "#e5e7eb", fontWeight: "900" },
//   paymentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
//   paymentText: { fontWeight: "900", fontSize: 12 },

//   receiveStatusBadge: { 
//     marginTop: 8, 
//     paddingHorizontal: 12, 
//     paddingVertical: 6, 
//     borderRadius: 20,
//     alignSelf: 'flex-start'
//   },
//   receiveStatusText: { 
//     fontWeight: "900", 
//     fontSize: 12 
//   },

//   paymentRow: { marginTop: 10, flexDirection: "row", gap: 10 },
//   payBtnText: { color: "white", fontWeight: "900", textAlign: "center" },
//   payBtnAlt: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "#0ea5e9" },

//   itemsWrap: { marginTop: 12, gap: 10 },
//   itemRow: { flexDirection: "row", gap: 10, alignItems: "center" },
//   itemImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#0b1220" },
//   imgPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1f2937" },
//   itemName: { color: "#f9fafb", fontWeight: "900" },
//   itemMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

//   actionsRow: { marginTop: 10, flexDirection: "row", gap: 10 },
//   actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "#0ea5e9" },
//   actionText: { color: "white", fontWeight: "900", textAlign: "center" },
//   actionBtnAlt: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "#16a34a" },
//   actionTextAlt: { color: "white", fontWeight: "900", textAlign: "center" },

//   instructions: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "rgba(30, 41, 59, 0.5)" },
//   instructionText: { color: "#94a3b8", fontSize: 12, textAlign: "center" },

//   // Modal styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.65)",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 18,
//   },
//   modalCard: {
//     width: "100%",
//     borderRadius: 18,
//     backgroundColor: "#0b1220",
//     padding: 16,
//     borderWidth: 1,
//     borderColor: "#1f2937",
//   },
//   modalTitle: {
//     color: "#f9fafb",
//     fontWeight: "900",
//     fontSize: 18,
//   },
//   modalSub: {
//     color: "#94a3b8",
//     marginTop: 6,
//     marginBottom: 12,
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: "#1f2937",
//     borderRadius: 14,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     color: "#f9fafb",
//     backgroundColor: "#020617",
//     fontSize: 16,
//     textAlign: "center",
//   },
//   modalActions: {
//     marginTop: 14,
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     gap: 10,
//   },
//   modalCancel: {
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     borderRadius: 12,
//     backgroundColor: "#111827",
//   },
//   modalCancelText: {
//     color: "#e5e7eb",
//     fontWeight: "800",
//   },
//   modalOk: {
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     borderRadius: 12,
//     backgroundColor: "#0ea5e9",
//   },
//   modalOkText: {
//     color: "white",
//     fontWeight: "900",
//   },
// });
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
  Pressable,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

// expo-router optional
let useLocalSearchParams: any = null;
try {
  useLocalSearchParams = require("expo-router").useLocalSearchParams;
} catch {}

import { fetchMyReservations } from "../../lib/storeApi";
import { API_BASE } from "../config/api";

const colors = ["#0ea5e9", "#1d4ed8"];

const resolveImage = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
};

const formatRemaining = (remaining_seconds?: number) => {
  const s = Number(remaining_seconds || 0);
  if (!s || s <= 0) return "Expired";
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

const getPaymentStatus = (r: any) => {
  const st = String(r?.payment_stripe_status || "").trim().toLowerCase();
  const paid = !!r?.payment_is_paid;

  if (paid || st === "paid" || st === "cash") {
    return { status: "paid", text: "Paid", color: "#22c55e", bgColor: "#14532d" };
  }

  if (st === "open" || st === "draft" || st === "pending") {
    return { status: "pending", text: "Payment Pending", color: "#f59e0b", bgColor: "#78350f" };
  }

  return { status: "unpaid", text: "Not Paid", color: "#ef4444", bgColor: "#7f1d1d" };
};

// FIXED: Properly extract customer_id from AsyncStorage
const getCustomerIdFromStorage = async (): Promise<number | null> => {
  try {
    const customerRaw = await AsyncStorage.getItem('customer');
    if (customerRaw) {
      try {
        const customer = JSON.parse(customerRaw);
        
        if (customer?.customer_id) {
          const id = Number(customer.customer_id);
          if (Number.isFinite(id) && id > 0) return id;
        }
        
        if (customer?.user_id) {
          const id = Number(customer.user_id);
          if (Number.isFinite(id) && id > 0) return id;
        }
        
        if (customer?.id) {
          const id = Number(customer.id);
          if (Number.isFinite(id) && id > 0) return id;
        }
      } catch (e) {
        console.log("Failed to parse customer data");
      }
    }
    
    const commonKeys = ['user', 'auth', 'session', 'profile', 'userData'];
    for (const key of commonKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          
          if (obj?.customer_id) {
            const id = Number(obj.customer_id);
            if (Number.isFinite(id) && id > 0) return id;
          }
          
          if (obj?.customer?.customer_id) {
            const id = Number(obj.customer.customer_id);
            if (Number.isFinite(id) && id > 0) return id;
          }
          
          if (obj?.user_id) {
            const id = Number(obj.user_id);
            if (Number.isFinite(id) && id > 0) return id;
          }
          
          if (obj?.id) {
            const id = Number(obj.id);
            if (Number.isFinite(id) && id > 0) return id;
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }
    
    console.log("No customer ID found in storage");
    return null;
  } catch (error) {
    console.error("Error getting customer ID:", error);
    return null;
  }
};

// Check receive request status
const getReceiveRequestStatus = (r: any) => {
  const st = String(r?.receive_request_status || "").trim().toLowerCase();
  
  if (st === "pending") {
    return { 
      status: "pending", 
      text: "Waiting for staff...", 
      color: "#f59e0b", 
      bgColor: "#78350f",
      buttonText: "Pending...",
      buttonColor: "#f59e0b"
    };
  }
  
  if (st === "confirmed") {
    return { 
      status: "confirmed", 
      text: "Ready for pickup!", 
      color: "#3b82f6", 
      bgColor: "#1e3a8a",
      buttonText: "Enter Pickup Code",
      buttonColor: "#16a34a"
    };
  }
  
  if (st === "approved") {
    return { 
      status: "approved", 
      text: "Received ✓", 
      color: "#22c55e", 
      bgColor: "#14532d",
      buttonText: "Received",
      buttonColor: "#22c55e"
    };
  }
  
  return { 
    status: "none", 
    text: "No request", 
    color: "#94a3b8", 
    bgColor: "#374151",
    buttonText: "Request Receiving",
    buttonColor: "#0ea5e9"
  };
};

export default function MyReservedTab() {
  const params = useLocalSearchParams ? useLocalSearchParams() : {};
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<number | null>(null); // Track which reservation is being requested
  const [paying, setPaying] = useState<number | null>(null); // Track which reservation is being paid
  const [approving, setApproving] = useState(false);
  
  // Track which reservation is being paid so we can refresh when user returns
  const [pendingPaymentReservationId, setPendingPaymentReservationId] = useState<number | null>(null);
  
  // Track reservations that have pending requests for polling
  const [pollingReservations, setPollingReservations] = useState<number[]>([]);
  
  // Ref for interval - using number for React Native
  const pollingIntervalRef = useRef<number | null>(null);

  // Modal states
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveReservationId, setApproveReservationId] = useState<number | null>(null);
  const [pickupCodeInput, setPickupCodeInput] = useState("");

  const load = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const customerId = await getCustomerIdFromStorage();
      
      if (!customerId) {
        setReservations([]);
        Alert.alert("Login Required", "Please login to view your reservations.");
        return;
      }
      
      const data = await fetchMyReservations(customerId);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.reservations)
        ? data.reservations
        : [];

      setReservations(list);
      
      // Update polling reservations - add any with pending requests
      const newPollingIds: number[] = [];
      list.forEach((r: any) => {
        const receiveStatus = getReceiveRequestStatus(r);
        if (receiveStatus.status === "pending") {
          newPollingIds.push(r.reservation_id);
        }
      });
      setPollingReservations(newPollingIds);
      
    } catch (e: any) {
      console.error("fetchMyReservations error:", e);
      setReservations([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Polling function for pending requests
  const startPolling = () => {
    // Clear existing interval
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Start new interval if we have pending reservations
    if (pollingReservations.length > 0) {
      pollingIntervalRef.current = setInterval(async () => {
        console.log("Polling for reservations:", pollingReservations);
        await load(false);
      }, 5000) as unknown as number; // Cast to number for React Native
    }
  };

  const checkPaymentStatus = async (reservationId: number) => {
    try {
      console.log("Checking payment status for reservation:", reservationId);
      const resp = await fetch(`${API_BASE}/api/store/payments/status/${reservationId}`);
      const data = await resp.json();
      console.log("Payment status check result:", data);
      return data;
    } catch (e) {
      console.log("checkPaymentStatus error", e);
      return null;
    }
  };

  const payOnline = async (reservation: any) => {
    try {
      if (!reservation?.reservation_id) return;

      setPaying(reservation.reservation_id);

      const customerId = await getCustomerIdFromStorage();
      if (!customerId) {
        Alert.alert("Error", "User not found. Please login again.");
        return;
      }

      const resp = await fetch(`${API_BASE}/api/store/payments/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation.reservation_id,
          customer_id: reservation.customer_id || customerId,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || data?.message || "Failed");

      const url = data?.hosted_invoice_url || reservation?.payment_hosted_invoice_url;
      if (!url) {
        Alert.alert("Payment", "Invoice created but no URL returned.");
        return;
      }

      setPendingPaymentReservationId(reservation.reservation_id);
      
      console.log("Opening Stripe URL, will check status when user returns");
      await WebBrowser.openBrowserAsync(url);
      
      // Check payment status immediately after browser closes
      await checkPaymentStatus(reservation.reservation_id);
      await load();
      
    } catch (e: any) {
      Alert.alert("Payment Error", e?.message || "Failed to start payment.");
    } finally {
      setPaying(null);
    }
  };

  const requestReceiving = async (reservation: any) => {
    try {
      if (requesting) return;
      setRequesting(reservation.reservation_id);

      const paymentStatus = getPaymentStatus(reservation);
      if (paymentStatus.status !== "paid") {
        Alert.alert("Payment Required", "Please complete payment before requesting receiving.");
        setRequesting(null);
        return;
      }

      const rawCustomer = await AsyncStorage.getItem("customer");
      const customerObj = rawCustomer ? JSON.parse(rawCustomer) : null;

      const resp = await fetch(`${API_BASE}/api/store/receive-requests/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservation.reservation_id,
          customer_name: customerObj?.name || customerObj?.full_name || "Customer",
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed");

      // Show success message
      Alert.alert(
        "Request Sent!",
        "Your request has been sent to staff. They will confirm and provide a pickup code shortly.",
        [{ text: "OK", onPress: () => {
          // Add to polling list
          setPollingReservations(prev => [...prev, reservation.reservation_id]);
          // Refresh data
          load(false);
        }}]
      );
      
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to request receiving");
    } finally {
      setRequesting(null);
    }
  };

  const openApproveModal = (reservation_id: number) => {
    setApproveReservationId(reservation_id);
    setPickupCodeInput("");
    setApproveOpen(true);
  };

  const approvePickupCode = async () => {
    try {
      if (!approveReservationId) return;

      const code = pickupCodeInput.trim();
      if (!code) {
        Alert.alert("Missing code", "Please enter the pickup code.");
        return;
      }

      if (code.length !== 6 || !/^\d+$/.test(code)) {
        Alert.alert("Invalid Code", "Pickup code must be 6 digits.");
        return;
      }

      setApproving(true);

      const resp = await fetch(`${API_BASE}/api/store/receive-requests/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: approveReservationId,
          request_code: code,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed");

      setApproveOpen(false);
      Alert.alert("Success", "Items received! Thank you for your purchase.");
      
      // Remove from polling if it was there
      setPollingReservations(prev => prev.filter(id => id !== approveReservationId));
      
      await load(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to approve code");
    } finally {
      setApproving(false);
    }
  };

  // Initial load
  useEffect(() => {
    load();
    
    // Cleanup interval on unmount
    return () => {
      if (pollingIntervalRef.current !== null) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Restart polling when pollingReservations changes
  useEffect(() => {
    startPolling();
  }, [pollingReservations]);

  // Listen for when user returns to app from Stripe payment
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state === "active" && pendingPaymentReservationId) {
        console.log("User returned to app, checking payment status for:", pendingPaymentReservationId);
        
        setTimeout(async () => {
          try {
            await checkPaymentStatus(pendingPaymentReservationId);
            await load(false);
            setPendingPaymentReservationId(null);
          } catch (error) {
            console.error("Failed to refresh payment status:", error);
          }
        }, 1000);
      }
    });

    return () => subscription.remove();
  }, [pendingPaymentReservationId]);

  const liveReservations = useMemo(() => {
    return (Array.isArray(reservations) ? reservations : []).filter((r) => {
      const st = String(r.status || "").trim().toLowerCase();
      return st === "reserved";
    });
  }, [reservations]);

  if (loading && reservations.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10, color: "#94a3b8" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: "#020617" }} 
      contentContainerStyle={{ padding: 14, paddingBottom: 90 }}
    >
      <LinearGradient colors={colors as any} style={styles.header}>
        <Text style={styles.headerTitle}>My Reserved Items</Text>
        <Text style={styles.headerSub}>Reservations expire after 48 hours.</Text>

        <TouchableOpacity onPress={() => load()} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </LinearGradient>

      {liveReservations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No active reservations.</Text>
        </View>
      ) : (
        liveReservations.map((r) => {
          const paymentStatus = getPaymentStatus(r);
          const receiveStatus = getReceiveRequestStatus(r);
          const isRequestingThis = requesting === r.reservation_id;
          const isPayingThis = paying === r.reservation_id;

          return (
            <View key={r.reservation_id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.code}>Code: {r.reservation_code}</Text>
                <Text style={styles.timeLeft}>{formatRemaining(r.remaining_seconds)} left</Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.total}>Total: ${Number(r.total_final_price || 0).toFixed(2)}</Text>

                <View style={[styles.paymentBadge, { backgroundColor: paymentStatus.bgColor }]}>
                  <Text style={[styles.paymentText, { color: paymentStatus.color }]}>{paymentStatus.text}</Text>
                </View>
              </View>

              {/* Receive Request Status */}
              {receiveStatus.status !== "none" && (
                <View style={[styles.receiveStatusBadge, { backgroundColor: receiveStatus.bgColor }]}>
                  <Text style={[styles.receiveStatusText, { color: receiveStatus.color }]}>
                    {receiveStatus.text}
                  </Text>
                  {receiveStatus.status === "pending" && (
                    <ActivityIndicator size="small" color={receiveStatus.color} style={{ marginLeft: 8 }} />
                  )}
                </View>
              )}

              {/* Payment Button - Only show if not paid */}
              {paymentStatus.status !== "paid" && (
                <View style={styles.paymentRow}>
                  <TouchableOpacity 
                    style={[
                      styles.payBtnAlt, 
                      { 
                        backgroundColor: isPayingThis ? "#0c4a6e" : "#0ea5e9",
                        opacity: isPayingThis ? 0.8 : 1
                      }
                    ]} 
                    disabled={isPayingThis} 
                    onPress={() => payOnline(r)}
                  >
                    {isPayingThis ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.payBtnText}>Pay Online</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button - Changes based on status */}
              {paymentStatus.status === "paid" && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity 
                    style={[
                      styles.actionBtn, 
                      { 
                        backgroundColor: receiveStatus.buttonColor,
                        opacity: (isRequestingThis || receiveStatus.status === "pending") ? 0.8 : 1
                      }
                    ]} 
                    disabled={isRequestingThis || receiveStatus.status === "pending" || receiveStatus.status === "approved"} 
                    onPress={() => {
                      if (receiveStatus.status === "none") {
                        requestReceiving(r);
                      } else if (receiveStatus.status === "confirmed") {
                        openApproveModal(r.reservation_id);
                      }
                    }}
                  >
                    {isRequestingThis ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.actionText}> Sending...</Text>
                      </>
                    ) : receiveStatus.status === "pending" ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        <Text style={styles.actionText}> Waiting for staff...</Text>
                      </>
                    ) : (
                      <Text style={styles.actionText}>{receiveStatus.buttonText}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Items List */}
              <View style={styles.itemsWrap}>
                {(r.items || []).map((it: any) => (
                  <View key={`${it.product_id}-${it.name}`} style={styles.itemRow}>
                    {it.image_url ? <Image source={{ uri: resolveImage(it.image_url) }} style={styles.itemImg} /> : <View style={[styles.itemImg, styles.imgPlaceholder]} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{it.name}</Text>
                      <Text style={styles.itemMeta}>
                        Qty: {it.quantity} • ${Number(it.unit_price || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Status Instructions */}
              <View style={styles.instructions}>
                {paymentStatus.status === "unpaid" && (
                  <Text style={styles.instructionText}>
                    ⚠️ Pay within {formatRemaining(r.remaining_seconds)} to keep your reservation
                  </Text>
                )}
                {paymentStatus.status === "pending" && (
                  <Text style={styles.instructionText}>
                    ⏳ Payment is processing. Complete payment to request receiving.
                  </Text>
                )}
                {paymentStatus.status === "paid" && receiveStatus.status === "none" && (
                  <Text style={styles.instructionText}>
                    ✅ Paid! Click "Request Receiving" to notify staff.
                  </Text>
                )}
                {receiveStatus.status === "pending" && (
                  <Text style={styles.instructionText}>
                    📞 Staff has been notified. They will confirm shortly.
                  </Text>
                )}
                {receiveStatus.status === "confirmed" && (
                  <Text style={styles.instructionText}>
                    🏪 Go to store, show your reservation, and ask for pickup code.
                  </Text>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* Pickup Code Modal */}
      <Modal
        transparent
        visible={approveOpen}
        animationType="fade"
        onRequestClose={() => setApproveOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Pickup Code</Text>
            <Text style={styles.modalSub}>
              Staff gave you a 6-digit code. Enter it below to receive your items.
            </Text>

            <TextInput
              value={pickupCodeInput}
              onChangeText={setPickupCodeInput}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.modalInput}
              autoFocus
              selectTextOnFocus
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setApproveOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalOk, { opacity: approving ? 0.7 : 1 }]}
                onPress={approvePickupCode}
                disabled={approving || pickupCodeInput.length !== 6}
              >
                {approving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalOkText}>Confirm Receipt</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#020617" },

  header: { padding: 16, borderRadius: 18 },
  headerTitle: { color: "white", fontWeight: "900", fontSize: 22 },
  headerSub: { color: "rgba(255,255,255,0.8)", marginTop: 6 },

  refreshBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.18)" },
  refreshText: { color: "white", fontWeight: "900", textAlign: "center" },

  empty: { marginTop: 20, padding: 18, borderRadius: 18, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  emptyText: { color: "#94a3b8", fontWeight: "800", textAlign: "center" },

  card: { marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "#0b1220", borderWidth: 1, borderColor: "#1f2937" },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { color: "#f9fafb", fontWeight: "900" },
  timeLeft: { color: "#38bdf8", fontWeight: "900" },

  cardBottom: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  total: { color: "#e5e7eb", fontWeight: "900" },
  paymentBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  paymentText: { fontWeight: "900", fontSize: 12 },

  receiveStatusBadge: { 
    marginTop: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center'
  },
  receiveStatusText: { 
    fontWeight: "900", 
    fontSize: 12 
  },

  paymentRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  payBtnText: { color: "white", fontWeight: "900", textAlign: "center" },
  payBtnAlt: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    backgroundColor: "#0ea5e9",
    alignItems: 'center',
    justifyContent: 'center'
  },

  itemsWrap: { marginTop: 12, gap: 10 },
  itemRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  itemImg: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#0b1220" },
  imgPlaceholder: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1f2937" },
  itemName: { color: "#f9fafb", fontWeight: "900" },
  itemMeta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

  actionsRow: { marginTop: 10, flexDirection: "row", gap: 10 },
  actionBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    backgroundColor: "#0ea5e9",
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  actionText: { color: "white", fontWeight: "900", textAlign: "center", marginLeft: 4 },
  actionBtnAlt: { flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: "#16a34a" },
  actionTextAlt: { color: "white", fontWeight: "900", textAlign: "center" },

  instructions: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "rgba(30, 41, 59, 0.5)" },
  instructionText: { color: "#94a3b8", fontSize: 12, textAlign: "center" },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#0b1220",
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  modalTitle: {
    color: "#f9fafb",
    fontWeight: "900",
    fontSize: 18,
  },
  modalSub: {
    color: "#94a3b8",
    marginTop: 6,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#1f2937",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 15,
    color: "#f9fafb",
    backgroundColor: "#020617",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "bold",
    letterSpacing: 10,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  modalCancelText: {
    color: "#e5e7eb",
    fontWeight: "800",
  },
  modalOk: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#0ea5e9",
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOkText: {
    color: "white",
    fontWeight: "900",
  },
});