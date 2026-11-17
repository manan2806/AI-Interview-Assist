
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    ReactNode,
} from "react";

import * as SecureStore from "expo-secure-store";

import {
    loginUser,
    logoutUser,
    User,
    LoginData,
} from "../services/authService";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (loginData: LoginData) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // RESTORE LOGIN SESSION
    const restoreSession = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync("access_token");
            const savedUser = await SecureStore.getItemAsync("user_data");

            if (token && savedUser) {
                setUser(JSON.parse(savedUser) as User);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Session restore error:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    // LOGIN
    const login = async (loginData: LoginData) => {
        const response = await loginUser(loginData);

        if (response.success && response.token && response.user) {
            await SecureStore.setItemAsync(
                "user_data",
                JSON.stringify(response.user)
            );

            setUser(response.user);
        }

        return response;
    };

    // LOGOUT
    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            await SecureStore.deleteItemAsync("user_data");
            await SecureStore.deleteItemAsync("access_token");
            setUser(null);
        }
    };

    const value = useMemo(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
        }),
        [user, isLoading]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// CUSTOM AUTH HOOK
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used inside AuthProvider"
        );
    }

    return context;
};
