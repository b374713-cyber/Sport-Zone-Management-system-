import React, { useEffect, useMemo, useState } from "react";
import { savePushTokenToBackend } from "../utils/pushToken";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { API_BASE } from "../config/api";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// ============================
// Storage keys
// ============================
const STORAGE_KEY = "gym_weekly_plan_days";
const PUSH_TOKEN_SAVED_KEY = "gym_push_token_saved_for_customer";
const LOCAL_CHECKIN_DATE_KEY_PREFIX = "gym_local_checked_in_date_";

// TEST notif (1 repeating ID)
const TEST_NOTIF_ID_KEY = "gym_test_repeat_notif_id";

// Production rolling schedule keys (date-based ids)
const NOTIF_IDS_KEY = "gym_weekly_plan_notification_ids";
const NOTIF_BY_DATE_KEY = "gym_weekly_plan_notifs_by_date";

// ============================
// ✅ MODE
// ============================
const TEST_MODE = false;
const TEST_INTERVAL_SECONDS = 60;

// Production schedule
const START_HOUR = 9;
const END_HOUR = 21;
const HOUR_STEP = 2;
const NOTIF_MINUTE = 0;
const SCHEDULE_AHEAD_DAYS = 7;

// JS getDay(): 0 Sun ... 6 Sat
const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
type DayKey = (typeof DAY_ORDER)[number];

type DayItem = { key: DayKey; label: string; full: string; icon: string };

const DAYS: DayItem[] = [
  { key: "sun", label: "Sun", full: "Sunday", icon: "sun" },
  { key: "mon", label: "Mon", full: "Monday", icon: "moon" },
  { key: "tue", label: "Tue", full: "Tuesday", icon: "star" },
  { key: "wed", label: "Wed", full: "Wednesday", icon: "cloud" },
  { key: "thu", label: "Thu", full: "Thursday", icon: "bolt" },
  { key: "fri", label: "Fri", full: "Friday", icon: "fire" },
  { key: "sat", label: "Sat", full: "Saturday", icon: "trophy" },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function todayISO() {
  return isoDate(new Date());
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSelectedWeekday(selectedKeys: DayKey[], date: Date) {
  const jsDay = date.getDay();
  const key = DAY_ORDER[jsDay] as DayKey;
  return selectedKeys.includes(key);
}

async function ensureNotifPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF6B6B",
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.log("ensureNotifPermission error:", e);
    return false;
  }
}

// ============================
// ✅ TEST notifications
// ============================
async function scheduleTestRepeatUntilCheckin() {
  const ok = await ensureNotifPermission();
  if (!ok) return;

  const old = await AsyncStorage.getItem(TEST_NOTIF_ID_KEY);
  if (old) {
    await Notifications.cancelScheduledNotificationAsync(old).catch(() => {});
    await AsyncStorage.removeItem(TEST_NOTIF_ID_KEY);
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🏋️ Gym Reminder (TEST)",
      body: "Every 1 minute until you press Attend ✅",
      sound: "default",
      ...(Platform.OS === "android" ? { channelId: "default" } : {}),
      data: { type: "gym_test_repeat" },
    },
    trigger: {
      type: "timeInterval",
      seconds: TEST_INTERVAL_SECONDS,
      repeats: true,
    } as Notifications.TimeIntervalTriggerInput,
  });

  await AsyncStorage.setItem(TEST_NOTIF_ID_KEY, id);
}

async function cancelTestRepeat() {
  const old = await AsyncStorage.getItem(TEST_NOTIF_ID_KEY);
  if (old) {
    await Notifications.cancelScheduledNotificationAsync(old).catch(() => {});
    await AsyncStorage.removeItem(TEST_NOTIF_ID_KEY);
  }
}

function getLocalCheckinKey(customerId: number | string) {
  return `${LOCAL_CHECKIN_DATE_KEY_PREFIX}${customerId}`;
}

async function getCheckedInTodayForCustomer(customerId: number | string): Promise<boolean> {
  const key = getLocalCheckinKey(customerId);
  const d = await AsyncStorage.getItem(key);
  return d === todayISO();
}

async function setCheckedInTodayForCustomer(customerId: number | string) {
  const key = getLocalCheckinKey(customerId);
  await AsyncStorage.setItem(key, todayISO());
}

// ============================
// ✅ PRODUCTION rolling schedule
// ============================
async function cancelOldGymNotifs() {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_IDS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];

    if (Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }

    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(NOTIF_BY_DATE_KEY, JSON.stringify({}));
  } catch (e) {
    console.log("cancelOldGymNotifs error:", e);
  }
}

async function scheduleGymNotifsRolling(selectedKeys: DayKey[]) {
  const ok = await ensureNotifPermission();
  if (!ok) return;

  await cancelOldGymNotifs();

  const map: Record<string, string[]> = {};
  const now = new Date();

  for (let dayOffset = 0; dayOffset < SCHEDULE_AHEAD_DAYS; dayOffset++) {
    const day = startOfDay(new Date(now));
    day.setDate(day.getDate() + dayOffset);

    if (!isSelectedWeekday(selectedKeys, day)) continue;

    const dayKey = isoDate(day);
    const selectedDayKey = DAY_ORDER[day.getDay()] as DayKey;
    const foundDay = DAYS.find((d) => d.key === selectedDayKey);
    const dayLabel = foundDay ? foundDay.full : "Gym";

    for (let hour = START_HOUR; hour <= END_HOUR; hour += HOUR_STEP) {
      const when = new Date(day);
      when.setHours(hour, NOTIF_MINUTE, 0, 0);

      if (when <= now) continue;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🏋️ Gym Time!",
          body: `Your ${dayLabel} workout • ${String(hour).padStart(2, "0")}:${String(
            NOTIF_MINUTE
          ).padStart(2, "0")}`,
          sound: "default",
          ...(Platform.OS === "android" ? { channelId: "default" } : {}),
          data: { type: "gym_weekly_reminder", date: dayKey, hour },
        },
        trigger: { type: "date", date: when } as Notifications.DateTriggerInput,
      });

      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(id);
    }
  }

  const allIds = Object.values(map).flat();
  await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(allIds));
  await AsyncStorage.setItem(NOTIF_BY_DATE_KEY, JSON.stringify(map));
}

async function cancelTodaysRemainingReminders() {
  try {
    const todayKey = isoDate(new Date());
    const raw = await AsyncStorage.getItem(NOTIF_BY_DATE_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};

    const ids = map[todayKey] || [];
    if (!Array.isArray(ids) || ids.length === 0) return;

    await Promise.all(
      ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
    );

    delete map[todayKey];
    await AsyncStorage.setItem(NOTIF_BY_DATE_KEY, JSON.stringify(map));

    const remainingIds = Object.values(map).flat();
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(remainingIds));
  } catch (e) {
    console.log("cancelTodaysRemainingReminders error:", e);
  }
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function WeeklyPlanTab() {
  const [selected, setSelected] = useState<Record<DayKey, boolean>>({
    sun: false,
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [streak, setStreak] = useState(0);

  // ✅ Progression form state
  const [progress, setProgress] = useState({
    log_date: todayISO(), // allows old dates
    weight_kg: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    water_liters: "",
    meals_count: "",
    steps: "",
    sleep_hours: "",
    height_cm: "",
    notes: "",
  });
  const [savingProgress, setSavingProgress] = useState(false);

  const scaleAnims = useMemo(
    () =>
      DAYS.reduce((acc, day) => {
        acc[day.key] = new Animated.Value(1);
        return acc;
      }, {} as Record<DayKey, Animated.Value>),
    []
  );

useEffect(() => {
  (async () => {
    // Load customer profile
    const customerRaw = await AsyncStorage.getItem("customer");
    const customer = safeParseJSON<any>(customerRaw);
    const customerId: number | undefined = customer?.customer_id;

    // ✅ fetch profile from DB and auto-fill height and weight
    if (customerId) {
      try {
        const profRes = await fetch(`${API_BASE}/api/gym/profile/${customerId}`);
        const prof = await profRes.json();

        setProgress((prev) => ({
          ...prev,
          height_cm: prof.height_cm != null ? String(prof.height_cm) : "",
          weight_kg: prof.weight_kg != null ? String(prof.weight_kg) : "",
        }));
      } catch (e) {
        console.log("profile load error:", e);
        // Fallback to local data
        if (customer) {
          setProgress((prev) => ({
            ...prev,
            height_cm: customer.height_cm ? String(customer.height_cm) : "",
            weight_kg: customer.weight_kg ? String(customer.weight_kg) : "",
          }));
        }
      }
    }

    await loadLocalCheckinState(customerId);
    await loadInitialAndAutoSchedule(customerId);
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  const ensurePushTokenSaved = async (customerId: number) => {
    try {
      const ok = await ensureNotifPermission();
      if (!ok) return;

      const savedFor = await AsyncStorage.getItem(PUSH_TOKEN_SAVED_KEY);
      if (savedFor && Number(savedFor) === customerId) return;

      await savePushTokenToBackend(customerId, API_BASE);
      await AsyncStorage.setItem(PUSH_TOKEN_SAVED_KEY, String(customerId));
    } catch (e) {
      console.log("❌ ensurePushTokenSaved error:", e);
    }
  };

  const loadLocalCheckinState = async (customerId?: number) => {
    try {
      if (!customerId) {
        setCheckedInToday(false);
        return;
      }
      const checked = await getCheckedInTodayForCustomer(customerId);
      setCheckedInToday(checked);
    } catch {
      setCheckedInToday(false);
    }
  };

  const loadInitialAndAutoSchedule = async (customerId?: number) => {
    try {
      const localRaw = await AsyncStorage.getItem(STORAGE_KEY);
      const localPlan = safeParseJSON<DayKey[]>(localRaw);

      if (localPlan && Array.isArray(localPlan)) {
        const map: Record<DayKey, boolean> = { ...selected };
        localPlan.forEach((k) => (map[k] = true));
        setSelected(map);
      }

      let backendPlan: DayKey[] | null = null;

      if (customerId) {
        await ensurePushTokenSaved(customerId);

        const res = await fetch(`${API_BASE}/api/gym/weekly-plan/${customerId}`);
        const data = await res.json();

        if (data?.plan?.days && Array.isArray(data.plan.days)) {
          backendPlan = data.plan.days as DayKey[];
          const map: Record<DayKey, boolean> = { ...selected };
          backendPlan.forEach((k) => (map[k] = true));
          setSelected(map);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backendPlan));
        }

        const streakRes = await fetch(`${API_BASE}/api/gym/attendance/streak/${customerId}`);
        const streakData = await streakRes.json();
        if (streakData?.streak !== undefined) setStreak(streakData.streak);
      }

      const finalPlan: DayKey[] = backendPlan ?? localPlan ?? [];
      const checkedForThisCustomer = customerId
        ? await getCheckedInTodayForCustomer(customerId)
        : false;
      setCheckedInToday(checkedForThisCustomer);

      if (TEST_MODE) {
        if (!checkedForThisCustomer) await scheduleTestRepeatUntilCheckin();
        else await cancelTestRepeat();
      } else {
        await scheduleGymNotifsRolling(finalPlan);
        if (checkedForThisCustomer) await cancelTodaysRemainingReminders();
      }
    } catch (e) {
      console.log("weekly plan load error", e);
    } finally {
      setLoading(false);
    }
  };

  const animateDay = (key: DayKey) => {
    Animated.sequence([
      Animated.timing(scaleAnims[key], { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnims[key], { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnims[key], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const toggleDay = (k: DayKey) => {
    animateDay(k);
    setSelected((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const selectedDays = useMemo(() => DAYS.filter((d) => selected[d.key]), [selected]);
  const selectedKeys = useMemo(() => selectedDays.map((d) => d.key), [selectedDays]);

  const savePlan = async () => {
    try {
      setSaving(true);

      const arr = selectedKeys;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

      const customerRaw = await AsyncStorage.getItem("customer");
      const customer = safeParseJSON<any>(customerRaw);

      if (customer?.customer_id) {
        await ensurePushTokenSaved(customer.customer_id);

        const res = await fetch(`${API_BASE}/api/gym/weekly-plan/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customer_id: customer.customer_id, days: arr }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Backend save failed");
      }

      if (TEST_MODE) {
        if (!checkedInToday) await scheduleTestRepeatUntilCheckin();
      } else {
        await scheduleGymNotifsRolling(arr);
        if (checkedInToday) await cancelTodaysRemainingReminders();
      }

      Alert.alert("✅ Plan Saved", "Your weekly plan and reminders were updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const nextTraining = useMemo(() => {
    if (selectedDays.length === 0) return null;
    const todayIdx = new Date().getDay();

    for (let offset = 0; offset < 7; offset++) {
      const idx = (todayIdx + offset) % 7;
      const key = DAY_ORDER[idx] as DayKey;
      if (selected[key]) return DAYS.find((d) => d.key === key) || null;
    }
    return null;
  }, [selected, selectedDays]);

  async function checkInToday() {
    try {
      const customerRaw = await AsyncStorage.getItem("customer");
      const customer = safeParseJSON<any>(customerRaw);

      if (!customer?.customer_id) {
        Alert.alert("Login Required", "Please login to check in.");
        return;
      }

      const res = await fetch(`${API_BASE}/api/gym/attendance/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customer.customer_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Check-in failed");

      await setCheckedInTodayForCustomer(customer.customer_id);
      setCheckedInToday(true);

      if (TEST_MODE) await cancelTestRepeat();
      else await cancelTodaysRemainingReminders();

      if (data?.already) Alert.alert("✅ Already Checked In", "You're marked present for today!");
      else {
        Alert.alert("🎉 Workout Logged!", "Great job staying consistent!");
        setStreak((prev) => prev + 1);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Check-in failed");
    }
  }

  async function onSaveProgressPressed() {
    try {
      const customerRaw = await AsyncStorage.getItem("customer");
      const customer = safeParseJSON<any>(customerRaw);
      const customerId: number | undefined = customer?.customer_id;

      if (!customerId) {
        Alert.alert("Login Required", "Please login first.");
        return;
      }

      setSavingProgress(true);

      const payload: any = {
        customer_id: customerId,
        log_date: progress.log_date,
        weight_kg: progress.weight_kg ? Number(progress.weight_kg) : null,
        calories: progress.calories ? Number(progress.calories) : null,
        protein_g: progress.protein_g ? Number(progress.protein_g) : null,
        carbs_g: progress.carbs_g ? Number(progress.carbs_g) : null,
        fat_g: progress.fat_g ? Number(progress.fat_g) : null,
        water_liters: progress.water_liters ? Number(progress.water_liters) : null,
        meals_count: progress.meals_count ? Number(progress.meals_count) : null,
        steps: progress.steps ? Number(progress.steps) : null,
        sleep_hours: progress.sleep_hours ? Number(progress.sleep_hours) : null,
        height_cm: progress.height_cm ? Number(progress.height_cm) : null,
        notes: progress.notes?.trim() ? progress.notes.trim() : null,
      };

      const res = await fetch(`${API_BASE}/api/gym/progress/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save progression");

      Alert.alert("Saved ✅", `Progression saved for ${progress.log_date}`);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save progression");
    } finally {
      setSavingProgress(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your plan...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={["#FF6B6B", "#FF8E53"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <MaterialIcons name="fitness-center" size={32} color="white" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Weekly Training Plan</Text>
            <Text style={styles.headerSubtitle}>
              {TEST_MODE ? "TEST MODE" : `Reminders every ${HOUR_STEP} hours`}
            </Text>
          </View>
        </View>

        <View style={styles.streakContainer}>
          <FontAwesome5 name="fire" size={20} color="#FFD700" />
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
      </LinearGradient>

      {/* Days Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Training Days</Text>
        <Text style={styles.sectionDescription}>
          Tap to select days you’ll train. Save to schedule reminders.
        </Text>

        <View style={styles.daysGrid}>
          {DAYS.map((d) => {
            const active = !!selected[d.key];
            const today = new Date().getDay();
            const todayKey = DAY_ORDER[today] as DayKey;
            const isToday = d.key === todayKey;

            return (
              <Animated.View
                key={d.key}
                style={[
                  styles.dayCard,
                  active && styles.dayCardActive,
                  isToday && styles.dayCardToday,
                  { transform: [{ scale: scaleAnims[d.key] }] },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleDay(d.key)}
                  activeOpacity={0.7}
                  style={styles.dayCardInner}
                >
                  <LinearGradient
                    colors={active ? ["#FF6B6B", "#FF8E53"] : ["#FFFFFF", "#F8F9FA"]}
                    style={styles.dayGradient}
                  >
                    <FontAwesome5 name={d.icon as any} size={24} color={active ? "white" : "#666"} />
                    <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{d.label}</Text>
                    {isToday && (
                      <View style={styles.todayBadge}>
                        <Text style={styles.todayText}>TODAY</Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Next Training */}
      {nextTraining && (
        <View style={styles.nextTrainingCard}>
          <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.nextTrainingGradient}>
            <MaterialIcons name="update" size={24} color="white" />
            <View style={styles.nextTrainingContent}>
              <Text style={styles.nextTrainingLabel}>Next Training</Text>
              <Text style={styles.nextTrainingDay}>{nextTraining.full}</Text>
            </View>
            <FontAwesome5 name="dumbbell" size={24} color="white" />
          </LinearGradient>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={savePlan} disabled={saving} activeOpacity={0.8} style={styles.saveButton}>
          <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.buttonGradient}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="save" size={24} color="white" />
                <Text style={styles.buttonText}>Save Plan & Set Reminders</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => checkInToday().catch((e) => Alert.alert("Error", e.message))}
          disabled={checkedInToday}
          activeOpacity={0.8}
          style={[styles.checkInButton, checkedInToday && styles.checkInButtonDisabled]}
        >
          <LinearGradient
            colors={checkedInToday ? ["#6EE7B7", "#34D399"] : ["#10B981", "#059669"]}
            style={styles.buttonGradient}
          >
            {checkedInToday ? (
              <>
                <MaterialIcons name="check-circle" size={24} color="white" />
                <Text style={styles.buttonText}>Already Checked In Today</Text>
              </>
            ) : (
              <>
                <MaterialIcons name="touch-app" size={24} color="white" />
                <Text style={styles.buttonText}>✅ I Attended Today</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ✅ Progression Section */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>📈 Progression (Day Log)</Text>
        <Text style={styles.progressSubtitle}>
          Enter your stats for any date (today or old date) then Save.
        </Text>

        <View style={styles.row}>
          <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
          <TextInput
            value={progress.log_date}
            onChangeText={(t) => setProgress((p) => ({ ...p, log_date: t }))}
            style={styles.input}
            placeholder="2025-12-29"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              value={progress.weight_kg}
              onChangeText={(t) => setProgress((p) => ({ ...p, weight_kg: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              value={progress.height_cm}
              onChangeText={(t) => setProgress((p) => ({ ...p, height_cm: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Calories</Text>
            <TextInput
              value={progress.calories}
              onChangeText={(t) => setProgress((p) => ({ ...p, calories: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Water (liters)</Text>
            <TextInput
              value={progress.water_liters}
              onChangeText={(t) => setProgress((p) => ({ ...p, water_liters: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.grid3}>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput
              value={progress.protein_g}
              onChangeText={(t) => setProgress((p) => ({ ...p, protein_g: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Carbs (g)</Text>
            <TextInput
              value={progress.carbs_g}
              onChangeText={(t) => setProgress((p) => ({ ...p, carbs_g: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Fat (g)</Text>
            <TextInput
              value={progress.fat_g}
              onChangeText={(t) => setProgress((p) => ({ ...p, fat_g: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.grid3}>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Meals</Text>
            <TextInput
              value={progress.meals_count}
              onChangeText={(t) => setProgress((p) => ({ ...p, meals_count: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Steps</Text>
            <TextInput
              value={progress.steps}
              onChangeText={(t) => setProgress((p) => ({ ...p, steps: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.inputLabel}>Sleep (hours)</Text>
            <TextInput
              value={progress.sleep_hours}
              onChangeText={(t) => setProgress((p) => ({ ...p, sleep_hours: t }))}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          value={progress.notes}
          onChangeText={(t) => setProgress((p) => ({ ...p, notes: t }))}
          style={[styles.input, { height: 90, textAlignVertical: "top" }]}
          placeholder="Optional notes..."
          placeholderTextColor="#999"
          multiline
        />

        <TouchableOpacity
          onPress={() => onSaveProgressPressed().catch((e) => Alert.alert("Error", e.message))}
          disabled={savingProgress}
          activeOpacity={0.85}
          style={styles.progressSaveBtn}
        >
          <LinearGradient colors={["#4ECDC4", "#44A08D"]} style={styles.buttonGradient}>
            {savingProgress ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialIcons name="done" size={24} color="white" />
                <Text style={styles.buttonText}>Save Progression</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#666", fontWeight: "600" },
  container: { backgroundColor: "#F8F9FA", minHeight: "100%" },

  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  headerTextContainer: { marginLeft: 15 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "white" },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4, fontWeight: "600" },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  streakText: { color: "white", fontWeight: "800", marginLeft: 8, fontSize: 16 },

  section: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  sectionDescription: { fontSize: 14, color: "#666", marginBottom: 20, lineHeight: 20 },

  daysGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  dayCard: {
    width: (width - 60) / 4,
    height: (width - 60) / 4,
    marginBottom: 15,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dayCardActive: { shadowColor: "#FF6B6B", shadowOpacity: 0.3, elevation: 8 },
  dayCardToday: { borderWidth: 2, borderColor: "#4ECDC4" },
  dayCardInner: { flex: 1, borderRadius: 20, overflow: "hidden" },
  dayGradient: { flex: 1, justifyContent: "center", alignItems: "center", borderRadius: 20, padding: 10 },
  dayLabel: { marginTop: 10, fontSize: 16, fontWeight: "800", color: "#666" },
  dayLabelActive: { color: "white" },
  todayBadge: { position: "absolute", top: 8, right: 8, backgroundColor: "#4ECDC4", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  todayText: { color: "white", fontSize: 10, fontWeight: "900" },

  nextTrainingCard: { paddingHorizontal: 20, marginBottom: 25 },
  nextTrainingGradient: { flexDirection: "row", alignItems: "center", padding: 20, borderRadius: 20, justifyContent: "space-between" },
  nextTrainingContent: { flex: 1, marginHorizontal: 15 },
  nextTrainingLabel: { color: "white", fontSize: 14, fontWeight: "600", opacity: 0.9 },
  nextTrainingDay: { color: "white", fontSize: 24, fontWeight: "900", marginTop: 4 },

  actionsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  saveButton: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkInButton: {
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  checkInButtonDisabled: { opacity: 0.9 },

  buttonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, paddingHorizontal: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "800", marginLeft: 12 },

  // Progress
  progressCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A" },
  progressSubtitle: { marginTop: 6, marginBottom: 12, color: "#666", fontSize: 13 },

  inputLabel: { fontSize: 12, fontWeight: "800", color: "#333", marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#EEE",
    color: "#111",
  },
  row: { marginBottom: 6 },
  grid2: { flexDirection: "row", gap: 10 },
  grid3: { flexDirection: "row", gap: 10 },
  gridItem: { flex: 1 },

  progressSaveBtn: {
    marginTop: 16,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#44A08D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
});