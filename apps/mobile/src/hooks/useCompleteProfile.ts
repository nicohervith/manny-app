import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export type ProfileImages = {
  dniFront: string | null;
  dniBack: string | null;
  selfie: string | null;
};

export type ProfileForm = {
  occupation: string;
  dni: string;
  description: string;
  hourlyRate: string;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const DEFAULT_REGION: MapRegion = {
  latitude: -34.6037,
  longitude: -58.3816,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function useCompleteProfile() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [address, setAddress] = useState("Ubicación no establecida");
  const [manualAddress, setManualAddress] = useState("");
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);

  const [form, setForm] = useState<ProfileForm>({
    occupation: "",
    dni: "",
    description: "",
    hourlyRate: "",
    latitude: null,
    longitude: null,
    tags: [],
  });

  const [images, setImages] = useState<ProfileImages>({
    dniFront: null,
    dniBack: null,
    selfie: null,
  });

  const profileCompletion = useMemo(() => {
    const checks = [
      !!form.occupation,
      !!form.dni,
      !!form.description,
      !!form.hourlyRate,
      !!form.latitude,
      form.tags.length > 0,
      !!images.dniFront,
      !!images.dniBack,
      !!images.selfie,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [form, images]);

  const saveDraft = useCallback(async () => {
    if (!user?.id) return;
    try {
      await api.post("/api/worker/save-draft", {
        userId: user.id,
        occupation: form.occupation,
        description: form.description,
        hourlyRate: form.hourlyRate,
        latitude: form.latitude,
        longitude: form.longitude,
        tags: JSON.stringify(form.tags),
      });
    } catch (e) {
      console.error("Error guardando borrador:", e);
    }
  }, [form, user]);

  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  const loadExistingProfile = async () => {
    try {
      const userDataRaw = await SecureStore.getItemAsync("userData");
      const user = userDataRaw ? JSON.parse(userDataRaw) : null;
      if (!user) return;

      setUserEmail(user.email);
      setIsEmailVerified(user.emailVerified || false);

      const res = await api.get(`/api/worker/profile/${user.id}`);
      if (!res.data) return;

      const p = res.data;
      setIsEditing(true);
      setForm({
        occupation: p.occupation || "",
        dni: p.dni || "",
        description: p.description || "",
        hourlyRate: p.hourlyRate ? p.hourlyRate.toString() : "",
        latitude: p.latitude,
        longitude: p.longitude,
        tags: p.tags ? p.tags.map((t: any) => t.name) : [],
      });
      setImages({
        dniFront: p.dniFront || null,
        dniBack: p.dniBack || null,
        selfie: p.selfie || null,
      });
      if (p.latitude && p.longitude) {
        setRegion((prev) => ({
          ...prev,
          latitude: p.latitude,
          longitude: p.longitude,
        }));
        setAddress("Ubicación guardada anteriormente");
      }
    } catch {
      setIsEditing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExistingProfile();
    }, []),
  );

  const updateLocationState = useCallback(async (lat: number, lng: number) => {
    setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    setRegion((prev) => ({ ...prev, latitude: lat, longitude: lng }));
    try {
      const geo = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (geo.length > 0) {
        const item = geo[0];
        setAddress(
          `${item.street || "Calle"} ${item.name || ""}, ${item.city || ""}`,
        );
      }
    } catch {
      setAddress("Dirección personalizada");
    }
  }, []);

  const getLocation = async () => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Ve a ajustes para permitir la ubicación.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await updateLocationState(
        location.coords.latitude,
        location.coords.longitude,
      );
    } catch (error: any) {
      Alert.alert("Error de GPS", `Código: ${error.code} - ${error.message}`);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateLocationState(latitude, longitude);
  };

  const searchManualAddress = async () => {
    if (!manualAddress.trim()) return;
    setLoadingLocation(true);
    try {
      const result = await Location.geocodeAsync(manualAddress);
      if (result.length > 0) {
        await updateLocationState(result[0].latitude, result[0].longitude);
      } else {
        Alert.alert("No encontrado", "No pudimos hallar esa dirección.");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al buscar la dirección.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const toggleTag = (tagName: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const pickImage = async (key: keyof ProfileImages) => {
    Alert.alert("Seleccionar imagen", "¿Cómo querés agregar la foto?", [
      {
        text: "Cámara",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso necesario", "Necesitamos acceso a tu cámara.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.5,
          });
          if (!result.canceled) {
            setImages((prev) => ({ ...prev, [key]: result.assets[0].uri }));
          }
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
          });
          if (!result.canceled) {
            setImages((prev) => ({ ...prev, [key]: result.assets[0].uri }));
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handlePressVerify = async () => {
    try {
      await api.post("/api/users/send-code");
      router.push("/verify-email" as any);
    } catch {
      Alert.alert("Error", "No pudimos enviar el código.");
    }
  };

  const saveProfile = async () => {
    if (!form.latitude || !form.hourlyRate || !form.dni) {
      Alert.alert("Error", "Completa los campos obligatorios y ubicación.");
      return;
    }
    if (!isEditing && (!images.dniFront || !images.dniBack || !images.selfie)) {
      Alert.alert("Validación", "Sube las 3 fotos de identidad.");
      return;
    }
    setLoading(true);
    try {
      const userDataRaw = await SecureStore.getItemAsync("userData");
      const userData = userDataRaw ? JSON.parse(userDataRaw) : null;

      const formData = new FormData();
      formData.append("userId", userData.id.toString());
      formData.append("occupation", form.occupation);
      formData.append("dni", form.dni);
      formData.append("description", form.description);
      formData.append("hourlyRate", form.hourlyRate);
      formData.append("latitude", form.latitude!.toString());
      formData.append("longitude", form.longitude!.toString());
      formData.append("tags", JSON.stringify(form.tags));

      const appendIfLocal = (uri: string | null, fieldName: string) => {
        if (!uri || uri.startsWith("http")) return;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        formData.append(fieldName, {
          uri,
          name: filename || `photo_${fieldName}.jpg`,
          type: match ? `image/${match[1]}` : "image/jpeg",
        } as any);
      };

      appendIfLocal(images.dniFront, "dniFront");
      appendIfLocal(images.dniBack, "dniBack");
      appendIfLocal(images.selfie, "selfie");

      await api.post(`/api/worker/complete-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Éxito", "Perfil enviado a revisión.");
      router.replace("/(tabs)/worker-feed");
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      Alert.alert("Error", "Error de red o servidor no alcanzado.");
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    images,
    region,
    address,
    manualAddress,
    setManualAddress,
    loading,
    loadingLocation,
    isEditing,
    isEmailVerified,
    userEmail,
    toggleTag,
    pickImage,
    getLocation,
    handleMapPress,
    searchManualAddress,
    handlePressVerify,
    saveProfile,
    profileCompletion,
  };
}
