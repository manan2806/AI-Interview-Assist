
import api from "./api";
import * as SecureStore from "expo-secure-store";

// ==========================================
// TYPES
// ==========================================

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: "user" | "admin";
}

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    user_id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    skills?: string[];
    target_role?: string;
    experience_level?: string;
}

interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    user: User;
}

// ==========================================
// REGISTER
// ==========================================

export const registerUser = async (userData: RegisterData) => {
    const response = await api.post("/api/register", userData);
    return response.data;
};

// ==========================================
// LOGIN
// ==========================================

export const loginUser = async (loginData: LoginData) => {
    const response = await api.post<LoginResponse>(
        "/api/login",
        loginData
    );

    const data = response.data;

    if (data.success && data.token) {
        await SecureStore.setItemAsync(
            "access_token",
            data.token
        );
    }

    return data;
};

// ==========================================
// LOGOUT
// ==========================================

export const logoutUser = async () => {
    try {
        const response = await api.post("/api/logout");
        return response.data;
    } finally {
        await SecureStore.deleteItemAsync("access_token");
    }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (email: string) => {
    const response = await api.post("/api/forgot-password", {
        email,
    });

    return response.data;
};

// ==========================================
// VERIFY OTP
// ==========================================

export const verifyOTP = async (
    email: string,
    otp: string
) => {
    const response = await api.post("/api/verify-otp", {
        email,
        otp,
    });

    return response.data;
};

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (
    email: string,
    resetToken: string,
    newPassword: string
) => {
    const response = await api.post("/api/reset-password", {
        email,
        reset_token: resetToken,
        new_password: newPassword,
    });

    return response.data;
};

// ==========================================
// CHANGE PASSWORD
// ==========================================

export const changePassword = async (passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
}) => {
    const response = await api.put(
        "/api/change-password",
        passwordData
    );

    return response.data;
};

// ==========================================
// DELETE ACCOUNT
// ==========================================

export const deleteAccount = async (
    currentPassword: string
) => {
    const response = await api.delete("/api/delete-account", {
        data: {
            current_password: currentPassword,
        },
    });

    return response.data;
};
