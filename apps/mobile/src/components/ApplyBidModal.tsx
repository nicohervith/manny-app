import React, { useState } from "react";
import {
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
  onSubmit: (data: { price: string; message: string; tiempo: string }) => void;
  jobTitle?: string;
}

export default function ApplyBidModal({
  visible,
  onClose,
  onSubmit,
  jobTitle,
}: ApplyBidModalProps) {
  const [formData, setFormData] = useState({
    price: "",
    message: "",
    tiempo: "",
  });

  const handleSend = () => {
    onSubmit(formData);
    setFormData({ price: "", message: "", tiempo: "" }); // Reset
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enviar Propuesta</Text>
          <Text style={styles.modalSubtitle}>{jobTitle}</Text>

          <Text style={styles.label}>Tu Precio ($)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Ej: 5000"
            keyboardType="numeric"
            value={formData.price}
            onChangeText={(text) => setFormData({ ...formData, price: text })}
          />

          <Text style={styles.label}>Tiempo de llegada (min)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Ej: 30"
            keyboardType="numeric"
            value={formData.tiempo}
            onChangeText={(text) => setFormData({ ...formData, tiempo: text })}
          />

          <Text style={styles.label}>Mensaje al cliente</Text>
          <TextInput
            style={[styles.modalInput, { height: 80 }]}
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
  modalSubtitle: { color: "#007AFF", marginBottom: 20 },
  modalInput: { backgroundColor: "#F0F2F5", borderRadius: 10, padding: 12 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 25,
  },
  label: { fontSize: 14, fontWeight: "bold", marginTop: 10, marginBottom: 5 },

  cancelButton: { padding: 15, marginRight: 10 },
  confirmButton: { backgroundColor: "#007AFF", padding: 15, borderRadius: 10 },
});
