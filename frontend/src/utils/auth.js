// ==========================================
// CHECK LOGIN
// ==========================================

export const isLoggedIn = () => {
    const token = localStorage.getItem("token");

    return !!token;
};


// ==========================================
// GET TOKEN
// ==========================================

export const getToken = () => {
    return localStorage.getItem("token");
};


// ==========================================
// GET USER
// ==========================================

export const getUser = () => {
    const user = localStorage.getItem("user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        return null;
    }
};


// ==========================================
// LOGOUT
// ==========================================

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};