import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = error.config?.url || "";

        // Login aur registration ke errors par redirect mat karo
        const isPublicAuthRequest =
            requestUrl.includes("/api/login") ||
            requestUrl.includes("/api/register");

        if (error.response?.status === 401 && !isPublicAuthRequest) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);


export const getSettings = async () => {
    const response = await api.get("/api/settings");
    return response.data;
};

export const updateSettings = async (settings) => {
    const response = await api.put("/api/settings", settings);
    return response.data;
};

export default api;