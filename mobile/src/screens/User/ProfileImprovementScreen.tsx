
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { getProfile } from "../../services/authService";
import { useTheme } from "../../context/ThemeContext";

type UserStackParamList = {
    UserDashboard: undefined;
    Profile: undefined;
    ProfileImprovement: undefined;
};

type Props = NativeStackScreenProps<
    UserStackParamList,
    "ProfileImprovement"
>;

interface ProfileData {
    name?: string;
    email?: string;
    target_role?: string;
    experience_level?: string;
    skills?: string[];
}

interface Suggestion {
    icon: string;
    title: string;
    description: string;
}

const ProfileImprovementScreen = ({ navigation }: Props) => {
    const { colors } = useTheme();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getProfile();

            if (data.success) {
                setProfile(data.user);
            } else {
                setError(
                    data.message || "Unable to load your profile."
                );
            }
        } catch (err: any) {
            console.error("Profile Improvement Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // PROFILE COMPLETION
    const calculateCompletion = () => {
        if (!profile) return 0;

        let completed = 0;

        if (profile.name) completed++;
        if (profile.email) completed++;
        if (profile.target_role) completed++;
        if (profile.experience_level) completed++;
        if (profile.skills && profile.skills.length > 0) completed++;

        return Math.round((completed / 5) * 100);
    };

    const completion = calculateCompletion();

    // IMPROVEMENT SUGGESTIONS
    const suggestions: Suggestion[] = [];

    if (!profile?.target_role) {
        suggestions.push({
            icon: "🎯",
            title: "Add your target role",
            description:
                "Set the job role you are preparing for so interviews can be personalized.",
        });
    }

    if (!profile?.skills || profile.skills.length === 0) {
        suggestions.push({
            icon: "🛠️",
            title: "Add your skills",
            description:
                "Add your technical and professional skills to get relevant interview questions.",
        });
    }

    if (
        profile?.skills &&
        profile.skills.length > 0 &&
        profile.skills.length < 3
    ) {
        suggestions.push({
            icon: "📚",
            title: "Add more skills",
            description:
                "Adding more relevant skills will help generate a better interview profile.",
        });
    }

    if (!profile?.experience_level) {
        suggestions.push({
            icon: "💼",
            title: "Set experience level",
            description:
                "Choose your experience level to receive appropriate interview questions.",
        });
    }

    // LOADING SCREEN
    if (loading) {
        return (
            <View style={[
                styles.centerContainer,
                { backgroundColor: colors.background },
            ]}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={[
                    styles.loadingTitle,
                    { color: colors.text },
                ]}>
                    Loading Profile...
                </Text>

                <Text style={[
                    styles.loadingDescription,
                    { color: colors.muted },
                ]}>
                    Please wait while we analyze your profile.
                </Text>
            </View>
        );
    }

    // ERROR SCREEN
    if (error && !profile) {
        return (
            <View style={[
                styles.centerContainer,
                { backgroundColor: colors.background },
            ]}>
                <Text style={styles.errorIcon}>⚠️</Text>

                <Text style={[
                    styles.errorTitle,
                    { color: colors.text },
                ]}>
                    Unable to Load Profile
                </Text>

                <Text style={[
                    styles.errorDescription,
                    { color: colors.muted },
                ]}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadProfile}
                >
                    <Text style={styles.retryButtonText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.dashboardButton}
                    onPress={() => navigation.navigate("UserDashboard")}
                >
                    <Text style={styles.dashboardButtonText}>
                        ← Back to Dashboard
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={[
                styles.screen,
                { backgroundColor: colors.background },
            ]}
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={loadProfile}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.label}>
                        PROFILE ANALYSIS
                    </Text>

                    <Text style={[
                        styles.title,
                        { color: colors.text },
                    ]}>
                        Improve Your Profile
                    </Text>

                    <Text style={[
                        styles.subtitle,
                        { color: colors.muted },
                    ]}>
                        Complete your profile to get a more personalized
                        interview experience.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.headerButton,
                        { backgroundColor: colors.header },
                    ]}
                    onPress={() => navigation.navigate("UserDashboard")}
                >
                    <Text style={[
                        styles.headerButtonText,
                        { color: colors.primary },
                    ]}>
                        Dashboard
                    </Text>
                </TouchableOpacity>
            </View>

            {/* INLINE ERROR */}
            {error ? (
                <View style={styles.inlineError}>
                    <Text style={styles.inlineErrorText}>
                        ⚠️ {error}
                    </Text>

                    <TouchableOpacity onPress={loadProfile}>
                        <Text style={styles.inlineRetry}>
                            Retry
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* COMPLETION CARD */}
            <View style={[
                styles.completionCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}>
                <View style={styles.completionTop}>
                    <View style={styles.completionTextContainer}>
                        <Text style={[
                            styles.cardTitle,
                            { color: colors.text },
                        ]}>
                            Profile Completion
                        </Text>

                        <Text style={[
                            styles.completionDescription,
                            { color: colors.muted },
                        ]}>
                            {completion === 100
                                ? "Your profile is complete! 🎉"
                                : "Complete the missing information below."}
                        </Text>
                    </View>

                    <Text style={styles.percentage}>
                        {completion}%
                    </Text>
                </View>

                <View style={[
                    styles.progressBackground,
                    { backgroundColor: colors.border },
                ]}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${completion}%` },
                        ]}
                    />
                </View>
            </View>

            {/* CURRENT PROFILE */}
            <View style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}>
                <Text style={[
                    styles.sectionTitle,
                    { color: colors.text },
                ]}>
                    Your Current Profile
                </Text>

                <View style={styles.profileGrid}>
                    <ProfileItem
                        label="Name"
                        value={profile?.name || "Not set"}
                        colors={colors}
                    />

                    <ProfileItem
                        label="Target Role"
                        value={profile?.target_role || "Not set"}
                        colors={colors}
                    />

                    <ProfileItem
                        label="Experience"
                        value={profile?.experience_level || "Not set"}
                        colors={colors}
                    />

                    <ProfileItem
                        label="Skills"
                        value={`${profile?.skills?.length || 0} skills`}
                        colors={colors}
                    />
                </View>
            </View>

            {/* IMPROVEMENT SUGGESTIONS */}
            <View style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}>
                <Text style={[
                    styles.sectionTitle,
                    { color: colors.text },
                ]}>
                    Improvement Suggestions
                </Text>

                {suggestions.length === 0 ? (
                    <View style={styles.completeContainer}>
                        <View style={styles.completeIcon}>
                            <Text style={styles.completeIconText}>
                                ✓
                            </Text>
                        </View>

                        <View style={styles.completeTextContainer}>
                            <Text style={styles.completeTitle}>
                                Great job!
                            </Text>

                            <Text style={styles.completeDescription}>
                                Your basic profile information is complete.
                                You are ready to start practicing interviews.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.suggestionList}>
                        {suggestions.map((suggestion, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.suggestionItem,
                                    {
                                        backgroundColor: colors.input,
                                        borderColor: colors.border,
                                    },
                                ]}
                            >
                                <View style={[
                                    styles.suggestionIcon,
                                    { backgroundColor: colors.header },
                                ]}>
                                    <Text style={styles.suggestionIconText}>
                                        {suggestion.icon}
                                    </Text>
                                </View>

                                <View style={styles.suggestionContent}>
                                    <Text style={[
                                        styles.suggestionTitle,
                                        { color: colors.text },
                                    ]}>
                                        {suggestion.title}
                                    </Text>

                                    <Text style={[
                                        styles.suggestionDescription,
                                        { color: colors.muted },
                                    ]}>
                                        {suggestion.description}
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.improveButton}
                                        onPress={() =>
                                            navigation.navigate("Profile")
                                        }
                                    >
                                        <Text style={styles.improveButtonText}>
                                            Improve Profile →
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            {/* BOTTOM BUTTON */}
            <TouchableOpacity
                style={styles.bottomButton}
                onPress={() => navigation.navigate("UserDashboard")}
            >
                <Text style={styles.bottomButtonText}>
                    ← Back to Dashboard
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// PROFILE ITEM COMPONENT
const ProfileItem = ({
    label,
    value,
    colors,
}: {
    label: string;
    value: string;
    colors: {
        card: string;
        input: string;
        text: string;
        muted: string;
        border: string;
    };
}) => {
    return (
        <View style={[
            styles.profileItem,
            {
                backgroundColor: colors.input,
                borderColor: colors.border,
            },
        ]}>
            <Text style={[
                styles.profileItemLabel,
                { color: colors.muted },
            ]}>
                {label}
            </Text>

            <Text style={[
                styles.profileItemValue,
                { color: colors.text },
            ]}>
                {value}
            </Text>
        </View>
    );
};

export default ProfileImprovementScreen;

// STYLES
const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },

    container: {
        paddingHorizontal: 18,
        paddingTop: 30,
        paddingBottom: 35,
    },

    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },

    loadingTitle: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: "700",
    },

    loadingDescription: {
        marginTop: 8,
        fontSize: 14,
        textAlign: "center",
    },

    errorIcon: {
        fontSize: 45,
        marginBottom: 15,
    },

    errorTitle: {
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
    },

    errorDescription: {
        fontSize: 14,
        textAlign: "center",
        marginTop: 10,
        lineHeight: 21,
    },

    retryButton: {
        backgroundColor: "#6366F1",
        paddingHorizontal: 25,
        paddingVertical: 13,
        borderRadius: 12,
        marginTop: 22,
    },

    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15,
    },

    dashboardButton: {
        marginTop: 18,
        padding: 12,
    },

    dashboardButtonText: {
        color: "#8B80FF",
        fontSize: 15,
        fontWeight: "700",
    },

    header: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 22,
        gap: 10,
    },

    headerTextContainer: {
        flex: 1,
    },

    label: {
        fontSize: 12,
        fontWeight: "800",
        color: "#8B80FF",
        letterSpacing: 1.2,
        marginBottom: 8,
    },

    title: {
        fontSize: 26,
        fontWeight: "900",
    },

    subtitle: {
        fontSize: 14,
        lineHeight: 21,
        marginTop: 8,
    },

    headerButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 22,
    },

    headerButtonText: {
        fontSize: 12,
        fontWeight: "800",
    },

    inlineError: {
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
    },

    inlineErrorText: {
        color: "#B91C1C",
        fontSize: 13,
        lineHeight: 20,
    },

    inlineRetry: {
        color: "#DC2626",
        fontWeight: "800",
        marginTop: 8,
    },

    completionCard: {
        borderRadius: 18,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        elevation: 3,
        shadowColor: "#6366F1",
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },

    completionTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },

    completionTextContainer: {
        flex: 1,
        paddingRight: 10,
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: "800",
    },

    completionDescription: {
        fontSize: 13,
        marginTop: 7,
        lineHeight: 19,
    },

    percentage: {
        fontSize: 30,
        fontWeight: "900",
        color: "#8B80FF",
    },

    progressBackground: {
        height: 12,
        borderRadius: 20,
        overflow: "hidden",
    },

    progressFill: {
        height: "100%",
        backgroundColor: "#6366F1",
        borderRadius: 20,
    },

    card: {
        borderRadius: 18,
        padding: 20,
        marginBottom: 18,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#64748B",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 18,
    },

    profileGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },

    profileItem: {
        width: "47%",
        borderWidth: 1,
        borderRadius: 13,
        padding: 14,
        minHeight: 85,
    },

    profileItemLabel: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 8,
    },

    profileItemValue: {
        fontSize: 15,
        fontWeight: "800",
    },

    completeContainer: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#ECFDF5",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        borderRadius: 14,
        padding: 16,
    },

    completeIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#10B981",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    completeIconText: {
        color: "#FFFFFF",
        fontSize: 23,
        fontWeight: "900",
    },

    completeTextContainer: {
        flex: 1,
    },

    completeTitle: {
        color: "#047857",
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 6,
    },

    completeDescription: {
        color: "#065F46",
        fontSize: 13,
        lineHeight: 20,
    },

    suggestionList: {
        gap: 14,
    },

    suggestionItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
    },

    suggestionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    suggestionIconText: {
        fontSize: 21,
    },

    suggestionContent: {
        flex: 1,
    },

    suggestionTitle: {
        fontSize: 15,
        fontWeight: "800",
    },

    suggestionDescription: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 6,
    },

    improveButton: {
        alignSelf: "flex-start",
        marginTop: 12,
        backgroundColor: "#4F46E5",
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },

    improveButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    bottomButton: {
        backgroundColor: "#6366F1",
        borderRadius: 13,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 3,
    },

    bottomButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});
