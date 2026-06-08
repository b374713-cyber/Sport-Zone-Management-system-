// // import React, { useMemo, useState } from "react";
// // import { View, Text, Alert, ScrollView, Platform, TouchableOpacity } from "react-native";
// // import { TextInput, Button, HelperText, Card } from "react-native-paper";
// // import axios from "axios";
// // import { useRouter } from "expo-router";
// // import { API_BASE } from "./config/api";

// // // DateTime Picker (Expo compatible)
// // let DateTimePicker: any = null;
// // try {
// //   DateTimePicker = require("@react-native-community/datetimepicker").default;
// // } catch {}

// // //const API_URL = "http://10.1.1.53:5000/api/customers";
// // //const API_URL = "http://172.20.10.9:5000/api/customers";
// // const API_URL = `${API_BASE}/api/customers`;

// // function formatYYYYMMDD(d: Date) {
// //   const yyyy = d.getFullYear();
// //   const mm = String(d.getMonth() + 1).padStart(2, "0");
// //   const dd = String(d.getDate()).padStart(2, "0");
// //   return `${yyyy}-${mm}-${dd}`;
// // }

// // export default function RegisterScreen() {
// //   const router = useRouter();

// //   const [name, setName] = useState("");
// //   const [email, setEmail] = useState("");
// //   const [phone, setPhone] = useState("");

// //   // ✅ birth date now stored as Date
// //   const [birthDate, setBirthDate] = useState<Date | null>(null);
// //   const [showBirthPicker, setShowBirthPicker] = useState(false);

// //   const [password, setPassword] = useState("");
// //   const [confirmPassword, setConfirmPassword] = useState("");
// //   const [loading, setLoading] = useState(false);

// //   function calcAge(birth: Date) {
// //     const today = new Date();
// //     let age = today.getFullYear() - birth.getFullYear();
// //     const m = today.getMonth() - birth.getMonth();
// //     if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
// //     return age;
// //   }

// //   const birthInvalid = useMemo(() => {
// //     if (!birthDate) return false;
// //     return isNaN(birthDate.getTime());
// //   }, [birthDate]);

// //   const onPickBirthDate = (_event: any, date?: Date) => {
// //     // On Android, picker closes after selection. On iOS it can stay open depending on display.
// //     if (Platform.OS === "android") setShowBirthPicker(false);

// //     if (!date) return; // cancelled
// //     setBirthDate(date);
// //   };

// //   const handleRegister = async () => {
// //     if (!name || !email || !password || !birthDate) {
// //       Alert.alert("Missing info", "Please fill all required fields.");
// //       return;
// //     }

// //     if (birthInvalid) {
// //       Alert.alert("Birth date error", "Please select a valid date.");
// //       return;
// //     }

// //     if (calcAge(birthDate) < 15) {
// //       Alert.alert("Not allowed", "You must be at least 15 years old.");
// //       return;
// //     }

// //     if (password !== confirmPassword) {
// //       Alert.alert("Password error", "Passwords do not match.");
// //       return;
// //     }

// //     try {
// //       setLoading(true);
// //       await axios.post(`${API_URL}/register`, {
// //         name,
// //         email,
// //         phone,
// //         password,
// //         birth_date: formatYYYYMMDD(birthDate), // ✅ send YYYY-MM-DD to backend
// //       });

// //       Alert.alert("Success", "Account created. Please login.");
// //       router.replace("/login");
// //     } catch (err: any) {
// //       Alert.alert(
// //         "Register failed",
// //         err?.response?.data?.message || "Server error"
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const birthText = birthDate ? formatYYYYMMDD(birthDate) : "";

// //   return (
// //     <ScrollView contentContainerStyle={{ padding: 18 }}>
// //       {/* Header */}
// //       <View style={{ marginBottom: 18 }}>
// //         <Text style={{ fontSize: 30, fontWeight: "800" }}>Create Account</Text>
// //         <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
// //           Join Sport Zone and start booking instantly.
// //         </Text>
// //       </View>

// //       {/* Form Card */}
// //       <Card style={{ padding: 14, borderRadius: 16 }}>
// //         <TextInput
// //           label="Full Name *"
// //           mode="outlined"
// //           value={name}
// //           onChangeText={setName}
// //           style={{ marginBottom: 10 }}
// //         />

// //         <TextInput
// //           label="Email *"
// //           mode="outlined"
// //           value={email}
// //           onChangeText={setEmail}
// //           keyboardType="email-address"
// //           autoCapitalize="none"
// //           style={{ marginBottom: 10 }}
// //         />

// //         <TextInput
// //           label="Phone"
// //           mode="outlined"
// //           value={phone}
// //           onChangeText={setPhone}
// //           keyboardType="phone-pad"
// //           style={{ marginBottom: 10 }}
// //         />

// //         {/* ✅ Birth Date Picker (no typing) */}
// //         <TouchableOpacity
// //           activeOpacity={0.9}
// //           onPress={() => {
// //             if (!DateTimePicker) {
// //               Alert.alert(
// //                 "Missing package",
// //                 "Install @react-native-community/datetimepicker"
// //               );
// //               return;
// //             }
// //             setShowBirthPicker(true);
// //           }}
// //         >
// //           <TextInput
// //             label="Birth Date *"
// //             mode="outlined"
// //             value={birthText}
// //             editable={false}
// //             pointerEvents="none"
// //             right={<TextInput.Icon icon="calendar" />}
// //             style={{ marginBottom: 4 }}
// //           />
// //         </TouchableOpacity>

// //         <HelperText type="error" visible={birthInvalid}>
// //           Please select a valid birth date.
// //         </HelperText>

// //         {/* Picker UI */}
// //         {showBirthPicker && DateTimePicker && (
// //           <DateTimePicker
// //             value={birthDate || new Date(2005, 0, 1)}
// //             mode="date"
// //             display={Platform.OS === "ios" ? "spinner" : "default"}
// //             onChange={onPickBirthDate}
// //             maximumDate={new Date()} // cannot pick future date
// //           />
// //         )}

// //         {/* On iOS, give a Done button to close */}
// //         {Platform.OS === "ios" && showBirthPicker && (
// //           <Button
// //             mode="outlined"
// //             style={{ marginTop: 8, borderRadius: 10 }}
// //             onPress={() => setShowBirthPicker(false)}
// //           >
// //             Done
// //           </Button>
// //         )}

// //         <TextInput
// //           label="Password *"
// //           mode="outlined"
// //           value={password}
// //           onChangeText={setPassword}
// //           secureTextEntry
// //           style={{ marginBottom: 10, marginTop: 10 }}
// //         />

// //         <TextInput
// //           label="Confirm Password *"
// //           mode="outlined"
// //           value={confirmPassword}
// //           onChangeText={setConfirmPassword}
// //           secureTextEntry
// //           style={{ marginBottom: 16 }}
// //         />

// //         <Button
// //           mode="contained"
// //           onPress={handleRegister}
// //           loading={loading}
// //           style={{ borderRadius: 10, paddingVertical: 4 }}
// //           contentStyle={{ paddingVertical: 6 }}
// //         >
// //           Register
// //         </Button>
// //       </Card>

// //       {/* Footer */}
// //       <Button
// //         mode="text"
// //         onPress={() => router.replace("/login")}
// //         style={{ marginTop: 12 }}
// //       >
// //         Already have an account? Login
// //       </Button>
// //     </ScrollView>
// //   );
// // }

// import React, { useMemo, useState } from "react";
// import { View, Text, Alert, ScrollView, Platform, TouchableOpacity, StyleSheet } from "react-native";
// import { TextInput, Button, HelperText, Card } from "react-native-paper";
// import axios from "axios";
// import { useRouter } from "expo-router";
// import { API_BASE } from "./config/api";

// // DateTime Picker (Expo compatible)
// let DateTimePicker: any = null;
// try {
//   DateTimePicker = require("@react-native-community/datetimepicker").default;
// } catch {}

// //const API_URL = "http://10.1.1.53:5000/api/customers";
// //const API_URL = "http://172.20.10.9:5000/api/customers";
// const API_URL = `${API_BASE}/api/customers`;

// function formatYYYYMMDD(d: Date) {
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${yyyy}-${mm}-${dd}`;
// }

// export default function RegisterScreen() {
//   const router = useRouter();

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phoneDigits, setPhoneDigits] = useState(""); // user types only digits after +961

//   // ✅ birth date now stored as Date
//   const [birthDate, setBirthDate] = useState<Date | null>(null);
//   const [showBirthPicker, setShowBirthPicker] = useState(false);

//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   function calcAge(birth: Date) {
//     const today = new Date();
//     let age = today.getFullYear() - birth.getFullYear();
//     const m = today.getMonth() - birth.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
//     return age;
//   }

//   const birthInvalid = useMemo(() => {
//     if (!birthDate) return false;
//     return isNaN(birthDate.getTime());
//   }, [birthDate]);

//   const onPickBirthDate = (_event: any, date?: Date) => {
//     // On Android, picker closes after selection. On iOS it can stay open depending on display.
//     if (Platform.OS === "android") setShowBirthPicker(false);

//     if (!date) return; // cancelled
//     setBirthDate(date);
//   };

//   const handleRegister = async () => {
//     if (!name || !email || !password || !birthDate || phoneDigits.length !== 8) {
//       Alert.alert("Error", "Please fill all fields (Phone must be 8 digits).");
//       return;
//     }

//     if (birthInvalid) {
//       Alert.alert("Birth date error", "Please select a valid date.");
//       return;
//     }

//     if (calcAge(birthDate) < 15) {
//       Alert.alert("Not allowed", "You must be at least 15 years old.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       Alert.alert("Password error", "Passwords do not match.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const fullPhone = `+961${phoneDigits}`;
      
//       await axios.post(`${API_URL}/register`, {
//         name,
//         email,
//         phone: fullPhone,
//         password,
//         birth_date: formatYYYYMMDD(birthDate), // ✅ send YYYY-MM-DD to backend
//       });

//       Alert.alert("Success", "Account created. Please login.");
//       router.replace("/login");
//     } catch (err: any) {
//       Alert.alert(
//         "Register failed",
//         err?.response?.data?.message || "Server error"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const birthText = birthDate ? formatYYYYMMDD(birthDate) : "";

//   return (
//     <ScrollView contentContainerStyle={{ padding: 18 }}>
//       {/* Header */}
//       <View style={{ marginBottom: 18 }}>
//         <Text style={{ fontSize: 30, fontWeight: "800" }}>Create Account</Text>
//         <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
//           Join Sport Zone and start booking instantly.
//         </Text>
//       </View>

//       {/* Form Card */}
//       <Card style={{ padding: 14, borderRadius: 16 }}>
//         <TextInput
//           label="Full Name *"
//           mode="outlined"
//           value={name}
//           onChangeText={setName}
//           style={{ marginBottom: 10 }}
//         />

//         <TextInput
//           label="Email *"
//           mode="outlined"
//           value={email}
//           onChangeText={setEmail}
//           keyboardType="email-address"
//           autoCapitalize="none"
//           style={{ marginBottom: 10 }}
//         />

//         {/* Phone Input with +961 prefix */}
//         <View style={{ marginBottom: 10 }}>
//           <Text style={styles.phoneLabel}>Phone *</Text>
//           <View style={styles.phoneContainer}>
//             <Text style={styles.phonePrefix}>+961</Text>
//             <TextInput
//               style={styles.phoneInput}
//               placeholder="8 digits"
//               keyboardType="number-pad"
//               value={phoneDigits}
//               onChangeText={(t) => {
//                 const digitsOnly = t.replace(/\D/g, "").slice(0, 8);
//                 setPhoneDigits(digitsOnly);
//               }}
//               mode="outlined"
//             />
//           </View>
//           {phoneDigits.length > 0 && phoneDigits.length < 8 && (
//             <HelperText type="error" visible>
//               Phone must be 8 digits
//             </HelperText>
//           )}
//         </View>

//         {/* ✅ Birth Date Picker (no typing) */}
//         <TouchableOpacity
//           activeOpacity={0.9}
//           onPress={() => {
//             if (!DateTimePicker) {
//               Alert.alert(
//                 "Missing package",
//                 "Install @react-native-community/datetimepicker"
//               );
//               return;
//             }
//             setShowBirthPicker(true);
//           }}
//         >
//           <TextInput
//             label="Birth Date *"
//             mode="outlined"
//             value={birthText}
//             editable={false}
//             pointerEvents="none"
//             right={<TextInput.Icon icon="calendar" />}
//             style={{ marginBottom: 4 }}
//           />
//         </TouchableOpacity>

//         <HelperText type="error" visible={birthInvalid}>
//           Please select a valid birth date.
//         </HelperText>

//         {/* Picker UI */}
//         {showBirthPicker && DateTimePicker && (
//           <DateTimePicker
//             value={birthDate || new Date(2005, 0, 1)}
//             mode="date"
//             display={Platform.OS === "ios" ? "spinner" : "default"}
//             onChange={onPickBirthDate}
//             maximumDate={new Date()} // cannot pick future date
//           />
//         )}

//         {/* On iOS, give a Done button to close */}
//         {Platform.OS === "ios" && showBirthPicker && (
//           <Button
//             mode="outlined"
//             style={{ marginTop: 8, borderRadius: 10 }}
//             onPress={() => setShowBirthPicker(false)}
//           >
//             Done
//           </Button>
//         )}

//         <TextInput
//           label="Password *"
//           mode="outlined"
//           value={password}
//           onChangeText={setPassword}
//           secureTextEntry
//           style={{ marginBottom: 10, marginTop: 10 }}
//         />

//         <TextInput
//           label="Confirm Password *"
//           mode="outlined"
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//           secureTextEntry
//           style={{ marginBottom: 16 }}
//         />

//         <Button
//           mode="contained"
//           onPress={handleRegister}
//           loading={loading}
//           style={{ borderRadius: 10, paddingVertical: 4 }}
//           contentStyle={{ paddingVertical: 6 }}
//         >
//           Register
//         </Button>
//       </Card>

//       {/* Footer */}
//       <Button
//         mode="text"
//         onPress={() => router.replace("/login")}
//         style={{ marginTop: 12 }}
//       >
//         Already have an account? Login
//       </Button>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   phoneContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   phoneLabel: {
//     fontSize: 12,
//     color: "rgba(0, 0, 0, 0.54)",
//     marginBottom: 4,
//     marginLeft: 12,
//   },
//   phonePrefix: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#000",
//     backgroundColor: "#f5f5f5",
//     paddingHorizontal: 12,
//     paddingVertical: 16,
//     borderTopLeftRadius: 4,
//     borderBottomLeftRadius: 4,
//     borderWidth: 1,
//     borderRightWidth: 0,
//     borderColor: "#ccc",
//   },
//   phoneInput: {
//     flex: 1,
//     borderTopLeftRadius: 0,
//     borderBottomLeftRadius: 0,
//   },
// });
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Modal,
  TextInput as RNTextInput,
} from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_BASE } from "./config/api";

// DateTime Picker (Expo compatible)
let DateTimePicker: any = null;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {}

const API_URL = `${API_BASE}/api/customers`;

function formatYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RegisterScreen() {
  const router = useRouter();

  // Registration form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);

  // Verification modal states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [codeTimer, setCodeTimer] = useState(0);
  const [codeResendLoading, setCodeResendLoading] = useState(false);
  const [tempRegistrationData, setTempRegistrationData] = useState<any>(null);

  // Refs for code inputs
  const codeInputRefs = useRef<Array<RNTextInput>>([]);

  useEffect(() => {
    codeInputRefs.current = codeInputRefs.current.slice(0, 6);
  }, []);

  useEffect(() => {
    if (codeTimer <= 0) return;

    const interval = setInterval(() => {
      setCodeTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [codeTimer]);

  function calcAge(birth: Date) {
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  const birthInvalid = useMemo(() => {
    if (!birthDate) return false;
    return isNaN(birthDate.getTime());
  }, [birthDate]);

  const onPickBirthDate = (_event: any, date?: Date) => {
    if (Platform.OS === "android") setShowBirthPicker(false);
    if (!date) return;
    setBirthDate(date);
  };

  const birthText = birthDate ? formatYYYYMMDD(birthDate) : "";

  // ✅ STEP 1: Send verification code
  const handleRegister = async () => {
    if (!name || !email || !password || !birthDate || phoneDigits.length !== 8) {
      Alert.alert("Error", "Please fill all fields (Phone must be 8 digits).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (birthInvalid) {
      Alert.alert("Error", "Please select a valid birth date.");
      return;
    }

    if (calcAge(birthDate) < 15) {
      Alert.alert("Error", "You must be at least 15 years old to register.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    try {
      setRegistrationLoading(true);

      const registrationData = {
        name,
        email,
        phone: `+961${phoneDigits}`,
        password,
        birth_date: formatYYYYMMDD(birthDate),
      };

      setTempRegistrationData(registrationData);

      const response = await axios.post(`${API_URL}/send-verification-code`, { email });

      if (response.data.success) {
        setShowVerificationModal(true);
        setCodeTimer(60);
        setTimeout(() => {
          codeInputRefs.current[0]?.focus();
        }, 100);
      } else {
        Alert.alert("Error", response.data.message || "Failed to send verification code");
      }
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Failed to send verification code. Please try again.");
    } finally {
      setRegistrationLoading(false);
    }
  };

  // ✅ FIXED: now last digit (index 5) is saved correctly
  const handleCodeInput = (text: string, index: number) => {
    const numericText = text.replace(/[^0-9]/g, "");
    const newCode = [...verificationCode];

    // ✅ allow typing on ALL indexes including index=5
    if (numericText.length === 1) {
      newCode[index] = numericText;
      setVerificationCode(newCode);

      // only move focus if not last box
      if (index < 5) {
        setTimeout(() => codeInputRefs.current[index + 1]?.focus(), 10);
      }
      return;
    }

    if (numericText.length === 0) {
      newCode[index] = "";
      setVerificationCode(newCode);

      if (index > 0) {
        setTimeout(() => codeInputRefs.current[index - 1]?.focus(), 10);
      }
      return;
    }

    // paste multiple digits
    if (numericText.length > 1) {
      const digits = numericText.split("");
      digits.forEach((digit, i) => {
        if (index + i < 6) newCode[index + i] = digit;
      });
      setVerificationCode(newCode);

      const lastIndex = Math.min(index + digits.length - 1, 5);
      setTimeout(() => codeInputRefs.current[lastIndex]?.focus(), 10);
    }
  };

  // ✅ STEP 2: Verify and register
  const handleVerifyAndRegister = async () => {
    const fullCode = verificationCode.join("");

    if (fullCode.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    if (!tempRegistrationData) {
      Alert.alert("Error", "Registration data missing. Please start over.");
      return;
    }

    try {
      setVerificationLoading(true);

      const verifyResponse = await axios.post(`${API_URL}/verify-code`, {
        email: tempRegistrationData.email,
        verification_code: fullCode,
      });

      if (!verifyResponse.data.success) {
        Alert.alert("Error", verifyResponse.data.message || "Invalid code");
        return;
      }

      await axios.post(`${API_URL}/register`, {
        ...tempRegistrationData,
        verification_code: fullCode,
      });

      setShowVerificationModal(false);

      Alert.alert("Success 🎉", "Account created successfully! Please login.", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (err: any) {
      console.error("Verification/Registration error:", err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Invalid verification code or server error");
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (codeTimer > 0 || !tempRegistrationData) return;

    try {
      setCodeResendLoading(true);
      const response = await axios.post(`${API_URL}/send-verification-code`, {
        email: tempRegistrationData.email,
      });

      if (response.data.success) {
        setCodeTimer(60);
        setVerificationCode(["", "", "", "", "", ""]);
        setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
        Alert.alert("Success", "New verification code sent to your email.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to resend code");
    } finally {
      setCodeResendLoading(false);
    }
  };

  const renderVerificationModal = () => (
    <Modal visible={showVerificationModal} animationType="slide" transparent onRequestClose={() => setShowVerificationModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Verify Your Email</Text>
          <Text style={styles.modalSubtitle}>
            We sent a 6-digit code to:{"\n"}
            <Text style={{ fontWeight: "600", color: "#4F46E5" }}>{email}</Text>
          </Text>

          <View style={styles.codeContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <RNTextInput
                key={index}
                ref={(ref) => {
                  if (ref) codeInputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, verificationCode[index] ? styles.codeInputFilled : styles.codeInputEmpty]}
                keyboardType="number-pad"
                maxLength={1}
                value={verificationCode[index]}
                onChangeText={(t) => handleCodeInput(t, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace" && !verificationCode[index] && index > 0) {
                    codeInputRefs.current[index - 1]?.focus();
                  }
                }}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <Text style={styles.codeHint}>Enter the 6-digit code from your email</Text>

          <View style={styles.resendContainer}>
            <Text style={{ color: "#666", marginRight: 8 }}>Didn't receive the code?</Text>
            <Button mode="text" onPress={handleResendCode} loading={codeResendLoading} disabled={codeTimer > 0 || codeResendLoading} compact>
              {codeTimer > 0 ? `Resend in ${codeTimer}s` : "Resend Code"}
            </Button>
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowVerificationModal(false);
                setVerificationCode(["", "", "", "", "", ""]);
              }}
              style={{ flex: 1, marginRight: 8 }}
              disabled={verificationLoading}
            >
              Cancel
            </Button>

            <Button
              mode="contained"
              onPress={handleVerifyAndRegister}
              loading={verificationLoading}
              disabled={verificationLoading || verificationCode.join("").length !== 6}
              style={{ flex: 1, marginLeft: 8 }}
            >
              Verify & Register
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center", minHeight: "100%" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account 🎮</Text>
          <Text style={styles.subtitle}>Join Sport Zone and start booking instantly</Text>

          <TextInput label="Full Name *" mode="outlined" value={name} onChangeText={setName} style={styles.input} left={<TextInput.Icon icon="account" />} />

          <TextInput
            label="Email Address *"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            left={<TextInput.Icon icon="email" />}
          />

          <View style={styles.phoneWrapper}>
            <Text style={styles.phoneLabel}>Phone *</Text>
            <View style={styles.phoneContainer}>
              <View style={styles.phonePrefix}>
                <Text style={styles.phonePrefixText}>+961</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="8 digits"
                keyboardType="number-pad"
                value={phoneDigits}
                onChangeText={(t) => setPhoneDigits(t.replace(/\D/g, "").slice(0, 8))}
                mode="outlined"
                outlineColor="#ccc"
                activeOutlineColor="#4F46E5"
              />
            </View>
            {phoneDigits.length > 0 && phoneDigits.length < 8 && (
              <HelperText type="error" visible style={styles.errorText}>
                Phone must be 8 digits
              </HelperText>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (!DateTimePicker) {
                Alert.alert("Missing package", "Install @react-native-community/datetimepicker");
                return;
              }
              setShowBirthPicker(true);
            }}
          >
            <TextInput
              label="Birth Date *"
              mode="outlined"
              value={birthText}
              editable={false}
              pointerEvents="none"
              style={styles.input}
              left={<TextInput.Icon icon="calendar" />}
              right={<TextInput.Icon icon="menu-down" />}
            />
          </TouchableOpacity>

          {birthInvalid && (
            <HelperText type="error" visible style={styles.errorText}>
              Please select a valid birth date
            </HelperText>
          )}

          {showBirthPicker && DateTimePicker && (
            <>
              <DateTimePicker value={birthDate || new Date(2005, 0, 1)} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onPickBirthDate} maximumDate={new Date()} />
              {Platform.OS === "ios" && (
                <Button mode="outlined" style={styles.doneButton} onPress={() => setShowBirthPicker(false)}>
                  Done
                </Button>
              )}
            </>
          )}

          <TextInput label="Password *" mode="outlined" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} left={<TextInput.Icon icon="lock" />} />

          <TextInput
            label="Confirm Password *"
            mode="outlined"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
          />

          <Button mode="contained" onPress={handleRegister} loading={registrationLoading} disabled={registrationLoading} style={styles.registerButton} contentStyle={{ paddingVertical: 8 }}>
            Register
          </Button>

          <Button mode="text" onPress={() => router.replace("/login")} style={styles.loginButton}>
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>

      {renderVerificationModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center", color: "#1f2937" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24, textAlign: "center" },
  input: { marginBottom: 12, backgroundColor: "white" },

  phoneWrapper: { marginBottom: 12 },
  phoneLabel: { fontSize: 12, color: "rgba(0, 0, 0, 0.54)", marginBottom: 4, marginLeft: 12 },
  phoneContainer: { flexDirection: "row", alignItems: "center" },
  phonePrefix: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "#ccc",
    justifyContent: "center",
  },
  phonePrefixText: { fontSize: 16, fontWeight: "500", color: "#000" },
  phoneInput: { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  errorText: { marginTop: 4 },
  doneButton: { marginTop: 8, borderRadius: 8 },
  registerButton: { borderRadius: 8, paddingVertical: 6, marginTop: 8, backgroundColor: "#4F46E5" },
  loginButton: { marginTop: 12, alignSelf: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8, color: "#1f2937" },
  modalSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 },

  codeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 10 },
  codeInput: { width: 50, height: 60, borderWidth: 2, borderRadius: 8, fontSize: 24, fontWeight: "600", textAlign: "center" },
  codeInputEmpty: { borderColor: "#e5e7eb", backgroundColor: "#f9fafb" },
  codeInputFilled: { borderColor: "#4F46E5", backgroundColor: "#f5f3ff", color: "#4F46E5" },

  codeHint: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  resendContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
});
