import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  updateUser: (newData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // 1. Cargar datos al iniciar
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const authDataSerialized = await SecureStore.getItemAsync("userData");
        if (authDataSerialized) {
          setUser(JSON.parse(authDataSerialized));
        }
      } catch (e) {
        console.error("Error loading auth data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadStorageData();
  }, []);

  // 2. Lógica de protección de rutas (Redirección automática)
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // No logueado -> Ir a login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // Ya logueado e intenta entrar a login -> Ir a la App
      // Redirigir según el rol si fuera necesario
      router.replace("/(tabs)/worker-feed");
    }
  }, [user, segments, isLoading]);

  // 3. Función para actualizar datos (como el Avatar)
  const updateUser = async (newData: any) => {
    try {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      await SecureStore.setItemAsync("userData", JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Error updating user context", e);
    }
  };

  // 4. Función de Logout
  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, updateUser, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
