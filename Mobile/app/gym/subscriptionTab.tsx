
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, StyleSheet, Alert,
  Modal, FlatList
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "../config/api";
import {
  getCustomerAssignments,
  getAllCoaches, // CHANGED: Use getAllCoaches instead of getAvailableCoaches
  assignCoach,
  unassignCoach
} from "../../lib/gymApi";

const PRICE_PER_MONTH = 30;

const getSubForCustomer = (customerId: number) =>
  fetch(`${API_BASE}/api/gym/subscriptions/customer/${customerId}`);
const getMemberProfile = (customerId: number) =>
  fetch(`${API_BASE}/api/gym/members/customer/${customerId}`);

const requestSubscription = (payload: any) =>
  fetch(`${API_BASE}/api/gym/subscriptions/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
// Add this near the top of subscriptionTab.tsx (after imports, before component)
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
function isValidDateStr(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function fetchGymProfile(customerId: number) {
  const res = await fetch(`${API_BASE}/api/gym/profile/customer/${customerId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.profile || null;
}

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const end = new Date(d);
  end.setMonth(end.getMonth() + months);
  if (end.getDate() !== d.getDate()) {
    end.setDate(0);
  }
  return end.toISOString().slice(0, 10);
}

export default function SubscriptionTab() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "",
    birth_date: "",
    height_cm: "",
    weight_kg: "",
    plan_type: "Monthly" as "Monthly" | "3-Month" | "6-Month" | "Yearly",
    start_date: "",
    end_date: "",
    price: "",
  });

  // NEW STATES FOR COACHES
  const [myCoaches, setMyCoaches] = useState<any[]>([]);
  const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [showCoachModal, setShowCoachModal] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    init();
  }, []);
const init = async () => {
  try {
    setLoading(true);

    const customerRaw = await AsyncStorage.getItem("customer");
    const customer = customerRaw ? JSON.parse(customerRaw) : null;
    setUser(customer);

    if (!customer) {
      setSubscription(null);
      return;
    }

    // ✅ fetch profile from DB
    if (customer.customer_id) {
      try {
        const profRes = await fetch(`${API_BASE}/api/gym/profile/${customer.customer_id}`);
        const prof = await profRes.json();

        setForm((f) => ({
          ...f,
          full_name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          gender: customer.gender || "",
          birth_date: prof.birth_date ?? (customer.birth_date ? String(customer.birth_date).slice(0, 10) : ""),
          // Auto-fill height and weight from DB
          height_cm: prof.height_cm != null ? String(prof.height_cm) : "",
          weight_kg: prof.weight_kg != null ? String(prof.weight_kg) : "",
        }));
      } catch (e) {
        console.log("profile load error:", e);
        // Fallback to local data
        setForm((f) => ({
          ...f,
          full_name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          birth_date: customer.birth_date
            ? String(customer.birth_date).slice(0, 10)
            : "",
          gender: customer.gender || "",
        }));
      }
    }

    const res = await getSubForCustomer(customer.customer_id);
    const data = await res.json();
    setSubscription(data.subscription || null);

  } catch (e: any) {
    console.log("gym subscription load error", e);
    setSubscription(null);
  } finally {
    setLoading(false);
  }
};
  // Load coaches data when subscription is active
  useEffect(() => {
    if (user?.customer_id && subscription?.status === "Active") {
      loadCoachesData();
    } else {
      setMyCoaches([]);
      setAvailableCoaches([]);
      setMemberId(null);
    }
  }, [user, subscription, refreshKey]);

  // FIXED: Use getAllCoaches to get ALL coaches
  const loadCoachesData = async () => {
    if (!user?.customer_id) return;
    
    try {
      setAssignmentsLoading(true);
      
      // Get customer assignments to find member_id
      const assignmentsData = await getCustomerAssignments(user.customer_id);
      
      if (assignmentsData.member?.member_id) {
        setMemberId(assignmentsData.member.member_id);
        
        // Get active assignments
        const activeAssignments = assignmentsData.assignments?.filter(
          (a: any) => a.status === "Active"
        ) || [];
        setMyCoaches(activeAssignments);
      }
      
      // Get ALL coaches using the new endpoint (not filtered)
      const coachesData = await getAllCoaches();
      setAvailableCoaches(coachesData.coaches || []);
      
    } catch (error) {
      console.error("Error loading coaches:", error);
      Alert.alert("Error", "Failed to load coaches data");
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const planMonths = useMemo(() => {
    return form.plan_type === "Monthly" ? 1
      : form.plan_type === "3-Month" ? 3
      : form.plan_type === "6-Month" ? 6
      : 12;
  }, [form.plan_type]);

  const computedEndDate = useMemo(() => {
    if (!isValidDateStr(form.start_date)) return "";
    return addMonths(form.start_date, planMonths);
  }, [form.start_date, planMonths]);

  const computedPrice = useMemo(() => {
    return String(planMonths * PRICE_PER_MONTH);
  }, [planMonths]);

  useEffect(() => {
    setForm((f) => ({
      ...f,
      end_date: computedEndDate,
      price: computedPrice,
    }));
  }, [computedEndDate, computedPrice]);

  const onSelectPlan = (p: "Monthly" | "3-Month" | "6-Month" | "Yearly") => {
    setForm((f) => {
      const start = isValidDateStr(f.start_date) ? f.start_date : todayStr();
      const months =
        p === "Monthly" ? 1 :
        p === "3-Month" ? 3 :
        p === "6-Month" ? 6 : 12;

      return {
        ...f,
        plan_type: p,
        start_date: start,
        end_date: addMonths(start, months),
        price: String(months * PRICE_PER_MONTH),
      };
    });
  };
////
// Add this function near the top of the file
// function calculateAge(birthDate: string): number | null {
//   if (!birthDate) return null;
  
//   const birth = new Date(birthDate);
//   const today = new Date();
  
//   if (isNaN(birth.getTime())) return null;
  
//   let age = today.getFullYear() - birth.getFullYear();
//   const monthDiff = today.getMonth() - birth.getMonth();
  
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
//     age--;
//   }
  
//   return age;
// }
/////

  // const submit = async () => {
  //   if (!user) {
  //     Alert.alert("Login required", "Please login first.");
  //     return;
  //   }

  //   if (!form.full_name || !form.plan_type) {
  //     Alert.alert("Missing fields", "Please fill required fields.");
  //     return;
  //   }

  //   if (!isValidDateStr(form.start_date)) {
  //     Alert.alert("Invalid start date", "Start Date must be valid.");
  //     return;
  //   }

  //   if (!form.end_date) {
  //     Alert.alert("Error", "End date could not be calculated.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const payload = {
  //       customer_id: user.customer_id,
  //       full_name: form.full_name.trim(),
  //       phone: form.phone || null,
  //       email: form.email || null,
  //       gender: form.gender || null,
  //       birth_date: form.birth_date || null,
  //       height_cm: form.height_cm ? Number(form.height_cm) : null,
  //       weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
  //       plan_type: form.plan_type,
  //       start_date: form.start_date,
  //       end_date: form.end_date,
  //       price: Number(form.price),
  //     };

  //     const res = await requestSubscription(payload);
  //     const data = await res.json();

  //     if (!res.ok) {
  //       Alert.alert("Error", data.error || "Failed to send request");
  //       return;
  //     }

  //     Alert.alert("✅ Sent", "Your gym application was sent!");
  //     setSubscription(data.subscription);

  //   } catch (e: any) {
  //     Alert.alert("Error", e.message || "Request failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
// In subscriptionTab.tsx, inside the submit() function:
const submit = async () => {
  if (!user) {
    Alert.alert("Login required", "Please login first.");
    return;
  }

  if (!form.full_name || !form.plan_type) {
    Alert.alert("Missing fields", "Please fill required fields.");
    return;
  }

  if (!isValidDateStr(form.start_date)) {
    Alert.alert("Invalid start date", "Start Date must be valid.");
    return;
  }

  if (!form.end_date) {
    Alert.alert("Error", "End date could not be calculated.");
    return;
  }

  try {
    setLoading(true);

    const payload = {
      customer_id: user.customer_id,
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      gender: form.gender || null,
      birth_date: form.birth_date || null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      plan_type: form.plan_type,
      start_date: form.start_date,
      end_date: form.end_date,
      price: Number(form.price),
    };

    const res = await requestSubscription(payload);
    const data = await res.json();

    if (!res.ok) {
      Alert.alert("Error", data.error || "Failed to send request");
      return;
    }

    Alert.alert("✅ Sent", "Your gym application was sent!");
    setSubscription(data.subscription);

    // ✅ Save profile data to customer object in AsyncStorage
    try {
      const updatedCustomer = {
        ...user,
        height_cm: form.height_cm ? Number(form.height_cm) : user?.height_cm,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : user?.weight_kg,
        birth_date: form.birth_date || user?.birth_date,
        // Calculate age from birth_date if available
        age: form.birth_date ? calculateAge(form.birth_date) : user?.age,
      };
      setUser(updatedCustomer);
      await AsyncStorage.setItem("customer", JSON.stringify(updatedCustomer));
    } catch (e) {
      console.log("Error updating customer profile:", e);
    }

  } catch (e: any) {
    Alert.alert("Error", e.message || "Request failed");
  } finally {
    setLoading(false);
  }
};
  // NEW: Handle assign coach
  const handleAssignCoach = async (coachId: number) => {
    if (!memberId) {
      Alert.alert("Error", "You need an active gym membership to assign coaches");
      return;
    }
    
    try {
      const result = await assignCoach(coachId, memberId);
      
      if (result.error) {
        Alert.alert("Error", result.error);
      } else {
        Alert.alert("Success", "Coach assigned successfully!");
        setRefreshKey(prev => prev + 1); // Refresh data
        setShowCoachModal(false);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to assign coach");
    }
  };

  // NEW: Handle unassign coach
  const handleUnassignCoach = async (assignmentId: number) => {
    Alert.alert(
      "Unassign Coach",
      "Are you sure you want to unassign this coach?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unassign", 
          style: "destructive",
          onPress: async () => {
            try {
              const result = await unassignCoach(assignmentId);
              
              if (result.error) {
                Alert.alert("Error", result.error);
              } else {
                Alert.alert("Success", "Coach unassigned successfully!");
                setRefreshKey(prev => prev + 1); // Refresh data
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to unassign coach");
            }
          }
        }
      ]
    );
  };

  // NEW: Open coach details modal
  const openCoachDetails = (coach: any) => {
    setSelectedCoach(coach);
    setShowCoachModal(true);
  };

  // NEW: Check if coach is already assigned
  const isCoachAssigned = (coachId: number) => {
    return myCoaches.some(coach => coach.coach_id === coachId);
  };

  // NEW: Get assignment ID for a coach
  const getAssignmentIdForCoach = (coachId: number) => {
    const coach = myCoaches.find(c => c.coach_id === coachId);
    return coach?.assignment_id;
  };

  // NEW: Coach Details Modal
  const renderCoachModal = () => (
    <Modal
      visible={showCoachModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCoachModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Coach Details</Text>
          
          {selectedCoach && (
            <ScrollView>
              <Text style={styles.coachName}>{selectedCoach.full_name}</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Specialty:</Text>
                <Text style={styles.infoValue}>{selectedCoach.specialties}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Experience:</Text>
                <Text style={styles.infoValue}>{selectedCoach.experience_years} years</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoValue}>{selectedCoach.phone || "Not provided"}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{selectedCoach.email || "Not provided"}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hourly Rate:</Text>
                <Text style={styles.infoValue}>${selectedCoach.hourly_rate || "0"}/hour</Text>
              </View>
              
              {selectedCoach.certifications && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Certifications:</Text>
                  <Text style={styles.infoValue}>{selectedCoach.certifications}</Text>
                </View>
              )}
              
              {selectedCoach.bio && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bio:</Text>
                  <Text style={styles.infoValue}>{selectedCoach.bio}</Text>
                </View>
              )}
            </ScrollView>
          )}
          
          <View style={styles.modalButtons}>
            {selectedCoach && isCoachAssigned(selectedCoach.coach_id) ? (
              <TouchableOpacity
                style={[styles.modalButton, styles.unassignButton]}
                onPress={() => {
                  const assignmentId = getAssignmentIdForCoach(selectedCoach.coach_id);
                  if (assignmentId) {
                    handleUnassignCoach(assignmentId);
                    setShowCoachModal(false);
                  }
                }}
              >
                <Text style={styles.modalButtonText}>Unassign Coach</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.modalButton, styles.assignButton]}
                onPress={() => handleAssignCoach(selectedCoach?.coach_id)}
                disabled={!memberId}
              >
                <Text style={styles.modalButtonText}>
                  {memberId ? "Assign Coach" : "Need Active Membership"}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowCoachModal(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // NEW: Render a coach item
  const renderCoachItem = ({ item }: { item: any }) => {
    const assigned = isCoachAssigned(item.coach_id);
    
    return (
      <TouchableOpacity
        style={[styles.coachItem, assigned && styles.assignedCoachItem]}
        onPress={() => openCoachDetails(item)}
      >
        <View style={styles.coachInfo}>
          <Text style={styles.coachItemName}>{item.full_name}</Text>
          <Text style={styles.coachItemSpecialty}>{item.specialties}</Text>
          <Text style={styles.coachItemExperience}>
            {item.experience_years} years experience
          </Text>
        </View>
        <View style={styles.coachStatus}>
          {assigned ? (
            <View style={styles.assignedBadge}>
              <Text style={styles.assignedBadgeText}>Assigned</Text>
            </View>
          ) : (
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Available</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // NEW: Render assigned coach item
  const renderMyCoachItem = ({ item }: { item: any }) => (
    <View style={styles.myCoachItem}>
      <View style={styles.myCoachInfo}>
        <Text style={styles.myCoachName}>{item.coach_name}</Text>
        <Text style={styles.myCoachSpecialty}>{item.specialties}</Text>
        <Text style={styles.myCoachDate}>
          Assigned since: {item.start_date?.slice(0, 10)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unassignButtonSmall}
        onPress={() => handleUnassignCoach(item.assignment_id)}
      >
        <Text style={styles.unassignButtonText}>Unassign</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading gym data...</Text>
      </View>
    );
  }

  // ACTIVE SUBSCRIPTION - Show subscription status + coaches sections
  if (subscription && subscription.status === "Active") {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 70 }}>
        {/* Existing subscription status card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏅 Membership Active</Text>

          <InfoRow label="Gym ID" value={subscription.member_id} />
          <InfoRow label="Name" value={subscription.full_name} />
          <InfoRow label="Plan" value={subscription.plan_type} />
          <InfoRow label="Start" value={subscription.start_date} />
          <InfoRow label="End" value={subscription.end_date} />
          <InfoRow label="Price" value={`$${subscription.price}`} />
          <InfoRow label="Status" value={subscription.status} />

          <Text style={styles.note}>
            You can now access Weekly Plan and AI Plan tabs ✅
          </Text>
        </View>

        {/* MY COACHES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Coaches ({myCoaches.length})</Text>
          
          {assignmentsLoading ? (
            <ActivityIndicator size="small" style={{ marginVertical: 20 }} />
          ) : myCoaches.length > 0 ? (
            <FlatList
              data={myCoaches}
              renderItem={renderMyCoachItem}
              keyExtractor={(item) => item.assignment_id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>
              No coaches assigned yet. Browse available coaches below.
            </Text>
          )}
        </View>

        {/* AVAILABLE COACHES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Coaches ({availableCoaches.length})
          </Text>
          
          {assignmentsLoading ? (
            <ActivityIndicator size="small" style={{ marginVertical: 20 }} />
          ) : availableCoaches.length > 0 ? (
            <FlatList
              data={availableCoaches}
              renderItem={renderCoachItem}
              keyExtractor={(item) => item.coach_id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>No coaches available at the moment.</Text>
          )}
        </View>

        {renderCoachModal()}
      </ScrollView>
    );
  }

  // PENDING SUBSCRIPTION
  if (subscription && subscription.status === "Pending") {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={[styles.card, { borderColor: "#F59E0B" }]}>
          <Text style={styles.cardTitle}>⏳ Application Pending</Text>

          <InfoRow label="Name" value={subscription.full_name} />
          <InfoRow label="Plan" value={subscription.plan_type} />
          <InfoRow label="Start" value={subscription.start_date} />
          <InfoRow label="End" value={subscription.end_date} />
          <InfoRow label="Price" value={`$${subscription.price}`} />
          <InfoRow label="Status" value={subscription.status} />

          <Text style={styles.note}>
            Your request is under review. Once approved, you'll be able to:
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Assign coaches</Text>
            <Text style={styles.featureItem}>• Browse available coaches</Text>
            <Text style={styles.featureItem}>• View coach profiles</Text>
            <Text style={styles.featureItem}>• Manage your coaching team</Text>
          </View>

          <TouchableOpacity style={styles.refreshBtn} onPress={init}>
            <Text style={{ color: "#0a7ea4", fontWeight: "800" }}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // NO SUBSCRIPTION - Show subscription form
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 70 }}>
      <Text style={styles.pageTitle}>Apply for Gym Subscription</Text>

      {/* Existing form fields... */}
      <Text style={styles.label}>Full Name *</Text>
      <TextInput
        style={styles.input}
        value={form.full_name}
        onChangeText={(t) => setForm({ ...form, full_name: t })}
        placeholder="Your name"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={form.phone}
        onChangeText={(t) => setForm({ ...form, phone: t })}
        placeholder="Phone"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={(t) => setForm({ ...form, email: t })}
        placeholder="Email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.radioRow}>
        {["Male", "Female"].map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setForm({ ...form, gender: g })}
            style={[styles.radioBtn, form.gender === g && styles.radioBtnActive]}
          >
            <Text style={[
              styles.radioText,
              form.gender === g && styles.radioTextActive
            ]}>
              {g}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Birth Date</Text>
      <TextInput
        style={styles.input}
        value={form.birth_date}
        onChangeText={(t) => setForm({ ...form, birth_date: t })}
        placeholder="YYYY-MM-DD"
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={form.height_cm}
            onChangeText={(t) => setForm({ ...form, height_cm: t })}
            keyboardType="numeric"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={form.weight_kg}
            onChangeText={(t) => setForm({ ...form, weight_kg: t })}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={styles.label}>Plan Type *</Text>
      <View style={styles.planRow}>
        {(["Monthly", "3-Month", "6-Month", "Yearly"] as const).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => onSelectPlan(p)}
            style={[styles.planBtn, form.plan_type === p && styles.planBtnActive]}
          >
            <Text style={[
              styles.planText,
              form.plan_type === p && styles.planTextActive
            ]}>
              {p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Start Date (auto today)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#F2F4F7" }]}
        value={form.start_date}
        editable={false}
      />

      <Text style={styles.label}>End Date (auto)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#F2F4F7" }]}
        value={form.end_date}
        editable={false}
      />

      <Text style={styles.label}>Price (auto)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: "#F2F4F7" }]}
        value={form.price}
        editable={false}
      />

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submit}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>Send Application</Text>
      </TouchableOpacity>

      {/* COACHES FEATURE PREVIEW */}
      <View style={styles.featurePreview}>
        <Text style={styles.featurePreviewTitle}>After Subscription Approval:</Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Browse and select coaches</Text>
          <Text style={styles.featureItem}>• View coach profiles and specialties</Text>
          <Text style={styles.featureItem}>• Assign coaches to your training</Text>
          <Text style={styles.featureItem}>• Manage your coaching team</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  pageTitle: { fontSize: 20, fontWeight: "800", marginBottom: 12, color: "#0b1a2b" },
  label: { marginTop: 10, fontWeight: "700", color: "#344054" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },

  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "900", marginBottom: 10, color: "#0b1a2b" },

  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  rowLabel: { color: "#667085", fontWeight: "700" },
  rowValue: { fontWeight: "800", color: "#101828" },

  note: { marginTop: 14, color: "#475467", lineHeight: 20 },

  planRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  planBtn: {
    backgroundColor: "#EEF2F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  planBtnActive: { backgroundColor: "#0a7ea4" },
  planText: { fontWeight: "700", color: "#344054" },
  planTextActive: { color: "white" },

  radioRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  radioBtn: {
    flex: 1,
    backgroundColor: "#EEF2F6",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  radioBtnActive: { backgroundColor: "#0a7ea4" },
  radioText: { fontWeight: "700", color: "#344054" },
  radioTextActive: { color: "white" },

  submitBtn: {
    marginTop: 18,
    backgroundColor: "#0a7ea4",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "900", fontSize: 16 },

  refreshBtn: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: "#E9EEF5",
    borderRadius: 12,
  },

  // NEW STYLES FOR COACHES
  section: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0b1a2b",
    marginBottom: 16,
  },
  emptyText: {
    color: "#667085",
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
  },

  // Coach Item Styles
  coachItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "white",
  },
  assignedCoachItem: {
    backgroundColor: "#F0F9FF",
    borderColor: "#0a7ea4",
  },
  coachInfo: {
    flex: 1,
  },
  coachItemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1a2b",
  },
  coachItemSpecialty: {
    fontSize: 14,
    color: "#667085",
    marginTop: 2,
  },
  coachItemExperience: {
    fontSize: 12,
    color: "#98A2B3",
    marginTop: 2,
  },
  coachStatus: {
    marginLeft: 12,
  },
  assignedBadge: {
    backgroundColor: "#0a7ea4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignedBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  availableBadge: {
    backgroundColor: "#ECFDF3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ABEFC6",
  },
  availableBadgeText: {
    color: "#067647",
    fontSize: 12,
    fontWeight: "700",
  },

  // My Coaches Styles
  myCoachItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ABEFC6",
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#F6FEF9",
  },
  myCoachInfo: {
    flex: 1,
  },
  myCoachName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b1a2b",
  },
  myCoachSpecialty: {
    fontSize: 14,
    color: "#667085",
    marginTop: 2,
  },
  myCoachDate: {
    fontSize: 12,
    color: "#98A2B3",
    marginTop: 2,
  },
  unassignButtonSmall: {
    backgroundColor: "#FEF3F2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECDCA",
  },
  unassignButtonText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0b1a2b",
    marginBottom: 20,
    textAlign: "center",
  },
  coachName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0b1a2b",
    marginBottom: 16,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: "700",
    color: "#667085",
    width: 100,
  },
  infoValue: {
    flex: 1,
    color: "#0b1a2b",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  assignButton: {
    backgroundColor: "#0a7ea4",
  },
  unassignButton: {
    backgroundColor: "#FEF3F2",
    borderWidth: 1,
    borderColor: "#FECDCA",
  },
  closeButton: {
    backgroundColor: "#F2F4F7",
  },
  modalButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },

  // Feature Preview Styles
  featurePreview: {
    marginTop: 30,
    padding: 16,
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#B9E6FE",
  },
  featurePreviewTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b1a2b",
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    color: "#475467",
    marginBottom: 6,
    lineHeight: 20,
  },
});