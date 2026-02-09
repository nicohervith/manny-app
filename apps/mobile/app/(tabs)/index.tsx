import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const data = await SecureStore.getItemAsync("userData");
      if (data) setUser(JSON.parse(data));
    };
    loadUser();
  }, []);

  if (!user) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {user.nombre}!</Text>
      <View style={styles.card}>
        <Text style={styles.roleTag}>{user.role}</Text>
        {user.role === "WORKER" ? (
          <Text style={styles.info}>
            You are ready to receive job requests.
          </Text>
        ) : (
          <Text style={styles.info}>
            Find the best professionals for your needs.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    elevation: 4,
  },
  roleTag: { color: "#007AFF", fontWeight: "bold", marginBottom: 5 },
  info: { fontSize: 16, color: "#444" },
});
