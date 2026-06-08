// // app/gym/ai.tsx
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   ActivityIndicator,
//   ScrollView,
//   StyleSheet,
//   Alert,
//   Linking,   // ✅ add this
// } from "react-native";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// // ✅ dynamic requires to avoid TS "Cannot find module"
// let WebViewComp: any = null;
// let PrintComp: any = null;
// let FileSystemComp: any = null;
// let SharingComp: any = null;

// try {
//   WebViewComp = require("react-native-webview").WebView;
// } catch {}
// try {
//   PrintComp = require("expo-print");
// } catch {}
// try {
//   // ✅ IMPORTANT: legacy import to avoid deprecated crash
//   FileSystemComp = require("expo-file-system/legacy");
// } catch {}
// try {
//   SharingComp = require("expo-sharing");
// } catch {}

// import { API_BASE } from "../config/api";

// // ✅ keep your local base, but allow env override if you ever need it
// //const API_BASE =
//   //process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.1.1.53:5000";

// type PlanJson = any;

// export default function AiTab() {
//   const [loading, setLoading] = useState(false);
//   const [user, setUser] = useState<any>(null);

//   const [form, setForm] = useState({
//     full_name: "",
//     age: "",
//     weight: "",
//     height: "",
//     gender: "",
//     experience_level: "beginner",
//     goal: "muscle_gain",
//     days_per_week: "3",
//     plan_duration_weeks: "4",
//   });

//   const [plan, setPlan] = useState<PlanJson | null>(null);
//   const [pdfUri, setPdfUri] = useState<string>("");

//   // useEffect(() => {
//   //   (async () => {
//   //     const customerRaw = await AsyncStorage.getItem("customer");
//   //     const customer = customerRaw ? JSON.parse(customerRaw) : null;
//   //     setUser(customer);

//   //     if (customer) {
//   //       setForm((f) => ({
//   //         ...f,
//   //         full_name: customer.name || "",
//   //         gender: customer.gender || "",
//   //       }));

//   //       // ✅ NEW: load latest saved AI plan from backend
//   //       if (customer.customer_id) {
//   //         try {
//   //           const latestRes = await fetch(
//   //             `${API_BASE}/api/gym/ai-plans/latest/${customer.customer_id}`
//   //           );
//   //           const latestData = await latestRes.json();

//   //           if (latestData?.plan) {
//   //             setPlan(latestData.plan);

//   //             // ✅ auto-generate PDF for latest plan
//   //             setTimeout(() => {
//   //               makePdf();
//   //             }, 400);
//   //           }
//   //         } catch (e) {
//   //           console.log("latest plan load error:", e);
//   //         }
//   //       }
//   //     }
//   //   })();
//   // }, []);
// // In AiTab.tsx, update the useEffect:
// useEffect(() => {
//   (async () => {
//     const customerRaw = await AsyncStorage.getItem("customer");
//     const customer = customerRaw ? JSON.parse(customerRaw) : null;
//     setUser(customer);

//     if (customer) {
//       // Auto-fill from customer profile
//       setForm((f) => ({
//         ...f,
//         full_name: customer.name || "",
//         gender: customer.gender || "",
//         // Auto-fill height and weight if available
//         height: customer.height_cm ? String(customer.height_cm) : "",
//         weight: customer.weight_kg ? String(customer.weight_kg) : "",
//         // Auto-fill age from birth_date if available
//         age: customer.age ? String(customer.age) : customer.birth_date 
//           ? String(calculateAge(customer.birth_date) || "") 
//           : "",
//       }));

//       // ✅ NEW: load latest saved AI plan from backend
//       if (customer.customer_id) {
//         try {
//           const latestRes = await fetch(
//             `${API_BASE}/api/gym/ai-plans/latest/${customer.customer_id}`
//           );
//           const latestData = await latestRes.json();

//           if (latestData?.plan) {
//             setPlan(latestData.plan);

//             // ✅ auto-generate PDF for latest plan
//             setTimeout(() => {
//               makePdf();
//             }, 400);
//           }
//         } catch (e) {
//           console.log("latest plan load error:", e);
//         }
//       }
//     }
//   })();
// }, []);

// // Add calculateAge helper function
// const calculateAge = (birthDate: string): number | null => {
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
// };
//   const generatePlan = async () => {
//     if (!user) {
//       Alert.alert("Login required", "Please login first.");
//       return;
//     }

//     const age = Number(form.age);
//     const weight = Number(form.weight);
//     const days = Number(form.days_per_week);

//     if (!age || !weight || !form.goal || !days) {
//       Alert.alert(
//         "Missing fields",
//         "age, weight, goal, days_per_week are required."
//       );
//       return;
//     }

//     try {
//       setLoading(true);
//       setPlan(null);
//       setPdfUri("");

//       const payload = {
//         full_name: form.full_name || user.name,
//         age,
//         weight,
//         height: form.height ? Number(form.height) : null,
//         gender: form.gender || null,
//         experience_level: form.experience_level,
//         goal: form.goal,
//         days_per_week: days,
//         plan_duration_weeks: form.plan_duration_weeks
//           ? Number(form.plan_duration_weeks)
//           : 4,
//       };

//       const res = await fetch(`${API_BASE}/api/gym/ai-plan`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         Alert.alert("AI Error", data.error || "Failed to generate plan");
//         return;
//       }

//       if (!data.plan) {
//         Alert.alert(
//           "AI Warning",
//           "AI did not return valid JSON. Check backend logs."
//         );
//         return;
//       }

//       setPlan(data.plan);
//       Alert.alert("✅ Success", "AI plan generated!");

//       // ✅ auto-save plan to DB (same as web)
//       try {
//         const savePayload = {
//           subscription_id: user.subscription_id || null,
//           member_id: null,
//           full_name: form.full_name || user.name,
//           age,
//           weight,
//           height: form.height ? Number(form.height) : null,
//           gender: form.gender || null,
//           experience_level: form.experience_level,
//           goal: form.goal,
//           days_per_week: days,
//           duration_weeks: form.plan_duration_weeks
//             ? Number(form.plan_duration_weeks)
//             : 4,
//           plan_json: data.plan,
//         };

//         await fetch(`${API_BASE}/api/gym/ai-plans/save`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(savePayload),
//         });
//       } catch (e) {
//         console.log("save plan error:", e);
//       }
//     } catch (e: any) {
//       Alert.alert("Error", e.message || "Failed to generate plan");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ PDF from plan (no preview, open externally)
//   const makePdf = async () => {
//     if (!plan) return;

//     if (!PrintComp || !FileSystemComp) {
//       Alert.alert(
//         "Missing packages",
//         "To enable PDF install: expo-print & expo-file-system"
//       );
//       return;
//     }

//     const html = `
//       <html>
//         <head>
//           <meta charset="utf-8" />
//           <style>
//             body { font-family: Arial; padding: 18px; font-size: 16px; line-height: 1.6; }
//             h2 { font-size: 22px; margin-bottom: 6px; }
//             h3 { font-size: 18px; margin-top: 12px; }
//             h4 { font-size: 16px; margin-top: 8px; }
//             ul { margin-left: 18px; }
//             li { margin-bottom: 4px; }
//             .week { border: 1px solid #ddd; padding: 10px; border-radius: 8px; margin-top: 10px; }
//             .day { margin-top: 6px; }
//           </style>
//         </head>
//         <body>
//           <h2>AI Gym Plan</h2>
//           <h3>Summary</h3>
//           <p>
//             Name: ${form.full_name}<br/>
//             Goal: ${plan.summary?.goal}<br/>
//             Experience: ${plan.summary?.experience_level}<br/>
//             Duration weeks: ${plan.summary?.duration_weeks}<br/>
//             Days/week: ${plan.summary?.days_per_week}
//           </p>

//           ${
//             (plan.weekly_plan || [])
//               .map(
//                 (w: any) => `
//                 <div class="week">
//                   <h3>Week ${w.week}</h3>
//                   ${
//                     (w.days || [])
//                       .map(
//                         (d: any) => `
//                         <div class="day">
//                           <h4>${d.day} - ${d.focus}</h4>
//                           <ul>
//                             ${
//                               (d.exercises || [])
//                                 .map(
//                                   (ex: any) =>
//                                     `<li>${ex.name} — ${ex.sets} sets × ${ex.reps} (rest ${ex.rest_sec}s)</li>`
//                                 )
//                                 .join("")
//                             }
//                           </ul>
//                           <p>${d.notes || ""}</p>
//                         </div>
//                       `
//                       )
//                       .join("")
//                   }
//                 </div>
//               `
//               )
//               .join("")
//           }

//           ${
//             plan.nutrition_tips?.length
//               ? `
//               <h3>Nutrition Tips</h3>
//               <ul>${plan.nutrition_tips
//                 .map((t: string) => `<li>${t}</li>`)
//                 .join("")}</ul>
//             `
//               : ""
//           }

//           <p style="color: gray; margin-top: 20px;">
//             ${plan.disclaimer || ""}
//           </p>
//         </body>
//       </html>
//     `;

//     try {
//       const { uri } = await PrintComp.printToFileAsync({
//         html,
//         width: 595,
//         height: 842,
//       });

//       const baseDir =
//         FileSystemComp.documentDirectory ||
//         FileSystemComp.cacheDirectory ||
//         uri.substring(0, uri.lastIndexOf("/") + 1);

//       const newPath = `${baseDir}gym-plan-${Date.now()}.pdf`;

//       await FileSystemComp.copyAsync({ from: uri, to: newPath });
//       setPdfUri(newPath);

//       Alert.alert("✅ PDF Ready", "Opening PDF...");
//     } catch (e: any) {
//       console.log("pdf error:", e);
//       Alert.alert("PDF Error", e.message || "Failed to create PDF");
//     }
//   };
// // ✅ open PDF directly in installed PDF viewer
// const openPdfExternal = async () => {
//   if (!pdfUri) {
//     Alert.alert("No PDF", "Please create PDF first.");
//     return;
//   }

//   try {
//     await Linking.openURL(pdfUri);
//   } catch (e) {
//     console.log("open pdf error:", e);
//     Alert.alert(
//       "Open Error",
//       "Could not open PDF. Please install a PDF viewer app."
//     );
//   }
// };

//   const sharePdf = async (path?: string) => {
//     const target = path || pdfUri;
//     if (!target) return;

//     if (!SharingComp) {
//       Alert.alert("Missing package", "Install expo-sharing to open/share PDF");
//       return;
//     }

//     await SharingComp.shareAsync(target);
//   };

//   return (
//     <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
//       <Text style={styles.title}>🤖 AI Gym Plan</Text>

//       <Text style={styles.label}>Age *</Text>
//       <TextInput
//         style={styles.input}
//         value={form.age}
//         onChangeText={(t) => setForm({ ...form, age: t })}
//         keyboardType="numeric"
//         placeholder="e.g. 22"
//       />

//       <Text style={styles.label}>Weight (kg) *</Text>
//       <TextInput
//         style={styles.input}
//         value={form.weight}
//         onChangeText={(t) => setForm({ ...form, weight: t })}
//         keyboardType="numeric"
//         placeholder="e.g. 80"
//       />

//       <Text style={styles.label}>Height (cm)</Text>
//       <TextInput
//         style={styles.input}
//         value={form.height}
//         onChangeText={(t) => setForm({ ...form, height: t })}
//         keyboardType="numeric"
//       />

//       <Text style={styles.label}>Goal *</Text>
//       <View style={styles.rowWrap}>
//         {[
//           { key: "muscle_gain", label: "Muscle" },
//           { key: "fat_loss", label: "Fat Loss" },
//           { key: "strength", label: "Strength" },
//         ].map((g) => (
//           <TouchableOpacity
//             key={g.key}
//             onPress={() => setForm({ ...form, goal: g.key })}
//             style={[styles.chip, form.goal === g.key && styles.chipActive]}
//           >
//             <Text
//               style={[
//                 styles.chipText,
//                 form.goal === g.key && styles.chipTextActive,
//               ]}
//             >
//               {g.label}
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <Text style={styles.label}>Days per week *</Text>
//       <TextInput
//         style={styles.input}
//         value={form.days_per_week}
//         onChangeText={(t) => setForm({ ...form, days_per_week: t })}
//         keyboardType="numeric"
//         placeholder="3"
//       />

//       <Text style={styles.label}>Duration weeks</Text>
//       <TextInput
//         style={styles.input}
//         value={form.plan_duration_weeks}
//         onChangeText={(t) =>
//           setForm({ ...form, plan_duration_weeks: t })
//         }
//         keyboardType="numeric"
//         placeholder="4"
//       />

//       <TouchableOpacity
//         style={styles.btn}
//         onPress={generatePlan}
//         activeOpacity={0.9}
//       >
//         {loading ? (
//           <ActivityIndicator color="white" />
//         ) : (
//           <Text style={styles.btnText}>Generate AI Plan</Text>
//         )}
//       </TouchableOpacity>

//       {plan && (
//   <View style={styles.card}>
//     <Text style={styles.cardTitle}>Plan Ready ✅</Text>

//     {/* 1) Create PDF */}
//     <TouchableOpacity
//       style={styles.btnSecondary}
//       onPress={makePdf}
//     >
//       <Text style={styles.btnSecondaryText}>
//         Create PDF
//       </Text>
//     </TouchableOpacity>

//     {/* 2) Share PDF */}
//     {pdfUri ? (
//       <TouchableOpacity
//         style={styles.btnSecondary}
//         onPress={() => sharePdf()}
//       >
//         <Text style={styles.btnSecondaryText}>
//           Share PDF
//         </Text>
//       </TouchableOpacity>
//     ) : null}

//     {/* 3) Open PDF directly */}
//     {pdfUri ? (
//       <TouchableOpacity
//         style={styles.btnSecondary}
//         onPress={openPdfExternal}
//       >
//         <Text style={styles.btnSecondaryText}>
//           Open PDF
//         </Text>
//       </TouchableOpacity>
//     ) : null}
//   </View>
// )}


//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   title: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
//   label: { marginTop: 10, fontWeight: "700", color: "#344054" },
//   input: {
//     backgroundColor: "white",
//     borderWidth: 1,
//     borderColor: "#E4E7EC",
//     padding: 12,
//     borderRadius: 12,
//     marginTop: 6,
//   },
//   btn: {
//     marginTop: 16,
//     backgroundColor: "#0a7ea4",
//     paddingVertical: 14,
//     borderRadius: 14,
//     alignItems: "center",
//   },
//   btnText: { color: "white", fontWeight: "900", fontSize: 16 },

//   rowWrap: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 8,
//     marginTop: 6,
//   },
//   chip: {
//     backgroundColor: "#EEF2F6",
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 999,
//   },
//   chipActive: { backgroundColor: "#0a7ea4" },
//   chipText: { fontWeight: "700", color: "#344054" },
//   chipTextActive: { color: "white" },

//   card: {
//     marginTop: 16,
//     backgroundColor: "white",
//     padding: 14,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: "#E4E7EC",
//   },
//   cardTitle: { fontWeight: "900", fontSize: 16, marginBottom: 8 },

//   btnSecondary: {
//     marginTop: 8,
//     backgroundColor: "#E9EEF5",
//     paddingVertical: 10,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   btnSecondaryText: { fontWeight: "800", color: "#0a7ea4" },
// });
// app/gym/ai.tsx
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
  Linking,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ dynamic requires to avoid TS "Cannot find module"
let WebViewComp: any = null;
let PrintComp: any = null;
let FileSystemComp: any = null;
let SharingComp: any = null;

try {
  WebViewComp = require("react-native-webview").WebView;
} catch {}
try {
  PrintComp = require("expo-print");
} catch {}
try {
  // ✅ IMPORTANT: legacy import to avoid deprecated crash
  FileSystemComp = require("expo-file-system/legacy");
} catch {}
try {
  SharingComp = require("expo-sharing");
} catch {}

import { API_BASE } from "../config/api";

type PlanJson = any;

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

export default function AiTab() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    weight: "",
    height: "",
    gender: "",
    experience_level: "beginner",
    goal: "muscle_gain",
    days_per_week: "3",
    plan_duration_weeks: "4",
  });

  const [plan, setPlan] = useState<PlanJson | null>(null);
  const [pdfUri, setPdfUri] = useState<string>("");

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

      // ✅ load latest saved AI plan from backend
      const latestRes = await fetch(
        `${API_BASE}/api/gym/ai-plans/latest/${customer.customer_id}`
      );
      const latestData = await latestRes.json();

      if (latestData?.plan) {
        setPlan(latestData.plan);
        // ✅ auto-generate PDF for latest plan
        setTimeout(() => {
          makePdf();
        }, 400);
      }
    } catch (e) {
      console.log("profile or latest plan load error:", e);
    }
  })();
}, []);
  const generatePlan = async () => {
    if (!user) {
      Alert.alert("Login required", "Please login first.");
      return;
    }

    const age = Number(form.age);
    const weight = Number(form.weight);
    const days = Number(form.days_per_week);

    if (!age || !weight || !form.goal || !days) {
      Alert.alert(
        "Missing fields",
        "age, weight, goal, days_per_week are required."
      );
      return;
    }

    try {
      setLoading(true);
      setPlan(null);
      setPdfUri("");

      const payload = {
        full_name: form.full_name || user.name,
        age,
        weight,
        height: form.height ? Number(form.height) : null,
        gender: form.gender || null,
        experience_level: form.experience_level,
        goal: form.goal,
        days_per_week: days,
        plan_duration_weeks: form.plan_duration_weeks
          ? Number(form.plan_duration_weeks)
          : 4,
      };

      const res = await fetch(`${API_BASE}/api/gym/ai-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("AI Error", data.error || "Failed to generate plan");
        return;
      }

      if (!data.plan) {
        Alert.alert(
          "AI Warning",
          "AI did not return valid JSON. Check backend logs."
        );
        return;
      }

      setPlan(data.plan);
      Alert.alert("✅ Success", "AI plan generated!");

      // ✅ auto-save plan to DB (same as web)
      try {
        const savePayload = {
          subscription_id: user.subscription_id || null,
          member_id: null,
          full_name: form.full_name || user.name,
          age,
          weight,
          height: form.height ? Number(form.height) : null,
          gender: form.gender || null,
          experience_level: form.experience_level,
          goal: form.goal,
          days_per_week: days,
          duration_weeks: form.plan_duration_weeks
            ? Number(form.plan_duration_weeks)
            : 4,
          plan_json: data.plan,
        };

        await fetch(`${API_BASE}/api/gym/ai-plans/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(savePayload),
        });
      } catch (e) {
        console.log("save plan error:", e);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  // ✅ PDF from plan (no preview, open externally)
  const makePdf = async () => {
    if (!plan) return;

    if (!PrintComp || !FileSystemComp) {
      Alert.alert(
        "Missing packages",
        "To enable PDF install: expo-print & expo-file-system"
      );
      return;
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial; padding: 18px; font-size: 16px; line-height: 1.6; }
            h2 { font-size: 22px; margin-bottom: 6px; }
            h3 { font-size: 18px; margin-top: 12px; }
            h4 { font-size: 16px; margin-top: 8px; }
            ul { margin-left: 18px; }
            li { margin-bottom: 4px; }
            .week { border: 1px solid #ddd; padding: 10px; border-radius: 8px; margin-top: 10px; }
            .day { margin-top: 6px; }
          </style>
        </head>
        <body>
          <h2>AI Gym Plan</h2>
          <h3>Summary</h3>
          <p>
            Name: ${form.full_name}<br/>
            Goal: ${plan.summary?.goal}<br/>
            Experience: ${plan.summary?.experience_level}<br/>
            Duration weeks: ${plan.summary?.duration_weeks}<br/>
            Days/week: ${plan.summary?.days_per_week}
          </p>

          ${
            (plan.weekly_plan || [])
              .map(
                (w: any) => `
                <div class="week">
                  <h3>Week ${w.week}</h3>
                  ${
                    (w.days || [])
                      .map(
                        (d: any) => `
                        <div class="day">
                          <h4>${d.day} - ${d.focus}</h4>
                          <ul>
                            ${
                              (d.exercises || [])
                                .map(
                                  (ex: any) =>
                                    `<li>${ex.name} — ${ex.sets} sets × ${ex.reps} (rest ${ex.rest_sec}s)</li>`
                                )
                                .join("")
                            }
                          </ul>
                          <p>${d.notes || ""}</p>
                        </div>
                      `
                      )
                      .join("")
                  }
                </div>
              `
              )
              .join("")
          }

          ${
            plan.nutrition_tips?.length
              ? `
              <h3>Nutrition Tips</h3>
              <ul>${plan.nutrition_tips
                .map((t: string) => `<li>${t}</li>`)
                .join("")}</ul>
            `
              : ""
          }

          <p style="color: gray; margin-top: 20px;">
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

      const newPath = `${baseDir}gym-plan-${Date.now()}.pdf`;

      await FileSystemComp.copyAsync({ from: uri, to: newPath });
      setPdfUri(newPath);

      Alert.alert("✅ PDF Ready", "Opening PDF...");
    } catch (e: any) {
      console.log("pdf error:", e);
      Alert.alert("PDF Error", e.message || "Failed to create PDF");
    }
  };

  // ✅ open PDF directly in installed PDF viewer
  const openPdfExternal = async () => {
    if (!pdfUri) {
      Alert.alert("No PDF", "Please create PDF first.");
      return;
    }

    try {
      await Linking.openURL(pdfUri);
    } catch (e) {
      console.log("open pdf error:", e);
      Alert.alert(
        "Open Error",
        "Could not open PDF. Please install a PDF viewer app."
      );
    }
  };

  const sharePdf = async (path?: string) => {
    const target = path || pdfUri;
    if (!target) return;

    if (!SharingComp) {
      Alert.alert("Missing package", "Install expo-sharing to open/share PDF");
      return;
    }

    await SharingComp.shareAsync(target);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
      <Text style={styles.title}>🤖 AI Gym Plan</Text>

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

      <Text style={styles.label}>Height (cm)</Text>
      <TextInput
        style={styles.input}
        value={form.height}
        onChangeText={(t) => setForm({ ...form, height: t })}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Goal *</Text>
      <View style={styles.rowWrap}>
        {[
          { key: "muscle_gain", label: "Muscle" },
          { key: "fat_loss", label: "Fat Loss" },
          { key: "strength", label: "Strength" },
        ].map((g) => (
          <TouchableOpacity
            key={g.key}
            onPress={() => setForm({ ...form, goal: g.key })}
            style={[styles.chip, form.goal === g.key && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                form.goal === g.key && styles.chipTextActive,
              ]}
            >
              {g.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Days per week *</Text>
      <TextInput
        style={styles.input}
        value={form.days_per_week}
        onChangeText={(t) => setForm({ ...form, days_per_week: t })}
        keyboardType="numeric"
        placeholder="3"
      />

      <Text style={styles.label}>Duration weeks</Text>
      <TextInput
        style={styles.input}
        value={form.plan_duration_weeks}
        onChangeText={(t) =>
          setForm({ ...form, plan_duration_weeks: t })
        }
        keyboardType="numeric"
        placeholder="4"
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={generatePlan}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>Generate AI Plan</Text>
        )}
      </TouchableOpacity>

      {plan && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Plan Ready ✅</Text>

          {/* 1) Create PDF */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={makePdf}
          >
            <Text style={styles.btnSecondaryText}>
              Create PDF
            </Text>
          </TouchableOpacity>

          {/* 2) Share PDF */}
          {pdfUri ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => sharePdf()}
            >
              <Text style={styles.btnSecondaryText}>
                Share PDF
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* 3) Open PDF directly */}
          {pdfUri ? (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={openPdfExternal}
            >
              <Text style={styles.btnSecondaryText}>
                Open PDF
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "900", marginBottom: 10 },
  label: { marginTop: 10, fontWeight: "700", color: "#344054" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  btn: {
    marginTop: 16,
    backgroundColor: "#0a7ea4",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "900", fontSize: 16 },

  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    backgroundColor: "#EEF2F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#0a7ea4" },
  chipText: { fontWeight: "700", color: "#344054" },
  chipTextActive: { color: "white" },

  card: {
    marginTop: 16,
    backgroundColor: "white",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4E7EC",
  },
  cardTitle: { fontWeight: "900", fontSize: 16, marginBottom: 8 },

  btnSecondary: {
    marginTop: 8,
    backgroundColor: "#E9EEF5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondaryText: { fontWeight: "800", color: "#0a7ea4" },
});