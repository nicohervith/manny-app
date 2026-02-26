import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      if (user.role === "WORKER") {
        router.replace("/(tabs)/worker-feed");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [user, segments, isLoading]);

  const updateUser = async (newData: any) => {
    try {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      await SecureStore.setItemAsync("userData", JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Error updating user context", e);
    }
  };

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
