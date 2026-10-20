import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import { useTheme } from "../../context/ThemeContext.jsx";
import "../../context/Admin/AdminSettings.css";

function AdminSettings() {
    const navigate = useNavigate();
    const { setTheme } = useTheme();

    const [activeSection, setActiveSection] = useState("appearance");

    const [settings, setSettings] = useState({
        theme: "Light",
        email_notifications: true,
        evaluation_alerts: true,
        system_alerts: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

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

    const menuItems = [
        {
            id: "appearance",
            icon: "🎨",
            title: "Appearance",
            subtitle: "Theme & display",
        },
        {
            id: "notifications",
            icon: "🔔",
            title: "Notifications",
            subtitle: "Alert preferences",
        },
        {
            id: "security",
            icon: "🔒",
            title: "Account Security",
            subtitle: "Password & account",
        },
    ];

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                setErrorMessage("");

                const response = await api.get("/api/admin/settings");

                if (response.data?.success && response.data?.settings) {
                    const saved = response.data.settings;

                    const nextSettings = {
                        theme: ["Light", "Dark"].includes(saved.theme)
                            ? saved.theme
                            : "Light",
                        email_notifications:
                            saved.email_notifications ?? true,
                        evaluation_alerts: saved.evaluation_alerts ?? true,
                        system_alerts: saved.system_alerts ?? true,
                    };

                    setSettings(nextSettings);
                }
            } catch (error) {
                setErrorMessage(
                    error.response?.data?.message ||
                    "Unable to load admin settings."
                );
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [setTheme]);

    const handleSettingChange = (field, value) => {
        setSettings((previous) => ({
            ...previous,
            [field]: value,
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSuccessMessage("");
            setErrorMessage("");

            const response = await api.put(
                "/api/admin/settings",
                settings
            );

            if (!response.data?.success) {
                setErrorMessage(
                    response.data?.message || "Unable to save settings."
                );
                return;
            }

            const savedSettings = response.data.settings || settings;

            setSettings((previous) => ({
                ...previous,
                ...savedSettings,
            }));

            // Apply the theme only after a successful save.
            if (["Light", "Dark"].includes(savedSettings.theme)) {
                setTheme(savedSettings.theme);
            }

            setSuccessMessage("Admin settings saved successfully.");
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to save settings. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();

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

        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError(
                "New password must differ from the current password."
            );
            return;
        }

        try {
            setPasswordLoading(true);

            const response = await api.put(
                "/api/admin/change-password",
                {
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }
            );

            if (response.data?.success) {
                setPasswordSuccess(
                    response.data.message || "Password changed successfully."
                );

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");

                window.setTimeout(() => {
                    setShowChangePassword(false);
                    setPasswordSuccess("");
                }, 1500);
            } else {
                setPasswordError(
                    response.data?.message || "Unable to change password."
                );
            }
        } catch (error) {
            setPasswordError(
                error.response?.data?.message ||
                "Unable to change password. Please try again."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError("");

        if (!deletePassword) {
            setDeleteError("Please enter your current password.");
            return;
        }

        if (!deleteConfirmed) {
            setDeleteError(
                "Please confirm that you understand this action."
            );
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to permanently delete your admin account? This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleteLoading(true);

            const response = await api.delete(
                "/api/admin/delete-account",
                {
                    data: {
                        current_password: deletePassword,
                        confirm_delete: deleteConfirmed,
                    },
                }
            );

            if (!response.data?.success) {
                setDeleteError(
                    response.data?.message ||
                    "Unable to delete your account."
                );
                return;
            }

            // Clear authentication data after successful deletion.
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");

            // Clear locally stored interview session data.
            Object.keys(localStorage).forEach((key) => {
                if (
                    key.startsWith("interview_") ||
                    key.startsWith("interview_deadline_")
                ) {
                    localStorage.removeItem(key);
                }
            });

            navigate("/login", { replace: true });
        } catch (error) {
            setDeleteError(
                error.response?.data?.message ||
                "Unable to delete account. Please try again."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-settings-page">
                <div className="admin-settings-container">
                    <div className="admin-settings-loading">
                        <span>⚙️</span>
                        <h2>Loading Settings...</h2>
                        <p>Please wait while your preferences load.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-settings-page">
            <div className="admin-settings-container">
                <header className="admin-settings-header">
                    <div>
                        <span className="admin-settings-label">
                            ADMIN PREFERENCES
                        </span>
                        <h1>Settings</h1>
                        <p>Manage your admin preferences and account security.</p>
                    </div>

                    <div className="admin-settings-header-actions">
                        <button
                            type="button"
                            className="admin-settings-save"
                            onClick={handleSaveSettings}
                            disabled={saving || loading}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>

                        <button
                            type="button"
                            className="admin-settings-back"
                            onClick={() => navigate("/admin-dashboard")}
                        >
                            Dashboard
                        </button>
                    </div>
                </header>

                {successMessage && (
                    <div className="admin-settings-message success" role="status">
                        ✓ {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="admin-settings-message error" role="alert">
                        ⚠ {errorMessage}
                    </div>
                )}

                <div className="admin-settings-main-card">
                    <aside className="admin-settings-sidebar">
                        <div className="admin-settings-sidebar-title">
                            <span>⚙️</span>
                            <div>
                                <h3>Settings</h3>
                                <p>Manage preferences</p>
                            </div>
                        </div>

                        <div className="admin-settings-menu">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={
                                        activeSection === item.id
                                            ? "admin-settings-menu-item active"
                                            : "admin-settings-menu-item"
                                    }
                                    onClick={() => {
                                        setActiveSection(item.id);
                                        setSuccessMessage("");
                                        setErrorMessage("");
                                    }}
                                >
                                    <span className="admin-settings-menu-icon">
                                        {item.icon}
                                    </span>
                                    <span className="admin-settings-menu-text">
                                        <strong>{item.title}</strong>
                                        <small>{item.subtitle}</small>
                                    </span>
                                    <span className="admin-settings-menu-arrow">
                                        →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <main className="admin-settings-content">
                        {activeSection === "appearance" && (
                            <section>
                                <div className="admin-settings-section-header">
                                    <span className="admin-settings-section-badge">
                                        🎨 Appearance
                                    </span>
                                    <h2>Appearance Settings</h2>
                                    <p>Choose how your admin dashboard looks.</p>
                                </div>

                                <div className="admin-settings-theme-grid">
                                    {[
                                        {
                                            value: "Light",
                                            icon: "☀️",
                                            description: "Clean and bright",
                                        },
                                        {
                                            value: "Dark",
                                            icon: "🌙",
                                            description: "Comfortable in low light",
                                        },
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            className={
                                                settings.theme === item.value
                                                    ? "admin-settings-theme-card selected"
                                                    : "admin-settings-theme-card"
                                            }
                                            onClick={() =>
                                                handleSettingChange(
                                                    "theme",
                                                    item.value
                                                )
                                            }
                                        >
                                            <span className="admin-settings-theme-icon">
                                                {item.icon}
                                            </span>
                                            <span>
                                                <strong>{item.value} Mode</strong>
                                                <small>{item.description}</small>
                                            </span>
                                            {settings.theme === item.value && (
                                                <span className="admin-settings-check">
                                                    ✓
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <p className="admin-settings-note">
                                    Select your preferred theme and click Save Changes to apply it.
                                </p>
                            </section>
                        )}

                        {activeSection === "notifications" && (
                            <section>
                                <div className="admin-settings-section-header">
                                    <span className="admin-settings-section-badge">
                                        🔔 Notifications
                                    </span>
                                    <h2>Notification Preferences</h2>
                                    <p>Choose which notification preferences to enable.</p>
                                </div>

                                {[
                                    {
                                        key: "email_notifications",
                                        icon: "✉️",
                                        title: "Email Notifications",
                                        description: "General account and activity updates.",
                                    },
                                    {
                                        key: "evaluation_alerts",
                                        icon: "📊",
                                        title: "Evaluation Alerts",
                                        description: "Alerts related to interview evaluations.",
                                    },
                                    {
                                        key: "system_alerts",
                                        icon: "🛡️",
                                        title: "System Alerts",
                                        description: "Important application and system alerts.",
                                    },
                                ].map((item) => (
                                    <div
                                        className="admin-settings-toggle-row"
                                        key={item.key}
                                    >
                                        <span className="admin-settings-toggle-icon">
                                            {item.icon}
                                        </span>
                                        <div className="admin-settings-toggle-info">
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                        <label className="admin-settings-switch">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(settings[item.key])}
                                                onChange={(event) =>
                                                    handleSettingChange(
                                                        item.key,
                                                        event.target.checked
                                                    )
                                                }
                                            />
                                            <span />
                                        </label>
                                    </div>
                                ))}
                            </section>
                        )}

                        {activeSection === "security" && (
                            <section>
                                <div className="admin-settings-section-header">
                                    <span className="admin-settings-section-badge">
                                        🔒 Account Security
                                    </span>
                                    <h2>Account Security</h2>
                                    <p>Protect your administrator account.</p>
                                </div>

                                <div className="admin-settings-security-card">
                                    <div className="admin-settings-security-icon">
                                        🔐
                                    </div>
                                    <div className="admin-settings-security-info">
                                        <h3>Change Password</h3>
                                        <p>
                                            Update your password to help keep your
                                            administrator account secure.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-settings-outline-button"
                                        onClick={() => {
                                            setPasswordError("");
                                            setPasswordSuccess("");
                                            setShowChangePassword(true);
                                        }}
                                    >
                                        Change Password
                                    </button>
                                </div>

                                <div className="admin-settings-danger-card">
                                    <div>
                                        <h3>Delete Admin Account</h3>
                                        <p>
                                            Permanently delete this administrator
                                            account. This action cannot be undone.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-settings-delete-button"
                                        onClick={() => {
                                            setDeletePassword("");
                                            setDeleteConfirmed(false);
                                            setDeleteError("");
                                            setShowDeleteAccount(true);
                                        }}
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>

            {showChangePassword && (
                <div className="admin-settings-modal-overlay">
                    <div
                        className="admin-settings-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-change-password-title"
                    >
                        <div className="admin-settings-modal-header">
                            <div>
                                <span>ACCOUNT SECURITY</span>
                                <h2 id="admin-change-password-title">
                                    Change Password
                                </h2>
                                <p>Enter your current password and choose a new one.</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setShowChangePassword(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form
                            className="admin-settings-password-form"
                            onSubmit={handleChangePassword}
                        >
                            {passwordError && (
                                <div className="admin-settings-message error">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="admin-settings-message success">
                                    {passwordSuccess}
                                </div>
                            )}

                            <label>
                                Current Password
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(event) =>
                                        setCurrentPassword(event.target.value)
                                    }
                                    placeholder="Enter your current password"
                                    autoComplete="current-password"
                                    required
                                />
                            </label>

                            <label>
                                New Password
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    placeholder="Enter your new password"
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </label>

                            <label>
                                Confirm New Password
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    placeholder="Re-enter your new password"
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                            </label>

                            <div className="admin-settings-modal-actions">
                                <button
                                    type="button"
                                    className="admin-settings-cancel"
                                    onClick={() => setShowChangePassword(false)}
                                    disabled={passwordLoading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-settings-save"
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "Changing..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteAccount && (
                <div className="admin-settings-modal-overlay">
                    <div
                        className="admin-settings-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-delete-account-title"
                    >
                        <div className="admin-settings-modal-header">
                            <div>
                                <span>CRITICAL ACTION</span>
                                <h2 id="admin-delete-account-title">
                                    Delete Admin Account
                                </h2>
                                <p>This action cannot be undone.</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={() => setShowDeleteAccount(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-settings-delete-warning">
                            Your administrator account will be permanently deleted.
                            You will be logged out and will need a new admin account
                            to access the administration panel again.
                        </div>

                        {deleteError && (
                            <div className="admin-settings-message error">
                                {deleteError}
                            </div>
                        )}

                        <label className="admin-settings-delete-password">
                            Current Password
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(event) => {
                                    setDeletePassword(event.target.value);
                                    setDeleteError("");
                                }}
                                placeholder="Enter your current password"
                                autoComplete="current-password"
                                required
                            />
                        </label>

                        <label className="admin-settings-delete-confirm">
                            <input
                                type="checkbox"
                                checked={deleteConfirmed}
                                onChange={(event) =>
                                    setDeleteConfirmed(event.target.checked)
                                }
                            />
                            <span>
                                I understand this action is permanent.
                            </span>
                        </label>

                        <div className="admin-settings-modal-actions">
                            <button
                                type="button"
                                className="admin-settings-cancel"
                                onClick={() => setShowDeleteAccount(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="admin-settings-delete-button"
                                onClick={handleDeleteAccount}
                                disabled={
                                    deleteLoading ||
                                    !deletePassword ||
                                    !deleteConfirmed
                                }
                            >
                                {deleteLoading ? "Deleting..." : "Permanently Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminSettings;
