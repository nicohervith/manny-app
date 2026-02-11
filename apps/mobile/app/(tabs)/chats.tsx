import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../src/constants/Config";

export default function ChatListScreen() {
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  const fetchChats = async () => {
    const userData = await SecureStore.getItemAsync("userData");
    if (!userData) return;
    const user = JSON.parse(userData);
    setUserId(user.id);

    try {
      const res = await axios.get(`${API_URL}/api/chat/list/${user.id}`);
      setChats(res.data);
    } catch (e) {
      console.error("Error fetching chats:", e);
    }
  };

  // Reemplaza tu useEffect por este useFocusEffect
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Conversaciones</Text>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const unreadCount = item._count.messages;
          const otherParty =
            item.clientId === userId ? item.worker : item.client;
          const lastMsg = item.messages[0];

          return (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() =>
                router.push({
                  pathname: "/chat/[jobId]",
                  params: { jobId: item.id },
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{otherParty.name[0]}</Text>
              </View>

              <View style={styles.chatInfo}>
                <Text style={styles.jobTitle}>{item.title}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {lastMsg ? lastMsg.content : "No hay mensajes aún"}
                </Text>
              </View>

              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  chatInfo: { flex: 1, marginLeft: 15 },
  jobTitle: { fontSize: 16, fontWeight: "bold" },
  lastMessage: { color: "#888", fontSize: 14 },
  unreadBadge: {
    backgroundColor: "#FF3B30",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
});
