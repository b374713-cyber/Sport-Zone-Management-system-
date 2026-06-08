import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { API_BASE } from "./config/api";
import * as DocumentPicker from "expo-document-picker";

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

export default function ApplyJobScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [cvFile, setCvFile] = useState<PickedFile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickCvFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/png",
          "image/jpeg",
          "image/jpg",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;

      const f = res.assets?.[0];
      if (!f?.uri) return;

      // mimeType sometimes missing on Android, fallback by extension
      const mime =
        f.mimeType ||
        (f.name?.toLowerCase().endsWith(".pdf")
          ? "application/pdf"
          : "image/jpeg");

      setCvFile({
        uri: f.uri,
        name: f.name || `cv_${Date.now()}`,
        mimeType: mime,
        size: f.size,
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to pick file.");
    }
  };

  const removeCvFile = () => setCvFile(null);

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please fill: Full name, Email, and Phone.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("full_name", fullName.trim());
      fd.append("email", email.trim());
      fd.append("phone", phone.trim());
      if (cvLink.trim()) fd.append("cv_link", cvLink.trim());

      // ✅ attach file (PDF or image)
      if (cvFile) {
        fd.append(
          "cv_image",
          {
            uri: cvFile.uri,
            name: cvFile.name,
            type: cvFile.mimeType,
          } as any
        );
      }

      const res = await fetch(`${API_BASE}/api/jobs/apply`, {
        method: "POST",
        body: fd,
        // ⚠️ don't set Content-Type manually with FormData in RN
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Error", data?.error || "Failed to submit application.");
        return;
      }

      Alert.alert("Done", "Your application was submitted successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={["#071b2f", "#0b6fa5", "#1bb6d8"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Job Application</Text>
          <Text style={styles.subtitle}>
            Fill your details and upload your CV (PDF or image).
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Full name *</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.input}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="john@email.com"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+961 ..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.input}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>CV link (optional)</Text>
            <TextInput
              value={cvLink}
              onChangeText={setCvLink}
              placeholder="Google Drive / Dropbox / etc."
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Upload CV (PDF / Image)</Text>

            <TouchableOpacity
              style={styles.pickBtn}
              onPress={pickCvFile}
              activeOpacity={0.85}
              disabled={submitting}
            >
              <Text style={styles.pickText}>
                {cvFile ? "Change File" : "Choose File"}
              </Text>
            </TouchableOpacity>

            {cvFile ? (
              <View style={styles.fileRow}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {cvFile.name}
                </Text>
                <TouchableOpacity onPress={removeCvFile} disabled={submitting}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.fileHint}>No file selected</Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={submit}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.submitText}>Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
              disabled={submitting}
            >
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 70, paddingBottom: 30, paddingHorizontal: 22 },
  title: { color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center" },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 20,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  label: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "700",
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pickBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  pickText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  fileRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fileName: { flex: 1, color: "rgba(255,255,255,0.9)" },
  removeText: { color: "#ffd1d1", fontWeight: "900" },
  fileHint: { marginTop: 10, color: "rgba(255,255,255,0.7)" },

  submitBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.8)",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  backBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  backText: { color: "rgba(255,255,255,0.9)", fontSize: 15, fontWeight: "700" },
});
