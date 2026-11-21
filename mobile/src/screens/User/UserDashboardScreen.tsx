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
import { getInterviewHistory } from "../../services/interviewService";
import { useTheme } from "../../context/ThemeContext";

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
    experience_level?: string;
    number_of_questions?: number;
    duration?: string;
    custom_duration?: number | null;
}

const UserDashboardScreen = ({ navigation }: any) => {
    const { user, logout } = useAuth();
    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadAnnouncementCount, setUnreadAnnouncementCount] = useState(0);

    // LOAD UNREAD ANNOUNCEMENTS
    useEffect(() => {
        let active = true;

        const loadUnreadAnnouncements = async () => {
            try {
                const response = await api.get("/api/announcements");

                const data = response.data;

                const announcements = Array.isArray(data)
                    ? data
                    : data?.announcements || [];

                const unreadCount = announcements.filter(
                    (item: any) => item.is_read === false
                ).length;

                if (active) {
                    setUnreadAnnouncementCount(unreadCount);
                }
            } catch (error: any) {
                console.error(
                    "Announcement Error:",
                    error?.response?.data || error?.message
                );
            }
        };

        loadUnreadAnnouncements();

        const intervalId = setInterval(
            loadUnreadAnnouncements,
            30000
        );

        return () => {
            active = false;
            clearInterval(intervalId);
        };
    }, []);

    // LOAD DASHBOARD DATA
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
                error?.response?.data || error?.message
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

    // STATISTICS
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

    // STATUS COLOR
    const getStatusColor = (status?: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
                return "#16A34A";
            case "in_progress":
                return "#2563EB";
            case "evaluating":
            case "evaluation_pending":
                return "#D97706";
            default:
                return "#64748B";
        }
    };

    // FORMAT DATE
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

    // TEMPORARY PAGE HANDLER
    const showComingSoon = (pageName: string) => {
        setMobileMenuOpen(false);

        Alert.alert(
            pageName,
            `${pageName} page will be available after we complete the mobile app conversion.`
        );
    };

    // LOGOUT
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
                        } catch (error) {
                            console.error("Logout error:", error);
                        }
                    },
                },
            ]
        );
    };

    // MENU ITEM COMPONENT
    const MenuItem = ({
        icon,
        title,
        onPress,
        danger = false,
        badge = 0,
    }: {
        icon: string;
        title: string;
        onPress: () => void;
        danger?: boolean;
        badge?: number;
    }) => (
        <TouchableOpacity
            style={[
                styles.menuItem,
                danger && [
                    styles.menuLogoutItem,
                    {
                        backgroundColor: isDark ? "#3A222B" : "#FFF1F2",
                        borderColor: isDark ? "#75404D" : "#FFE4E6",
                        borderWidth: 1,
                    },
                ],
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuIconContainer}>
                <Text style={styles.menuIcon}>{icon}</Text>
            </View>

            <Text
                style={[
                    styles.menuItemText,
                    {
                        color: danger
                            ? (isDark ? "#FF9AAE" : colors.danger)
                            : colors.text,
                    },
                    danger && styles.menuLogoutText,
                ]}
            >
                {title}
            </Text>

            {badge > 0 && (
                <View
                    style={[
                        styles.unreadBadge,
                        {
                            backgroundColor: isDark ? "#4C1D35" : "#FEE2E2",
                            borderColor: isDark ? "#9F456B" : "#FECACA",
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.unreadBadgeText,
                            {
                                color: isDark ? "#FDA4AF" : "#DC2626",
                            },
                        ]}
                    >
                        {badge > 99 ? "99+" : badge}
                    </Text>
                </View>
            )}

            {!danger && (
                <Text style={[styles.menuArrow, { color: colors.muted },]}>
                    ›
                </Text>
            )}
        </TouchableOpacity>
    );

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
                    Loading dashboard...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#4F46E5"]}
                />
            }
        >
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: colors.background },]}>
                <View style={styles.headerBrand}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoIconText}>AI</Text>
                    </View>

                    <View>
                        <Text style={[styles.logo, { color: colors.text }]}>
                            AI Interview Assist
                        </Text>

                        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
                            User Dashboard
                        </Text>
                    </View>
                </View>

                {/* MENU BUTTON */}
                <TouchableOpacity
                    style={[
                        styles.menuButton,
                        {
                            backgroundColor: colors.header,
                            borderColor: colors.border,
                        },
                        mobileMenuOpen && styles.menuButtonActive,
                    ]}
                    onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                        mobileMenuOpen
                            ? "Close navigation menu"
                            : "Open navigation menu"
                    }
                >
                    <Text style={styles.menuIcon}>
                        {mobileMenuOpen ? "✕" : "☰"}
                    </Text>

                    {!mobileMenuOpen && unreadAnnouncementCount > 0 && (
                        <View style={styles.menuNotificationBadge}>
                            <Text style={styles.menuNotificationBadgeText}>
                                {unreadAnnouncementCount > 99
                                    ? "99+"
                                    : unreadAnnouncementCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* DROPDOWN MENU */}
            {mobileMenuOpen && (
                <View style={styles.menuOverlay}>
                    <View
                        style={[
                            styles.mobileMenu,
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
                                <Text style={styles.menuHeadingEmoji}>👤</Text>
                            </View>

                            <View style={styles.menuHeadingInfo}>
                                <Text style={[styles.menuHeadingTitle, { color: colors.text }]}>
                                    My Dashboard
                                </Text>

                                <Text style={[styles.menuHeadingSubtitle, { color: colors.muted }]}>
                                    User Panel
                                </Text>
                            </View>
                        </View>

                        <View style={styles.menuDivider} />

                        {/* ANNOUNCEMENTS */}
                        <MenuItem
                            icon="🔔"
                            title="Announcements"
                            badge={unreadAnnouncementCount}
                            onPress={() => {
                                setMobileMenuOpen(false);
                                navigation.navigate("Announcements");
                            }}
                        />

                        {/* DASHBOARD */}
                        <MenuItem
                            icon="🏠"
                            title="Dashboard"
                            onPress={() => setMobileMenuOpen(false)}
                        />

                        {/* PROFILE */}
                        <MenuItem
                            icon="👤"
                            title="Profile"
                            onPress={() => {
                                setMobileMenuOpen(false);
                                navigation.navigate("Profile");
                            }}
                        />

                        {/* INTERVIEW HISTORY */}
                        <MenuItem
                            icon="📋"
                            title="Interview History"
                            onPress={() => {
                                setMobileMenuOpen(false);
                                navigation.navigate("InterviewHistory");
                            }}
                        />

                        {/* WRITE REVIEW */}
                        <MenuItem
                            icon="⭐"
                            title="Write a Review"
                            onPress={() => navigation.navigate("Reviews")}
                        />

                        {/* SETTINGS */}
                        <MenuItem
                            icon="⚙️"
                            title="Settings"
                            onPress={() => {
                                setMobileMenuOpen(false);
                                navigation.navigate("Settings");
                            }}
                        />

                        {/* SUPPORT */}
                        <MenuItem
                            icon="📞"
                            title="Help & Support"
                            onPress={() => {
                                setMobileMenuOpen(false);
                                navigation.navigate("Support");
                            }}
                        />

                        <View style={styles.menuDivider} />

                        {/* LOGOUT */}
                        <MenuItem
                            icon="🚪"
                            title="Logout"
                            danger
                            onPress={() => {
                                setMobileMenuOpen(false);
                                handleLogout();
                            }}
                        />
                    </View>
                </View>
            )}

            {/* WELCOME CARD */}
            <View
                style={[
                    styles.welcomeCard,
                    {
                        backgroundColor: isDark ? "#252044" : "#6366F1",
                        borderColor: isDark ? "#514B80" : "#6366F1",
                        borderWidth: 1,
                    },
                ]}
            >
                <View style={styles.welcomeTop}>
                    <View style={styles.welcomeBadge}>
                        <Text style={styles.welcomeBadgeText}>
                            ✨ YOUR LEARNING JOURNEY
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.welcomeTitle,
                            { color: "#FFFFFF" },
                        ]}
                    >
                        Welcome, {user?.name || "User"}!
                    </Text>

                    <Text
                        style={[
                            styles.welcomeDescription,
                            { color: "#E5E7FF" },
                        ]}
                    >
                        Track your interview preparation, monitor your
                        performance, and keep improving your skills.
                    </Text>
                </View>

                <View style={styles.welcomeBottom}>
                    <Text
                        style={[
                            styles.welcomeBottomText,
                            { color: "#FFFFFF" },
                        ]}
                    >
                        Every interview makes you better 🚀
                    </Text>
                </View>
            </View>

            {/* START NEW INTERVIEW */}
            <TouchableOpacity
                style={[
                    styles.startInterviewButton,
                    {
                        backgroundColor: isDark ? "#25233D" : "#FFFFFF",
                        borderColor: isDark ? "#514B80" : "#DCE3FF",
                        borderWidth: 1,
                    },
                ]}
                onPress={() => navigation.navigate("InterviewSetup")}
                activeOpacity={0.85}
            >
                <View
                    style={[
                        styles.startInterviewIcon,
                        {
                            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
                            borderColor: isDark ? "#59458A" : "#D5CEFF",
                        },
                    ]}
                >
                    <Text style={{ fontSize: 25 }}>🎯</Text>
                </View>

                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.startInterviewTitle,
                            { color: isDark ? "#FFFFFF" : "#252943" },
                        ]}
                    >
                        Start New Interview
                    </Text>

                    <Text
                        style={[
                            styles.startInterviewSubtitle,
                            { color: isDark ? "#B8B5CC" : "#777C90" },
                        ]}
                    >
                        Practice with AI-powered interview questions
                    </Text>
                </View>

                <Text
                    style={[
                        styles.startInterviewArrow,
                        { color: isDark ? "#B9A8FF" : "#554BD7" },
                    ]}
                >
                    ›
                </Text>
            </TouchableOpacity>

            {/* PROFILE OVERVIEW */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Profile Overview
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate("Profile")}
                    style={[
                        styles.viewProfileButton,
                        {
                            backgroundColor: isDark ? "#25233D" : "#EEF2FF",
                            borderColor: isDark ? "#514B80" : "#DCE3FF",
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.viewProfileText,
                            { color: isDark ? "#B9A8FF" : "#4F46E5" },
                        ]}
                    >
                        Edit Profile ›
                    </Text>
                </TouchableOpacity>
            </View>

            <View
                style={[
                    styles.infoCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                <InfoRow
                    label="Target Role"
                    value={user?.target_role || "Not Set"}
                    icon="💼"
                    colors={colors}
                    styles={styles}
                />

                <View
                    style={[
                        styles.infoDivider,
                        { backgroundColor: colors.border },
                    ]}
                />

                <InfoRow
                    label="Experience Level"
                    value={user?.experience_level || "Not Set"}
                    icon="🎯"
                    colors={colors}
                    styles={styles}
                />

                <View
                    style={[
                        styles.infoDivider,
                        { backgroundColor: colors.border },
                    ]}
                />

                <InfoRow
                    label="Skills"
                    value={
                        user?.skills?.length
                            ? user.skills.join(", ")
                            : "No skills added"
                    }
                    icon="🧠"
                    colors={colors}
                    styles={styles}
                />
            </View>

            {/* PERFORMANCE */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Performance Overview
            </Text>

            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Interviews"
                    value={interviews.length.toString()}
                    icon="📚"
                    color="#4F46E5"
                    background={isDark ? "#30264F" : "#EEF2FF"}
                    colors={colors}
                    styles={styles}
                />

                <StatCard
                    title="Completed"
                    value={completedInterviews.length.toString()}
                    icon="✅"
                    color="#059669"
                    background={isDark ? "#1D3B30" : "#ECFDF5"}
                    colors={colors}
                    styles={styles}
                />

                <StatCard
                    title="Average Score"
                    value={`${averageScore}%`}
                    icon="🏆"
                    color="#D97706"
                    background={isDark ? "#46351F" : "#FFFBEB"}
                    colors={colors}
                    styles={styles}
                />
            </View>

            {/* RECENT INTERVIEWS */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Recent Interviews
                </Text>

                <TouchableOpacity
                    onPress={() => navigation.navigate("InterviewHistory")}
                    style={[
                        styles.viewProfileButton,
                        {
                            backgroundColor: isDark ? "#25233D" : "#EEF2FF",
                            borderColor: isDark ? "#514B80" : "#DCE3FF",
                        },
                    ]}
                >
                    <Text style={[
                        styles.viewProfileText,
                        { color: isDark ? "#B9A8FF" : "#4F46E5" },
                    ]}
                    >
                        View History ›
                    </Text>
                </TouchableOpacity>
            </View>

            {recentInterviews.length === 0 ? (
                <View
                    style={[
                        styles.emptyCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <Text style={styles.emptyIcon}>📭</Text>

                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        No Interviews Yet
                    </Text>

                    <Text style={[styles.emptyDescription, { color: colors.muted }]}>
                        Your interview history will appear here
                        after you complete your first interview.
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
                            style={[
                                styles.interviewCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.interviewTop}>
                                <View style={styles.interviewRoleIcon}>
                                    <Text>💼</Text>
                                </View>

                                <View style={styles.interviewMain}>
                                    <Text style={[styles.interviewRole, { color: colors.text }]}>
                                        {interview.job_role || "Interview"}
                                    </Text>

                                    <Text style={[styles.interviewDate, { color: colors.muted }]}>
                                        📅 {formatDate(interview.created_at)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.interviewDetailContainer}>
                                <Text style={[styles.interviewDetail, { color: colors.muted }]}>
                                    {interview.interview_type || "General"}
                                </Text>

                                <View style={styles.detailDot} />

                                <Text style={[styles.interviewDetail, { color: colors.muted }]}>
                                    {interview.difficulty || "Medium"}
                                </Text>
                            </View>

                            <View
                                style={[
                                    styles.interviewFooter,
                                    { borderTopColor: colors.border },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor:
                                                `${getStatusColor(interview.status)}15`,
                                        },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.statusDot,
                                            {
                                                backgroundColor:
                                                    getStatusColor(interview.status),
                                            },
                                        ]}
                                    />

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
                                </View>

                                <Text style={[styles.score, { color: colors.primary }]}>
                                    {typeof score === "number"
                                        ? `${score}%`
                                        : "Score pending"}
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.interviewActionButton,
                                        {
                                            backgroundColor: isDark ? "#25233D" : "#EEF2FF",
                                            borderColor: isDark ? "#514B80" : "#DCE3FF",
                                        },
                                    ]}
                                    onPress={() => {
                                        const interviewId =
                                            interview.interview_id || interview._id;

                                        if (!interviewId) {
                                            Alert.alert("Error", "Interview ID is missing.");
                                            return;
                                        }

                                        const score =
                                            interview.overall_score ?? interview.score;

                                        const hasScore =
                                            typeof score === "number" &&
                                            Number.isFinite(score);

                                        if (hasScore) {
                                            navigation.navigate("InterviewResult", {
                                                interviewId,
                                                from: "dashboard",
                                            });
                                        } else {
                                            navigation.navigate("InterviewSession", {
                                                interviewId,
                                                setup: {
                                                    field: interview.job_role || "General",
                                                    target_role: interview.job_role || "",
                                                    job_role: interview.job_role || "",
                                                    experience_level: interview.experience_level || "Fresher",
                                                    interview_type: interview.interview_type || "Technical",
                                                    difficulty: interview.difficulty || "Medium",
                                                    number_of_questions: interview.number_of_questions || 5,
                                                    duration: interview.duration || "No Limit",
                                                    custom_duration: interview.custom_duration ?? null,
                                                },
                                            });
                                        }
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.interviewActionText,
                                            { color: isDark ? "#B9A8FF" : "#4F46E5" },
                                        ]}
                                    >
                                        {typeof (interview.overall_score ?? interview.score) === "number"
                                            ? "View Result →"
                                            : "Continue →"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })
            )}

            {/* QUICK ACTIONS */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                What Would You Like To Do?
            </Text>

            <View style={styles.quickActionsGrid}>
                <QuickAction
                    icon="👤"
                    title="View Profile"
                    description="Manage your profile information"
                    color="#4F46E5"
                    onPress={() => navigation.navigate("Profile")}
                    colors={colors}
                    styles={styles}
                />

                <QuickAction
                    icon="🚀"
                    title="Improve Profile"
                    description="Improve your skills and experience"
                    color="#059669"
                    onPress={() => navigation.navigate("ProfileImprovement")}
                    colors={colors}
                    styles={styles}
                />

                <QuickAction
                    icon="🎯"
                    title="Practice Interview"
                    description="Start a new mock interview"
                    color="#D97706"
                    onPress={() => navigation.navigate("InterviewSetup")}
                    colors={colors}
                    styles={styles}
                />

                <QuickAction
                    icon="📋"
                    title="Interview History"
                    description="View all previous interviews"
                    color="#2563EB"
                    onPress={() => navigation.navigate("InterviewHistory")}
                    colors={colors}
                    styles={styles}

                />

                <QuickAction
                    icon="⭐"
                    title="Write a Review"
                    description="Share your experience"
                    color="#DB2777"
                    onPress={() => navigation.navigate("Reviews")}
                    colors={colors}
                    styles={styles}
                />
            </View>
            {/* FOOTER */}
            <View
                style={[
                    styles.footer,
                    { borderTopColor: colors.border },
                ]}
            >
                <Text style={[styles.footerTitle, { color: colors.text }]}>
                    AI Interview Assist
                </Text>

                <Text style={[styles.footerText, { color: colors.muted }]}>
                    Your AI-powered interview preparation partner.
                </Text>

                <Text style={[styles.footerCopyright, { color: colors.muted }]}>
                    © {new Date().getFullYear()} AI Interview Assist.
                </Text>

                <Text style={[styles.footerCopyright, { color: colors.muted }]}>
                    All Rights Reserved.
                </Text>
            </View>
        </ScrollView>
    );
};

// QUICK ACTION COMPONENT
const QuickAction = ({
    icon,
    title,
    description,
    color,
    onPress,
    colors,
    styles,
}: {
    icon: string;
    title: string;
    description: string;
    color: string;
    onPress: () => void;
    colors: any;
    styles: any;
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.quickActionCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View
                style={[
                    styles.quickActionIcon,
                    { backgroundColor: `${color}15` },
                ]}
            >
                <Text style={{ fontSize: 24 }}>
                    {icon}
                </Text>
            </View>

            <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                {title}
            </Text>

            <Text style={[styles.quickActionDescription, { color: colors.muted }]}>
                {description}
            </Text>

            <Text style={[styles.quickActionArrow, { color }]}>
                Explore →
            </Text>
        </TouchableOpacity>
    );
};

// PROFILE INFO ROW
const InfoRow = ({
    label,
    value,
    icon,
    colors,
    styles,
}: {
    label: string;
    value: string;
    icon: string;
    colors: any;
    styles: any;
}) => (
    <View style={styles.infoRow}>
        <View
            style={[
                styles.infoIcon,
                { backgroundColor: colors.header },
            ]}
        >
            <Text>{icon}</Text>
        </View>

        <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>
                {label}
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
                {value}
            </Text>
        </View>
    </View>
);

// STAT CARD
const StatCard = ({
    title,
    value,
    icon,
    color,
    background,
    colors,
    styles,
}: {
    title: string;
    value: string;
    icon: string;
    color: string;
    background: string;
    colors: any;
    styles: any;
}) => (
    <View
        style={[
            styles.statCard,
            {
                backgroundColor: colors.card,
                borderColor: colors.border,
            },
        ]}
    >
        <View
            style={[
                styles.statIcon,
                { backgroundColor: background },
            ]}
        >
            <Text>{icon}</Text>
        </View>

        <Text style={[styles.statValue, { color }]}>
            {value}
        </Text>

        <Text style={[styles.statTitle, { color: colors.muted }]}>
            {title}
        </Text>
    </View>
);

// STYLES
const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#F5F7FF",
        },

        content: {
            paddingHorizontal: 18,
            paddingTop: 32,
            paddingBottom: 40,
        },

        loader: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F5F7FF",
        },

        loadingText: {
            marginTop: 12,
            color: "#64748B",
            fontSize: 14,
        },

        // HEADER
        header: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            zIndex: 2,
        },

        headerBrand: {
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
        },

        logoIcon: {
            width: 42,
            height: 42,
            borderRadius: 13,
            backgroundColor: "#4F46E5",
            justifyContent: "center",
            alignItems: "center",
        },

        logoIconText: {
            fontSize: 15,
            fontWeight: "900",
            color: "#FFFFFF",
        },

        logo: {
            fontSize: 17,
            fontWeight: "800",
            color: "#1E293B",
        },

        headerSubtitle: {
            fontSize: 12,
            color: "#64748B",
            marginTop: 3,
        },

        menuButton: {
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: "#EEF2FF",
            borderWidth: 1,
            borderColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
        },

        menuButtonActive: {
            backgroundColor: isDark ? "#302D55" : "#EEF2FF",
            borderColor: colors.primary,
        },

        menuNotificationBadge: {
            position: "absolute",
            top: -7,
            right: -7,
            backgroundColor: "#EF4444",
            minWidth: 21,
            height: 21,
            borderRadius: 11,
            paddingHorizontal: 5,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 2,
            borderColor: "#F5F7FF",
            zIndex: 10,
        },

        menuNotificationBadgeText: {
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "900",
        },

        menuIcon: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
        },
        // MENU
        menuOverlay: {
            position: "absolute",
            top: 86,
            left: 0,
            right: 10,
            zIndex: 999,
            elevation: 999,
            alignItems: "flex-end",
            paddingHorizontal: 12,
        },

        mobileMenu: {
            backgroundColor: "#FFFFFF",
            width: "78%",
            maxWidth: 310,
            borderRadius: 15,
            padding: 9,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            elevation: 10,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
        },
        menuHeading: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#EEF2FF",
            borderRadius: 11,
            padding: 9,
            marginBottom: 4,
        },

        menuHeadingIcon: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },

        menuHeadingEmoji: {
            fontSize: 21,
        },

        menuHeadingInfo: {
            flex: 1,
        },

        menuHeadingTitle: {
            fontSize: 16,
            fontWeight: "800",
            color: "#3730A3",
        },

        menuHeadingSubtitle: {
            fontSize: 12,
            color: "#6366F1",
            marginTop: 3,
        },

        menuDivider: {
            height: 1,
            backgroundColor: "#EEF2F7",
            marginVertical: 7,
        },

        menuItem: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 5,
            paddingHorizontal: 7,
            borderRadius: 10,
            minHeight: 42,
        },

        menuIconContainer: {
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
        },
        menuItemText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#334155",
            flex: 1,
        },

        menuArrow: {
            fontSize: 22,
            color: "#94A3B8",
            marginRight: 5,
        },

        menuLogoutItem: {
            backgroundColor: "#FFF5F5",
        },

        logoutIconContainer: {
            backgroundColor: "#FEE2E2",
        },

        menuLogoutText: {
            fontSize: 14,
            color: "#DC2626",
            fontWeight: "700",
        },

        unreadBadge: {
            backgroundColor: "#FEE2E2",
            minWidth: 23,
            height: 23,
            borderRadius: 12,
            paddingHorizontal: 6,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            borderWidth: 1,
            borderColor: "#FECACA",
        },

        unreadBadgeText: {
            color: "#DC2626",
            fontSize: 11,
            fontWeight: "800",
        },

        // WELCOME
        welcomeCard: {
            backgroundColor: "#4338CA",
            borderRadius: 19,
            overflow: "hidden",
            marginBottom: 25,
        },

        welcomeTop: {
            padding: 22,
        },

        welcomeBadge: {
            alignSelf: "flex-start",
            backgroundColor: "#6366F1",
            paddingHorizontal: 11,
            paddingVertical: 7,
            borderRadius: 20,
            marginBottom: 15,
        },

        welcomeBadgeText: {
            color: "#E0E7FF",
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 0.5,
        },

        welcomeTitle: {
            fontSize: 23,
            fontWeight: "900",
            color: "#FFFFFF",
        },

        welcomeDescription: {
            color: "#E0E7FF",
            fontSize: 13,
            lineHeight: 21,
            marginTop: 10,
        },

        welcomeBottom: {
            backgroundColor: "#3730A3",
            paddingVertical: 12,
            paddingHorizontal: 20,
        },

        welcomeBottomText: {
            fontSize: 12,
            color: "#C7D2FE",
            fontWeight: "600",
        },

        // SECTION TITLES
        sectionHeader: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
        },

        sectionTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: "#1E293B",
            marginBottom: 13,
            marginTop: 5,
        },

        viewProfileButton: {
            backgroundColor: "#EEF2FF",
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 9,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#D5DEFF",
            alignItems: "center",
            justifyContent: "center",
        },

        viewProfileText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#4338CA",
        },

        // PROFILE CARD
        infoCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#EEF2F7",
            elevation: 2,
            shadowColor: "#64748B",
            shadowOpacity: 0.04,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowRadius: 4,
        },

        infoRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
        },

        infoIcon: {
            width: 38,
            height: 38,
            borderRadius: 11,
            backgroundColor: "#F1F5F9",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
        },

        infoTextContainer: {
            flex: 1,
        },

        infoLabel: {
            color: "#64748B",
            fontSize: 12,
            marginBottom: 5,
        },

        infoValue: {
            color: "#1E293B",
            fontSize: 14,
            fontWeight: "700",
        },

        infoDivider: {
            height: 1,
            backgroundColor: "#F1F5F9",
            marginVertical: 7,
        },

        // STATISTICS
        statsGrid: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 24,
        },

        statCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 13,
            flex: 1,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#EEF2F7",
            elevation: 2,
            shadowColor: "#64748B",
            shadowOpacity: 0.04,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowRadius: 4,
        },

        statIcon: {
            width: 35,
            height: 35,
            borderRadius: 11,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
        },

        statValue: {
            fontSize: 21,
            fontWeight: "900",
        },

        statTitle: {
            color: "#64748B",
            fontSize: 10,
            textAlign: "center",
            fontWeight: "600",
            marginTop: 6,
        },

        // EMPTY STATE
        emptyCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#EEF2F7",
        },

        emptyIcon: {
            fontSize: 38,
            marginBottom: 10,
        },

        emptyTitle: {
            fontSize: 16,
            fontWeight: "800",
            color: "#334155",
        },

        emptyDescription: {
            color: "#64748B",
            fontSize: 13,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 19,
        },

        // INTERVIEW CARDS
        interviewCard: {
            backgroundColor: "#FFFFFF",
            padding: 16,
            borderRadius: 15,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#EEF2F7",
            elevation: 2,
            shadowColor: "#64748B",
            shadowOpacity: 0.04,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowRadius: 4,
        },

        interviewTop: {
            flexDirection: "row",
            alignItems: "center",
        },

        interviewRoleIcon: {
            marginRight: 12,
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            alignItems: "center",
            justifyContent: "center",
        },

        interviewMain: {
            flex: 1,
        },

        interviewRole: {
            fontSize: 15,
            fontWeight: "800",
            color: "#1E293B",
        },

        interviewDate: {
            color: "#64748B",
            fontSize: 11,
            marginTop: 5,
        },

        interviewDetailContainer: {
            flexDirection: "row",
            alignItems: "center",
            marginTop: 14,
        },

        interviewDetail: {
            color: "#64748B",
            fontSize: 12,
            fontWeight: "600",
        },

        detailDot: {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "#94A3B8",
            marginHorizontal: 8,
        },

        interviewFooter: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 15,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
        },

        statusBadge: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 9,
            paddingVertical: 6,
            borderRadius: 20,
        },

        statusDot: {
            width: 7,
            height: 7,
            borderRadius: 4,
            marginRight: 6,
        },

        status: {
            fontWeight: "700",
            fontSize: 11,
            textTransform: "capitalize",
        },

        score: {
            fontWeight: "900",
            color: "#4338CA",
            fontSize: 13,
        },

        // START INTERVIEW BUTTON
        startInterviewButton: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#4F46E5",
            padding: 17,
            borderRadius: 17,
            marginBottom: 25,
            elevation: 4,
            shadowColor: "#4F46E5",
            shadowOffset: {
                width: 0,
                height: 3,
            },
            shadowOpacity: 0.2,
            shadowRadius: 6,
        },

        startInterviewIcon: {
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#6366F1",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 13,
        },

        startInterviewTitle: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "800",
        },

        startInterviewSubtitle: {
            color: "#E0E7FF",
            fontSize: 11,
            marginTop: 5,
        },

        startInterviewArrow: {
            color: "#FFFFFF",
            fontSize: 30,
            fontWeight: "700",
        },

        // INTERVIEW ACTION
        interviewActionButton: {
            backgroundColor: "#EEF2FF",
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: "#DCE3FF",
        },

        interviewActionText: {
            color: "#4338CA",
            fontSize: 11,
            fontWeight: "800",
        },

        // QUICK ACTIONS
        quickActionsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 25,
        },

        quickActionCard: {
            width: "48%",
            backgroundColor: "#FFFFFF",
            borderRadius: 15,
            padding: 14,
            borderWidth: 1,
            borderColor: "#EEF2F7",
            elevation: 2,
            shadowColor: "#64748B",
            shadowOpacity: 0.05,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowRadius: 4,
        },

        quickActionIcon: {
            width: 43,
            height: 43,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
        },

        quickActionTitle: {
            fontSize: 14,
            fontWeight: "800",
            color: "#1E293B",
        },

        quickActionDescription: {
            fontSize: 11,
            lineHeight: 17,
            color: "#64748B",
            marginTop: 6,
            minHeight: 34,
        },

        quickActionArrow: {
            fontSize: 13,
            fontWeight: "800",
            marginTop: 12,
            textAlign: "left",
        },

        // FOOTER
        footer: {
            marginTop: 15,
            paddingTop: 20,
            paddingBottom: 10,
            borderTopWidth: 1,
            alignItems: "center",
        },

        footerTitle: {
            fontSize: 15,
            fontWeight: "800",
            marginBottom: 7,
        },

        footerText: {
            fontSize: 11,
            textAlign: "center",
            marginBottom: 12,
        },

        footerCopyright: {
            fontSize: 11,
            textAlign: "center",
            marginTop: 3,
        },
    });

export default UserDashboardScreen;