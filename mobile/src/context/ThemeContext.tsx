
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

type ThemeName = "Light" | "Dark";

type ThemeColors = {
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
    primary: string;
    input: string;
    header: string;
    danger: string;
};

const lightColors: ThemeColors = {
    background: "#F8FAFF",
    card: "#FFFFFF",
    text: "#1E293B",
    muted: "#64748B",
    border: "#E2E8F0",
    primary: "#6257D9",
    input: "#FFFFFF",
    header: "#EEF2FF",
    danger: "#DC2626",
};

const darkColors: ThemeColors = {
    background: "#111827",
    card: "#1F2937",
    text: "#F9FAFB",
    muted: "#9CA3AF",
    border: "#374151",
    primary: "#8B80FF",
    input: "#273449",
    header: "#273449",
    danger: "#F87171",
};

type ThemeContextType = {
    theme: ThemeName;
    colors: ThemeColors;
    setTheme: (theme: ThemeName) => Promise<void>;
    loadSavedTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
    undefined
);

export const ThemeProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [theme, setThemeState] = useState<ThemeName>("Light");

    const colors = theme === "Dark" ? darkColors : lightColors;

    const setTheme = async (newTheme: ThemeName) => {
        setThemeState(newTheme);

        await SecureStore.setItemAsync("app_theme", newTheme);
    };

    const loadSavedTheme = async () => {
        try {
            const savedTheme = await SecureStore.getItemAsync("app_theme");

            if (savedTheme === "Dark" || savedTheme === "Light") {
                setThemeState(savedTheme);
            }
        } catch (error) {
            console.log("Theme loading error:", error);
        }
    };

    useEffect(() => {
        loadSavedTheme();
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                colors,
                setTheme,
                loadSavedTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider"
        );
    }

    return context;
};
