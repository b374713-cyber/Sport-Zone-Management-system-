
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as WebBrowser from "expo-web-browser";
import { API_BASE } from "../../config/api";

const AVAIL_URL = `${API_BASE}/api/sports/availability`;
const RESERVE_URL = `${API_BASE}/api/sports/reservations`;
const RES_BY_DATE_URL = `${API_BASE}/api/sports/reservations/date`;
const CANCEL_URL = `${API_BASE}/api/sports/reservations`;

type PaymentInfo = {
  reservation_id: number;
  stripe_invoice_status?: string;
  hosted_invoice_url?: string;
  invoice_pdf_url?: string;
  is_paid?: boolean;
};

export default function StadiumScheduleScreen() {
  const router = useRouter();
  const { id, stadium_name } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const [customer, setCustomer] = useState<any | null>(null);

  // "My reservation in this selected slot" (if the slot is reserved and belongs to me)
  const [myReservationId, setMyReservationId] = useState<number | null>(null);

  // payment panel for myReservationId
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // prevents duplicate alerts (Paid/Cancelled/etc)
  const lastAlertKeyRef = useRef<string>("");

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    loadCustomer();
  }, []);

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, id]);

  const loadCustomer = async () => {
    try {
      const stored = await AsyncStorage.getItem("customer");
      if (stored) setCustomer(JSON.parse(stored));
    } catch (e) {
      console.log("loadCustomer error", e);
    }
  };

  const loadAvailability = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // DO NOT auto-clear selectedSlot always, because user may be selecting a reserved slot
      // But we do clear reservation/payment state until we re-detect it for selected slot.
      setMyReservationId(null);
      setPayment(null);

      const res = await axios.get(`${AVAIL_URL}/${id}/${selectedDate}`);
      setSlots(res.data.availableSlots || []);
    } catch (err) {
      console.log("availability error", err);
      Alert.alert("Error", "Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  };

  const openUrl = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.log("openUrl error", e);
      Alert.alert("Error", "Could not open link.");
    }
  };

  /**
   * Detect if the currently selected (reserved) slot belongs to this customer.
   * If yes -> set myReservationId and (optionally) load payment info from API
   */
  const checkIfMyReservation = async (slot: any) => {
    setMyReservationId(null);
    setPayment(null);

    if (!customer) return;

    try {
      const res = await axios.get(`${RES_BY_DATE_URL}/${selectedDate}`);
      const reservations = res.data.reservations || [];

      const match = reservations.find((r: any) => {
        const sameStadium = String(r.stadium_id) === String(id);
        const sameSlot =
          r.start_time === slot.start_time && r.end_time === slot.end_time;

        // treat cancelled as not-active (so it shouldn't show as reserved)
        const notCancelled = r.status !== "Cancelled";

        const byId =
          customer.customer_id &&
          r.customer_id &&
          String(r.customer_id) === String(customer.customer_id);

        const byName =
          r.customer_name && customer.name && r.customer_name === customer.name;

        return sameStadium && sameSlot && notCancelled && (byId || byName);
      });

      if (match?.reservation_id) {
        setMyReservationId(match.reservation_id);

        // Load payment info once when selecting your reservation
        await fetchPaymentInfo(match.reservation_id, { silent: true });
      }
    } catch (err) {
      console.log("check reservation error", err);
    }
  };

  const onSelectSlot = async (slot: any) => {
    setSelectedSlot(slot);

    // Available slot -> user can reserve; clear my reservation state
    if (slot.available) {
      setMyReservationId(null);
      setPayment(null);
      return;
    }

    // Reserved slot -> check if it's mine
    await checkIfMyReservation(slot);
  };

  /**
   * Fetch payment status and store it.
   * If not silent, show exactly ONE alert per (reservationId + paidStatus) to avoid duplicates.
   */
  const fetchPaymentInfo = async (
    reservationId: number,
    opts?: { silent?: boolean }
  ) => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/sports/reservations/${reservationId}/payment-status`
      );

      const info: PaymentInfo = {
        reservation_id: reservationId,
        stripe_invoice_status: res.data.stripe_invoice_status,
        hosted_invoice_url: res.data.hosted_invoice_url,
        invoice_pdf_url: res.data.invoice_pdf_url,
        is_paid: res.data.is_paid,
      };

      setPayment(info);

      if (!opts?.silent) {
        const key = `${reservationId}:${info.is_paid ? "PAID" : "NOTPAID"}`;
        if (lastAlertKeyRef.current !== key) {
          lastAlertKeyRef.current = key;

          if (info.is_paid) {
            Alert.alert("Paid ✅", "Payment confirmed. Your reservation is Confirmed.");
          } else {
            Alert.alert("Pending ⏳", "Payment not completed yet.");
          }
        }
      }

      return info;
    } catch (err: any) {
      console.log("payment-status error", err?.response?.data || err);
      if (!opts?.silent) {
        Alert.alert("Error", err?.response?.data?.error || "Failed to check payment status");
      }
      return null;
    }
  };

  const checkPaymentStatus = async (reservationId: number) => {
    try {
      setCheckingPayment(true);
      await fetchPaymentInfo(reservationId, { silent: false });
      // refresh availability after check (so Reserved/Available updates correctly)
      await loadAvailability();
    } finally {
      setCheckingPayment(false);
    }
  };

  /**
   * Reserve flow: show Pay Now / Pay Later
   * - Pay Now opens Stripe
   * - Pay Later does NOT claim it's paid; it just keeps reservation pending
   */
  const reserve = async () => {
    if (!customer) {
      Alert.alert("Login required", "Login first to reserve.", [
        { text: "OK", onPress: () => router.back() },
      ]);
      return;
    }

    if (!selectedSlot || !selectedSlot.available) {
      Alert.alert("Choose time", "Select an available slot first.");
      return;
    }

    try {
      // Load stadium to compute total_price
      const stadiumsRes = await axios.get(`${API_BASE}/api/sports/stadiums`);
      const stadium = (stadiumsRes.data.stadiums || []).find(
        (s: any) => String(s.stadium_id) === String(id)
      );

      if (!stadium) {
        Alert.alert("Error", "Stadium not found.");
        return;
      }

      const total_price = Number(stadium.price_per_hour || 0);

      const payload: any = {
        stadium_id: Number(id),
        reservation_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        total_price,
      };

      // use customer_id if possible
      if (customer.customer_id) {
        payload.customer_id = customer.customer_id;
      } else {
        payload.customer_name = customer.name;
        payload.customer_phone = customer.phone || "";
        payload.customer_email = customer.email || undefined;
      }

      const createRes = await axios.post(RESERVE_URL, payload);

      const reservation = createRes.data?.reservation;
      const pay = createRes.data?.payment;

      if (!reservation?.reservation_id) {
        Alert.alert("Reserved", "Reservation created.");
        await loadAvailability();
        return;
      }

      // Set myReservationId and store payment links (if any)
      setMyReservationId(reservation.reservation_id);

      const paymentInfo: PaymentInfo = {
        reservation_id: reservation.reservation_id,
        hosted_invoice_url: pay?.hosted_invoice_url,
        invoice_pdf_url: pay?.invoice_pdf_url,
        stripe_invoice_status: pay?.stripe_invoice_status,
        is_paid: false,
      };
      setPayment(paymentInfo);

      // IMPORTANT: Do NOT show "paid" on reserve. Only "Pending Payment"
      Alert.alert(
        "Pending Payment ⏳",
        "Reservation created. Pay now to confirm, or pay later from the buttons below.",
        [
          {
            text: "Pay Now",
            onPress: async () => {
              if (pay?.hosted_invoice_url) {
                await openUrl(pay.hosted_invoice_url);
                // DO NOT auto-alert "Paid" here.
                // User will press "Confirm Payment" button after returning.
              } else {
                Alert.alert("No payment link", "Payment link was not returned.");
              }
            },
          },
          {
            text: "Pay Later",
            style: "cancel",
            onPress: async () => {
              // just close the alert; do not claim paid
              // keep payment panel available below
            },
          },
        ]
      );

      // After creating reservation, refresh slots so it becomes Reserved
      setSelectedSlot(null);
      await loadAvailability();
    } catch (err: any) {
      console.log("reserve error", err?.response?.data || err);
      Alert.alert(
        "Failed",
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Slot already reserved."
      );
    }
  };

  /**
   * Cancel my reservation:
   * - If paid => warn user money lost
   * - After cancel => show "cancelled" (NOT confirmed)
   */
  const cancelMyReservation = async () => {
    if (!myReservationId) return;

    let isPaid = false;
    try {
      const ps = await axios.get(
        `${API_BASE}/api/sports/reservations/${myReservationId}/payment-status`
      );
      isPaid = ps.data?.is_paid === true;
    } catch {
      isPaid = false;
    }

    const msg = isPaid
      ? "This reservation is already PAID.\nIf you cancel, you will lose your money."
      : "Are you sure you want to cancel this reservation?";

    Alert.alert("Cancel reservation?", msg, [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.patch(`${CANCEL_URL}/${myReservationId}/cancel`);

            // Avoid duplicate alerts: give a unique key
            const key = `${myReservationId}:CANCELLED`;
            if (lastAlertKeyRef.current !== key) {
              lastAlertKeyRef.current = key;
              Alert.alert("Cancelled ✅", "Your reservation is cancelled.");
            }

            setSelectedSlot(null);
            setMyReservationId(null);
            setPayment(null);
            await loadAvailability();
          } catch (err) {
            console.log("cancel error", err);
            Alert.alert("Error", "Failed to cancel.");
          }
        },
      },
    ]);
  };

  const showBottomActions =
    // If selected slot is available -> show only reserve button
    (selectedSlot && selectedSlot.available) ||
    // If selected slot is reserved AND belongs to me -> show payment/cancel buttons
    (!!myReservationId);

  const selectedIsAvailable = !!(selectedSlot && selectedSlot.available);
  const selectedIsMineReserved = !!myReservationId;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading schedule.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 8 }}>
        {stadium_name || "Stadium Schedule"}
      </Text>

      {/* Date Selector */}
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
        Select Date
      </Text>

      <View style={{ flexDirection: "row", marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(todayStr)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: selectedDate === todayStr ? "#0a7ea4" : "#eee",
            marginRight: 8,
          }}
        >
          <Text style={{ color: selectedDate === todayStr ? "white" : "black" }}>
            Today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedDate(tomorrowStr)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: selectedDate === tomorrowStr ? "#0a7ea4" : "#eee",
          }}
        >
          <Text style={{ color: selectedDate === tomorrowStr ? "white" : "black" }}>
            Tomorrow
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slots */}
      {slots.map((slot, idx) => {
        const isSelected =
          selectedSlot &&
          selectedSlot.start_time === slot.start_time &&
          selectedSlot.end_time === slot.end_time;

        return (
          <TouchableOpacity
            key={idx}
            onPress={() => onSelectSlot(slot)}
            activeOpacity={0.85}
            style={{
              padding: 14,
              borderRadius: 14,
              marginBottom: 10,
              backgroundColor: slot.available ? "white" : "#f3f4f6",
              borderWidth: isSelected ? 2 : 1,
              borderColor: isSelected ? "#0a7ea4" : "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "800" }}>
              {slot.start_time} - {slot.end_time}
            </Text>

            <Text style={{ marginTop: 6, color: slot.available ? "#16a34a" : "#6b7280" }}>
              {slot.available ? "Available" : "Reserved"}
            </Text>

            {/* If selected is a reserved slot and it's ours */}
            {!slot.available && isSelected && myReservationId && (
              <Text style={{ marginTop: 6, color: "#0a7ea4", fontWeight: "700" }}>
                This reservation is yours (ID: {myReservationId})
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Bottom Actions */}
      {showBottomActions && (
        <View style={{ marginTop: 8 }}>
          {/* If Available slot selected -> ONLY Reserve button */}
          {selectedIsAvailable && (
            <TouchableOpacity
              onPress={reserve}
              activeOpacity={0.9}
              style={{
                backgroundColor: "#0a7ea4",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                Reserve (Pending Payment)
              </Text>
            </TouchableOpacity>
          )}

          {/* If reserved slot is mine -> show Cancel + Confirm Payment (+ PDF + Open Invoice) */}
          {selectedIsMineReserved && (
            <>
              <TouchableOpacity
                onPress={cancelMyReservation}
                activeOpacity={0.9}
                style={{
                  backgroundColor: "#ef4444",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                  Cancel My Reservation
                </Text>
              </TouchableOpacity>

              {/* If we have hosted invoice, show Pay button (works for "Pay later") */}
              {!!payment?.hosted_invoice_url && (
                <TouchableOpacity
                  onPress={() => openUrl(payment.hosted_invoice_url)}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: "#111827",
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                    Pay Now (Open Stripe Invoice)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Confirm payment status */}
              <TouchableOpacity
                disabled={checkingPayment}
                onPress={() => myReservationId && checkPaymentStatus(myReservationId)}
                activeOpacity={0.9}
                style={{
                  backgroundColor: checkingPayment ? "#94a3b8" : "#0a7ea4",
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                  {checkingPayment ? "Checking..." : "Confirm Payment"}
                </Text>
              </TouchableOpacity>

              {/* PDF */}
              {!!payment?.invoice_pdf_url && (
                <TouchableOpacity
                  onPress={() => openUrl(payment.invoice_pdf_url)}
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: "#22c55e",
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 16, fontWeight: "800" }}>
                    View Invoice PDF
                  </Text>
                </TouchableOpacity>
              )}

              {/* Status text */}
              <View
                style={{
                  marginTop: 6,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  backgroundColor: "white",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900" }}>Payment Status</Text>
                <Text style={{ marginTop: 8, color: "#334155" }}>
                  Status:{" "}
                  <Text style={{ fontWeight: "900" }}>
                    {payment?.is_paid
                      ? "Paid ✅"
                      : payment?.stripe_invoice_status || "Pending ⏳"}
                  </Text>
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
