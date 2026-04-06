import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ApplyBidModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    price: string;
    message: string;
    availableFrom: string;
    availableTo: string;
  }) => void;
  jobTitle?: string;
  jobDescription?: string;
}

export default function ApplyBidModal({
  visible,
  onClose,
  onSubmit,
  jobTitle,
  jobDescription,
}: ApplyBidModalProps) {
  const [formData, setFormData] = useState({
    price: "",
    message: "",
    availableFrom: "",
    availableTo: "",
  });

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromTime, setFromTime] = useState(new Date());
  const [toTime, setToTime] = useState(new Date());

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = () => {
    if (!formData.price || !formData.availableFrom || !formData.availableTo) {
      Alert.alert("Atención", "Completá el precio y la franja horaria.");
      return;
    }
    onSubmit(formData);
    setFormData({ price: "", message: "", availableFrom: "", availableTo: "" });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enviar Propuesta</Text>
          <Text style={styles.modalSubtitle}>{jobTitle}</Text>

          {jobDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionTitle}>
                Descripción del trabajo:
              </Text>
              <Text style={styles.descriptionText}>{jobDescription}</Text>
            </View>
          )}

          <Text style={styles.label}>Tu Precio ($)</Text>
          <TextInput
            style={styles.modalInput}
            placeholderTextColor="#999"
            placeholder="Ej: 5000"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />

          <Text style={styles.label}>¿Cuándo podés asistir?</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={styles.timePicker}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="time-outline" size={16} color="#007AFF" />
              <Text style={styles.timeText}>
                {formData.availableFrom || "Desde"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.timeSeparator}>→</Text>

            <TouchableOpacity
              style={styles.timePicker}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="time-outline" size={16} color="#007AFF" />
              <Text style={styles.timeText}>
                {formData.availableTo || "Hasta"}
              </Text>
            </TouchableOpacity>
          </View>

          {showFromPicker && (
            <DateTimePicker
              value={fromTime}
              mode="time"
              is24Hour={true}
              onChange={(event, date) => {
                setShowFromPicker(false);
                if (date) {
                  setFromTime(date);
                  setFormData({ ...formData, availableFrom: formatTime(date) });
                }
              }}
            />
          )}

          {showToPicker && (
            <DateTimePicker
              value={toTime}
              mode="time"
              is24Hour={true}
              onChange={(event, date) => {
                setShowToPicker(false);
                if (date) {
                  setToTime(date);
                  setFormData({ ...formData, availableTo: formatTime(date) });
                }
              }}
            />
          )}

          <Text style={styles.label}>Mensaje al cliente</Text>
          <TextInput
            style={[styles.modalInput, { height: 80 }]}
            placeholderTextColor="#999"
            placeholder="Cuéntale por qué eres el indicado..."
            multiline
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={{ color: "#666" }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSend}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>
                Enviar Oferta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  descriptionBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  modalSubtitle: { color: "#007AFF", marginBottom: 20 },
  modalInput: {
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 10, marginBottom: 8 },
  cancelButton: { padding: 15, marginRight: 10 },
  confirmButton: { backgroundColor: "#007AFF", padding: 15, borderRadius: 10 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F2F5",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  timeText: { color: "#333", fontSize: 14 },
  timeSeparator: { color: "#999", fontSize: 18 },
});
