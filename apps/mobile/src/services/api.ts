import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/Config";

const api = axios.create({
  baseURL: API_URL,
});

// INTERCEPTOR: Antes de cada petición, busca el token y lo inyecta
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
