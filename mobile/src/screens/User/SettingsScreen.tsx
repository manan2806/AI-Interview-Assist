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
import { useNavigation } from "@react-navigation/native";
import api, { getSettings, updateSettings } from "../../services/api";
import { changePassword, deleteAccount, logoutUser } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";

type Section = "account" | "interview" | "appearance" | "security";
type ThemeName = "Light" | "Dark";

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { setTheme } = useTheme();
    const [activeSection, setActiveSection] = useState<Section>("account");
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

    const [user, setUser] = useState<any>(null);

    // Change Password
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Delete Account
    const [showDeleteAccount, setShowDeleteAccount] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Theme application is intentionally deferred until Save Changes.
    const [appliedTheme, setAppliedTheme] = useState<ThemeName>("Light");

    const isDark = appliedTheme === "Dark";

    const colors = {
        background: isDark ? "#101426" : "#F4F6FF",
        card: isDark ? "#1B2340" : "#FFFFFF",
        text: isDark ? "#F4F5FF" : "#20264A",
        muted: isDark ? "#AAB3D0" : "#737B99",
        border: isDark ? "#303B60" : "#E7EAF5",
        input: isDark ? "#252F50" : "#F8F9FF",
    };

    useEffect(() => {
        loadSettings();
        loadProfile();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setErrorMessage("");

            const data = await getSettings();

            if (data?.success && data?.settings) {
                const savedTheme =
                    ["Light", "Dark"].includes(data.settings.theme)
                        ? data.settings.theme
                        : "Light";

                const loadedSettings = {
                    interview_type: data.settings.interview_type || "Technical",
                    difficulty: data.settings.difficulty || "Medium",
                    number_of_questions:
                        Number(data.settings.number_of_questions) || 10,
                    theme: savedTheme,
                };

                setSettings(loadedSettings);
                setAppliedTheme(savedTheme as ThemeName);
                await setTheme(savedTheme as ThemeName);
            }
        } catch (error: any) {
            setErrorMessage(
                error?.response?.data?.message ||
                "Unable to load settings."
            );
        } finally {
            setLoading(false);
        }
    };

    const loadProfile = async () => {
        try {
            const response = await api.get("/api/profile");

            if (response.data?.success) {
                setUser(response.data.user || response.data.profile || null);
            }
        } catch (error) {
            console.log("Profile loading error:", error);
        }
    };

    const handleSettingChange = (field: string, value: any) => {
        setSettings((previous) => ({
            ...previous,
            [field]:
                field === "number_of_questions"
                    ? Number(value)
                    : value,
        }));

        setSuccessMessage("");
        setErrorMessage("");
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSuccessMessage("");
            setErrorMessage("");

            const data = await updateSettings(settings);

            if (!data?.success) {
                setErrorMessage(
                    data?.message || "Unable to save settings."
                );
                return;
            }

            const saved = data.settings || settings;

            const savedTheme =
                ["Light", "Dark"].includes(saved.theme)
                    ? saved.theme
                    : "Light";

            setSettings({
                interview_type: saved.interview_type || "Technical",
                difficulty: saved.difficulty || "Medium",
                number_of_questions:
                    Number(saved.number_of_questions) || 10,
                theme: savedTheme,
            });

            await setTheme(savedTheme as ThemeName);
            setAppliedTheme(savedTheme as ThemeName);
            setSuccessMessage("Settings saved successfully.");
        } catch (error: any) {
            setErrorMessage(
                error?.response?.data?.message ||
                "Unable to save settings. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
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
            setPasswordError("New password must be different from current password.");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters.");
            return;
        }

        try {
            setPasswordLoading(true);

            const data = await changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            });

            if (data?.success) {
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
            } else {
                setPasswordError(
                    data?.message || "Unable to change password."
                );
            }
        } catch (error: any) {
            setPasswordError(
                error?.response?.data?.message ||
                error.message ||
                "Unable to change password."
            );
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Please enter your current password.");
            return;
        }

        if (!deleteConfirmed) {
            setDeleteError("Please confirm this action.");
            return;
        }

        Alert.alert(
            "Confirm Account Deletion",
            "Your account and associated interview data will be permanently deleted. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Account",
                    style: "destructive",
                    onPress: performDeleteAccount,
                },
            ]
        );
    };

    const performDeleteAccount = async () => {
        try {
            setDeleteLoading(true);
            setDeleteError("");

            const response = await deleteAccount(deletePassword);

            if (!response?.success) {
                setDeleteError(
                    response?.message || "Unable to delete your account."
                );
                return;
            }

            await logoutUser();

            Alert.alert(
                "Account Deleted",
                "Your account has been deleted successfully."
            );
        } catch (error: any) {
            setDeleteError(
                error?.response?.data?.message ||
                "Unable to delete your account."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const openPasswordModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
        setShowChangePassword(true);
    };

    const closePasswordModal = () => {
        if (passwordLoading) return;
        setShowChangePassword(false);
        setPasswordError("");
        setPasswordSuccess("");
    };

    const OptionButton = ({
        value,
        selected,
        onPress,
    }: {
        value: string;
        selected: boolean;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                {
                    backgroundColor: selected
                        ? isDark ? "#3B3265" : "#EDE9FF"
                        : colors.input,
                    borderColor: selected ? "#8064E8" : colors.border,
                },
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.optionText,
                    { color: selected ? "#7048D8" : colors.text },
                ]}
            >
                {value}
            </Text>
            {selected && <Text style={styles.optionCheck}>✓</Text>}
        </TouchableOpacity>
    );

    const SectionButton = ({
        id,
        icon,
        title,
        subtitle,
    }: {
        id: Section;
        icon: string;
        title: string;
        subtitle: string;
    }) => (
        <TouchableOpacity
            style={[
                styles.sectionButton,
                {
                    backgroundColor:
                        activeSection === id
                            ? isDark ? "#3B3265" : "#EEE9FF"
                            : colors.card,
                    borderColor:
                        activeSection === id ? "#8064E8" : colors.border,
                },
            ]}
            onPress={() => {
                setActiveSection(id);
                setSuccessMessage("");
                setErrorMessage("");
            }}
        >
            <Text style={styles.sectionIcon}>{icon}</Text>
            <View style={{ flex: 1 }}>
                <Text
                    style={[
                        styles.sectionTitle,
                        {
                            color:
                                activeSection === id ? "#7048D8" : colors.text,
                        },
                    ]}
                >
                    {title}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                    {subtitle}
                </Text>
            </View>
            <Text style={{ color: "#8064E8", fontSize: 20 }}>›</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color="#8064E8" />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading Settings...
                </Text>
                <Text style={[styles.mutedText, { color: colors.muted }]}>
                    Please wait while we load your preferences.
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
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerLabel}>PREFERENCES</Text>

                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Settings
                        </Text>

                        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
                            Customize your Interview Assist experience.
                        </Text>

                        {/* BACK BUTTON */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>← DashBoard</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* SAVE BUTTON */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && { opacity: 0.6 }]}
                    onPress={handleSaveSettings}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>✓ Save Changes</Text>
                    )}
                </TouchableOpacity>

                {successMessage ? (
                    <Text style={styles.successMessage}>✓ {successMessage}</Text>
                ) : null}

                {errorMessage ? (
                    <Text style={styles.errorMessage}>⚠ {errorMessage}</Text>
                ) : null}

                {/* SETTINGS NAVIGATION */}
                <View style={[styles.mainCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sidebarHeading, { color: colors.text }]}>
                        ⚙️ Manage Preferences
                    </Text>

                    <SectionButton
                        id="account"
                        icon="👤"
                        title="Account"
                        subtitle="Profile & personal info"
                    />
                    <SectionButton
                        id="interview"
                        icon="🎯"
                        title="Interview"
                        subtitle="Interview defaults"
                    />
                    <SectionButton
                        id="appearance"
                        icon="🎨"
                        title="Appearance"
                        subtitle="Theme & display"
                    />
                    <SectionButton
                        id="security"
                        icon="🔒"
                        title="Account Security"
                        subtitle="Password & account"
                    />

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* ACCOUNT */}
                    {activeSection === "account" && (
                        <View>
                            <Text style={[styles.contentTitle, { color: colors.text }]}>
                                👤 Account Settings
                            </Text>
                            <Text style={[styles.contentSubtitle, { color: colors.muted }]}>
                                Manage your personal account information and profile details.
                            </Text>

                            <View style={[styles.optionCard, { backgroundColor: colors.input }]}>
                                <Text style={styles.bigIcon}>👤</Text>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    Profile Information
                                </Text>
                                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                                    {user?.name || "Manage your name, skills, target role and profile details."}
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => navigation.navigate("Profile")}
                                >
                                    <Text style={styles.primaryButtonText}>View Profile</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* INTERVIEW */}
                    {activeSection === "interview" && (
                        <View>
                            <Text style={[styles.contentTitle, { color: colors.text }]}>
                                🎯 Interview Preferences
                            </Text>
                            <Text style={[styles.contentSubtitle, { color: colors.muted }]}>
                                Customize your default interview experience.
                            </Text>

                            <Text style={[styles.fieldTitle, { color: colors.text }]}>
                                Default Interview Type
                            </Text>
                            <View style={styles.optionsRow}>
                                {["Technical", "HR", "Mixed"].map((item) => (
                                    <OptionButton
                                        key={item}
                                        value={item}
                                        selected={settings.interview_type === item}
                                        onPress={() => handleSettingChange("interview_type", item)}
                                    />
                                ))}
                            </View>

                            <Text style={[styles.fieldTitle, { color: colors.text }]}>
                                Default Difficulty
                            </Text>
                            <View style={styles.optionsRow}>
                                {["Easy", "Medium", "Hard"].map((item) => (
                                    <OptionButton
                                        key={item}
                                        value={item}
                                        selected={settings.difficulty === item}
                                        onPress={() => handleSettingChange("difficulty", item)}
                                    />
                                ))}
                            </View>

                            <Text style={[styles.fieldTitle, { color: colors.text }]}>
                                Questions per Interview
                            </Text>
                            <View style={styles.optionsRow}>
                                {[5, 10, 15, 20].map((item) => (
                                    <OptionButton
                                        key={item}
                                        value={`${item} Questions`}
                                        selected={settings.number_of_questions === item}
                                        onPress={() => handleSettingChange("number_of_questions", item)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {/* APPEARANCE */}
                    {activeSection === "appearance" && (
                        <View>
                            <Text style={[styles.contentTitle, { color: colors.text }]}>
                                🎨 Appearance
                            </Text>
                            <Text style={[styles.contentSubtitle, { color: colors.muted }]}>
                                Customize how Interview Assist looks on your device.
                            </Text>

                            <View style={styles.themeRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.themeCard,
                                        {
                                            backgroundColor: "#FFFFFF",
                                            borderColor: settings.theme === "Light" ? "#8064E8" : "#E7EAF5",
                                            borderWidth: settings.theme === "Light" ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => handleSettingChange("theme", "Light")}
                                >
                                    <Text style={styles.themeIcon}>☀️</Text>
                                    <Text style={styles.themeTitle}>Light</Text>
                                    <Text style={styles.themeDescription}>Clean and bright</Text>
                                    {settings.theme === "Light" && (
                                        <Text style={styles.themeCheck}>✓ Selected</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.themeCard,
                                        {
                                            backgroundColor: "#1B2340",
                                            borderColor: settings.theme === "Dark" ? "#A78BFA" : "#303B60",
                                            borderWidth: settings.theme === "Dark" ? 2 : 1,
                                        },
                                    ]}
                                    onPress={() => handleSettingChange("theme", "Dark")}
                                >
                                    <Text style={styles.themeIcon}>🌙</Text>
                                    <Text style={[styles.themeTitle, { color: "#FFFFFF" }]}>
                                        Dark
                                    </Text>
                                    <Text style={[styles.themeDescription, { color: "#C1C9E0" }]}>
                                        Easy on the eyes
                                    </Text>
                                    {settings.theme === "Dark" && (
                                        <Text style={styles.themeCheck}>✓ Selected</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.noteText, { color: colors.muted }]}>
                                Select your preferred theme and click Save Changes to apply it.
                            </Text>
                        </View>
                    )}

                    {/* SECURITY */}
                    {activeSection === "security" && (
                        <View>
                            <Text style={[styles.contentTitle, { color: colors.text }]}>
                                🔒 Account Security
                            </Text>
                            <Text style={[styles.contentSubtitle, { color: colors.muted }]}>
                                Manage your password and account security.
                            </Text>

                            <View style={[styles.optionCard, { backgroundColor: colors.input }]}>
                                <Text style={styles.bigIcon}>🔐</Text>
                                <Text style={[styles.cardTitle, { color: colors.text }]}>
                                    Account Password
                                </Text>
                                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                                    Update your password regularly to keep your account protected.
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={openPasswordModal}
                                >
                                    <Text style={styles.primaryButtonText}>Change Password</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dangerCard}>
                                <Text style={styles.dangerTitle}>Delete Account</Text>
                                <Text style={styles.dangerDescription}>
                                    Permanently delete your account and associated interview data.
                                </Text>
                                <TouchableOpacity
                                    style={styles.dangerButton}
                                    onPress={() => {
                                        setDeletePassword("");
                                        setDeleteConfirmed(false);
                                        setDeleteError("");
                                        setShowDeleteAccount(true);
                                    }}
                                >
                                    <Text style={styles.dangerButtonText}>Delete Account</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* CHANGE PASSWORD MODAL */}
            <Modal
                visible={showChangePassword}
                transparent
                animationType="slide"
                onRequestClose={closePasswordModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerLabel}>ACCOUNT SECURITY</Text>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Change Password
                                </Text>
                                <Text style={[styles.contentSubtitle, { color: colors.muted }]}>
                                    Update your account password securely.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={closePasswordModal}>
                                <Text style={[styles.closeButton, { color: colors.text }]}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View
                            style={[
                                styles.modalDivider,
                                {
                                    backgroundColor: isDark ? "#45415F" : "#E5E7EB",
                                },
                            ]}
                        />
                        <ScrollView keyboardShouldPersistTaps="handled">
                            {passwordError ? (
                                <Text style={styles.errorMessage}>{passwordError}</Text>
                            ) : null}
                            {passwordSuccess ? (
                                <Text style={styles.successMessage}>{passwordSuccess}</Text>
                            ) : null}

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Current Password
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                New Password
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Confirm New Password
                            </Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.muted}
                                secureTextEntry
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={closePasswordModal}
                                    disabled={passwordLoading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={handleChangePassword}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>Change Password</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* DELETE ACCOUNT MODAL */}
            <Modal
                visible={showDeleteAccount}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteAccount(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerLabel}>ACCOUNT SECURITY</Text>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Delete Account
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowDeleteAccount(false)}>
                                <Text style={[styles.closeButton, { color: colors.text }]}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.warningCard}>
                            <Text style={styles.warningIcon}>⚠️</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.warningTitle}>
                                    This action cannot be undone.
                                </Text>
                                <Text style={styles.warningDescription}>
                                    Your profile, interview history, results and related data will be permanently removed.
                                </Text>
                            </View>
                        </View>

                        {deleteError ? (
                            <Text style={styles.errorMessage}>{deleteError}</Text>
                        ) : null}

                        <Text style={[styles.inputLabel, { color: colors.text }]}>
                            Current Password
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                            value={deletePassword}
                            onChangeText={(value) => {
                                setDeletePassword(value);
                                setDeleteError("");
                            }}
                            placeholder="Enter your current password"
                            placeholderTextColor={colors.muted}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.confirmRow}
                            onPress={() => {
                                setDeleteConfirmed(!deleteConfirmed);
                                setDeleteError("");
                            }}
                        >
                            <View style={[
                                styles.checkbox,
                                deleteConfirmed && styles.checkboxSelected,
                            ]}>
                                {deleteConfirmed && <Text style={styles.checkboxTick}>✓</Text>}
                            </View>
                            <Text style={[styles.confirmText, { color: colors.text }]}>
                                I understand that my account and interview data will be permanently deleted.
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowDeleteAccount(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.dangerButton,
                                    (!deletePassword || !deleteConfirmed || deleteLoading) && { opacity: 0.5 },
                                ]}
                                onPress={handleDeleteAccount}
                                disabled={!deletePassword || !deleteConfirmed || deleteLoading}
                            >
                                {deleteLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.dangerButtonText}>Delete My Account</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 18,
        paddingTop: 30,
        paddingBottom: 45,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },
    loadingText: {
        fontSize: 19,
        fontWeight: "800",
        marginTop: 15,
    },
    mutedText: {
        marginTop: 7,
        fontSize: 13,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 20,
        gap: 12,
    },
    headerContent: {
        flex: 1,
    },
    headerLabel: {
        color: "#8064E8",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 1.5,
    },
    backButton: {
        backgroundColor: "#E8EDFF",
        marginTop: 5,
        width: "100%",
        height: 42,
        paddingHorizontal: 10,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: "#D5DEFF",
        alignItems: "center",
        justifyContent: "center",
    },

    backButtonText: {
        color: "#4056B5",
        fontSize: 15,
        fontWeight: "700",
    },

    saveButton: {
        backgroundColor: "#6257D9",
        width: "100%",
        height: 42,
        paddingHorizontal: 10,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -5,
        marginBottom: 18,
        elevation: 3,
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    headerTitle: {
        fontSize: 29,
        fontWeight: "900",
        marginTop: 5,
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 5,
        lineHeight: 19,
    },
    successMessage: {
        color: "#16834C",
        backgroundColor: "#E6F8EF",
        padding: 12,
        borderRadius: 10,
        fontWeight: "700",
        marginBottom: 12,
    },
    errorMessage: {
        color: "#C62828",
        backgroundColor: "#FDECEC",
        padding: 12,
        borderRadius: 10,
        fontWeight: "700",
        marginBottom: 12,
    },
    mainCard: {
        borderRadius: 20,
        padding: 16,
        elevation: 3,
    },
    sidebarHeading: {
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 13,
    },
    sectionButton: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 13,
        padding: 12,
        marginBottom: 9,
        gap: 11,
    },
    sectionIcon: {
        fontSize: 23,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "900",
    },
    sectionSubtitle: {
        fontSize: 11,
        marginTop: 3,
    },
    divider: {
        height: 1,
        marginVertical: 18,
    },
    contentTitle: {
        fontSize: 21,
        fontWeight: "900",
        marginBottom: 7,
    },
    contentSubtitle: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 8,
    },
    modalDivider: {
        height: 1,
        width: "100%",
        marginTop: 6,
        marginBottom: 18,
    },
    optionCard: {
        borderRadius: 15,
        padding: 17,
        marginBottom: 14,
    },
    bigIcon: {
        fontSize: 28,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "900",
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 7,
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: "#7655D9",
        paddingHorizontal: 17,
        paddingVertical: 12,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 13,
    },
    fieldTitle: {
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 10,
        marginTop: 13,
    },
    optionsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    optionButton: {
        minWidth: "29%",
        flexGrow: 1,
        borderWidth: 1,
        borderRadius: 11,
        paddingVertical: 12,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    optionText: {
        fontSize: 12,
        fontWeight: "800",
    },
    optionCheck: {
        color: "#7048D8",
        fontWeight: "900",
    },
    themeRow: {
        flexDirection: "row",
        gap: 12,
    },
    themeCard: {
        flex: 1,
        borderRadius: 15,
        padding: 15,
        alignItems: "center",
    },
    themeIcon: {
        fontSize: 29,
        marginBottom: 8,
    },
    themeTitle: {
        color: "#20264A",
        fontSize: 16,
        fontWeight: "900",
    },
    themeDescription: {
        color: "#737B99",
        fontSize: 11,
        marginTop: 5,
        textAlign: "center",
    },
    themeCheck: {
        color: "#8064E8",
        fontWeight: "900",
        fontSize: 11,
        marginTop: 9,
    },
    noteText: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 15,
    },
    dangerCard: {
        backgroundColor: "#FFF0F0",
        borderColor: "#FFD0D0",
        borderWidth: 1,
        borderRadius: 15,
        padding: 16,
        marginTop: 5,
    },
    dangerTitle: {
        color: "#C62828",
        fontSize: 16,
        fontWeight: "900",
    },
    dangerDescription: {
        color: "#8C5555",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 7,
        marginBottom: 14,
    },
    dangerButton: {
        backgroundColor: "#D93636",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    dangerButtonText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(10,15,35,0.65)",
        justifyContent: "center",
        padding: 17,
    },
    modalCard: {
        borderRadius: 20,
        padding: 19,
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 17,
    },
    modalTitle: {
        fontSize: 23,
        fontWeight: "900",
        marginTop: 5,
    },
    closeButton: {
        fontSize: 31,
        fontWeight: "500",
        paddingHorizontal: 7,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 7,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#E9ECF5",
        padding: 13,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        color: "#4E5672",
        fontWeight: "900",
        fontSize: 12,
    },
    warningCard: {
        flexDirection: "row",
        backgroundColor: "#FFF4E5",
        borderRadius: 12,
        padding: 12,
        gap: 10,
        marginBottom: 10,
    },
    warningIcon: {
        fontSize: 23,
    },
    warningTitle: {
        color: "#A85B00",
        fontSize: 13,
        fontWeight: "900",
    },
    warningDescription: {
        color: "#986B39",
        fontSize: 11,
        lineHeight: 17,
        marginTop: 5,
    },
    confirmRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 17,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: "#9AA2B8",
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxSelected: {
        backgroundColor: "#7655D9",
        borderColor: "#7655D9",
    },
    checkboxTick: {
        color: "#FFFFFF",
        fontWeight: "900",
    },
    confirmText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
});

export default SettingsScreen;
