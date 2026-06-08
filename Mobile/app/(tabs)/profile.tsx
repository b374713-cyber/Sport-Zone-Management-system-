// import React, { useEffect, useState } from "react";
// import { View, Text, Image, Alert, ScrollView } from "react-native";
// import {
//   TextInput,
//   Button,
//   Card,
//   ActivityIndicator,
//   RadioButton,
//   Divider
// } from "react-native-paper";
// import * as ImagePicker from "expo-image-picker";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useRouter } from "expo-router";

// //const API_BASE = "http://10.1.1.53:5000";
// import { API_BASE } from "../config/api";

// const API_URL = `${API_BASE}/api/customers`;

// export default function ProfileScreen() {
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);

//   const [customerId, setCustomerId] = useState<number | null>(null);
//   const [token, setToken] = useState<string | null>(null);

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState(""); // read-only
//   const [phone, setPhone] = useState("");
//   const [birthDate, setBirthDate] = useState("");
//   const [gender, setGender] = useState<"Male" | "Female" | "">("");
//   const [address, setAddress] = useState("");
//   const [photoUrl, setPhotoUrl] = useState<string | null>(null);

//   useEffect(() => {
//     (async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem("token");
//         const storedCustomer = await AsyncStorage.getItem("customer");

//         if (!storedToken || !storedCustomer) {
//           Alert.alert("Not logged in", "Please login again.");
//           router.replace("/login");
//           return;
//         }

//         const parsed = JSON.parse(storedCustomer);
//         setCustomerId(parsed.customer_id);
//         setToken(storedToken);

//         await fetchProfile(parsed.customer_id, storedToken);
//       } catch (err) {
//         console.error(err);
//         Alert.alert("Error", "Failed to load profile.");
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   const fetchProfile = async (id: number, jwt: string) => {
//     const res = await axios.get(`${API_URL}/${id}/profile`, {
//       headers: { Authorization: `Bearer ${jwt}` },
//     });

//     const p = res.data;
//     setName(p.name || "");
//     setEmail(p.email || "");
//     setPhone(p.phone || "");
//     setBirthDate(p.birth_date ? p.birth_date.slice(0, 10) : "");
//     setGender(p.gender || "");
//     setAddress(p.address || "");
//     setPhotoUrl(p.photo_url ? `${API_BASE}${p.photo_url}` : null);
//   };

//   const handleSave = async () => {
//     if (!customerId || !token) return;

//     try {
//       setSaving(true);
//       await axios.put(
//         `${API_URL}/${customerId}/profile`,
//         { name, phone, birth_date: birthDate, gender, address },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       // update local storage
//       const storedCustomer = await AsyncStorage.getItem("customer");
//       if (storedCustomer) {
//         const parsed = JSON.parse(storedCustomer);
//         parsed.name = name;
//         parsed.phone = phone;
//         parsed.gender = gender;
//         parsed.address = address;
//         parsed.birth_date = birthDate;
//         await AsyncStorage.setItem("customer", JSON.stringify(parsed));
//       }

//       Alert.alert("Saved", "Profile updated successfully.");
//     } catch (err: any) {
//       Alert.alert("Error", err?.response?.data?.message || "Failed to update.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const pickAndUploadPhoto = async () => {
//     if (!customerId || !token) return;

//     const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!perm.granted) {
//       Alert.alert("Permission needed", "Allow gallery access to upload photo.");
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.8,
//     });

//     if (result.canceled) return;

//     const asset = result.assets[0];
//     const formData = new FormData();
//     formData.append("photo", {
//       uri: asset.uri,
//       name: "profile.jpg",
//       type: "image/jpeg",
//     } as any);

//     try {
//       setUploading(true);
//       const res = await axios.post(
//         `${API_URL}/${customerId}/profile/photo`,
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       setPhotoUrl(`${API_BASE}${res.data.photo_url}`);
//       Alert.alert("Done", "Photo updated!");
//     } catch (err: any) {
//       Alert.alert("Upload failed", err?.response?.data?.message || "Server error");
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleLogout = async () => {
//     await AsyncStorage.removeItem("token");
//     await AsyncStorage.removeItem("customer");

//     // IMPORTANT: replace, not push (prevents going back)
//     router.replace("/login");
//   };

//   if (loading) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={{ padding: 18 }}>
//       {/* Header */}
//       <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 10 }}>
//         Profile
//       </Text>

//       {/* Photo Card */}
//       <Card style={{ padding: 14, borderRadius: 16, marginBottom: 12 }}>
//         <View style={{ alignItems: "center" }}>
//           <Image
//             source={photoUrl ? { uri: photoUrl } : undefined}
//             style={{
//               width: 120,
//               height: 120,
//               borderRadius: 60,
//               backgroundColor: "#ddd",
//               marginBottom: 10,
//             }}
//           />
//           <Button
//             mode="outlined"
//             onPress={pickAndUploadPhoto}
//             loading={uploading}
//             style={{ borderRadius: 10 }}
//           >
//             Change Photo
//           </Button>
//         </View>
//       </Card>

//       {/* Info Card */}
//       <Card style={{ padding: 14, borderRadius: 16 }}>
//         <TextInput
//           label="Full Name"
//           mode="outlined"
//           value={name}
//           onChangeText={setName}
//           style={{ marginBottom: 10 }}
//         />

//         <TextInput
//           label="Email"
//           mode="outlined"
//           value={email}
//           editable={false}
//           style={{ marginBottom: 10 }}
//         />

//         <TextInput
//           label="Phone"
//           mode="outlined"
//           value={phone}
//           onChangeText={setPhone}
//           keyboardType="phone-pad"
//           style={{ marginBottom: 10 }}
//         />

//         <TextInput
//           label="Birth Date (YYYY-MM-DD)"
//           mode="outlined"
//           value={birthDate}
//           onChangeText={setBirthDate}
//           style={{ marginBottom: 10 }}
//         />

//         <Divider style={{ marginVertical: 8 }} />

//         {/* Gender Radio */}
//         <Text style={{ fontWeight: "700", marginBottom: 6 }}>Gender</Text>
//         <RadioButton.Group
//           onValueChange={(v) => setGender(v as any)}
//           value={gender}
//         >
//           <View style={{ flexDirection: "row", alignItems: "center" }}>
//             <RadioButton value="Male" />
//             <Text style={{ marginRight: 20 }}>Male</Text>

//             <RadioButton value="Female" />
//             <Text>Female</Text>
//           </View>
//         </RadioButton.Group>

//         <TextInput
//           label="Address"
//           mode="outlined"
//           value={address}
//           onChangeText={setAddress}
//           style={{ marginTop: 10, marginBottom: 16 }}
//         />

//         <Button
//           mode="contained"
//           onPress={handleSave}
//           loading={saving}
//           style={{ borderRadius: 10 }}
//           contentStyle={{ paddingVertical: 6 }}
//         >
//           Save Changes
//         </Button>

//         <Button
//           mode="text"
//           onPress={handleLogout}
//           style={{ marginTop: 6 }}
//         >
//           Logout
//         </Button>
//       </Card>
//     </ScrollView>
//   );
// }
import React, { useEffect, useState } from "react";
import { View, Text, Image, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

import { API_BASE } from "../config/api";

const API_URL = `${API_BASE}/api/customers`;

export default function ProfileScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [customerId, setCustomerId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // read-only
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [address, setAddress] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Reset Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedCustomer = await AsyncStorage.getItem("customer");

        if (!storedToken || !storedCustomer) {
          Alert.alert("Not logged in", "Please login again.");
          router.replace("/login");
          return;
        }

        const parsed = JSON.parse(storedCustomer);
        setCustomerId(parsed.customer_id);
        setToken(storedToken);

        await fetchProfile(parsed.customer_id, storedToken);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchProfile = async (id: number, jwt: string) => {
    const res = await axios.get(`${API_URL}/${id}/profile`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const p = res.data;
    setName(p.name || "");
    setEmail(p.email || "");
    setPhone(p.phone || "");
    setBirthDate(p.birth_date ? p.birth_date.slice(0, 10) : "");
    setGender(p.gender || "");
    setAddress(p.address || "");
    setPhotoUrl(p.photo_url ? `${API_BASE}${p.photo_url}` : null);
  };

  const handleSave = async () => {
    if (!customerId || !token) return;

    try {
      setSaving(true);
      await axios.put(
        `${API_URL}/${customerId}/profile`,
        { name, phone, birth_date: birthDate, gender, address },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const storedCustomer = await AsyncStorage.getItem("customer");
      if (storedCustomer) {
        const parsed = JSON.parse(storedCustomer);
        parsed.name = name;
        parsed.phone = phone;
        parsed.gender = gender;
        parsed.address = address;
        parsed.birth_date = birthDate;
        await AsyncStorage.setItem("customer", JSON.stringify(parsed));
      }

      Alert.alert("Saved", "Profile updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!customerId || !token) return;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Missing fields", "Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Mismatch", "New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await axios.put(
        `${API_URL}/${customerId}/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to update password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const pickAndUploadPhoto = async () => {
    if (!customerId || !token) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow gallery access to upload photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("photo", {
      uri: asset.uri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as any);

    try {
      setUploading(true);
      const res = await axios.post(
        `${API_URL}/${customerId}/profile/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPhotoUrl(`${API_BASE}${res.data.photo_url}`);
      Alert.alert("Done", "Photo updated!");
    } catch (err: any) {
      Alert.alert("Upload failed", err?.response?.data?.message || "Server error");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("customer");
    router.replace("/login");
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 18 }}>
      <Text style={{ fontSize: 26, fontWeight: "800", marginBottom: 10 }}>
        Profile
      </Text>

      <Card style={{ padding: 14, borderRadius: 16, marginBottom: 12 }}>
        <View style={{ alignItems: "center" }}>
          <Image
            source={photoUrl ? { uri: photoUrl } : undefined}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#ddd",
              marginBottom: 10,
            }}
          />
          <Button
            mode="outlined"
            onPress={pickAndUploadPhoto}
            loading={uploading}
            style={{ borderRadius: 10 }}
          >
            Change Photo
          </Button>
        </View>
      </Card>

      <Card style={{ padding: 14, borderRadius: 16 }}>
        <TextInput
          label="Full Name"
          mode="outlined"
          value={name}
          onChangeText={setName}
          style={{ marginBottom: 10 }}
        />

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          editable={false}
          style={{ marginBottom: 10 }}
        />

        <TextInput
          label="Phone"
          mode="outlined"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={{ marginBottom: 10 }}
        />

        <TextInput
          label="Birth Date (YYYY-MM-DD)"
          mode="outlined"
          value={birthDate}
          onChangeText={setBirthDate}
          style={{ marginBottom: 10 }}
        />

        <Divider style={{ marginVertical: 8 }} />

        {/* Gender: show ONLY if it exists */}
        {gender ? (
          <TextInput
            label="Gender"
            mode="outlined"
            value={gender}
            editable={false}
            style={{ marginBottom: 10 }}
          />
        ) : null}

        <TextInput
          label="Address"
          mode="outlined"
          value={address}
          onChangeText={setAddress}
          style={{ marginBottom: 16 }}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          style={{ borderRadius: 10 }}
          contentStyle={{ paddingVertical: 6 }}
        >
          Save Changes
        </Button>

        <Divider style={{ marginVertical: 14 }} />

        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
          Reset Password
        </Text>

        <TextInput
          label="Current Password"
          mode="outlined"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          style={{ marginBottom: 10 }}
        />

        <TextInput
          label="New Password"
          mode="outlined"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          style={{ marginBottom: 10 }}
        />

        <TextInput
          label="Confirm New Password"
          mode="outlined"
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry
          style={{ marginBottom: 12 }}
        />

        <Button
          mode="contained"
          onPress={handleResetPassword}
          loading={changingPassword}
          style={{ borderRadius: 10 }}
          contentStyle={{ paddingVertical: 6 }}
        >
          Update Password
        </Button>

        <Button mode="text" onPress={handleLogout} style={{ marginTop: 6 }}>
          Logout
        </Button>
      </Card>
    </ScrollView>
  );
}
