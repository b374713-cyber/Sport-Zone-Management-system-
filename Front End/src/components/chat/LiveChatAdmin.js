
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

export default function LiveChatAdmin() {
  const { user } = useAuth();
  const userId = user?.user_id || user?.id;

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // ✅ keep latest selected in a ref so socket handler always sees it
  const selectedRef = useRef(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const socketUrl = useMemo(() => {
    const base = api?.defaults?.baseURL || "http://localhost:5000/api";
    return base.replace(/\/api\/?$/, "");
  }, []);

  // load inbox once
  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // connect socket once
  useEffect(() => {
    const s = io(socketUrl, { transports: ["websocket"] });

    s.on("connect", () => {
      console.log("✅ Admin socket connected:", s.id);
      // ✅ IMPORTANT: join admins room to receive ALL customer messages instantly
      s.emit("join-admin");
    });

    s.on("message", (msg) => {
      console.log("📨 Received message event:", msg);
      const current = selectedRef.current;

      // ✅ Update inbox preview for ALL messages (admin or customer)
      updateConversationList(msg);

      // ✅ Append ONLY if currently open conversation matches
      if (current && msg.conversation_id === current.conversation_id) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.message_id) === String(msg.message_id))) return prev;
          return [...prev, msg];
        });
      }
    });

    // ✅ NEW: Listen for special customer message events to update inbox
    s.on("new-customer-message", (data) => {
      console.log("📩 New customer message for inbox:", data);
      updateConversationList(data);
      
      // If this conversation is currently open, add the message
      const current = selectedRef.current;
      if (current && data.conversation_id === current.conversation_id) {
        setMessages((prev) => {
          if (prev.some((m) => m.message_id === data.message_id)) return prev;
          return [...prev, data];
        });
      }
    });

    s.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    s.on("error", (err) => {
      console.error("Socket error:", err);
    });

    socketRef.current = s;
    return () => s.disconnect();
  }, [socketUrl]);

  // Helper to update conversation list
  const updateConversationList = (msg) => {
    setConversations((prev) => {
      const copy = Array.isArray(prev) ? [...prev] : [];
      const idx = copy.findIndex((c) => c.conversation_id === msg.conversation_id);

      if (idx !== -1) {
        // Update existing conversation
        const updated = {
          ...copy[idx],
          last_message: msg.body,
          last_message_at: msg.created_at || new Date().toISOString(),
          updated_at: msg.created_at || new Date().toISOString(),
        };
        
        const newList = [...copy];
        newList[idx] = updated;
        
        // Move to top
        const [moved] = newList.splice(idx, 1);
        return [moved, ...newList];
      } else {
        // If conversation not loaded yet, we need to fetch it
        loadConversations();
        return copy;
      }
    });
  };

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      const res = await api.get("/chat/admin/conversations");
      setConversations(res.data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  const openConversation = async (c) => {
    // leave old room
    if (selectedRef.current?.conversation_id) {
      socketRef.current?.emit("leave", {
        conversationId: selectedRef.current.conversation_id,
      });
    }

    setSelected(c);

    // join new room
    socketRef.current?.emit("join", { conversationId: c.conversation_id });

    // load messages
    try {
      const res = await api.get(`/chat/admin/messages/${c.conversation_id}`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const send = async () => {
    const current = selectedRef.current;

    if (!current || !text.trim()) return;

    if (!userId) {
      alert("Missing admin userId. Please login again.");
      return;
    }

    const body = text.trim();
    setText("");

    // optimistic add
    const temp = {
      message_id: `temp-${Date.now()}`,
      conversation_id: current.conversation_id,
      sender_type: "user",
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await api.post(
        "/chat/admin/message",
        { conversation_id: current.conversation_id, body },
        { headers: { "x-user-id": String(userId) } }
      );
      
      // Update conversation list in inbox
      updateConversationList({
        conversation_id: current.conversation_id,
        body,
        created_at: new Date().toISOString(),
        sender_type: "user"
      });
    } catch (e) {
      console.error("send admin message error:", e);
      alert("Failed to send message.");
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.message_id !== temp.message_id));
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div style={{ display: "flex", gap: 14, padding: 16, height: "85vh" }}>
      {/* Left: inbox */}
      <div style={{ width: 320, border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, fontWeight: 800, borderBottom: "1px solid #eee", background: "#f8f9fa" }}>
          Live Chat Inbox
          <div style={{ fontSize: 12, fontWeight: 400, color: "#666", marginTop: 4 }}>
            {conversations.length} conversations
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
              No conversations yet
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = selected?.conversation_id === c.conversation_id;
              const lastMessageTime = c.last_message_at ? formatTime(c.last_message_at) : "";
              const lastMessageDate = c.last_message_at ? formatDate(c.last_message_at) : "";
              
              return (
                <div
                  key={c.conversation_id}
                  onClick={() => openConversation(c)}
                  style={{
                    padding: 12,
                    cursor: "pointer",
                    background: isSelected ? "#e3f2fd" : "white",
                    borderBottom: "1px solid #eee",
                    borderLeft: isSelected ? "4px solid #0a7ea4" : "4px solid transparent",
                    transition: "all 0.2s",
                    ":hover": {
                      background: isSelected ? "#e3f2fd" : "#f8f9fa"
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#333" }}>
                      {c.customer_name}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", whiteSpace: "nowrap" }}>
                      {lastMessageTime}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                    <div style={{ 
                      overflow: "hidden", 
                      textOverflow: "ellipsis", 
                      whiteSpace: "nowrap",
                      maxWidth: "180px"
                    }}>
                      {c.last_message || "No messages yet"}
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>
                      {lastMessageDate}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, display: "flex", gap: 8 }}>
                    <span>ID: {c.customer_id}</span>
                    <span>•</span>
                    <span>Convo: {c.conversation_id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div style={{ padding: 12, borderTop: "1px solid #eee", background: "#f8f9fa", fontSize: 12, color: "#666" }}>
          💬 Real-time chat enabled
        </div>
      </div>

      {/* Right: chat */}
      <div
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          minHeight: "75vh",
          background: "#fff"
        }}
      >
        <div style={{ 
          padding: 12, 
          borderBottom: "1px solid #eee", 
          fontWeight: 800,
          background: "#f8f9fa",
          borderTopLeftRadius: 11,
          borderTopRightRadius: 11
        }}>
          {selected ? (
            <div>
              <div>Chat with {selected.customer_name}</div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#666", marginTop: 4 }}>
                {selected.customer_phone && `📱 ${selected.customer_phone}`}
                {selected.customer_email && ` • ✉️ ${selected.customer_email}`}
              </div>
            </div>
          ) : "Select a conversation"}
        </div>

        <div style={{ 
          flex: 1, 
          padding: 14, 
          overflowY: "auto",
          background: "linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center", 
              alignItems: "center",
              color: "#999"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
              <div>No messages yet</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>Start the conversation!</div>
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = String(m.sender_type || "").toLowerCase() !== "customer";
              const time = m.created_at ? formatTime(m.created_at) : "";
              
              return (
                <div
                  key={m.message_id || m.body}
                  style={{
                    display: "flex",
                    justifyContent: isAdmin ? "flex-end" : "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      background: isAdmin ? "#d1f7d6" : "#ffffff",
                      padding: "10px 14px",
                      borderRadius: 14,
                      fontSize: 14,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      border: isAdmin ? "none" : "1px solid #e9ecef"
                    }}
                  >
                    <div style={{ color: isAdmin ? "#155724" : "#212529" }}>{m.body}</div>
                    <div style={{ 
                      fontSize: 11, 
                      color: isAdmin ? "#0f5132" : "#6c757d", 
                      marginTop: 6, 
                      textAlign: "right",
                      opacity: 0.8
                    }}>
                      {time}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ 
          display: "flex", 
          gap: 10, 
          padding: 12, 
          borderTop: "1px solid #eee",
          background: "#f8f9fa",
          borderBottomLeftRadius: 11,
          borderBottomRightRadius: 11
        }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={selected ? "Type a message..." : "Select a conversation to chat"}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
              fontSize: 14,
              background: selected ? "#fff" : "#f1f1f1",
              cursor: selected ? "text" : "not-allowed"
            }}
            disabled={!selected}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={send}
            style={{
              padding: "0 24px",
              borderRadius: 10,
              border: "none",
              background: selected ? "#0a7ea4" : "#cccccc",
              color: "white",
              fontWeight: 700,
              cursor: selected ? "pointer" : "not-allowed",
              fontSize: 14,
              transition: "all 0.2s",
              ":hover": {
                background: selected ? "#086690" : "#cccccc"
              }
            }}
            disabled={!selected || !text.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
