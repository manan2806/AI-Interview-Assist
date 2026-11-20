import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ==========================================
// API BASE URL
// ==========================================
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.warn("EXPO_PUBLIC_API_URL is not configured!");
}

// ==========================================
// AXIOS INSTANCE
// ==========================================
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// ==========================================
// REQUEST INTERCEPTOR - JWT TOKEN
// ==========================================
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync("access_token");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Token retrieval error:", error);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(
            "API Error:",
            error.response?.data || error.message
        );

        return Promise.reject(error);
    }
);

// ==========================================
// GET SETTINGS
// ==========================================
export const getSettings = async () => {
    const response = await api.get("/api/settings");
    return response.data;
};

// ==========================================
// UPDATE SETTINGS
// ==========================================
export const updateSettings = async (settings: {
    interview_type: string;
    difficulty: string;
    number_of_questions: number;
    theme: string;
}) => {
    const response = await api.put("/api/settings", settings);
    return response.data;
};

export default api;
