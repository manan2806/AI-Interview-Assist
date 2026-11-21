
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

interface AdminProfile {
    user_id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

interface ProfileForm {
    name: string;
    email: string;
}

const AdminProfileScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();

    const isDark = theme === "Dark";

    const [profile, setProfile] = useState<AdminProfile>({
        user_id: "",
        name: "",
        email: "",
        role: "admin",
        created_at: "",
    });

    const [formData, setFormData] = useState<ProfileForm>({
        name: "",
        email: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // ==========================================
    // FETCH ADMIN PROFILE
    // ==========================================

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/admin/profile");
            const data = response.data;

            if (data.success && data.profile) {
                setProfile(data.profile);

                setFormData({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                });
            } else {
                setError(data.message || "Unable to load profile.");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to load admin profile."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // ==========================================
    // HANDLE INPUT CHANGE
    // ==========================================

    const handleChange = (field: keyof ProfileForm, value: string) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // ==========================================
    // ENABLE EDIT MODE
    // ==========================================

    const handleEdit = () => {
        setFormData({
            name: profile.name || "",
            email: profile.email || "",
        });

        setError("");
        setMessage("");
        setEditing(true);
    };

    // ==========================================
    // CANCEL EDIT
    // ==========================================

    const handleCancel = () => {
        setFormData({
            name: profile.name || "",
            email: profile.email || "",
        });

        setEditing(false);
        setError("");
        setMessage("");
    };

    // ==========================================
    // SAVE PROFILE
    // ==========================================

    const handleSubmit = async () => {
        setError("");
        setMessage("");

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();

        if (!name || !email) {
            setError("Name and email are required.");
            return;
        }

        if (name.length > 100) {
            setError("Name cannot exceed 100 characters.");
            return;
        }

        if (email.length > 254) {
            setError("Email cannot exceed 254 characters.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.patch(
                "/api/admin/profile",
                { name, email }
            );

            const data = response.data;

            if (data.success && data.profile) {
                setProfile(data.profile);

                setFormData({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                });

                setEditing(false);
                setMessage(
                    data.message || "Profile updated successfully."
                );
            } else {
                setError(data.message || "Unable to update profile.");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to update admin profile."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // FORMAT ACCOUNT CREATION DATE
    // ==========================================

    const formatDate = (dateValue: string) => {
        if (!dateValue) {
            return "Not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // ==========================================
    // STYLES
    // ==========================================

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 18,
            paddingTop: 30,
            paddingBottom: 35,
        },
        headingCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
        },
        title: {
            fontSize: 25,
            fontWeight: "800",
            color: colors.text,
        },
        subtitle: {
            fontSize: 13,
            color: colors.muted,
            marginTop: 7,
            lineHeight: 20,
        },
        backButton: {
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.header,
        },
        backButtonText: {
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
            color: colors.primary,
        },
        alert: {
            padding: 13,
            borderRadius: 10,
            marginBottom: 15,
            borderWidth: 1,
        },
        errorAlert: {
            backgroundColor: isDark ? "#451F25" : "#FEF2F2",
            borderColor: isDark ? "#7F303B" : "#FECACA",
        },
        successAlert: {
            backgroundColor: isDark ? "#173D32" : "#F0FDF4",
            borderColor: isDark ? "#27634E" : "#BBF7D0",
        },
        errorText: {
            color: isDark ? "#FCA5A5" : "#B91C1C",
            fontSize: 13,
            fontWeight: "600",
        },
        successText: {
            color: isDark ? "#86EFAC" : "#15803D",
            fontSize: 13,
            fontWeight: "600",
        },
        profileCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
        },
        banner: {
            backgroundColor: colors.header,
            padding: 22,
            flexDirection: "row",
            alignItems: "center",
        },
        avatar: {
            width: 66,
            height: 66,
            borderRadius: 33,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 15,
        },
        avatarText: {
            fontSize: 27,
            fontWeight: "800",
            color: "#FFFFFF",
        },
        bannerInfo: {
            flex: 1,
        },
        profileName: {
            fontSize: 19,
            fontWeight: "800",
            color: colors.text,
        },
        profileEmail: {
            fontSize: 12,
            color: colors.muted,
            marginTop: 5,
        },
        roleBadge: {
            alignSelf: "flex-start",
            marginTop: 9,
            paddingHorizontal: 11,
            paddingVertical: 5,
            borderRadius: 20,
            backgroundColor: isDark ? "#37305F" : "#E0E7FF",
        },
        roleText: {
            fontSize: 11,
            fontWeight: "800",
            color: colors.primary,
            textTransform: "uppercase",
        },
        section: {
            padding: 20,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 20,
        },
        field: {
            marginBottom: 17,
        },
        label: {
            fontSize: 13,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 8,
        },
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            fontSize: 14,
            color: colors.text,
            backgroundColor: colors.input,
        },
        inputMultiline: {
            minHeight: 48,
        },
        detailGrid: {
            gap: 13,
        },
        detailItem: {
            padding: 15,
            borderRadius: 11,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
        },
        detailLabel: {
            fontSize: 12,
            color: colors.muted,
            fontWeight: "600",
            marginBottom: 7,
        },
        detailValue: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },
        actions: {
            flexDirection: "row",
            gap: 10,
            marginTop: 20,
        },
        actionButton: {
            flex: 1,
            paddingVertical: 13,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
        },
        cancelButton: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
        },
        saveButton: {
            backgroundColor: colors.primary,
        },
        editButton: {
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 20,
        },
        cancelText: {
            color: colors.text,
            fontWeight: "700",
            fontSize: 13,
        },
        saveText: {
            color: "#FFFFFF",
            fontWeight: "700",
            fontSize: 13,
        },
        editText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "700",
        },
        loadingContainer: {
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
        },
        loadingText: {
            color: colors.muted,
            marginTop: 12,
            fontSize: 14,
        },
        retryButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: 25,
            paddingVertical: 12,
            borderRadius: 10,
            marginTop: 18,
        },
        retryText: {
            color: "#FFFFFF",
            fontWeight: "700",
        },
    });

    // ==========================================
    // LOADING STATE
    // ==========================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    Loading admin profile...
                </Text>
            </View>
        );
    }

    // ==========================================
    // ERROR STATE
    // ==========================================

    if (error && !profile.user_id && !profile.name && !profile.email) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={[styles.errorText, { textAlign: "center" }]}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchProfile}
                >
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate("AdminDashboard")}
                >
                    <Text style={styles.backButtonText}>
                        ← Dashboard
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ==========================================
    // PROFILE SCREEN
    // ==========================================

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* PAGE HEADING */}

                <View style={styles.headingCard}>
                    <Text style={styles.title}>My Profile</Text>

                    <Text style={styles.subtitle}>
                        View and manage your admin profile information.
                    </Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() =>
                            navigation.navigate("AdminDashboard")
                        }
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backButtonText}>
                            ← Dashboard
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ALERTS */}

                {error ? (
                    <View style={[styles.alert, styles.errorAlert]}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {message ? (
                    <View style={[styles.alert, styles.successAlert]}>
                        <Text style={styles.successText}>{message}</Text>
                    </View>
                ) : null}

                {/* PROFILE CARD */}

                <View style={styles.profileCard}>

                    {/* PROFILE BANNER */}

                    <View style={styles.banner}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(profile.name || "A")
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase()}
                            </Text>
                        </View>

                        <View style={styles.bannerInfo}>
                            <Text style={styles.profileName}>
                                {profile.name || "Admin"}
                            </Text>

                            <Text style={styles.profileEmail}>
                                {profile.email || "No email available"}
                            </Text>

                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>
                                    {profile.role || "admin"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* EDIT PROFILE */}

                    {editing ? (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Edit Profile Information
                            </Text>

                            <View style={styles.field}>
                                <Text style={styles.label}>
                                    Full Name
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    value={formData.name}
                                    onChangeText={(value) =>
                                        handleChange("name", value)
                                    }
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.muted}
                                    maxLength={100}
                                    autoCapitalize="words"
                                    editable={!saving}
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>
                                    Email Address
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    value={formData.email}
                                    onChangeText={(value) =>
                                        handleChange("email", value)
                                    }
                                    placeholder="Enter your email"
                                    placeholderTextColor={colors.muted}
                                    maxLength={254}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!saving}
                                />
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.cancelButton,
                                    ]}
                                    onPress={handleCancel}
                                    disabled={saving}
                                >
                                    <Text style={styles.cancelText}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        styles.saveButton,
                                        saving && { opacity: 0.7 },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveText}>
                                            Save Changes
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (

                        /* PROFILE DETAILS */

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                Profile Information
                            </Text>

                            <View style={styles.detailGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Full Name
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {profile.name || "Not available"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Email Address
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {profile.email || "Not available"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Admin Role
                                    </Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: colors.primary },
                                    ]}>
                                        {profile.role || "admin"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Account Created
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(profile.created_at)}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={handleEdit}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.editText}>
                                    ✏️ Edit Profile
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

export default AdminProfileScreen;
