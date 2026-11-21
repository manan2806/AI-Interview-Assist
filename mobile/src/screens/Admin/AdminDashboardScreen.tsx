
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

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
        description: "Registered accounts",
        icon: "👥",
        color: "#6257D9",
        background: "#EEF2FF",
    },
    {
        key: "total_interviews",
        title: "Total Interviews",
        description: "All interview records",
        icon: "📋",
        color: "#2563EB",
        background: "#DBEAFE",
    },
    {
        key: "completed_interviews",
        title: "Completed",
        description: "Finished interviews",
        icon: "✅",
        color: "#16A34A",
        background: "#DCFCE7",
    },
    {
        key: "total_problem_reports",
        title: "Problem Reports",
        description: "All submitted reports",
        icon: "📨",
        color: "#EA580C",
        background: "#FFEDD5",
    },
    {
        key: "in_progress_interviews",
        title: "In Progress",
        description: "Currently running",
        icon: "🎯",
        color: "#7C3AED",
        background: "#F3E8FF",
    },
] as const;

const adminActions = [
    {
        title: "Admin Profile",
        description: "View your administrator account details.",
        icon: "🛡️",
        color: "#7C3AED",
        background: "#F3E8FF",
    },
    {
        title: "User Management",
        description: "Manage registered users and accounts.",
        icon: "👥",
        color: "#2563EB",
        background: "#DBEAFE",
    },
    {
        title: "Interview Management",
        description: "View interview records and activity.",
        icon: "📋",
        color: "#16A34A",
        background: "#DCFCE7",
    },
    {
        title: "Problem Reports",
        description: "Review reports and update their status.",
        icon: "📨",
        color: "#EA580C",
        background: "#FFEDD5",
    },
    {
        title: "Announcements",
        description: "Create and manage user announcements.",
        icon: "📢",
        color: "#7C3AED",
        background: "#F3E8FF",
    },
    {
        title: "Review Management",
        description: "Approve, hide and manage user reviews.",
        icon: "⭐",
        color: "#D97706",
        background: "#FEF3C7",
    },
    {
        title: "Export Reports",
        description: "Export platform reports in different formats.",
        icon: "📊",
        color: "#2563EB",
        background: "#DBEAFE",
    },
    {
        title: "Activity Logs",
        description: "Monitor user and administrator activities.",
        icon: "📜",
        color: "#7C3AED",
        background: "#F3E8FF",
    },
];

const AdminDashboardScreen = () => {
    const { user, logout } = useAuth();
    const { colors, theme } = useTheme();
    const navigation = useNavigation<any>();
    const isDark = theme === "Dark";

    const [stats, setStats] = useState<AdminStats>(initialStats);
    const [openReportCount, setOpenReportCount] = useState(0);
    const [pendingReviewCount, setPendingReviewCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const totalNotifications = openReportCount + pendingReviewCount;
    const getCountLabel = (count: number) =>
        count > 99 ? "99+" : String(count);

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

    // ==========================================
    // REFRESH
    // ==========================================
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
    // ADMIN NAVIGATION PLACEHOLDER
    // ==========================================
    const handleAction = (title: string) => {
        if (title === "User Management") {
            navigation.navigate("AdminUsers");
            return;
        }

        if (title === "Settings") {
            navigation.navigate("AdminSettings");
            return;
        }

        if (title === "Review Management") {
            navigation.navigate("AdminReviews");
            return;
        }

        if (title === "Export Reports") {
            navigation.navigate("AdminReports");
            return;
        }

        if (title === "Admin Profile" || title === "My Profile") {
            navigation.navigate("AdminProfile");
            return;
        }

        if (title === "Problem Reports") {
            navigation.navigate("AdminProblemReports");
            return;
        }

        if (title === "Interview Management") {
            navigation.navigate("AdminInterview");
            return;
        }

        if (title === "Announcements") {
            navigation.navigate("AdminAnnouncements");
            return;
        }

        if (title === "Activity Logs") {
            navigation.navigate("AdminActivityLogs");
            return;
        }

        Alert.alert(
            title,
            `${title} screen will be connected in its development step.`
        );
    };

    const handleMenuAction = (title: string) => {
        setMobileMenuOpen(false);
        if (title === "Dashboard") {
            return;
        }
        if (title === "Logout") {
            handleLogout();
            return;
        }
        handleAction(title);
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <View
                style={[
                    styles.loader,
                    { backgroundColor: colors.background },
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
                <Text
                    style={[
                        styles.loadingText,
                        { color: colors.muted },
                    ]}
                >
                    Loading Admin Dashboard...
                </Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView
                style={[
                    styles.container,
                    { backgroundColor: colors.background },
                ]}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* ==================================
                HEADER
            ================================== */}
                <View style={styles.header}>
                    <View style={styles.brandContainer}>
                        <View style={styles.brandIcon}>
                            <Text style={styles.brandIconText}>AI</Text>
                        </View>

                        <View style={styles.brandTextContainer}>
                            <Text
                                style={[
                                    styles.logo,
                                    { color: colors.text },
                                ]}
                            >
                                Interview Assist
                            </Text>

                            <Text style={styles.adminBadge}>
                                ADMIN PANEL
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.menuButton,
                            {
                                backgroundColor: isDark ? "#303B60" : "#EEF2FF",
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => {
                            setMobileMenuOpen((previous) => !previous);
                            setNotificationsOpen(false);
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.menuButtonText, { color: colors.text }]}>
                            {mobileMenuOpen ? "✕" : "☰"}
                        </Text>

                        {!mobileMenuOpen && totalNotifications > 0 && (
                            <View style={styles.menuNotificationBadge}>
                                <Text style={styles.menuNotificationBadgeText}>
                                    {getCountLabel(totalNotifications)}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ==================================
                WELCOME SECTION
            ================================== */}
                <View style={styles.welcomeCard}>
                    <View style={styles.welcomeTextContainer}>
                        <Text style={styles.eyebrow}>
                            ADMINISTRATION
                        </Text>

                        <Text style={styles.welcomeTitle}>
                            Welcome back, {user?.name || "Admin"}! 👋
                        </Text>

                        <Text style={styles.welcomeDescription}>
                            Monitor users, manage interview activity,
                            and track your platform's performance.
                        </Text>
                    </View>

                    <Text style={styles.shieldIcon}>🛡️</Text>
                </View>

                {/* ==================================
                ERROR MESSAGE
            ================================== */}
                {error ? (
                    <View
                        style={[
                            styles.errorCard,
                            {
                                backgroundColor: isDark
                                    ? "#3B252D"
                                    : "#FEF2F2",
                                borderColor: isDark
                                    ? "#75404D"
                                    : "#FECACA",
                            },
                        ]}
                    >
                        <Text style={styles.errorText}>
                            ⚠️ {error}
                        </Text>

                        <TouchableOpacity onPress={loadDashboard}>
                            <Text
                                style={[
                                    styles.retryText,
                                    { color: colors.primary },
                                ]}
                            >
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* ==================================
                PLATFORM OVERVIEW
            ================================== */}
                <View style={styles.sectionHeader}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.text },
                            ]}
                        >
                            Platform Overview
                        </Text>

                        <Text
                            style={[
                                styles.sectionDescription,
                                { color: colors.muted },
                            ]}
                        >
                            A summary of your platform's current activity.
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={onRefresh}
                        disabled={refreshing}
                        style={[
                            styles.refreshButton,
                            {
                                backgroundColor: isDark
                                    ? "#303B60"
                                    : "#DBEAFE",
                            },
                        ]}
                    >
                        <Text style={styles.refreshText}>
                            ↻ Refresh
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ==================================
                STATISTICS CARDS
            ================================== */}
                <View style={styles.statsGrid}>
                    {statCards.map((card) => (
                        <View
                            key={card.key}
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.statTop}>
                                <View
                                    style={[
                                        styles.statIconBox,
                                        { backgroundColor: card.background },
                                    ]}
                                >
                                    <Text style={styles.statIcon}>
                                        {card.icon}
                                    </Text>
                                </View>

                                <Text
                                    style={[
                                        styles.statTitle,
                                        { color: colors.muted },
                                    ]}
                                >
                                    {card.title}
                                </Text>
                            </View>

                            <Text
                                style={[
                                    styles.statValue,
                                    { color: card.color },
                                ]}
                            >
                                {Number(stats[card.key]) || 0}
                            </Text>

                            <Text
                                style={[
                                    styles.statDescription,
                                    { color: colors.muted },
                                ]}
                            >
                                {card.description}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* ==================================
                PLATFORM ACTIVITY
            ================================== */}
                <View style={styles.activityHeading}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Platform Activity
                    </Text>

                    <Text
                        style={[
                            styles.sectionDescription,
                            { color: colors.muted },
                        ]}
                    >
                        Manage users, interviews, and platform features.
                    </Text>
                </View>

                <View style={styles.actionList}>
                    {adminActions.map((action) => (
                        <TouchableOpacity
                            key={action.title}
                            style={[
                                styles.actionCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                            onPress={() => handleAction(action.title)}
                            activeOpacity={0.75}
                        >
                            <View
                                style={[
                                    styles.actionIconBox,
                                    { backgroundColor: action.background },
                                ]}
                            >
                                <Text style={styles.actionIcon}>
                                    {action.icon}
                                </Text>
                            </View>

                            <View style={styles.actionContent}>
                                <Text
                                    style={[
                                        styles.actionTitle,
                                        { color: colors.text },
                                    ]}
                                >
                                    {action.title}
                                </Text>

                                <Text
                                    style={[
                                        styles.actionDescription,
                                        { color: colors.muted },
                                    ]}
                                >
                                    {action.description}
                                </Text>
                            </View>

                            <Text
                                style={[
                                    styles.actionArrow,
                                    { color: colors.muted },
                                ]}
                            >
                                ›
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* ==================================
                ADMINISTRATOR ACCOUNT
            ================================== */}
                <View style={styles.accountHeading}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: colors.text },
                        ]}
                    >
                        Administrator Account
                    </Text>

                    <Text
                        style={[
                            styles.sectionDescription,
                            { color: colors.muted },
                        ]}
                    >
                        Your currently signed-in account details.
                    </Text>
                </View>

                <View
                    style={[
                        styles.accountCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {(user?.name || "A").charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.accountInfo}>
                        <Text
                            style={[
                                styles.accountName,
                                { color: colors.text },
                            ]}
                        >
                            {user?.name || "Admin"}
                        </Text>

                        <Text
                            style={[
                                styles.accountEmail,
                                { color: colors.muted },
                            ]}
                        >
                            {user?.email || "Email not available"}
                        </Text>

                        <Text style={styles.roleBadge}>
                            {user?.role || "Admin"}
                        </Text>
                    </View>
                </View>

                {/* ==================================
                FOOTER
            ================================== */}

                {/* FOOTER */}
                <View
                    style={[
                        styles.footer,
                        {
                            borderTopColor: colors.border,
                            backgroundColor: colors.background,
                        },
                    ]}
                >
                    <View style={styles.footerBrand}>
                        <View style={styles.footerLogoBox}>
                            <Text style={styles.footerLogoText}>AI</Text>
                        </View>

                        <View style={styles.footerBrandInfo}>
                            <Text
                                style={[
                                    styles.footerLogo,
                                    { color: colors.text },
                                ]}
                            >
                                AI Interview Assist
                            </Text>

                            <Text
                                style={[
                                    styles.footerTagline,
                                    { color: colors.muted },
                                ]}
                            >
                                Trust • Practise • Success
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.footerDivider,
                            { backgroundColor: colors.border },
                        ]}
                    />

                    <Text
                        style={[
                            styles.footerCopyright,
                            { color: colors.muted },
                        ]}
                    >
                        © {new Date().getFullYear()} AI Interview Assist.
                        {"\n"}All rights reserved.
                    </Text>

                    <View style={styles.footerPanel}>
                        <View style={styles.footerStatusDot} />

                        <Text style={styles.footerPanelText}>
                            Administrator Panel
                        </Text>
                    </View>
                </View>

            </ScrollView>
            {/* ==================================
            ADMIN MOBILE MENU
        ================================== */}
            <Modal
                visible={mobileMenuOpen}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setMobileMenuOpen(false)}
            >
                <View style={styles.menuModalContainer}>
                    {/* BACKDROP */}
                    <Pressable
                        style={styles.menuBackdrop}
                        onPress={() => setMobileMenuOpen(false)}
                    />

                    {/* MENU */}
                    <View
                        style={[
                            styles.mobileMenuDropdown,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {/* MENU HEADER */}
                        <View
                            style={[
                                styles.menuHeading,
                                { backgroundColor: colors.header },
                            ]}
                        >
                            <View style={styles.menuHeadingIcon}>
                                <Text style={styles.menuHeadingEmoji}>🛡️</Text>
                            </View>

                            <View style={styles.menuHeadingInfo}>
                                <Text
                                    style={[
                                        styles.menuHeadingTitle,
                                        { color: colors.text },
                                    ]}
                                >
                                    Admin Menu
                                </Text>

                                <Text
                                    style={[
                                        styles.menuHeadingSubtitle,
                                        { color: colors.muted },
                                    ]}
                                >
                                    Administrator Panel
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => setMobileMenuOpen(false)}
                                style={[
                                    styles.menuCloseButton,
                                    {
                                        backgroundColor: isDark ? "#374151" : "#F1F5F9",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.menuCloseText,
                                        { color: colors.text },
                                    ]}
                                >
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            persistentScrollbar={true}
                            indicatorStyle={isDark ? "white" : "black"}
                            style={styles.mobileMenuScroll}
                            nestedScrollEnabled={true}
                        >
                            {/* NOTIFICATION LINKS */}
                            <TouchableOpacity
                                style={[
                                    styles.mobileNotificationLink,
                                    { backgroundColor: isDark ? "#302B3D" : "#F5F3FF" },
                                ]}
                                onPress={() => handleMenuAction("Problem Reports")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>📨</Text>

                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text, flex: 1 },
                                    ]}
                                >
                                    Problem Reports
                                </Text>

                                {openReportCount > 0 && (
                                    <View style={styles.reportCount}>
                                        <Text style={styles.menuCountText}>
                                            {getCountLabel(openReportCount)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.mobileNotificationLink,
                                    { backgroundColor: isDark ? "#3B3525" : "#FFFBEB" },
                                ]}
                                onPress={() => handleMenuAction("Review Management")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>⭐</Text>

                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text, flex: 1 },
                                    ]}
                                >
                                    User Reviews
                                </Text>

                                {pendingReviewCount > 0 && (
                                    <View style={styles.reviewCount}>
                                        <Text style={styles.menuCountText}>
                                            {getCountLabel(pendingReviewCount)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View
                                style={[
                                    styles.mobileMenuDivider,
                                    { backgroundColor: colors.border },
                                ]}
                            />

                            {/* DASHBOARD */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Dashboard")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>🏠</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Dashboard
                                </Text>
                            </TouchableOpacity>

                            {/* PROFILE */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Admin Profile")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>👤</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    My Profile
                                </Text>
                            </TouchableOpacity>

                            {/* USERS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("User Management")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>👥</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    User Management
                                </Text>
                            </TouchableOpacity>

                            {/* INTERVIEWS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Interview Management")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>📋</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Interview Management
                                </Text>
                            </TouchableOpacity>

                            {/* ANNOUNCEMENTS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Announcements")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>📢</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Announcements
                                </Text>
                            </TouchableOpacity>

                            {/* REPORTS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Export Reports")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>📊</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Export Reports
                                </Text>
                            </TouchableOpacity>

                            {/* ACTIVITY LOGS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Activity Logs")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>📜</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Activity Logs
                                </Text>
                            </TouchableOpacity>

                            {/* SETTINGS */}
                            <TouchableOpacity
                                style={styles.mobileMenuItem}
                                onPress={() => handleMenuAction("Settings")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>⚙️</Text>
                                <Text
                                    style={[
                                        styles.mobileMenuItemText,
                                        { color: colors.text },
                                    ]}
                                >
                                    Settings
                                </Text>
                            </TouchableOpacity>

                            <View
                                style={[
                                    styles.mobileMenuDivider,
                                    { backgroundColor: colors.border },
                                ]}
                            />

                            {/* LOGOUT */}
                            <TouchableOpacity
                                style={[
                                    styles.mobileLogoutButton,
                                    {
                                        backgroundColor: isDark
                                            ? "#3A222B"
                                            : "#FFF1F2",
                                        borderColor: isDark
                                            ? "#75404D"
                                            : "#FFE4E6",
                                    },
                                ]}
                                onPress={() => handleMenuAction("Logout")}
                            >
                                <Text style={styles.mobileMenuItemIcon}>🚪</Text>

                                <Text style={styles.mobileLogoutText}>
                                    Logout
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 35,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    menuButton: {
        width: 43,
        height: 43,
        borderRadius: 11,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    menuButtonText: {
        fontSize: 23,
        fontWeight: "600",
    },
    menuNotificationBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        minWidth: 19,
        height: 19,
        borderRadius: 10,
        backgroundColor: "#DC2626",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: "#FFFFFF",
    },
    menuNotificationBadgeText: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "bold",
    },
    menuModalContainer: {
        flex: 1,
        alignItems: "flex-end",
        paddingTop: 80,
        paddingRight: 14,
    },

    menuBackdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0,0,0,0.15)",
    },
    mobileMenuDropdown: {
        width: "78%",
        maxWidth: 310,
        maxHeight: "70%",
        borderRadius: 15,
        borderWidth: 1,
        padding: 12,
        elevation: 15,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    menuHeading: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 10,
    },

    menuHeadingIcon: {
        width: 40,
        height: 40,
        borderRadius: 11,
        backgroundColor: "#6257D9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 11,
    },

    menuHeadingEmoji: {
        fontSize: 20,
    },

    menuHeadingInfo: {
        flex: 1,
    },

    menuHeadingTitle: {
        fontSize: 14,
        fontWeight: "bold",
    },

    menuHeadingSubtitle: {
        fontSize: 11,
        marginTop: 4,
    },

    menuCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },

    menuCloseText: {
        fontSize: 15,
        fontWeight: "bold",
    },
    mobileMenuHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#64748B",
        marginBottom: 12,
    },
    mobileMenuTitle: {
        fontSize: 17,
        fontWeight: "bold",
    },
    mobileMenuPending: {
        fontSize: 11,
        marginTop: 4,
    },
    mobileMenuScroll: {
        flexGrow: 1,
        maxHeight: 560,
    },
    mobileNotificationLink: {
        minHeight: 46,
        borderRadius: 9,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
        marginBottom: 4,
    },
    mobileMenuItem: {
        minHeight: 47,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 9,
        borderRadius: 9,
    },
    mobileMenuItemIcon: {
        fontSize: 19,
        width: 35,
    },
    mobileMenuItemText: {
        fontSize: 13,
        fontWeight: "600",
    },
    mobileMenuDivider: {
        height: 1,
        marginVertical: 10,
    },
    menuCountText: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "bold",
        textAlign: "center",
    },
    mobileLogoutButton: {
        minHeight: 45,
        borderRadius: 9,
        borderWidth: 1,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    mobileLogoutText: {
        color: "#DC2626",
        fontSize: 13,
        fontWeight: "bold",
    },
    brandContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    brandIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: "#6257D9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    brandIconText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "bold",
    },
    brandTextContainer: {
        flex: 1,
    },
    logo: {
        fontSize: 16,
        fontWeight: "bold",
    },
    adminBadge: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#8B5CF6",
        letterSpacing: 1.2,
        marginTop: 4,
    },
    logoutButton: {
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 9,
        marginLeft: 5,
    },
    logoutText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "bold",
    },
    notificationCard: {
        borderWidth: 1,
        borderRadius: 13,
        marginBottom: 18,
        overflow: "hidden",
    },
    notificationHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 13,
    },
    notificationIconBox: {
        width: 42,
        height: 42,
        borderRadius: 11,
        backgroundColor: "#FEF3C7",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 11,
    },
    notificationIcon: {
        fontSize: 22,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: "bold",
    },
    notificationDescription: {
        fontSize: 11,
        marginTop: 4,
    },
    totalBadge: {
        backgroundColor: "#DC2626",
        minWidth: 23,
        height: 23,
        borderRadius: 12,
        paddingHorizontal: 5,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    totalBadgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "bold",
    },
    notificationChevron: {
        fontSize: 11,
    },
    notificationDropdown: {
        borderTopWidth: 1,
        padding: 13,
    },
    dropdownHeading: {
        fontSize: 13,
        fontWeight: "bold",
        marginBottom: 9,
    },
    notificationItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#64748B",
    },
    notificationItemIcon: {
        fontSize: 22,
        marginRight: 11,
    },
    notificationItemContent: {
        flex: 1,
    },
    notificationItemTitle: {
        fontSize: 12,
        fontWeight: "bold",
    },
    notificationItemDescription: {
        fontSize: 10,
        marginTop: 4,
    },
    reportCount: {
        backgroundColor: "#DC2626",
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    reviewCount: {
        backgroundColor: "#D97706",
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    emptyNotification: {
        textAlign: "center",
        fontSize: 12,
        paddingVertical: 15,
    },
    welcomeCard: {
        backgroundColor: "#312E81",
        padding: 21,
        borderRadius: 16,
        marginBottom: 25,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
    },
    welcomeTextContainer: {
        flex: 1,
    },
    eyebrow: {
        color: "#C4B5FD",
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1.5,
    },
    welcomeTitle: {
        color: "#FFFFFF",
        fontSize: 21,
        fontWeight: "bold",
        marginTop: 12,
        lineHeight: 29,
    },
    welcomeDescription: {
        color: "#E0E7FF",
        fontSize: 12,
        lineHeight: 19,
        marginTop: 9,
    },
    shieldIcon: {
        fontSize: 34,
        marginLeft: 8,
    },
    errorCard: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 13,
        marginBottom: 18,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 12,
    },
    retryText: {
        fontWeight: "bold",
        fontSize: 12,
        marginTop: 10,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
    },
    sectionDescription: {
        fontSize: 11,
        lineHeight: 17,
    },
    refreshButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginLeft: 7,
    },
    refreshText: {
        color: "#2563EB",
        fontSize: 11,
        fontWeight: "bold",
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 11,
        marginBottom: 24,
    },
    statCard: {
        borderWidth: 1,
        borderRadius: 13,
        padding: 13,
        width: "48%",
        flexGrow: 1,
        minWidth: 130,
    },
    statTop: {
        flexDirection: "row",
        alignItems: "center",
    },
    statIconBox: {
        width: 34,
        height: 34,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
    },
    statIcon: {
        fontSize: 18,
    },
    statTitle: {
        fontSize: 11,
        fontWeight: "600",
        flexShrink: 1,
    },
    statValue: {
        fontSize: 27,
        fontWeight: "bold",
        marginTop: 13,
    },
    statDescription: {
        fontSize: 10,
        marginTop: 4,
    },
    activityHeading: {
        marginBottom: 13,
    },
    actionList: {
        marginBottom: 24,
        gap: 10,
    },
    actionCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 13,
        flexDirection: "row",
        alignItems: "center",
    },
    actionIconBox: {
        width: 43,
        height: 43,
        borderRadius: 11,
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
        fontSize: 13,
        fontWeight: "bold",
    },
    actionDescription: {
        fontSize: 10,
        lineHeight: 15,
        marginTop: 4,
    },
    actionArrow: {
        fontSize: 25,
        marginLeft: 7,
    },
    accountHeading: {
        marginBottom: 12,
    },
    accountCard: {
        borderWidth: 1,
        borderRadius: 13,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 25,
    },
    avatar: {
        width: 49,
        height: 49,
        borderRadius: 25,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#2563EB",
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 14,
        fontWeight: "bold",
    },
    accountEmail: {
        fontSize: 11,
        marginTop: 4,
    },
    roleBadge: {
        color: "#8B5CF6",
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginTop: 6,
    },

    footer: {
        borderTopWidth: 1,
        paddingTop: 24,
        paddingBottom: 10,
        alignItems: "center",
        marginTop: 5,
    },

    footerBrand: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },

    footerLogoBox: {
        width: 46,
        height: 46,
        borderRadius: 13,
        backgroundColor: "#6257D9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    footerLogoText: {
        color: "#FFFFFF",
        fontSize: 19,
        fontWeight: "bold",
    },

    footerBrandInfo: {
        justifyContent: "center",
    },

    footerLogo: {
        fontSize: 16,
        fontWeight: "bold",
    },

    footerTagline: {
        fontSize: 12,
        marginTop: 5,
        letterSpacing: 0.3,
    },

    footerDivider: {
        width: "85%",
        height: 1,
        marginBottom: 17,
    },

    footerCopyright: {
        fontSize: 10,
        textAlign: "center",
        lineHeight: 18,
    },

    footerPanel: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#DCFCE7",
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 20,
        marginTop: 15,
    },

    footerStatusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#16A34A",
        marginRight: 7,
    },

    footerPanelText: {
        color: "#15803D",
        fontSize: 11,
        fontWeight: "700",
    },
});

export default AdminDashboardScreen;
