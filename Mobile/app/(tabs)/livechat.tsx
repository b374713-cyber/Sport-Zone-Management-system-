
// app/(tabs)/livechat.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
import * as Notifications from "expo-notifications";

import { API_BASE } from "../config/api";
import { registerForPushNotificationsAsync } from "../utils/pushToken";

type Message = {
  message_id: number;
  sender_type: "customer" | "user";
  sender_id: number;
  body: string;
  created_at: string;
  conversation_id?: number;
  is_read?: boolean;
};

export default function LiveChatScreen() {
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<Message> | null>(null);

  const [customer, setCustomer] = useState<any>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // in-app banner
  const [bannerText, setBannerText] = useState<string | null>(null);
  const bannerTimer = useRef<any>(null);

  useEffect(() => {
    init();
    return () => {
      socketRef.current?.disconnect();
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showInAppBanner = (msg: string) => {
    setBannerText(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBannerText(null), 2500);
  };

  const loadMessages = async (customerId: number) => {
    const msgRes = await fetch(`${API_BASE}/api/chat/messages`, {
      headers: { "x-customer-id": String(customerId) },
    });
    const msgJson = await msgRes.json();
    setMessages(msgJson.messages || []);
  };

  const init = async () => {
    try {
      const stored = await AsyncStorage.getItem("customer");
      if (!stored) {
        setLoading(false);
        return;
      }

      const c = JSON.parse(stored);
      setCustomer(c);

      // 1) register push token
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await fetch(`${API_BASE}/api/chat/push-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-customer-id": String(c.customer_id),
          },
          body: JSON.stringify({ expo_push_token: token }),
        });
      }

      // 2) get/create conversation
      const convoRes = await fetch(`${API_BASE}/api/chat/conversation`, {
        method: "POST",
        headers: { "x-customer-id": String(c.customer_id) },
      });

      const convoJson = await convoRes.json();
      const convoId = convoJson.conversation?.conversation_id ?? null;
      setConversationId(convoId);

      // 3) load history
      await loadMessages(c.customer_id);

      // 4) socket connect
      const socket = io(API_BASE, { 
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.on("connect", () => {
        console.log("✅ Mobile socket connected:", socket.id);
        setSocketConnected(true);
        if (convoId) {
          socket.emit("join", { conversationId: convoId });
          console.log("👥 Joined conversation:", convoId);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Mobile socket disconnected");
        setSocketConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.log("❌ Socket connection error:", err.message);
      });

      socket.on("message", async (msg: Message) => {
        console.log("📨 Received message on mobile:", msg.message_id);
        
        // ✅ FIX: prevent duplicate on sender (optimistic + socket echo)
        if (msg.sender_type === "customer" && msg.sender_id === c.customer_id) {
          // We already added this message optimistically on this device.
          // Optionally: try to replace a temp message if it exists (handled in sendMessage response too).
          return;
        }

        setMessages((prev) => {
          // also prevent duplicates by message_id (safe guard)
          if (prev.some((m) => m.message_id === msg.message_id)) return prev;
          return [...prev, msg];
        });

        // ✅ FIX FOR DUPLICATE NOTIFICATIONS:
        // When app is OPEN (socket connected) → show in-app banner ONLY
        // When app is CLOSED/background → Expo push will handle notification
        // DO NOT schedule local notification when socket is active!
        
        if (msg.sender_type === "user") {
          // App is open, just show in-app banner
          showInAppBanner(msg.body);
          
          // DO NOT schedule local notification here
          // Expo push from backend will handle background/closed app notifications
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.log("LiveChat init error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || !customer) return;

    const body = text.trim();
    setText("");

    // optimistic temp message
    const tempId = -Date.now();
    const temp: Message = {
      message_id: tempId,
      sender_type: "customer",
      sender_id: customer.customer_id,
      body,
      created_at: new Date().toISOString(),
      conversation_id: conversationId ?? undefined,
    };

    setMessages((prev) => [...prev, temp]);

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-customer-id": String(customer.customer_id),
        },
        body: JSON.stringify({ body }),
      });

      const json = await res.json();

      // ✅ Replace temp message with real inserted message (so list stays clean)
      if (json?.message?.message_id) {
        const realMsg: Message = json.message;

        setMessages((prev) => {
          // if server already delivered it somehow, keep only one
          const withoutTemp = prev.filter((m) => m.message_id !== tempId);
          if (withoutTemp.some((m) => m.message_id === realMsg.message_id)) {
            return withoutTemp;
          }
          return [...withoutTemp, realMsg];
        });
      }
    } catch (err) {
      console.log("sendMessage error:", err);
      // remove optimistic message if failed
      setMessages((prev) => prev.filter((m) => m.message_id !== tempId));
    }
  };

  // auto-scroll
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [messages]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading chat…</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Please log in to use live chat.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      {/* Connection status */}
      <View style={{
        padding: 8,
        backgroundColor: socketConnected ? "#4CAF50" : "#f44336",
        alignItems: "center"
      }}>
        <Text style={{ color: "white", fontSize: 12 }}>
          {socketConnected ? "● Live Connected" : "● Disconnected - Reconnecting..."}
        </Text>
      </View>

      {/* In-app banner */}
      {bannerText && (
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 12,
            right: 12,
            zIndex: 999,
            backgroundColor: "#111",
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            opacity: 0.95,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>New message</Text>
          <Text style={{ color: "white", fontSize: 13 }} numberOfLines={2}>
            {bannerText}
          </Text>
        </View>
      )}

      <FlatList
        ref={(ref) => {
          listRef.current = ref;
        }}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => String(item.message_id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 12, paddingTop: 60 }}
        renderItem={({ item }) => {
          const mine = item.sender_type === "customer";
          return (
            <View
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                backgroundColor: mine ? "#0a7ea4" : "#eee",
                padding: 12,
                borderRadius: 14,
                marginBottom: 8,
                maxWidth: "80%",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: mine ? 0.1 : 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text style={{ color: mine ? "white" : "#111", fontSize: 15 }}>{item.body}</Text>
              <Text style={{ 
                color: mine ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)", 
                fontSize: 10, 
                marginTop: 4,
                textAlign: "right"
              }}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      <View
        style={{
          flexDirection: "row",
          padding: 10,
          borderTopWidth: 1,
          borderColor: "#ddd",
          backgroundColor: "white",
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          style={{
            flex: 1,
            backgroundColor: "#f1f1f1",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginRight: 8,
            fontSize: 15,
          }}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!text.trim()}
          style={{
            backgroundColor: text.trim() ? "#0a7ea4" : "#cccccc",
            borderRadius: 20,
            paddingHorizontal: 18,
            justifyContent: "center",
            opacity: text.trim() ? 1 : 0.7,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}