import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./config/api";

//const API_URL = "http://YOUR_IP:5000/api/customers"; 
//const API_URL = "http://10.1.1.53:5000/api/customers";
//const API_URL = "http://172.20.10.9:5000/api/customers";
const API_URL = `${API_BASE}/api/customers`;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and Password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      const { token, customer } = res.data;

      // ✅ Save token + customer in storage
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("customer", JSON.stringify(customer));

      Alert.alert("Success", "Login successful!");
      router.replace("/(tabs)/sports");

    } catch (err: any) {
      console.log("LOGIN ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Login Failed",
        err?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineMedium">
        Login
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        contentStyle={{ paddingVertical: 6 }}
      >
        Login
      </Button>

      <Button mode="text" onPress={() => router.push("/register")}>
        Don’t have an account? Register
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "white",
  },
  title: {
    fontWeight: "800",
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
  },
});
