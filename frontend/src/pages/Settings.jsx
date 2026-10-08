import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    getSettings,
    updateSettings,
} from "../services/api";

function Settings() {
    const [activeSection, setActiveSection] = useState("account");

    // ==========================================
    // SETTINGS STATE
    // ==========================================

    const [settings, setSettings] = useState({
        interview_type: "Technical",
        difficulty: "Medium",
        number_of_questions: 10,
        theme: "Light",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ==========================================
    // MENU ITEMS
    // ==========================================

    const menuItems = [
        {
            id: "account",
            icon: "👤",
            title: "Account",
            subtitle: "Profile & personal info",
        },
        {
            id: "interview",
            icon: "🎯",
            title: "Interview",
            subtitle: "Interview defaults",
        },
        {
            id: "appearance",
            icon: "🎨",
            title: "Appearance",
            subtitle: "Theme & display",
        },
        {
            id: "security",
            icon: "🔒",
            title: "Account Security",
            subtitle: "Password & account",
        },
    ];

    // ==========================================
    // LOAD SETTINGS
    // ==========================================

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setErrorMessage("");

                const data = await getSettings();

                if (data?.success && data?.settings) {
                    setSettings({
                        interview_type:
                            data.settings.interview_type || "Technical",
                        difficulty:
                            data.settings.difficulty || "Medium",
                        number_of_questions:
                            Number(data.settings.number_of_questions) || 10,
                        theme:
                            data.settings.theme || "Light",
                    });
                }
            } catch (error) {
                console.error("Load Settings Error:", error);

                const message =
                    error?.response?.data?.message ||
                    "Unable to load settings.";

                setErrorMessage(message);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    // ==========================================
    // HANDLE SETTINGS CHANGE
    // ==========================================

    const handleSettingChange = (field, value) => {
        setSettings((previousSettings) => ({
            ...previousSettings,
            [field]:
                field === "number_of_questions"
                    ? Number(value)
                    : value,
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    // ==========================================
    // HANDLE SAVE
    // ==========================================

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSuccessMessage("");
            setErrorMessage("");

            const data = await updateSettings(settings);

            if (!data?.success) {
                setErrorMessage(
                    data?.message ||
                    "Unable to save settings."
                );
                return;
            }

            if (data?.settings) {
                setSettings({
                    interview_type:
                        data.settings.interview_type || "Technical",
                    difficulty:
                        data.settings.difficulty || "Medium",
                    number_of_questions:
                        Number(data.settings.number_of_questions) || 10,
                    theme:
                        data.settings.theme || "Light",
                });
            }

            setSuccessMessage("Settings saved successfully.");
        } catch (error) {
            console.error("Save Settings Error:", error);

            const message =
                error?.response?.data?.message ||
                "Unable to save settings. Please try again.";

            setErrorMessage(message);
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-container">
                    <div className="settings-loading-card">
                        <div className="settings-loading-spinner">
                            <span>⚙️</span>
                        </div>
                        <h2>Loading Settings...</h2>
                        <p>Please wait while we load your preferences.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="settings-header">
                    <div>
                        <span className="settings-label">
                            Preferences
                        </span>

                        <h1>Settings</h1>

                        <p>
                            Customize your Interview Assist experience.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="settings-save-button"
                        onClick={handleSaveSettings}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {/* ==========================================
                    SUCCESS / ERROR MESSAGE
                ========================================== */}

                {successMessage && (
                    <div className="settings-success-message">
                        ✓ {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="settings-error-message">
                        ⚠ {errorMessage}
                    </div>
                )}

                {/* ==========================================
                    SINGLE SETTINGS CARD
                ========================================== */}

                <div className="settings-main-card">
                    {/* ==========================================
                        SIDEBAR
                    ========================================== */}

                    <aside className="settings-sidebar">
                        <div className="settings-sidebar-title">
                            <span className="settings-sidebar-icon">
                                ⚙️
                            </span>

                            <div>
                                <h3>Settings</h3>
                                <p>Manage preferences</p>
                            </div>
                        </div>

                        <div className="settings-menu-list">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        activeSection === item.id
                                            ? "settings-menu active"
                                            : "settings-menu"
                                    }
                                    onClick={() =>
                                        setActiveSection(item.id)
                                    }
                                >
                                    <span className="settings-menu-icon">
                                        {item.icon}
                                    </span>

                                    <span className="settings-menu-text">
                                        <strong>{item.title}</strong>
                                        <small>{item.subtitle}</small>
                                    </span>

                                    <span className="settings-menu-arrow">
                                        →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* ==========================================
                        MAIN CONTENT
                    ========================================== */}

                    <main className="settings-content">
                        {/* ==========================================
                            ACCOUNT
                        ========================================== */}

                        {activeSection === "account" && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <span className="settings-section-badge">
                                        👤 Account
                                    </span>

                                    <h2>Account Settings</h2>

                                    <p>
                                        Manage your personal account
                                        information and profile details.
                                    </p>
                                </div>

                                <div className="settings-cards">
                                    <div className="settings-option-card">
                                        <div className="settings-option-icon purple">
                                            👤
                                        </div>

                                        <div className="settings-option-info">
                                            <h3>
                                                Profile Information
                                            </h3>

                                            <p>
                                                Update your name, skills,
                                                target role and other profile
                                                details.
                                            </p>
                                        </div>

                                        <Link
                                            to="/profile"
                                            className="settings-option-button"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            INTERVIEW
                        ========================================== */}

                        {activeSection === "interview" && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <span className="settings-section-badge">
                                        🎯 Interview
                                    </span>

                                    <h2>Interview Preferences</h2>

                                    <p>
                                        Customize your default interview
                                        experience.
                                    </p>
                                </div>

                                <div className="settings-preference-grid">
                                    {/* TYPE */}

                                    <div className="settings-preference-card">
                                        <div className="preference-card-icon purple">
                                            🎯
                                        </div>

                                        <h3>
                                            Default Interview Type
                                        </h3>

                                        <p>
                                            Choose your preferred interview
                                            type.
                                        </p>

                                        <select
                                            value={settings.interview_type}
                                            onChange={(event) =>
                                                handleSettingChange(
                                                    "interview_type",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Technical">
                                                Technical
                                            </option>

                                            <option value="HR">
                                                HR
                                            </option>

                                            <option value="Mixed">
                                                Mixed
                                            </option>
                                        </select>
                                    </div>

                                    {/* DIFFICULTY */}

                                    <div className="settings-preference-card">
                                        <div className="preference-card-icon orange">
                                            ⚡
                                        </div>

                                        <h3>Default Difficulty</h3>

                                        <p>
                                            Set the difficulty for new
                                            interviews.
                                        </p>

                                        <select
                                            value={settings.difficulty}
                                            onChange={(event) =>
                                                handleSettingChange(
                                                    "difficulty",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="Easy">
                                                Easy
                                            </option>

                                            <option value="Medium">
                                                Medium
                                            </option>

                                            <option value="Hard">
                                                Hard
                                            </option>
                                        </select>
                                    </div>

                                    {/* QUESTIONS */}

                                    <div className="settings-preference-card">
                                        <div className="preference-card-icon green">
                                            📝
                                        </div>

                                        <h3>
                                            Questions per Interview
                                        </h3>

                                        <p>
                                            Choose the default number of
                                            questions.
                                        </p>

                                        <select
                                            value={
                                                settings.number_of_questions
                                            }
                                            onChange={(event) =>
                                                handleSettingChange(
                                                    "number_of_questions",
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value={5}>
                                                5 Questions
                                            </option>

                                            <option value={10}>
                                                10 Questions
                                            </option>

                                            <option value={15}>
                                                15 Questions
                                            </option>

                                            <option value={20}>
                                                20 Questions
                                            </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            APPEARANCE
                        ========================================== */}

                        {activeSection === "appearance" && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <span className="settings-section-badge">
                                        🎨 Appearance
                                    </span>

                                    <h2>Appearance</h2>

                                    <p>
                                        Customize how Interview Assist
                                        looks on your device.
                                    </p>
                                </div>

                                <div className="theme-selection">
                                    {/* LIGHT */}

                                    <button
                                        type="button"
                                        className={
                                            settings.theme === "Light"
                                                ? "theme-card selected"
                                                : "theme-card"
                                        }
                                        onClick={() =>
                                            handleSettingChange(
                                                "theme",
                                                "Light"
                                            )
                                        }
                                    >
                                        <div className="theme-preview light-preview">
                                            ☀️
                                        </div>

                                        <div className="theme-info">
                                            <h3>Light</h3>
                                            <p>Clean and bright</p>
                                        </div>

                                        {settings.theme === "Light" && (
                                            <span className="theme-check">
                                                ✓
                                            </span>
                                        )}
                                    </button>

                                    {/* DARK */}

                                    <button
                                        type="button"
                                        className={
                                            settings.theme === "Dark"
                                                ? "theme-card selected"
                                                : "theme-card"
                                        }
                                        onClick={() =>
                                            handleSettingChange(
                                                "theme",
                                                "Dark"
                                            )
                                        }
                                    >
                                        <div className="theme-preview dark-preview">
                                            🌙
                                        </div>

                                        <div className="theme-info">
                                            <h3>Dark</h3>
                                            <p>Easy on the eyes</p>
                                        </div>

                                        {settings.theme === "Dark" && (
                                            <span className="theme-check">
                                                ✓
                                            </span>
                                        )}
                                    </button>

                                    {/* SYSTEM */}

                                    <button
                                        type="button"
                                        className={
                                            settings.theme === "System"
                                                ? "theme-card selected"
                                                : "theme-card"
                                        }
                                        onClick={() =>
                                            handleSettingChange(
                                                "theme",
                                                "System"
                                            )
                                        }
                                    >
                                        <div className="theme-preview system-preview">
                                            💻
                                        </div>

                                        <div className="theme-info">
                                            <h3>System</h3>
                                            <p>
                                                Follow device settings
                                            </p>
                                        </div>

                                        {settings.theme === "System" && (
                                            <span className="theme-check">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ==========================================
                            SECURITY
                        ========================================== */}

                        {activeSection === "security" && (
                            <div className="settings-section">
                                <div className="settings-section-header">
                                    <span className="settings-section-badge">
                                        🔒 Security
                                    </span>

                                    <h2>Account Security</h2>

                                    <p>
                                        Manage your password and account
                                        security.
                                    </p>
                                </div>

                                {/* PASSWORD */}

                                <div className="settings-security-card">
                                    <div className="settings-option-icon blue">
                                        🔐
                                    </div>

                                    <div className="settings-option-info">
                                        <h3>Account Password</h3>

                                        <p>
                                            Update your password regularly
                                            to keep your account protected.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="settings-option-button"
                                    >
                                        Change Password
                                    </button>
                                </div>

                                {/* DELETE ACCOUNT */}

                                <div className="settings-danger-card">
                                    <div>
                                        <h3>Delete Account</h3>

                                        <p>
                                            Permanently delete your account
                                            and associated interview data.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="settings-danger-button"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default Settings;
