import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    getSettings,
    updateSettings,
} from "../services/api";

import { changePassword, deleteAccount } from "../services/authService";

function Settings() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("account");

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

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
    // HANDLE CHANGE PASSWORD
    // ==========================================
    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("All password fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError(
                "New password must be different from current password."
            );
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError(
                "New password must be at least 6 characters."
            );
            return;
        }

        try {
            setPasswordLoading(true);

            const data = await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            console.log("Change Password Response:", data);

            if (data?.success === true) {
                setPasswordSuccess(
                    data.message || "Password changed successfully."
                );

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");

                setTimeout(() => {
                    setShowChangePassword(false);
                    setPasswordSuccess("");
                }, 1500);

                return;
            }

            setPasswordError(
                data?.message || "Unable to change password."
            );

        } catch (error) {
            console.error(
                "Change Password Error:",
                error.response?.data || error
            );

            setPasswordError(
                error.response?.data?.message ||
                error.message ||
                "Unable to change password."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    // ==========================================
    // HANDLE DELETE ACCOUNT
    // ==========================================
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Please enter your current password.");
            return;
        }

        if (!deleteConfirmed) {
            setDeleteError("Please confirm that you understand this action.");
            return;
        }

        try {
            setDeleteLoading(true);
            setDeleteError("");

            const response = await deleteAccount(deletePassword);

            if (!response?.success) {
                setDeleteError(response?.message || "Unable to delete your account.");
                return;
            }

            // Clear authentication data
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Clear interview-related local storage
            Object.keys(localStorage).forEach((key) => {
                if (
                    key.startsWith("interview_") ||
                    key.startsWith("interview_deadline_")
                ) {
                    localStorage.removeItem(key);
                }
            });

            // Redirect to login
            navigate("/login");

        } catch (error) {
            console.error("Delete Account Error:", error);
            setDeleteError(error?.response?.data?.message || "Unable to delete your account.");
        } finally {
            setDeleteLoading(false);
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

                    <div className="settings-header-actions">
                        <button
                            type="button"
                            className="settings-save-button"
                            onClick={handleSaveSettings}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            className="result-back-btn"
                            onClick={() => navigate("/dashboard")}
                        >
                            Dashboard
                        </button>
                    </div>
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
                        {activeSection === "appearance" && (<div className="settings-section"> <div className="settings-section-header">
                            <span className="settings-section-badge">
                                🎨 Appearance
                            </span>

                            <h2>Appearance</h2>
                            <p>Customize how Interview Assist looks on your device.</p>
                        </div>

                            <div className="theme-selection">
                                {[
                                    {
                                        value: "Light",
                                        icon: "☀️",
                                        description: "Clean and bright",
                                        previewClass: "light-preview",
                                    },
                                    {
                                        value: "Dark",
                                        icon: "🌙",
                                        description: "Easy on the eyes",
                                        previewClass: "dark-preview",
                                    },
                                    {
                                        value: "System",
                                        icon: "💻",
                                        description: "Follow device settings",
                                        previewClass: "system-preview",
                                    },
                                ].map((theme) => (
                                    <button
                                        key={theme.value}
                                        type="button"
                                        className={`theme-card ${settings.theme === theme.value
                                            ? "selected"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            handleSettingChange("theme", theme.value)
                                        }
                                    >
                                        <div
                                            className={`theme-preview ${theme.previewClass}`}
                                        >
                                            {theme.icon}
                                        </div>

                                        <div className="theme-info">
                                            <h3>{theme.value}</h3>
                                            <p>{theme.description}</p>
                                        </div>

                                        {settings.theme === theme.value && (
                                            <span className="theme-check">✓</span>
                                        )}
                                    </button>
                                ))}
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
                                        className="change-password-open-button"
                                        onClick={() => {
                                            setPasswordError("");
                                            setPasswordSuccess("");
                                            setCurrentPassword("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setShowChangePassword(true);
                                        }}
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
                                        onClick={() => {
                                            setDeletePassword("");
                                            setDeleteConfirmed(false);
                                            setShowDeleteAccount(true);
                                        }}
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* ==========================================
                CHANGE PASSWORD MODAL
            ========================================== */}
            {showChangePassword && (
                <div className="change-password-overlay">
                    <div className="change-password-modal">
                        {/* HEADER */}
                        <div className="change-password-header">

                            <div>
                                <span className="change-password-label">
                                    Account Security
                                </span>

                                <h2>
                                    Change Password
                                </h2>

                                <p>
                                    Update your account password securely.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="change-password-close"
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setPasswordError("");
                                    setPasswordSuccess("");
                                }}
                            >
                                ×
                            </button>

                        </div>

                        {/* FORM */}
                        <form
                            className="change-password-form"
                            onSubmit={handleChangePassword}
                        >

                            {/* ERROR */}
                            {passwordError && (
                                <div className="change-password-error">
                                    {passwordError}
                                </div>
                            )}

                            {/* SUCCESS */}
                            {passwordSuccess && (
                                <div className="change-password-success">
                                    {passwordSuccess}
                                </div>
                            )}

                            {/* CURRENT PASSWORD */}
                            <div className="change-password-group">
                                <label>
                                    Current Password
                                </label>

                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) =>
                                        setCurrentPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>

                            {/* NEW PASSWORD */}
                            <div className="change-password-group">

                                <label>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>

                            {/* CONFIRM PASSWORD */}
                            <div className="change-password-group">
                                <label>
                                    Confirm New Password
                                </label>

                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="change-password-actions">
                                <button
                                    type="button"
                                    className="change-password-cancel"
                                    onClick={() => {
                                        setShowChangePassword(false);
                                        setPasswordError("");
                                        setPasswordSuccess("");
                                    }}
                                    disabled={passwordLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="change-password-submit"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading
                                        ? "Changing..."
                                        : "Change Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ==========================================
                DELETE ACCOUNT MODEL
            ========================================== */}
            {showDeleteAccount && (
                <div
                    className="delete-account-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteAccount(false);
                            setDeletePassword("");
                            setDeleteConfirmed(false);
                        }
                    }}
                >
                    <div className="delete-account-modal">
                        <div className="delete-account-header">
                            <div>
                                <span className="delete-account-label">
                                    Account Security
                                </span>
                                <h2>Delete Account</h2>
                                <p>
                                    This action will permanently delete your
                                    account and all associated interview data.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="delete-account-close"
                                onClick={() => {
                                    setShowDeleteAccount(false);
                                    setDeletePassword("");
                                    setDeleteConfirmed(false);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="delete-account-warning">
                            <span className="delete-account-warning-icon">
                                ⚠
                            </span>
                            <div>
                                <strong>This action cannot be undone.</strong>
                                <p>
                                    Your profile, interview history, results,
                                    and related data will be permanently removed.
                                </p>
                            </div>
                        </div>

                        {deleteError && (
                            <div className="delete-account-error" role="alert">
                                ⚠ {deleteError}
                            </div>
                        )}

                        <div className="delete-account-group">
                            <label htmlFor="delete-account-password">
                                Current Password
                            </label>
                            <input
                                id="delete-account-password"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => {
                                    setDeletePassword(e.target.value);
                                    setDeleteError("");
                                }}
                                placeholder="Enter your current password"
                                autoComplete="current-password"
                            />
                        </div>

                        <label className="delete-account-confirm">
                            <input
                                type="checkbox"
                                checked={deleteConfirmed}
                                onChange={(e) => {
                                    setDeleteConfirmed(e.target.checked);
                                    setDeleteError("");
                                }}
                            />
                            <span>
                                I understand that my account and interview data
                                will be permanently deleted.
                            </span>
                        </label>

                        <div className="delete-account-actions">
                            <button
                                type="button"
                                className="delete-account-cancel"
                                onClick={() => {
                                    setShowDeleteAccount(false);
                                    setDeletePassword("");
                                    setDeleteConfirmed(false);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="delete-account-confirm-button"
                                onClick={handleDeleteAccount}
                                disabled={
                                    !deletePassword ||
                                    !deleteConfirmed ||
                                    deleteLoading
                                }
                            >
                                {deleteLoading
                                    ? "Deleting Account..."
                                    : "Delete My Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;
