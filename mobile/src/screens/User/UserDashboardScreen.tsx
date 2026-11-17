
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";
import { getInterviewHistory } from "../../services/interviewService";

interface Interview {
    _id?: string;
    interview_id?: string;
    interview_code?: string;
    job_role?: string;
    interview_type?: string;
    difficulty?: string;
    status?: string;
    created_at?: string;
    overall_score?: number;
    score?: number;
    performance_level?: string;
}

const UserDashboardScreen = () => {
    const { user, logout } = useAuth();

    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboard = useCallback(async () => {
        try {
            const historyData = await getInterviewHistory();

            const history = Array.isArray(historyData)
                ? historyData
                : historyData?.interviews || [];

            setInterviews(history);
        } catch (error: any) {
            console.error(
                "Dashboard error:",
                error?.response?.data || error.message
            );

            Alert.alert(
                "Error",
                "Unable to load interview history. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const completedInterviews = interviews.filter(
        (item) => item.status?.toLowerCase() === "completed"
    );

    const scoredInterviews = interviews.filter((item) => {
        const score = item.overall_score ?? item.score;
        return typeof score === "number" && Number.isFinite(score);
    });

    const averageScore =
        scoredInterviews.length > 0
            ? Math.round(
                scoredInterviews.reduce(
                    (total, item) =>
                        total + (item.overall_score ?? item.score ?? 0),
                    0
                ) / scoredInterviews.length
            )
            : 0;

    const recentInterviews = [...interviews]
        .sort(
            (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
        )
        .slice(0, 3);

    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "#16A34A";
            case "in_progress":
                return "#2563EB";
            case "evaluating":
                return "#D97706";
            default:
                return "#64748B";
        }
    };

    const formatDate = (date?: string) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error("Logout error:", error);
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>
                    Loading dashboard...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>AI Interview Assist</Text>
                    <Text style={styles.headerSubtitle}>
                        User Dashboard
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* WELCOME */}
            <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>
                    Welcome, {user?.name || "User"}!
                </Text>
                <Text style={styles.welcomeDescription}>
                    Track your interview preparation and improve your skills.
                </Text>
            </View>

            {/* PROFILE OVERVIEW */}
            <Text style={styles.sectionTitle}>Profile Overview</Text>

            <View style={styles.infoCard}>
                <InfoRow
                    label="Target Role"
                    value={user?.target_role || "Not Set"}
                />
                <InfoRow
                    label="Experience Level"
                    value={user?.experience_level || "Not Set"}
                />
                <InfoRow
                    label="Skills"
                    value={
                        user?.skills?.length
                            ? user.skills.join(", ")
                            : "No skills added"
                    }
                />
            </View>

            {/* STATISTICS */}
            <Text style={styles.sectionTitle}>Performance Overview</Text>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Interviews"
                    value={interviews.length.toString()}
                />

                <StatCard
                    title="Completed"
                    value={completedInterviews.length.toString()}
                />

                <StatCard
                    title="Average Score"
                    value={`${averageScore}%`}
                />
            </View>

            {/* RECENT INTERVIEWS */}
            <Text style={styles.sectionTitle}>Recent Interviews</Text>

            {recentInterviews.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>
                        No Interviews Yet
                    </Text>
                    <Text style={styles.emptyDescription}>
                        Your interview history will appear here.
                    </Text>
                </View>
            ) : (
                recentInterviews.map((interview, index) => {
                    const score =
                        interview.overall_score ?? interview.score;

                    return (
                        <View
                            key={
                                interview._id ||
                                interview.interview_id ||
                                interview.interview_code ||
                                index.toString()
                            }
                            style={styles.interviewCard}
                        >
                            <Text style={styles.interviewRole}>
                                {interview.job_role || "Interview"}
                            </Text>

                            <Text style={styles.interviewDate}>
                                {formatDate(interview.created_at)}
                            </Text>

                            <Text style={styles.interviewDetail}>
                                {interview.interview_type || "General"} •{" "}
                                {interview.difficulty || "Medium"}
                            </Text>

                            <View style={styles.interviewFooter}>
                                <Text
                                    style={[
                                        styles.status,
                                        {
                                            color: getStatusColor(
                                                interview.status
                                            ),
                                        },
                                    ]}
                                >
                                    {interview.status || "Created"}
                                </Text>

                                <Text style={styles.score}>
                                    {typeof score === "number"
                                        ? `${score}%`
                                        : "Score pending"}
                                </Text>
                            </View>
                        </View>
                    );
                })
            )}
        </ScrollView>
    );
};

const InfoRow = ({
    label,
    value,
}: {
    label: string;
    value: string;
}) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const StatCard = ({
    title,
    value,
}: {
    title: string;
    value: string;
}) => (
    <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FB",
    },
    content: {
        padding: 18,
        paddingBottom: 35,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FB",
    },
    loadingText: {
        marginTop: 12,
        color: "#64748B",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 22,
    },
    logo: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#1E40AF",
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 3,
    },
    logoutButton: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    logoutText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    welcomeCard: {
        backgroundColor: "#1E40AF",
        padding: 22,
        borderRadius: 15,
        marginBottom: 25,
    },
    welcomeTitle: {
        fontSize: 23,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    welcomeDescription: {
        color: "#DBEAFE",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 9,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1E293B",
        marginBottom: 13,
        marginTop: 5,
    },
    infoCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 23,
    },
    infoRow: {
        marginBottom: 15,
    },
    infoLabel: {
        color: "#64748B",
        fontSize: 12,
        marginBottom: 5,
    },
    infoValue: {
        color: "#1E293B",
        fontSize: 14,
        fontWeight: "600",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15,
        flexGrow: 1,
        flexBasis: "30%",
        minWidth: 95,
        alignItems: "center",
    },
    statValue: {
        fontSize: 23,
        fontWeight: "bold",
        color: "#1D4ED8",
    },
    statTitle: {
        color: "#64748B",
        fontSize: 11,
        textAlign: "center",
        marginTop: 7,
    },
    emptyCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 22,
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#334155",
    },
    emptyDescription: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 7,
        textAlign: "center",
    },
    interviewCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    interviewRole: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1E293B",
    },
    interviewDate: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 5,
    },
    interviewDetail: {
        color: "#475569",
        fontSize: 13,
        marginTop: 10,
    },
    interviewFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 14,
    },
    status: {
        fontWeight: "600",
        fontSize: 13,
        textTransform: "capitalize",
    },
    score: {
        fontWeight: "bold",
        color: "#1D4ED8",
    },
});

export default UserDashboardScreen;
