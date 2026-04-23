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
import { useTheme } from "../context/ThemeContext";

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
  const { colors } = useTheme();
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
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Enviar Propuesta
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            {jobTitle}
          </Text>

          {jobDescription && (
            <View
              style={[
                styles.descriptionBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.descriptionTitle,
                  { color: colors.textSecondary },
                ]}
              >
                Descripción del trabajo:
              </Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {jobDescription}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>
            Tu Precio ($)
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            placeholderTextColor={colors.textLight}
            placeholder="Ej: 5000"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />

          <Text style={[styles.label, { color: colors.text }]}>
            ¿Cuándo podés asistir?
          </Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={[
                styles.timePicker,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowFromPicker(true)}
            >
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.timeText, { color: colors.text }]}>
                {formData.availableFrom || "Desde"}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.timeSeparator, { color: colors.textLight }]}>
              →
            </Text>

            <TouchableOpacity
              style={[
                styles.timePicker,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setShowToPicker(true)}
            >
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={[styles.timeText, { color: colors.text }]}>
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

          <Text style={[styles.label, { color: colors.text }]}>
            Mensaje al cliente
          </Text>
          <TextInput
            style={[
              styles.modalInput,
              {
                height: 80,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholderTextColor={colors.textLight}
            placeholder="Cuéntale por qué eres el indicado..."
            multiline
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={onClose}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
                Cancelar
              </Text>
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
  modalContent: {
    borderRadius: 24,
    padding: 25,
    borderWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  descriptionBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#007AFF",
    borderWidth: 1,
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 10, marginBottom: 8 },
  cancelButton: {
    padding: 15,
    marginRight: 10,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  timePicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  timeText: { color: "#333", fontSize: 14 },
  timeSeparator: { color: "#999", fontSize: 18 },
});
