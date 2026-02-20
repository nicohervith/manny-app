import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CongratsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extraemos datos que envía Mercado Pago en la URL de retorno
  const { status, payment_id, external_reference } = params;

  // Evitamos que el usuario vuelva atrás a la pantalla de pago con el botón físico
  useEffect(() => {
    const backAction = () => {
      router.replace("/(tabs)" as any);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const isSuccess = status === "approved" || status === "success";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View
          style={[
            styles.iconContainer,
            isSuccess ? styles.successBg : styles.pendingBg,
          ]}
        >
          <Ionicons
            name={isSuccess ? "checkmark-circle" : "time"}
            size={80}
            color="white"
          />
        </View>

        <Text style={styles.title}>
          {isSuccess ? "¡Pago Confirmado!" : "Pago en proceso"}
        </Text>

        <Text style={styles.subtitle}>
          {isSuccess
            ? "El dinero ha sido enviado correctamente al trabajador."
            : "Mercado Pago está procesando la transacción. Te avisaremos en breve."}
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>ID de Pago:</Text>
            <Text style={styles.detailValue}>#{payment_id || "N/A"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trabajo:</Text>
            <Text style={styles.detailValue}>
              #{external_reference || "N/A"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)" as any)}
        >
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successBg: { backgroundColor: "#34C759" },
  pendingBg: { backgroundColor: "#FFCC00" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  detailsContainer: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 20,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#8E8E93",
    fontSize: 14,
  },
  detailValue: {
    color: "#1C1C1E",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
