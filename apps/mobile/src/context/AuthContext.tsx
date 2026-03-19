import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: any;
  token: string | null;
  setUser: (user: any) => void;
  setToken: (token: string, user: any) => Promise<void>;
  updateUser: (newData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");

        if (storedToken && storedUser) {
          setTokenState(storedToken);
          setUser(JSON.parse(storedUser));
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

  const setToken = async (newToken: string, newUser: any) => {
    try {
      await SecureStore.setItemAsync("userToken", newToken);
      await SecureStore.setItemAsync("userData", JSON.stringify(newUser));
      setTokenState(newToken);
      setUser(newUser);
    } catch (e) {
      console.error("Error saving auth data", e);
    }
  };

  const updateUser = async (newData: any) => {
    try {
      setUser((prevUser: any) => {
        if (!prevUser) return null;
        const updated = { ...prevUser, ...newData };
        SecureStore.setItemAsync("userData", JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Error updating user context", e);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, setUser, setToken, updateUser, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
