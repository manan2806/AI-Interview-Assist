
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { getProfile, updateProfile } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";

interface ProfileData {
    user_id?: string;
    name?: string;
    email?: string;
    target_role?: string;
    experience_level?: string;
    skills?: string[];
}

const experienceOptions = [
    "Fresher",
    "Junior",
    "Mid Level",
    "Senior",
];

const ProfileScreen = ({ navigation }: any) => {
    const { colors } = useTheme();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("Fresher");
    const [skills, setSkills] = useState("");

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const data = await getProfile();

            if (data.success) {
                const user = data.user as ProfileData;

                setProfile(user);
                setName(user.name || "");
                setEmail(user.email || "");
                setTargetRole(user.target_role || "");
                setExperienceLevel(user.experience_level || "Fresher");
                setSkills(user.skills?.join(", ") || "");
            } else {
                setError(data.message || "Unable to load profile.");
            }
        } catch (err: any) {
            console.error("Profile Error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleUpdate = async () => {
        if (!name.trim()) {
            setError("Name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const skillsArray = skills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill !== "");

            const data = await updateProfile({
                name: name.trim(),
                target_role: targetRole.trim(),
                experience_level: experienceLevel,
                skills: skillsArray,
            });

            if (data.success) {
                const updatedUser = data.user || {
                    ...profile,
                    name: name.trim(),
                    target_role: targetRole.trim(),
                    experience_level: experienceLevel,
                    skills: skillsArray,
                };

                setProfile(updatedUser);
                setEditing(false);
                setSuccess(data.message || "Profile updated successfully.");

                const savedUser = await SecureStore.getItemAsync("user_data");

                if (savedUser) {
                    const currentUser = JSON.parse(savedUser);
                    const mergedUser = {
                        ...currentUser,
                        ...updatedUser,
                    };

                    await SecureStore.setItemAsync(
                        "user_data",
                        JSON.stringify(mergedUser)
                    );
                }
            } else {
                setError(data.message || "Unable to update profile.");
            }
        } catch (err: any) {
            console.error("Update Profile Error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        setError("");
        setSuccess("");
        setName(profile?.name || "");
        setEmail(profile?.email || "");
        setTargetRole(profile?.target_role || "");
        setExperienceLevel(profile?.experience_level || "Fresher");
        setSkills(profile?.skills?.join(", ") || "");
        setEditing(false);
    };

    if (loading) {
        return (
            <SafeAreaView
                style={[
                    styles.centerContainer,
                    { backgroundColor: colors.background },
                ]}
            >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading Profile...
                </Text>
                <Text style={[styles.subText, { color: colors.muted }]}>
                    Please wait while we load your profile.
                </Text>
            </SafeAreaView>
        );
    }

    if (error && !profile) {
        return (
            <SafeAreaView
                style={[
                    styles.centerContainer,
                    { backgroundColor: colors.background },
                ]}
            >
                <Text style={styles.errorIcon}>⚠️</Text>

                <Text style={[styles.errorTitle, { color: colors.text }]}>
                    Unable to Load Profile
                </Text>

                <Text style={[styles.errorText, { color: colors.muted }]}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={loadProfile}
                >
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation?.goBack?.()}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                        ← Back to Dashboard
                    </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: colors.background },
            ]}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={{ backgroundColor: colors.background }}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* HEADER */}
                    <View style={styles.header}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.label}>ACCOUNT</Text>

                            <Text style={[styles.title, { color: colors.text }]}>
                                My Profile
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.muted }]}>
                                Manage your personal and professional information.
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.backButton,
                                    {
                                        backgroundColor: colors.header,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => navigation?.goBack?.()}
                            >
                                <Text style={[styles.backButtonText, { color: colors.primary }]}>
                                    ← Dashboard
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ALERTS */}
                    {!!error && (
                        <View style={styles.errorBanner}>
                            <Text style={styles.errorBannerText}>{error}</Text>
                        </View>
                    )}

                    {!!success && (
                        <View style={styles.successBanner}>
                            <Text style={styles.successBannerText}>{success}</Text>
                        </View>
                    )}

                    {/* PROFILE CARD */}
                    <View
                        style={[
                            styles.card,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {!editing ? (
                            <>
                                <View
                                    style={[
                                        styles.avatar,
                                        {
                                            backgroundColor: colors.header,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                                        {profile?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </Text>
                                </View>

                                <View style={styles.profileInfo}>
                                    <ProfileRow
                                        label="Full Name"
                                        value={profile?.name || "Not set"}
                                        colors={colors}
                                    />

                                    <ProfileRow
                                        label="Email"
                                        value={profile?.email || "Not set"}
                                        colors={colors}
                                    />

                                    <ProfileRow
                                        label="Target Role"
                                        value={profile?.target_role || "Not set"}
                                        colors={colors}
                                    />

                                    <ProfileRow
                                        label="Experience Level"
                                        value={profile?.experience_level || "Fresher"}
                                        colors={colors}
                                    />

                                    <View
                                        style={[
                                            styles.profileRow,
                                            { borderBottomColor: colors.border },
                                        ]}
                                    >
                                        <Text style={[styles.rowLabel, { color: colors.muted }]}>
                                            Skills
                                        </Text>

                                        <View style={styles.skillsContainer}>
                                            {profile?.skills?.length ? (
                                                profile.skills.map((skill, index) => (
                                                    <View
                                                        key={`${skill}-${index}`}
                                                        style={[
                                                            styles.skillTag,
                                                            {
                                                                backgroundColor: colors.header,
                                                                borderColor: colors.border,
                                                            },
                                                        ]}
                                                    >
                                                        <Text style={[styles.skillText, { color: colors.primary }]}>
                                                            {skill}
                                                        </Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={[styles.rowValue, { color: colors.text }]}>
                                                    No skills added
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.primaryButton}
                                    onPress={() => {
                                        setError("");
                                        setSuccess("");
                                        setEditing(true);
                                    }}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        ✏️ Edit Profile
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.form}>
                                <Text style={[styles.formTitle, { color: colors.text }]}>
                                    Edit Profile
                                </Text>

                                <FormLabel label="Full Name" colors={colors} />

                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={colors.muted}
                                />

                                <FormLabel label="Email" colors={colors} />

                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.disabledInput,
                                        {
                                            backgroundColor: colors.header,
                                            borderColor: colors.border,
                                            color: colors.muted,
                                        },
                                    ]}
                                    value={email}
                                    editable={false}
                                />

                                <Text style={[styles.helperText, { color: colors.muted }]}>
                                    Email cannot be changed.
                                </Text>

                                <FormLabel label="Target Role" colors={colors} />

                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={targetRole}
                                    onChangeText={setTargetRole}
                                    placeholder="e.g. Software Engineer"
                                    placeholderTextColor={colors.muted}
                                />

                                <FormLabel label="Experience Level" colors={colors} />

                                <View style={styles.experienceOptions}>
                                    {experienceOptions.map((option) => {
                                        const selected = experienceLevel === option;

                                        return (
                                            <TouchableOpacity
                                                key={option}
                                                style={[
                                                    styles.experienceOption,
                                                    {
                                                        backgroundColor: colors.input,
                                                        borderColor: colors.border,
                                                    },
                                                    selected && {
                                                        backgroundColor: colors.header,
                                                        borderColor: colors.primary,
                                                    },
                                                ]}
                                                onPress={() => setExperienceLevel(option)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.experienceText,
                                                        { color: colors.muted },
                                                        selected && {
                                                            color: colors.primary,
                                                        },
                                                    ]}
                                                >
                                                    {option}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <FormLabel label="Skills" colors={colors} />

                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={skills}
                                    onChangeText={setSkills}
                                    placeholder="Python, React, MongoDB"
                                    placeholderTextColor={colors.muted}
                                />

                                <Text style={[styles.helperText, { color: colors.muted }]}>
                                    Separate skills with commas.
                                </Text>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.primaryButton,
                                            styles.actionButton,
                                            saving && styles.disabledButton,
                                        ]}
                                        onPress={handleUpdate}
                                        disabled={saving}
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.primaryButtonText}>
                                                Save Changes
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.cancelButton,
                                            styles.actionButton,
                                            {
                                                backgroundColor: colors.header,
                                                borderColor: colors.border,
                                            },
                                        ]}
                                        onPress={cancelEditing}
                                        disabled={saving}
                                    >
                                        <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const ProfileRow = ({
    label,
    value,
    colors,
}: {
    label: string;
    value: string;
    colors: {
        text: string;
        muted: string;
        border: string;
    };
}) => (
    <View style={[styles.profileRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.muted }]}>
            {label}
        </Text>
        <Text style={[styles.rowValue, { color: colors.text }]}>
            {value}
        </Text>
    </View>
);

const FormLabel = ({
    label,
    colors,
}: {
    label: string;
    colors: {
        text: string;
    };
}) => (
    <Text style={[styles.formLabel, { color: colors.text }]}>
        {label}
    </Text>
);

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 35,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 15,
    },
    subText: {
        fontSize: 14,
        marginTop: 7,
        textAlign: "center",
    },
    errorIcon: {
        fontSize: 42,
        marginBottom: 12,
    },
    errorTitle: {
        fontSize: 21,
        fontWeight: "800",
        textAlign: "center",
    },
    errorText: {
        textAlign: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
        gap: 10,
    },
    headerTextContainer: {
        flex: 1,
    },
    label: {
        color: "#6366F1",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 28,
        fontWeight: "900",
        marginTop: 5,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 19,
        marginTop: 5,
    },
    backButton: {
        paddingHorizontal: 120,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignSelf: "flex-start",
        marginTop: 12,
    },
    backButtonText: {
        fontWeight: "700",
        fontSize: 12,
    },
    card: {
        borderRadius: 22,
        borderWidth: 1,
        padding: 20,
        elevation: 3,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        borderWidth: 3,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginBottom: 20,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: "900",
    },
    profileInfo: {
        marginBottom: 20,
    },
    profileRow: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    rowLabel: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 5,
    },
    rowValue: {
        fontSize: 15,
        fontWeight: "700",
    },
    skillsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 5,
    },
    skillTag: {
        borderWidth: 1,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 20,
    },
    skillText: {
        fontSize: 12,
        fontWeight: "700",
    },
    primaryButton: {
        backgroundColor: "#6366F1",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    primaryButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 14,
    },
    secondaryButton: {
        marginTop: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    secondaryButtonText: {
        fontWeight: "700",
    },
    errorBanner: {
        backgroundColor: "#FEE2E2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        padding: 13,
        borderRadius: 12,
        marginBottom: 15,
    },
    errorBannerText: {
        color: "#991B1B",
        fontSize: 13,
        fontWeight: "600",
    },
    successBanner: {
        backgroundColor: "#DCFCE7",
        borderWidth: 1,
        borderColor: "#86EFAC",
        padding: 13,
        borderRadius: 12,
        marginBottom: 15,
    },
    successBannerText: {
        color: "#166534",
        fontSize: 13,
        fontWeight: "600",
    },
    form: {
        width: "100%",
    },
    formTitle: {
        fontSize: 22,
        fontWeight: "900",
        marginBottom: 22,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
    },
    disabledInput: {
        opacity: 0.8,
    },
    helperText: {
        fontSize: 12,
        marginTop: 6,
    },
    experienceOptions: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    experienceOption: {
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    experienceText: {
        fontSize: 12,
        fontWeight: "700",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 10,
        marginTop: 25,
    },
    actionButton: {
        flex: 1,
    },
    cancelButton: {
        borderWidth: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButtonText: {
        fontWeight: "800",
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default ProfileScreen;
