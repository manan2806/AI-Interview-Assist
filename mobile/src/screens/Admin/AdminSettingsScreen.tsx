
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

type Section = "appearance" | "notifications" | "security";

interface Props {
    navigation: any;
}

interface AdminSettingsData {
    theme: string;
    email_notifications: boolean;
    evaluation_alerts: boolean;
    system_alerts: boolean;
}

function AdminSettingsScreen({ navigation }: Props) {
    const { colors, theme, setTheme } = useTheme();
    const { logout } = useAuth();

    const isDark = theme === "Dark";

    const [activeSection, setActiveSection] =
        useState<Section>("appearance");

    const [settings, setSettings] = useState<AdminSettingsData>({
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

    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const response = await api.get("/api/admin/settings");

            if (response.data?.success && response.data?.settings) {
                const saved = response.data.settings;

                setSettings({
                    theme: ["Light", "Dark"].includes(saved.theme)
                        ? saved.theme
                        : theme,
                    email_notifications:
                        saved.email_notifications ?? true,
                    evaluation_alerts:
                        saved.evaluation_alerts ?? true,
                    system_alerts:
                        saved.system_alerts ?? true,
                });
            }
        } catch (error: any) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to load admin settings."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (
        field: keyof AdminSettingsData,
        value: string | boolean
    ) => {
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
                    response.data?.message ||
                    "Unable to save settings."
                );
                return;
            }

            const savedSettings = response.data.settings || settings;

            setSettings((previous) => ({
                ...previous,
                ...savedSettings,
            }));

            if (["Light", "Dark"].includes(savedSettings.theme)) {
                setTheme(savedSettings.theme);
            }

            setSuccessMessage("Admin settings saved successfully.");
        } catch (error: any) {
            setErrorMessage(
                error.response?.data?.message ||
                "Unable to save settings. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Required", "All password fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert(
                "Password Mismatch",
                "New password and confirm password do not match."
            );
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert(
                "Invalid Password",
                "Password must be at least 6 characters."
            );
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert(
                "Invalid Password",
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
                setShowChangePassword(false);

                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");

                Alert.alert(
                    "Success",
                    response.data.message ||
                    "Password changed successfully."
                );
            } else {
                Alert.alert(
                    "Error",
                    response.data?.message ||
                    "Unable to change password."
                );
            }
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.message ||
                "Unable to change password. Please try again."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        if (!deletePassword) {
            Alert.alert("Required", "Please enter your current password.");
            return;
        }

        if (!deleteConfirmed) {
            Alert.alert(
                "Confirmation Required",
                "Please confirm that you understand this action."
            );
            return;
        }

        Alert.alert(
            "Delete Admin Account",
            "Are you sure you want to permanently delete your admin account? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: confirmDeleteAccount,
                },
            ]
        );
    };

    const confirmDeleteAccount = async () => {
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
                Alert.alert(
                    "Error",
                    response.data?.message ||
                    "Unable to delete your account."
                );
                return;
            }

            setShowDeleteAccount(false);

            Alert.alert(
                "Account Deleted",
                "Your administrator account has been deleted.",
                [
                    {
                        text: "OK",
                        onPress: async () => {
                            await logout();
                        },
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.response?.data?.message ||
                "Unable to delete account. Please try again."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const renderSectionButton = (
        section: Section,
        icon: string,
        title: string,
        subtitle: string
    ) => (
        <TouchableOpacity
            key={section}
            activeOpacity={0.8}
            onPress={() => {
                setActiveSection(section);
                setSuccessMessage("");
                setErrorMessage("");
            }}
            style={[
                styles.menuItem,
                {
                    backgroundColor:
                        activeSection === section
                            ? colors.header
                            : colors.card,
                    borderColor:
                        activeSection === section
                            ? colors.primary
                            : colors.border,
                },
            ]}
        >
            <Text style={styles.menuIcon}>{icon}</Text>

            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.muted }]}>
                    {subtitle}
                </Text>
            </View>

            <Text style={{ color: colors.primary, fontSize: 20 }}>
                →
            </Text>
        </TouchableOpacity>
    );

    const renderNotification = (
        key: keyof AdminSettingsData,
        icon: string,
        title: string,
        description: string
    ) => (
        <View
            key={key}
            style={[
                styles.notificationRow,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <Text style={styles.notificationIcon}>{icon}</Text>

            <View style={styles.notificationInfo}>
                <Text style={[styles.notificationTitle, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.description, { color: colors.muted }]}>
                    {description}
                </Text>
            </View>

            <Switch
                value={Boolean(settings[key])}
                onValueChange={(value) =>
                    handleSettingChange(key, value)
                }
                trackColor={{
                    false: colors.border,
                    true: colors.primary,
                }}
                thumbColor="#FFFFFF"
            />
        </View>
    );

    if (loading) {
        return (
            <View
                style={[
                    styles.loadingContainer,
                    { backgroundColor: colors.background },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading Settings...
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text style={styles.eyebrow}>
                        ADMIN PREFERENCES
                    </Text>

                    <Text style={[styles.heading, { color: colors.text }]}>
                        Settings
                    </Text>

                    <Text style={[styles.description, { color: colors.muted }]}>
                        Manage your admin preferences and account security.
                    </Text>

                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={[
                                styles.headerActionButton,
                                { backgroundColor: colors.primary },
                            ]}
                            onPress={handleSaveSettings}
                            disabled={saving}
                            activeOpacity={0.8}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    ✓ Save Changes
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.headerActionButton,
                                {
                                    backgroundColor: colors.header,
                                    borderColor: colors.border,
                                },
                            ]}
                            onPress={() => navigation.navigate("AdminDashboard")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.headerActionText,
                                    { color: colors.primary },
                                ]}
                            >
                                ← Dashboard
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {successMessage !== "" && (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>
                            ✓ {successMessage}
                        </Text>
                    </View>
                )}

                {errorMessage !== "" && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            ⚠ {errorMessage}
                        </Text>
                    </View>
                )}

                {/* Main Card */}
                <View
                    style={[
                        styles.mainCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text style={[styles.sidebarHeading, { color: colors.text }]}>
                        ⚙️ Settings
                    </Text>

                    {renderSectionButton(
                        "appearance",
                        "🎨",
                        "Appearance",
                        "Theme & display"
                    )}

                    {renderSectionButton(
                        "notifications",
                        "🔔",
                        "Notifications",
                        "Alert preferences"
                    )}

                    {renderSectionButton(
                        "security",
                        "🔒",
                        "Account Security",
                        "Password & account"
                    )}

                    <View
                        style={[
                            styles.sectionDivider,
                            { backgroundColor: colors.border },
                        ]}
                    />

                    {/* Appearance */}
                    {activeSection === "appearance" && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                🎨 Appearance Settings
                            </Text>

                            <Text style={[styles.description, { color: colors.muted }]}>
                                Choose how your admin dashboard looks.
                            </Text>

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
                                <TouchableOpacity
                                    key={item.value}
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        handleSettingChange("theme", item.value)
                                    }
                                    style={[
                                        styles.themeCard,
                                        {
                                            backgroundColor:
                                                settings.theme === item.value
                                                    ? colors.header
                                                    : colors.background,
                                            borderColor:
                                                settings.theme === item.value
                                                    ? colors.primary
                                                    : colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={styles.themeIcon}>
                                        {item.icon}
                                    </Text>

                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.themeTitle,
                                                { color: colors.text },
                                            ]}
                                        >
                                            {item.value} Mode
                                        </Text>
                                        <Text
                                            style={[
                                                styles.description,
                                                { color: colors.muted },
                                            ]}
                                        >
                                            {item.description}
                                        </Text>
                                    </View>

                                    {settings.theme === item.value && (
                                        <Text
                                            style={{
                                                color: colors.primary,
                                                fontSize: 22,
                                                fontWeight: "bold",
                                            }}
                                        >
                                            ✓
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}

                            <Text style={[styles.note, { color: colors.muted }]}>
                                Select your preferred theme and click Save Changes
                                to apply it.
                            </Text>
                        </View>
                    )}

                    {/* Notifications */}
                    {activeSection === "notifications" && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                🔔 Notification Preferences
                            </Text>

                            <Text style={[styles.description, { color: colors.muted }]}>
                                Choose which notification preferences to enable.
                            </Text>

                            {renderNotification(
                                "email_notifications",
                                "✉️",
                                "Email Notifications",
                                "General account and activity updates."
                            )}

                            {renderNotification(
                                "evaluation_alerts",
                                "📊",
                                "Evaluation Alerts",
                                "Alerts related to interview evaluations."
                            )}

                            {renderNotification(
                                "system_alerts",
                                "🛡️",
                                "System Alerts",
                                "Important application and system alerts."
                            )}
                        </View>
                    )}

                    {/* Security */}
                    {activeSection === "security" && (
                        <View>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                🔒 Account Security
                            </Text>

                            <Text style={[styles.description, { color: colors.muted }]}>
                                Protect your administrator account.
                            </Text>

                            <View
                                style={[
                                    styles.securityCard,
                                    {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <Text style={styles.securityIcon}>🔐</Text>

                                <Text style={[styles.securityTitle, { color: colors.text }]}>
                                    Change Password
                                </Text>

                                <Text style={[styles.description, { color: colors.muted }]}>
                                    Update your password to help keep your
                                    administrator account secure.
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.outlineButton,
                                        { borderColor: colors.primary },
                                    ]}
                                    onPress={() => setShowChangePassword(true)}
                                >
                                    <Text
                                        style={[
                                            styles.outlineButtonText,
                                            { color: colors.primary },
                                        ]}
                                    >
                                        Change Password
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View
                                style={[
                                    styles.dangerCard,
                                    {
                                        backgroundColor: colors.background,
                                        borderColor: colors.danger,
                                    },
                                ]}
                            >
                                <Text style={[styles.securityTitle, { color: colors.danger }]}>
                                    Delete Admin Account
                                </Text>

                                <Text style={[styles.description, { color: colors.muted }]}>
                                    Permanently delete this administrator account.
                                    This action cannot be undone.
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.deleteButton,
                                        { backgroundColor: colors.danger },
                                    ]}
                                    onPress={() => {
                                        setDeletePassword("");
                                        setDeleteConfirmed(false);
                                        setShowDeleteAccount(true);
                                    }}
                                >
                                    <Text style={styles.saveButtonText}>
                                        Delete Account
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showChangePassword}
                transparent
                animationType="fade"
                onRequestClose={() => setShowChangePassword(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Change Password
                        </Text>

                        <Text style={[styles.description, { color: colors.muted }]}>
                            Enter your current password and choose a new one.
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Current Password"
                            placeholderTextColor={colors.muted}
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="New Password"
                            placeholderTextColor={colors.muted}
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Confirm New Password"
                            placeholderTextColor={colors.muted}
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: colors.primary },
                            ]}
                            onPress={handleChangePassword}
                            disabled={passwordLoading}
                        >
                            {passwordLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    Update Password
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                { borderColor: colors.border },
                            ]}
                            onPress={() => setShowChangePassword(false)}
                            disabled={passwordLoading}
                        >
                            <Text style={{ color: colors.text, fontWeight: "600" }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                visible={showDeleteAccount}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteAccount(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <Text style={[styles.modalTitle, { color: colors.danger }]}>
                            Delete Admin Account
                        </Text>

                        <Text style={[styles.description, { color: colors.muted }]}>
                            Your administrator account will be permanently deleted.
                            This action cannot be undone.
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                    color: colors.text,
                                },
                            ]}
                            placeholder="Enter Current Password"
                            placeholderTextColor={colors.muted}
                            secureTextEntry
                            value={deletePassword}
                            onChangeText={setDeletePassword}
                        />

                        <TouchableOpacity
                            style={styles.confirmRow}
                            onPress={() => setDeleteConfirmed((previous) => !previous)}
                            activeOpacity={0.8}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: deleteConfirmed
                                            ? colors.primary
                                            : colors.input,
                                    },
                                ]}
                            >
                                {deleteConfirmed && (
                                    <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                                        ✓
                                    </Text>
                                )}
                            </View>

                            <Text style={[styles.description, { color: colors.text, flex: 1 }]}>
                                I understand this action is permanent.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.deleteButton,
                                { backgroundColor: colors.danger },
                            ]}
                            onPress={handleDeleteAccount}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    Permanently Delete Account
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                { borderColor: colors.border },
                            ]}
                            onPress={() => setShowDeleteAccount(false)}
                            disabled={deleteLoading}
                        >
                            <Text style={{ color: colors.text, fontWeight: "600" }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 35,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        fontWeight: "600",
    },
    header: {
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 15,
    },
    eyebrow: {
        color: "#8B5CF6",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    heading: {
        fontSize: 27,
        fontWeight: "800",
        marginTop: 8,
    },
    description: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 5,
    },
    headerActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },

    headerActionButton: {
        flex: 1,
        minHeight: 46,
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    headerActionText: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },
    dashboardButton: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    dashboardButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    saveButton: {
        minHeight: 48,
        paddingHorizontal: 18,
        paddingVertical: 13,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
        marginBottom: 6,
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        textAlign: "center",
    },
    successBox: {
        backgroundColor: "#DCFCE7",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    successText: {
        color: "#166534",
        fontSize: 13,
        fontWeight: "600",
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
        fontWeight: "600",
    },
    mainCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
    },
    sidebarHeading: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 12,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        padding: 13,
        marginBottom: 9,
    },
    menuIcon: {
        fontSize: 22,
        marginRight: 12,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: "700",
    },
    menuSubtitle: {
        fontSize: 11,
        marginTop: 3,
    },
    sectionDivider: {
        height: 1,
        marginVertical: 18,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
        marginBottom: 5,
    },
    themeCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderWidth: 1,
        borderRadius: 13,
        marginTop: 13,
    },
    themeIcon: {
        fontSize: 27,
        marginRight: 13,
    },
    themeTitle: {
        fontSize: 15,
        fontWeight: "700",
    },
    note: {
        fontSize: 12,
        lineHeight: 19,
        marginTop: 15,
    },
    notificationRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 13,
        padding: 12,
        marginTop: 13,
    },
    notificationIcon: {
        fontSize: 23,
        marginRight: 10,
    },
    notificationInfo: {
        flex: 1,
        paddingRight: 5,
    },
    notificationTitle: {
        fontSize: 13,
        fontWeight: "700",
    },
    securityCard: {
        padding: 16,
        borderRadius: 13,
        borderWidth: 1,
        marginTop: 17,
    },
    securityIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    securityTitle: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 5,
    },
    outlineButton: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
        marginTop: 15,
    },
    outlineButtonText: {
        fontSize: 13,
        fontWeight: "700",
    },
    dangerCard: {
        padding: 16,
        borderRadius: 13,
        borderWidth: 1,
        marginTop: 14,
    },
    deleteButton: {
        padding: 13,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 14,
        minHeight: 46,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 18,
    },
    modalCard: {
        width: "100%",
        maxWidth: 450,
        borderRadius: 18,
        padding: 20,
    },
    modalTitle: {
        fontSize: 21,
        fontWeight: "800",
        marginBottom: 5,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 13,
        marginTop: 13,
        fontSize: 14,
    },
    cancelButton: {
        minHeight: 45,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
    },
    confirmRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        gap: 10,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 1,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
    },
});

export default AdminSettingsScreen;
