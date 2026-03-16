import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { io } from "socket.io-client";
import { API_URL } from "../../src/constants/Config";
import { useAuth } from "../../src/context/AuthContext";
import api from "../../src/services/api";

const socket = io(API_URL.replace("/api", ""), {
  transports: ["websocket"],
});

export default function ChatScreen() {
  const { jobId } = useLocalSearchParams();
  const router = useRouter();
  const [otherPartyName, setOtherPartyName] = useState("");
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [job, setJob] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markAsRead = async () => {
    if (!jobId || !userId) return;
    try {
      await api.patch(`/api/chat/read-all/${jobId}/${userId}`);
    } catch (e) {
      console.error("Error marking as read", e);
    }
  };
  useEffect(() => {
    if (userId && jobId) {
      markAsRead();
    }
  }, [userId, messages]);

  useEffect(() => {
    setupChat();

    socket.on("new-message", (message) => {
      if (message.senderId === userId) return;
      setMessages((prev) => {
        const exists = prev.find((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
      setIsOtherTyping(false);
    });

    socket.on("user-typing", ({ userName: remoteUserName }) => {
      setTypingUser(remoteUserName);
      setIsOtherTyping(true);
    });

    socket.on("user-stop-typing", () => {
      setIsOtherTyping(false);
    });

    return () => {
      socket.off("new-message");
      socket.off("user-typing");
      socket.off("user-stop-typing");
      socket.emit("leave-chat", jobId);
    };
  }, [jobId]);

  const setupChat = async () => {
    try {
      if (user) {
        setUserId(user.id);
        setUserName(user.name);
      }

      const res = await api.get(`/api/chat/${jobId}`);
      const jobData = res.data.job;
      const messages = res.data.messages;

      setMessages(messages || []);
      setJob(jobData);

      if (user && jobData) {
        const isClient = jobData.clientId === user.id;
        setOtherPartyName(
          isClient ? jobData.worker?.name : jobData.client?.name,
        );
      }

      socket.emit("join-chat", jobId);
      setLoading(false);
    } catch (e) {
      console.error("Error setting up chat:", e);
      setLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    socket.emit("typing", { jobId, userName });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", jobId);
    }, 2000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const temporaryId = Date.now();
    const content = newMessage.trim();

    const localMessage = {
      id: temporaryId,
      content: content,
      senderId: userId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, localMessage]);
    setNewMessage("");

    try {
      await api.post(`/api/chat/send`, {
        jobId,
        senderId: userId,
        content: content,
      });

      socket.emit("stop-typing", jobId);
    } catch (e) {
      console.error("Error sending message:", e);
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.select({ ios: 0, android: 80 })}
    >
      {/* Header Personalizado (Opcional si usas Stack) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherPartyName || "Chat"}</Text>
        <View style={{ width: 24 }} />
      </View>

      {job?.status === "COMPLETED" && (
        <View style={styles.completedBanner}>
          <Ionicons
            name="information-circle"
            size={16}
            color="#92400E"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.completedBannerText}>
            Trabajo completado. Este chat se cerrará en 24 horas.
          </Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        style={{ flex: 1 }} // Esto es clave
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 20 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const isMine = item.senderId === userId;
          return (
            <View
              style={[
                styles.messageWrapper,
                isMine ? styles.myWrapper : styles.otherWrapper,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.myBubble : styles.otherBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isMine ? styles.myText : styles.otherText,
                  ]}
                >
                  {item.content}
                </Text>
              </View>
              <Text style={styles.timeText}>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        }}
      />

      {/* Indicador de escritura */}
      <View style={styles.typingArea}>
        {isOtherTyping && (
          <Text style={styles.typingText}>
            {typingUser} está escribiendo...
          </Text>
        )}
      </View>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChangeText={handleInputChange}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  messageWrapper: { marginBottom: 10, marginHorizontal: 15 },
  myWrapper: { alignItems: "flex-end" },
  otherWrapper: { alignItems: "flex-start" },
  bubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: "80%",
  },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 2 },
  messageText: { fontSize: 16 },
  myText: { color: "#fff" },
  otherText: { color: "#333" },
  timeText: {
    fontSize: 10,
    color: "#8E8E93",
    marginTop: 4,
    marginHorizontal: 5,
  },
  typingArea: { height: 20, marginHorizontal: 20, marginBottom: 5 },
  typingText: { fontSize: 12, color: "#8E8E93", fontStyle: "italic" },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: { backgroundColor: "#B0D4FF" },
  completedBanner: {
    backgroundColor: "#FFFBEB",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FEF3C7",
  },
  completedBannerText: {
    color: "#92400E",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
