
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

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface AdminStats {
    total_users: number;
    total_interviews: number;
    completed_interviews: number;
    total_problem_reports: number;
    pending_evaluations: number;
    in_progress_interviews: number;
}

const initialStats: AdminStats = {
    total_users: 0,
    total_interviews: 0,
    completed_interviews: 0,
    total_problem_reports: 0,
    pending_evaluations: 0,
    in_progress_interviews: 0,
};

const statCards = [
    {
        key: "total_users",
        title: "Total Users",
        icon: "👥",
        description: "Registered accounts",
    },
    {
        key: "total_interviews",
        title: "Total Interviews",
        icon: "📋",
        description: "All interview records",
    },
    {
        key: "completed_interviews",
        title: "Completed",
        icon: "✅",
        description: "Finished interviews",
    },
    {
        key: "total_problem_reports",
        title: "Problem Reports",
        icon: "📨",
        description: "All submitted reports",
    },
    {
        key: "in_progress_interviews",
        title: "In Progress",
        icon: "🎯",
        description: "Currently running",
    },
] as const;

const adminActions = [
    {
        title: "Admin Profile",
        description: "View administrator account details",
        icon: "🛡️",
    },
    {
        title: "User Management",
        description: "Manage registered users",
        icon: "👥",
    },
    {
        title: "Interview Management",
        description: "View interview records and activity",
        icon: "📋",
    },
    {
        title: "Problem Reports",
        description: "Review submitted problem reports",
        icon: "📨",
    },
    {
        title: "Announcements",
        description: "Create and manage announcements",
        icon: "📢",
    },
    {
        title: "Review Management",
        description: "Approve and manage user reviews",
        icon: "⭐",
    },
    {
        title: "Export Reports",
        description: "Export platform reports",
        icon: "📊",
    },
    {
        title: "Activity Logs",
        description: "Monitor platform activities",
        icon: "📜",
    },
    {
        title: "Settings",
        description: "Manage administrator settings",
        icon: "⚙️",
    },
];

const AdminDashboardScreen = () => {
    const { user, logout } = useAuth();

    const [stats, setStats] = useState<AdminStats>(initialStats);
    const [openReportCount, setOpenReportCount] = useState(0);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const totalNotifications = openReportCount + pendingReviewCount;

    // ==========================================
    // FETCH ADMIN STATISTICS
    // ==========================================
    const fetchStats = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/api/admin/stats");

            if (response.data?.success) {
                setStats({
                    ...initialStats,
                    ...response.data.stats,
                });
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load dashboard statistics."
                );
            }
        } catch (err: any) {
            console.error("Admin stats error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load statistics. Please try again."
            );
        }
    }, []);

    // ==========================================
    // FETCH OPEN PROBLEM REPORT COUNT
    // ==========================================
    const fetchOpenReportCount = useCallback(async () => {
        try {
            const response = await api.get(
                "/api/admin/problem-reports"
            );

            if (response.data?.success) {
                const reports = Array.isArray(response.data.reports)
                    ? response.data.reports
                    : [];

                const count = reports.filter(
                    (report: any) =>
                        String(report.status || "Open").toLowerCase() ===
                        "open"
                ).length;

                setOpenReportCount(count);
            }
        } catch (err) {
            console.error("Problem report notification error:", err);
        }
    }, []);

    // ==========================================
    // FETCH PENDING REVIEW COUNT
    // ==========================================
    const fetchPendingReviewCount = useCallback(async () => {
        try {
            const response = await api.get("/api/admin/reviews");

            if (response.data?.success) {
                const reviews = Array.isArray(response.data.reviews)
                    ? response.data.reviews
                    : [];

                const count = reviews.filter(
                    (review: any) =>
                        String(review.status || "pending").toLowerCase() ===
                        "pending"
                ).length;

                setPendingReviewCount(count);
            }
        } catch (err) {
            console.error("Pending review notification error:", err);
        }
    }, []);

    // ==========================================
    // LOAD DASHBOARD
    // ==========================================
    const loadDashboard = useCallback(async () => {
        await Promise.all([
            fetchStats(),
            fetchOpenReportCount(),
            fetchPendingReviewCount(),
        ]);

        setLoading(false);
        setRefreshing(false);
    }, [
        fetchStats,
        fetchOpenReportCount,
        fetchPendingReviewCount,
    ]);

    useEffect(() => {
        loadDashboard();

        const intervalId = setInterval(() => {
            fetchOpenReportCount();
            fetchPendingReviewCount();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [
        loadDashboard,
        fetchOpenReportCount,
        fetchPendingReviewCount,
    ]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    // ==========================================
    // LOGOUT
    // ==========================================
    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (err) {
                            console.error("Admin logout error:", err);
                        }
                    },
                },
            ]
        );
    };

    // ==========================================
    // ACTION PLACEHOLDER
    // ==========================================
    const handleAction = (title: string) => {
        Alert.alert(
            title,
            `${title} mobile screen will be added in the next development steps.`
        );
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>
                    Loading Admin Dashboard...
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
                    <Text style={styles.adminBadge}>ADMIN PANEL</Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* NOTIFICATIONS */}
            <TouchableOpacity
                style={styles.notificationCard}
                onPress={() => handleAction("Notifications")}
            >
                <Text style={styles.notificationIcon}>🔔</Text>

                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                        Notifications
                    </Text>

                    <Text style={styles.notificationDescription}>
                        {totalNotifications} pending items
                    </Text>
                </View>

                <View style={styles.notificationCounts}>
                    <Text style={styles.notificationCount}>
                        📨 {openReportCount}
                    </Text>
                    <Text style={styles.notificationCount}>
                        ⭐ {pendingReviewCount}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* WELCOME */}
            <View style={styles.welcomeCard}>
                <Text style={styles.eyebrow}>ADMINISTRATION</Text>

                <Text style={styles.welcomeTitle}>
                    Welcome back, {user?.name || "Admin"}! 👋
                </Text>

                <Text style={styles.welcomeDescription}>
                    Monitor users, manage interview activity, and track
                    your platform's performance.
                </Text>

                <Text style={styles.shieldIcon}>🛡️</Text>
            </View>

            {/* ERROR */}
            {error ? (
                <View style={styles.errorCard}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>

                    <TouchableOpacity onPress={loadDashboard}>
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {/* PLATFORM OVERVIEW */}
            <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>
                        Platform Overview
                    </Text>
                    <Text style={styles.sectionDescription}>
                        Summary of current platform activity.
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={onRefresh}
                    disabled={refreshing}
                    style={styles.refreshButton}
                >
                    <Text style={styles.refreshText}>↻ Refresh</Text>
                </TouchableOpacity>
            </View>

            {/* STATISTICS */}
            <View style={styles.statsGrid}>
                {statCards.map((card) => (
                    <View
                        key={card.key}
                        style={styles.statCard}
                    >
                        <View style={styles.statTop}>
                            <Text style={styles.statIcon}>
                                {card.icon}
                            </Text>

                            <Text style={styles.statTitle}>
                                {card.title}
                            </Text>
                        </View>

                        <Text style={styles.statValue}>
                            {Number(stats[card.key]) || 0}
                        </Text>

                        <Text style={styles.statDescription}>
                            {card.description}
                        </Text>
                    </View>
                ))}
            </View>

            {/* PLATFORM ACTIVITY */}
            <Text style={styles.sectionTitle}>
                Platform Activity
            </Text>

            <Text style={styles.sectionDescription}>
                Manage users, interviews, and platform features.
            </Text>

            <View style={styles.actionList}>
                {adminActions.map((action) => (
                    <TouchableOpacity
                        key={action.title}
                        style={styles.actionCard}
                        onPress={() => handleAction(action.title)}
                    >
                        <View style={styles.actionIconBox}>
                            <Text style={styles.actionIcon}>
                                {action.icon}
                            </Text>
                        </View>

                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>
                                {action.title}
                            </Text>

                            <Text style={styles.actionDescription}>
                                {action.description}
                            </Text>
                        </View>

                        <Text style={styles.actionArrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ADMIN ACCOUNT */}
            <Text style={styles.sectionTitle}>
                Administrator Account
            </Text>

            <Text style={styles.sectionDescription}>
                Your currently signed-in account details.
            </Text>

            <View style={styles.accountCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {(user?.name || "A").charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                        {user?.name || "Admin"}
                    </Text>

                    <Text style={styles.accountEmail}>
                        {user?.email || "Email not available"}
                    </Text>

                    <Text style={styles.roleBadge}>
                        {user?.role || "admin"}
                    </Text>
                </View>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
                <Text style={styles.footerLogo}>
                    AI Interview Assist
                </Text>

                <Text style={styles.footerTagline}>
                    Manage smarter. Perform better.
                </Text>

                <Text style={styles.footerCopyright}>
                    © {new Date().getFullYear()} AI Interview Assist.
                    All rights reserved.
                </Text>

                <Text style={styles.footerPanel}>
                    🟢 Administrator Panel
                </Text>
            </View>
        </ScrollView>
    );
};

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
        marginBottom: 18,
    },
    logo: {
        fontSize: 19,
        fontWeight: "bold",
        color: "#1E40AF",
    },
    adminBadge: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#7C3AED",
        letterSpacing: 1,
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: "#FEE2E2",
        paddingVertical: 5,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    logoutText: {
        color: "#DC2626",
        fontWeight: "600",
    },
    notificationCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },
    notificationIcon: {
        fontSize: 25,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        color: "#1E293B",
        fontSize: 15,
        fontWeight: "bold",
    },
    notificationDescription: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 3,
    },
    notificationCounts: {
        alignItems: "flex-end",
    },
    notificationCount: {
        color: "#475569",
        fontSize: 12,
        marginVertical: 2,
    },
    welcomeCard: {
        backgroundColor: "#312E81",
        padding: 22,
        borderRadius: 15,
        marginBottom: 25,
        overflow: "hidden",
    },
    eyebrow: {
        color: "#C4B5FD",
        fontSize: 11,
        fontWeight: "bold",
        letterSpacing: 1.5,
    },
    welcomeTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 12,
        paddingRight: 25,
    },
    welcomeDescription: {
        color: "#E0E7FF",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 10,
        paddingRight: 20,
    },
    shieldIcon: {
        fontSize: 32,
        marginTop: 15,
    },
    errorCard: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        borderWidth: 1,
        borderRadius: 10,
        padding: 14,
        marginBottom: 20,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
    },
    retryText: {
        color: "#1D4ED8",
        fontWeight: "bold",
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionHeaderText: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1E293B",
        marginTop: 8,
        marginBottom: 6,
    },
    sectionDescription: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 13,
    },
    refreshButton: {
        backgroundColor: "#DBEAFE",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 8,
    },
    refreshText: {
        color: "#1D4ED8",
        fontSize: 12,
        fontWeight: "600",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 11,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 15,
        flexBasis: "47%",
        flexGrow: 1,
        minWidth: 135,
    },
    statTop: {
        flexDirection: "row",
        alignItems: "center",
    },
    statIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    statTitle: {
        fontSize: 12,
        color: "#475569",
        fontWeight: "600",
        flexShrink: 1,
    },
    statValue: {
        fontSize: 27,
        fontWeight: "bold",
        color: "#1D4ED8",
        marginTop: 15,
    },
    statDescription: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 5,
    },
    actionList: {
        marginBottom: 22,
    },
    actionCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
    },
    actionIconBox: {
        width: 43,
        height: 43,
        borderRadius: 11,
        backgroundColor: "#EEF2FF",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    actionIcon: {
        fontSize: 21,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        color: "#1E293B",
        fontSize: 14,
        fontWeight: "bold",
    },
    actionDescription: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 4,
        lineHeight: 16,
    },
    actionArrow: {
        fontSize: 25,
        color: "#64748B",
        marginLeft: 8,
    },
    accountCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 17,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 13,
    },
    avatarText: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#1D4ED8",
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#1E293B",
    },
    accountEmail: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 4,
    },
    roleBadge: {
        color: "#7C3AED",
        fontSize: 11,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginTop: 6,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: "#E2E8F0",
        paddingTop: 20,
        alignItems: "center",
    },
    footerLogo: {
        color: "#1E40AF",
        fontSize: 16,
        fontWeight: "bold",
    },
    footerTagline: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 5,
    },
    footerCopyright: {
        color: "#94A3B8",
        fontSize: 10,
        textAlign: "center",
        marginTop: 18,
    },
    footerPanel: {
        color: "#16A34A",
        fontSize: 11,
        fontWeight: "600",
        marginTop: 10,
    },
});

export default AdminDashboardScreen;
