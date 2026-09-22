import api from "./api";

// ==========================================
// REGISTER
// ==========================================

export const registerUser = async (userData) => {
    const response = await api.post("/api/register", userData);

    return response.data;
};

// ==========================================
// LOGIN
// ==========================================

export const loginUser = async (loginData) => {
    const response = await api.post("/api/login", loginData);

    return response.data;
};

// ==========================================
// GET PROFILE
// ==========================================

export const getProfile = async () => {
    const response = await api.get("/api/profile");

    return response.data;
};

// ==========================================
// UPDATE PROFILE
// ==========================================

export const updateProfile = async (profileData) => {
    const response = await api.put("/api/profile", profileData);

    return response.data;
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (email) => {

    const response = await api.post(
        "/api/forgot-password",
        {
            email: email
        }
    );

    return response.data;
};

// ==========================================
// VERIFY OTP
// ==========================================

export const verifyOTP = async (email, otp) => {

    const response = await api.post(
        "/api/verify-otp",
        {
            email: email,
            otp: otp
        }
    );

    return response.data;
};

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (email, resetToken, newPassword) => {

    const response = await api.post("/api/reset-password",
        {
            email: email,
            reset_token: resetToken,
            new_password: newPassword
        }
    );

    return response.data;
};