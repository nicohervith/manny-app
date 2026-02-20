import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ImageLightboxProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export const ImageLightbox = ({
  visible,
  imageUrl,
  onClose,
}: ImageLightboxProps) => {
  if (!imageUrl) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={35} color="#fff" />
        </TouchableOpacity>

        <Image
          source={{ uri: imageUrl }}
          style={styles.fullImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 25,
    zIndex: 10,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
});
