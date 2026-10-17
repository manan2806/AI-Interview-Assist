import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api, { getSettings } from "../services/api";

const ThemeContext = createContext(null);

const getUserRole = () => {
    const storedRole = localStorage.getItem("role");

    if (storedRole) {
        return storedRole.toLowerCase();
    }

    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        return (user.role || "user").toLowerCase();
    } catch {
        return "user";
    }
};

const isAdmin = () => getUserRole() === "admin";

const getSavedLocalTheme = () => {
    const key = isAdmin() ? "admin_app_theme" : "app_theme";
    const savedTheme = localStorage.getItem(key);

    if (
        isAdmin() &&
        !["Light", "Dark"].includes(savedTheme)
    ) {
        return "Light";
    }

    return ["Light", "Dark", "System"].includes(savedTheme)
        ? savedTheme
        : "Light";
};

const getAppliedTheme = (selectedTheme) => {
    if (selectedTheme === "System") {
        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "Dark"
            : "Light";
    }

    return selectedTheme;
};

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(getSavedLocalTheme);

    const [systemDark, setSystemDark] = useState(false);

    // Load the saved theme from the correct backend settings endpoint.
    useEffect(() => {
        let active = true;

        const loadTheme = async () => {
            if (!localStorage.getItem("token")) {
                return;
            }

            try {
                let data;

                if (isAdmin()) {
                    const response = await api.get(
                        "/api/admin/settings"
                    );

                    data = response.data;
                } else {
                    data = await getSettings();
                }

                const allowedThemes = isAdmin()
                    ? ["Light", "Dark"]
                    : ["Light", "Dark", "System"];

                const savedTheme = data?.settings?.theme;

                if (
                    active &&
                    data?.success &&
                    allowedThemes.includes(savedTheme)
                ) {
                    setThemeState(savedTheme);

                    const storageKey = isAdmin()
                        ? "admin_app_theme"
                        : "app_theme";

                    localStorage.setItem(storageKey, savedTheme);
                }
            } catch (error) {
                console.error(
                    "Unable to load saved theme:",
                    error
                );
            }
        };

        loadTheme();

        return () => {
            active = false;
        };
    }, []);

    // Track the device appearance preference.
    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

        const updateSystemTheme = () => {
            setSystemDark(mediaQuery.matches);
        };

        updateSystemTheme();

        mediaQuery.addEventListener(
            "change",
            updateSystemTheme
        );

        return () => {
            mediaQuery.removeEventListener(
                "change",
                updateSystemTheme
            );
        };
    }, []);

    const appliedTheme = getAppliedTheme(theme);

    // Apply the selected theme globally.
    useEffect(() => {
        document.documentElement.setAttribute(
            "data-theme",
            appliedTheme.toLowerCase()
        );

        document.documentElement.style.colorScheme =
            appliedTheme.toLowerCase();
    }, [appliedTheme, systemDark]);

    // Persist a theme only when the caller explicitly applies it.
    const setTheme = useCallback((newTheme) => {
        const admin = isAdmin();

        const allowedThemes = admin
            ? ["Light", "Dark"]
            : ["Light", "Dark", "System"];

        if (!allowedThemes.includes(newTheme)) {
            return;
        }

        setThemeState(newTheme);

        const storageKey = admin
            ? "admin_app_theme"
            : "app_theme";

        localStorage.setItem(storageKey, newTheme);
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
