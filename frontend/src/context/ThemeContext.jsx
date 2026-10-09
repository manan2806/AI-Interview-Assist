import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { getSettings } from "../services/api";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem("app_theme") || "Light";
    });

    const [systemDark, setSystemDark] = useState(false);

    // Load saved theme from backend
    useEffect(() => {
        let active = true;

        const loadTheme = async () => {
            try {
                const data = await getSettings();

                if (
                    active &&
                    data?.success &&
                    ["Light", "Dark", "System"].includes(
                        data.settings?.theme
                    )
                ) {
                    setThemeState(data.settings.theme);
                    localStorage.setItem(
                        "app_theme",
                        data.settings.theme
                    );
                }
            } catch (error) {
                // Keep the locally saved theme if loading fails.
                console.error("Unable to load saved theme:", error);
            }
        };

        if (localStorage.getItem("token")) {
            loadTheme();
        }

        return () => {
            active = false;
        };
    }, []);

    // Track device appearance preference
    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

        const updateSystemTheme = () => {
            setSystemDark(mediaQuery.matches);
        };

        updateSystemTheme();

        mediaQuery.addEventListener("change", updateSystemTheme);

        return () => {
            mediaQuery.removeEventListener(
                "change",
                updateSystemTheme
            );
        };
    }, []);

    // Apply theme globally
    const appliedTheme =
        theme === "System"
            ? systemDark
                ? "Dark"
                : "Light"
            : theme;

    useEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            appliedTheme.toLowerCase()
        );

        document.documentElement.style.colorScheme =
            appliedTheme.toLowerCase();
    }, [appliedTheme]);

    // Update theme immediately
    const setTheme = useCallback((newTheme) => {
        if (!["Light", "Dark", "System"].includes(newTheme)) {
            return;
        }

        setThemeState(newTheme);

        localStorage.setItem("app_theme", newTheme);
    }, []);

    return (
        <ThemeContext.Provider
            value={{
                theme,
                appliedTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );

}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            "useTheme must be used inside ThemeProvider."
        );
    }

    return context;

}
