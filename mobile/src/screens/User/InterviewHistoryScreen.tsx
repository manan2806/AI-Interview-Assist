import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import {
    getInterviewHistory,
    deleteInterview,
    resumeInterview,
} from "../../services/interviewService";

interface Interview {
    interview_id: string;
    interview_code?: string;
    job_role?: string;
    field?: string;
    interview_type?: string;
    experience_level?: string;
    difficulty?: string;
    number_of_questions?: number;
    duration?: string;
    custom_duration?: number | null;
    status?: string;
    performance_level?: string;
    overall_score?: number;
    created_at?: string;
}

const InterviewHistoryScreen = () => {
    const navigation = useNavigation<any>();
    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [experienceFilter, setExperienceFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [performanceFilter, setPerformanceFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const [filterVisible, setFilterVisible] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data: any = await getInterviewHistory();

            if (!data?.success) {
                setInterviews([]);
                setError(
                    data?.message || "Unable to load interview history."
                );
                return;
            }

            setInterviews(
                Array.isArray(data.interviews) ? data.interviews : []
            );
        } catch (err: any) {
            setInterviews([]);
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load interview history. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const formatDate = (date?: string) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) return "-";

        return parsed.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const isWithinDateFilter = (date?: string, filter?: string) => {
        if (filter === "all") return true;
        if (!date) return false;

        const interviewDate = new Date(date);

        if (Number.isNaN(interviewDate.getTime())) return false;

        const now = new Date();

        if (filter === "today") {
            const startOfToday = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

            return interviewDate >= startOfToday;
        }

        const days =
            filter === "7days" ? 7 :
                filter === "30days" ? 30 :
                    filter === "90days" ? 90 : 0;

        if (!days) return true;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return interviewDate >= startDate;
    };

    const filteredInterviews = useMemo(() => {
        let result = [...interviews];

        const search = searchTerm.trim().toLowerCase();

        if (search) {
            result = result.filter((item) => {
                const searchable = [
                    item.job_role,
                    item.interview_code,
                    item.interview_id,
                    item.interview_type,
                    item.experience_level,
                    item.difficulty,
                ].join(" ").toLowerCase();

                return searchable.includes(search);
            });
        }

        if (statusFilter !== "all") {
            result = result.filter(
                (item) =>
                    String(item.status || "").toLowerCase() === statusFilter
            );
        }

        if (experienceFilter !== "all") {
            result = result.filter(
                (item) =>
                    String(item.experience_level || "").toLowerCase() ===
                    experienceFilter
            );
        }

        if (difficultyFilter !== "all") {
            result = result.filter(
                (item) =>
                    String(item.difficulty || "").toLowerCase() ===
                    difficultyFilter
            );
        }

        if (performanceFilter !== "all") {
            result = result.filter(
                (item) =>
                    String(item.performance_level || "").toLowerCase() ===
                    performanceFilter
            );
        }

        if (dateFilter !== "all") {
            result = result.filter((item) =>
                isWithinDateFilter(item.created_at, dateFilter)
            );
        }

        result.sort((a, b) => {
            if (sortBy === "newest") {
                return (
                    new Date(b.created_at || 0).getTime() -
                    new Date(a.created_at || 0).getTime()
                );
            }

            if (sortBy === "oldest") {
                return (
                    new Date(a.created_at || 0).getTime() -
                    new Date(b.created_at || 0).getTime()
                );
            }

            if (sortBy === "highest") {
                return Number(b.overall_score || 0) -
                    Number(a.overall_score || 0);
            }

            if (sortBy === "lowest") {
                return Number(a.overall_score || 0) -
                    Number(b.overall_score || 0);
            }

            return 0;
        });

        return result;
    }, [
        interviews,
        searchTerm,
        statusFilter,
        experienceFilter,
        difficultyFilter,
        performanceFilter,
        dateFilter,
        sortBy,
    ]);

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        statusFilter !== "all" ||
        experienceFilter !== "all" ||
        difficultyFilter !== "all" ||
        performanceFilter !== "all" ||
        dateFilter !== "all" ||
        sortBy !== "newest";

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setExperienceFilter("all");
        setDifficultyFilter("all");
        setPerformanceFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    const handleDelete = (interviewId: string) => {
        Alert.alert(
            "Delete Interview",
            "Are you sure you want to delete this interview? This action cannot be undone.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeletingId(interviewId);

                            const data: any =
                                await deleteInterview(interviewId);

                            if (data?.success) {
                                setInterviews((previous) =>
                                    previous.filter(
                                        (item) =>
                                            item.interview_id !== interviewId
                                    )
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    data?.message || "Failed to delete interview."
                                );
                            }
                        } catch (err: any) {
                            Alert.alert(
                                "Delete Failed",
                                err?.response?.data?.message ||
                                err?.message ||
                                "Something went wrong."
                            );
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleResume = async (item: Interview) => {
        try {
            const response: any = await resumeInterview(item.interview_id);

            if (response?.success === false) {
                Alert.alert(
                    "Unable to Resume",
                    response.message || "Could not resume this interview."
                );
                return;
            }

            const setup = {
                field: item.field || "",
                target_role: item.job_role || "",
                job_role: item.job_role || "",
                experience_level: item.experience_level || "Fresher",
                interview_type: item.interview_type || "Technical",
                difficulty: item.difficulty || "Medium",
                number_of_questions: Number(item.number_of_questions) || 5,
                duration: item.duration || "No Limit",
                custom_duration: item.custom_duration ?? null,
            };

            navigation.navigate("InterviewSession", {
                interviewId: item.interview_id,
                setup,
            });
        } catch (err: any) {
            Alert.alert(
                "Resume Failed",
                err?.response?.data?.message ||
                err?.message ||
                "Unable to resume interview."
            );
        }
    };

    const completedCount = interviews.filter(
        (item) => item.status === "completed"
    ).length;

    const averageScore =
        interviews.length > 0
            ? (
                interviews.reduce(
                    (total, item) =>
                        total + Number(item.overall_score || 0),
                    0
                ) / interviews.length
            ).toFixed(1)
            : "0.0";

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.loadingText}>
                    Loading Interview History...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.largeIcon}>⚠️</Text>
                <Text style={styles.emptyTitle}>
                    Unable to Load History
                </Text>
                <Text style={styles.emptyDescription}>{error}</Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={loadHistory}
                >
                    <Text style={styles.primaryButtonText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate("UserDashboard")}
                >
                    <Text style={styles.secondaryButtonText}>
                        Dashboard
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {/* HISTORY HEADER */}
                <View style={styles.historyHeader}>
                    <View style={styles.historyHeaderContent}>
                        <Text style={styles.historyLabel}>
                            Your Progress
                        </Text>

                        <Text style={styles.historyTitle}>
                            Interview History
                        </Text>

                        <Text style={styles.historyDescription}>
                            Review your previous interview attempts
                            and track your performance.
                        </Text>
                    </View>

                    <View style={styles.historyHeaderActions}>
                        <TouchableOpacity
                            style={styles.startInterviewButton}
                            onPress={() => navigation.navigate("InterviewSetup")}
                        >
                            <Text style={styles.startInterviewButtonText}>
                                + Start New Interview
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.performanceButton}
                            onPress={() => navigation.navigate("PerformanceChart")}
                        >
                            <Text style={styles.performanceButtonText}>
                                📊 Performance Chart
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.dashboardButton}
                            onPress={() => navigation.navigate("UserDashboard")}
                        >
                            <Text style={styles.dashboardButtonText}>
                                Dashboard
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.summaryGrid}>
                    <SummaryCard
                        icon="🎯"
                        label="Total Interviews"
                        value={String(interviews.length)}
                        color="#6C63FF"
                        styles={styles}
                    />
                    <SummaryCard
                        icon="🏆"
                        label="Completed"
                        value={String(completedCount)}
                        color="#16A085"
                        styles={styles}
                    />
                    <SummaryCard
                        icon="📊"
                        label="Average Score"
                        value={`${averageScore}%`}
                        color="#E58A28"
                        styles={styles}
                    />
                </View>

                {interviews.length > 0 && (
                    <View style={styles.searchCard}>
                        <Text style={styles.sectionTitle}>
                            Search & Filter
                        </Text>
                        <Text style={styles.sectionDescription}>
                            Find your previous interviews quickly.
                        </Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="🔍 Search role, ID, type..."
                            placeholderTextColor="#9296A8"
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                        />

                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setFilterVisible(true)}
                        >
                            <Text style={styles.filterButtonText}>
                                ⚙️ Filters & Sorting
                                {hasActiveFilters ? "  •" : ""}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.searchFooter}>
                            <Text style={styles.resultCount}>
                                Showing {filteredInterviews.length} of {interviews.length}
                            </Text>

                            {hasActiveFilters && (
                                <TouchableOpacity onPress={clearFilters}>
                                    <Text style={styles.clearText}>
                                        Clear All
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}

                {interviews.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.largeIcon}>📝</Text>
                        <Text style={styles.emptyTitle}>
                            No Interviews Yet
                        </Text>
                        <Text style={styles.emptyDescription}>
                            Start your first AI-powered interview and your history will appear here.
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => navigation.navigate("InterviewSetup")}
                        >
                            <Text style={styles.primaryButtonText}>
                                Start New Interview →
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredInterviews.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.largeIcon}>🔍</Text>
                        <Text style={styles.emptyTitle}>
                            No Matching Interviews
                        </Text>
                        <Text style={styles.emptyDescription}>
                            No interviews match your current search or filters.
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={clearFilters}
                        >
                            <Text style={styles.primaryButtonText}>
                                Clear Search & Filters
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {filteredInterviews.map((item, index) => (
                            <View
                                key={item.interview_id || String(index)}
                                style={styles.interviewCard}
                            >
                                <View style={styles.roleHeader}>
                                    <View style={styles.roleIcon}>
                                        <Text style={styles.roleIconText}>💼</Text>
                                    </View>

                                    <View style={styles.roleInfo}>
                                        <Text style={styles.roleTitle}>
                                            {item.job_role || "Unknown Role"}
                                        </Text>
                                        <Text style={styles.roleSubtitle}>
                                            {item.interview_type || "Interview"}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.codeContainer}>
                                    <Text style={styles.codeLabel}>
                                        INTERVIEW ID
                                    </Text>
                                    <Text style={styles.codeValue}>
                                        {item.interview_code || item.interview_id || "N/A"}
                                    </Text>
                                </View>

                                <View style={styles.detailsGrid}>
                                    <DetailItem
                                        label="Experience"
                                        value={item.experience_level || "-"}
                                        styles={styles}
                                    />
                                    <DetailItem
                                        label="Difficulty"
                                        value={item.difficulty || "-"}
                                        styles={styles}
                                    />
                                    <DetailItem
                                        label="Questions"
                                        value={String(item.number_of_questions || 0)}
                                        styles={styles}
                                    />
                                    <DetailItem
                                        label="Date"
                                        value={formatDate(item.created_at)}
                                        styles={styles}
                                    />
                                </View>

                                <View style={styles.badgesRow}>
                                    <Text
                                        style={[
                                            styles.statusBadge,
                                            getStatusStyle(item.status),
                                        ]}
                                    >
                                        {(item.status || "Unknown").replace(/_/g, " ")}
                                    </Text>

                                    {!!item.performance_level && (
                                        <Text
                                            style={[
                                                styles.performanceBadge,
                                                getPerformanceStyle(
                                                    item.performance_level
                                                ),
                                            ]}
                                        >
                                            {item.performance_level}
                                        </Text>
                                    )}
                                </View>

                                {item.status === "completed" && (
                                    <View style={styles.scoreRow}>
                                        <Text style={styles.scoreLabel}>
                                            Overall Score
                                        </Text>
                                        <Text style={styles.scoreValue}>
                                            {Number(item.overall_score || 0)}%
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.actions}>
                                    {(
                                        item.status === "in_progress" ||
                                        item.status === "evaluation_pending" ||
                                        item.status === "ready" ||
                                        item.status === "created"
                                    ) && (
                                            <TouchableOpacity
                                                style={styles.resumeButton}
                                                onPress={() => handleResume(item)}
                                            >
                                                <Text style={styles.actionButtonText}>
                                                    ▶ Resume Interview
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                    {item.status === "completed" && (
                                        <TouchableOpacity
                                            style={styles.resultButton}
                                            onPress={() =>
                                                navigation.navigate("InterviewResult", {
                                                    interviewId: item.interview_id,
                                                    from: "history",
                                                })
                                            }
                                        >
                                            <Text style={styles.actionButtonText}>
                                                📊 View Result
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={styles.detailsButton}
                                        onPress={() =>
                                            navigation.navigate("InterviewDetails", {
                                                interviewId: item.interview_id,
                                            })
                                        }
                                    >
                                        <Text style={styles.actionButtonText}>
                                            📄 View Details
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        disabled={deletingId === item.interview_id}
                                        onPress={() => handleDelete(item.interview_id)}
                                    >
                                        {deletingId === item.interview_id ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>
                                                🗑 Delete
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={filterVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFilterVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Filters & Sorting
                            </Text>
                            <TouchableOpacity
                                onPress={() => setFilterVisible(false)}
                            >
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <FilterGroup
                                title="Status"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    ["all", "All"],
                                    ["created", "Created"],
                                    ["ready", "Ready"],
                                    ["in_progress", "In Progress"],
                                    ["completed", "Completed"],
                                ]}
                                styles={styles}
                            />

                            <FilterGroup
                                title="Experience"
                                value={experienceFilter}
                                onChange={setExperienceFilter}
                                options={[
                                    ["all", "All"],
                                    ["fresher", "Fresher"],
                                    ["junior", "Junior"],
                                    ["mid level", "Mid Level"],
                                    ["senior", "Senior"],
                                ]}
                                styles={styles}
                            />

                            <FilterGroup
                                title="Difficulty"
                                value={difficultyFilter}
                                onChange={setDifficultyFilter}
                                options={[
                                    ["all", "All"],
                                    ["easy", "Easy"],
                                    ["medium", "Medium"],
                                    ["hard", "Hard"],
                                ]}
                                styles={styles}
                            />

                            <FilterGroup
                                title="Performance"
                                value={performanceFilter}
                                onChange={setPerformanceFilter}
                                options={[
                                    ["all", "All"],
                                    ["excellent", "Excellent"],
                                    ["very good", "Very Good"],
                                    ["good", "Good"],
                                    ["needs improvement", "Needs Improvement"],
                                    ["poor", "Poor"],
                                ]}
                                styles={styles}
                            />

                            <FilterGroup
                                title="Date"
                                value={dateFilter}
                                onChange={setDateFilter}
                                options={[
                                    ["all", "All Dates"],
                                    ["today", "Today"],
                                    ["7days", "Last 7 Days"],
                                    ["30days", "Last 30 Days"],
                                    ["90days", "Last 90 Days"],
                                ]}
                                styles={styles}
                            />

                            <FilterGroup
                                title="Sort By"
                                value={sortBy}
                                onChange={setSortBy}
                                options={[
                                    ["newest", "Newest First"],
                                    ["oldest", "Oldest First"],
                                    ["highest", "Highest Score"],
                                    ["lowest", "Lowest Score"],
                                ]}
                                styles={styles}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalClearButton}
                                onPress={clearFilters}
                            >
                                <Text style={styles.modalClearText}>
                                    Clear Filters
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.modalApplyButton}
                                onPress={() => setFilterVisible(false)}
                            >
                                <Text style={styles.modalApplyText}>
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const SummaryCard = ({
    icon,
    label,
    value,
    color,
    styles,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
    styles: any;
}) => (
    <View style={styles.summaryCard}>
        <Text style={styles.summaryIcon}>{icon}</Text>
        <Text style={[styles.summaryValue, { color }]}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
    </View>
);

const DetailItem = ({
    label,
    value,
    styles,
}: {
    label: string;
    value: string;
    styles: any;
}) => (
    <View style={styles.detailItem}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const FilterGroup = ({
    title,
    value,
    onChange,
    options,
    styles,
}: {
    title: string;
    value: string;
    onChange: (value: string) => void;
    options: [string, string][];
    styles: any;
}) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const selectedOption =
        options.find((option) => option[0] === value)?.[1] || "Select Option";

    return (
        <View style={styles.filterGroup}>
            <Text style={styles.filterTitle}>{title}</Text>

            <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setDropdownOpen((previous) => !previous)}
                activeOpacity={0.8}
            >
                <Text style={styles.dropdownButtonText}>
                    {selectedOption}
                </Text>

                <Text style={styles.dropdownArrow}>
                    {dropdownOpen ? "▲" : "▼"}
                </Text>
            </TouchableOpacity>

            {dropdownOpen && (
                <View style={styles.dropdownList}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option[0]}
                            style={[
                                styles.dropdownOption,
                                value === option[0] &&
                                styles.dropdownSelectedOption,
                            ]}
                            onPress={() => {
                                onChange(option[0]);
                                setDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.dropdownOptionText,
                                    value === option[0] &&
                                    styles.dropdownSelectedText,
                                ]}
                            >
                                {value === option[0] ? "✓  " : ""}
                                {option[1]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const getStatusStyle = (status?: string) => {
    switch (status) {
        case "completed":
            return { backgroundColor: "#D9F7E9", color: "#16845B" };
        case "in_progress":
            return { backgroundColor: "#FFF0D6", color: "#A56812" };
        case "evaluation_pending":
            return { backgroundColor: "#E9E4FF", color: "#6552C9" };
        default:
            return { backgroundColor: "#E9ECF5", color: "#596078" };
    }
};

const getPerformanceStyle = (level?: string) => {
    const value = (level || "").toLowerCase();

    if (value.includes("excellent")) {
        return { backgroundColor: "#D9F7E9", color: "#16845B" };
    }

    if (value.includes("very good")) {
        return { backgroundColor: "#DCEEFF", color: "#2466A8" };
    }

    if (value.includes("good")) {
        return { backgroundColor: "#E9E4FF", color: "#6552C9" };
    }

    if (value.includes("improvement")) {
        return { backgroundColor: "#FFF0D6", color: "#A56812" };
    }

    if (value.includes("poor")) {
        return { backgroundColor: "#FDE2E2", color: "#B42318" };
    }

    return { backgroundColor: "#E9ECF5", color: "#596078" };
};

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? colors.background : "#F5F6FF",
            paddingTop: 30,
        },
        content: {
            padding: 17,
            paddingBottom: 40,
        },
        historyHeader: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 20,
            padding: 22,
            marginBottom: 22,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
        },

        historyHeaderContent: {
            marginBottom: 20,
        },

        historyLabel: {
            color: "#6C63FF",
            fontSize: 13,
            fontWeight: "700",
            marginBottom: 6,
        },
        historyTitle: {
            color: isDark ? colors.text : "#202044",
            fontSize: 27,
            fontWeight: "800",
            marginBottom: 8,
        },
        historyDescription: {
            color: isDark ? colors.muted : "#73738A",
            fontSize: 14,
            lineHeight: 21,
        },

        historyHeaderActions: {
            gap: 10,
            width: "100%",
        },

        startInterviewButton: {
            backgroundColor: isDark ? "#5141B8" : "#6C63FF",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
        },

        startInterviewButtonText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
        },

        performanceButton: {
            backgroundColor: isDark ? "#30264F" : "#EDE9FE",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#C4B5FD",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
        },

        performanceButtonText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontSize: 14,
            fontWeight: "800",
            textAlign: "center",
        },

        dashboardButton: {
            backgroundColor: isDark ? "#1D3B30" : "#EAF8F0",
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: isDark ? "#326B50" : "#86D6A5",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            marginTop: 0,
        },

        dashboardButtonText: {
            color: isDark ? "#86D6A5" : "#219653",
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
        },
        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? colors.background : "#F5F6FF",
            padding: 25,
        },
        loadingText: {
            marginTop: 14,
            color: isDark ? colors.text : "#555B70",
            fontSize: 15,
        },
        header: {
            backgroundColor: "#6C63FF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 17,
        },
        headerLabel: {
            color: "#DCD9FF",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.5,
        },
        headerTitle: {
            color: "#FFFFFF",
            fontSize: 25,
            fontWeight: "800",
            marginTop: 8,
        },
        headerDescription: {
            color: "#E8E6FF",
            fontSize: 13,
            lineHeight: 20,
            marginTop: 8,
        },
        headerButton: {
            backgroundColor: "#FFFFFF",
            padding: 13,
            borderRadius: 11,
            alignItems: "center",
            marginTop: 19,
        },
        headerButtonText: {
            color: "#5B52E8",
            fontWeight: "800",
            fontSize: 14,
        },
        summaryGrid: {
            flexDirection: "row",
            gap: 9,
            marginBottom: 17,
        },
        summaryCard: {
            flex: 1,
            backgroundColor: colors.card,
            borderRadius: 14,
            paddingVertical: 15,
            paddingHorizontal: 5,
            alignItems: "center",
            minHeight: 112,
            justifyContent: "center",
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
        },
        summaryIcon: {
            fontSize: 22,
            marginBottom: 5,
        },
        summaryValue: {
            fontSize: 19,
            fontWeight: "800",
        },
        summaryLabel: {
            color: colors.muted,
            fontSize: 10,
            textAlign: "center",
            marginTop: 4,
        },
        searchCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 17,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
        },
        sectionTitle: {
            color: colors.text,
            fontSize: 17,
            fontWeight: "800",
        },
        sectionDescription: {
            color: colors.muted,
            fontSize: 12,
            marginTop: 5,
            marginBottom: 14,
        },
        searchInput: {
            backgroundColor: isDark ? colors.input : "#F7F7FC",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 11,
            paddingHorizontal: 13,
            height: 47,
            color: colors.text,
            fontSize: 13,
        },
        filterButton: {
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            borderRadius: 10,
            padding: 13,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
        },
        filterButtonText: {
            color: isDark ? "#D6C5FF" : "#554BD7",
            fontSize: 13,
            fontWeight: "800",
            textAlign: "center",
        },
        searchFooter: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 13,
            alignItems: "center",
        },
        resultCount: {
            color: "#777C90",
            fontSize: 12,
        },
        clearText: {
            color: "#6C63FF",
            fontWeight: "700",
            fontSize: 12,
        },
        emptyCard: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 25,
            alignItems: "center",
            marginTop: 5,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
        },
        largeIcon: {
            fontSize: 48,
            marginBottom: 12,
        },
        emptyTitle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
            textAlign: "center",
        },
        emptyDescription: {
            color: colors.muted,
            fontSize: 13,
            lineHeight: 20,
            textAlign: "center",
            marginTop: 9,
            marginBottom: 18,
        },
        primaryButton: {
            backgroundColor: "#6C63FF",
            paddingVertical: 13,
            paddingHorizontal: 22,
            borderRadius: 11,
            alignItems: "center",
            marginTop: 10,
        },
        primaryButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 14,
        },
        secondaryButton: {
            backgroundColor: isDark ? "#302D55" : "#EAE8FF",
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 11,
            marginTop: 10,
        },
        secondaryButtonText: {
            color: isDark ? "#C5B8FF" : "#554BD7",
            fontWeight: "700",
        },
        list: {
            gap: 15,
        },
        interviewCard: {
            backgroundColor: colors.card,
            borderRadius: 17,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        roleHeader: {
            flexDirection: "row",
            alignItems: "center",
        },
        roleIcon: {
            width: 45,
            height: 45,
            borderRadius: 13,
            backgroundColor: isDark ? "#302D55" : "#EAE8FF",
            justifyContent: "center",
            alignItems: "center",
        },
        roleIconText: {
            fontSize: 21,
        },
        roleInfo: {
            flex: 1,
            marginLeft: 11,
        },
        roleTitle: {
            color: colors.text,
            fontSize: 16,
            fontWeight: "800",
        },
        roleSubtitle: {
            color: colors.muted,
            fontSize: 12,
            marginTop: 4,
        },
        codeContainer: {
            backgroundColor: isDark ? colors.input : "#F7F7FC",
            borderRadius: 10,
            padding: 10,
            marginTop: 14,
        },
        codeLabel: {
            color: colors.muted,
            fontSize: 9,
            fontWeight: "800",
            letterSpacing: 1,
        },
        codeValue: {
            color: "#554BD7",
            fontSize: 12,
            fontWeight: "800",
            marginTop: 4,
        },
        detailsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginTop: 12,
        },
        detailItem: {
            width: "50%",
            paddingVertical: 9,
        },
        detailLabel: {
            color: colors.muted,
            fontSize: 11,
        },
        detailValue: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            marginTop: 4,
        },
        badgesRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 8,
        },
        statusBadge: {
            overflow: "hidden",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
            fontSize: 10,
            fontWeight: "800",
            textTransform: "capitalize",
        },
        performanceBadge: {
            overflow: "hidden",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
            fontSize: 10,
            fontWeight: "800",
        },
        scoreRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: 1,
            borderTopColor: "#F0F0F6",
            paddingTop: 12,
            marginTop: 12,
        },
        scoreLabel: {
            color: colors.muted,
            fontSize: 13,
        },
        scoreValue: {
            color: "#16A085",
            fontSize: 17,
            fontWeight: "800",
        },
        actions: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 15,
        },
        resumeButton: {
            flexGrow: 1,
            backgroundColor: "#6C63FF",
            padding: 11,
            borderRadius: 9,
            alignItems: "center",
        },
        resultButton: {
            flexGrow: 1,
            backgroundColor: "#16A085",
            padding: 11,
            borderRadius: 9,
            alignItems: "center",
        },
        detailsButton: {
            flexGrow: 1,
            backgroundColor: "#2878D0",
            padding: 11,
            borderRadius: 9,
            alignItems: "center",
        },
        deleteButton: {
            backgroundColor: "#E05252",
            padding: 11,
            borderRadius: 9,
            alignItems: "center",
            minWidth: 290,
        },
        actionButtonText: {
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: "800",
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(20,20,40,0.5)",
            justifyContent: "flex-end",
        },
        modalCard: {
            backgroundColor: colors.card,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            padding: 19,
            maxHeight: "88%",
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        modalTitle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
        },
        closeButton: {
            color: "#777C90",
            fontSize: 22,
            padding: 5,
        },
        filterGroup: {
            marginBottom: 18,
        },
        filterTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 14,
            fontWeight: "800",
            marginBottom: 9,
        },
        dropdownButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 11,
            paddingHorizontal: 14,
            paddingVertical: 14,
        },
        dropdownButtonText: {
            color: isDark ? colors.text : "#374151",
            fontSize: 13,
            fontWeight: "700",
        },
        dropdownArrow: {
            color: isDark ? "#B9A5FF" : "#6D5CE8",
            fontSize: 12,
        },
        dropdownList: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E5E7EB",
            borderRadius: 11,
            padding: 6,
            marginTop: 6,
        },
        dropdownOption: {
            paddingVertical: 12,
            paddingHorizontal: 12,
            borderRadius: 8,
        },
        dropdownSelectedOption: {
            backgroundColor: isDark ? "#3B3265" : "#EDE9FE",
        },
        dropdownOptionText: {
            color: isDark ? colors.text : "#4B5563",
            fontSize: 13,
            fontWeight: "600",
        },
        dropdownSelectedText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontWeight: "900",
        },
        modalActions: {
            flexDirection: "row",
            gap: 10,
            paddingTop: 15,
        },
        modalClearButton: {
            flex: 1,
            backgroundColor: isDark ? "#302D42" : "#F0F0F6",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
        },
        modalClearText: {
            color: isDark ? colors.text : "#555B70",
            fontWeight: "700",
        },
        modalApplyButton: {
            flex: 1,
            backgroundColor: "#6C63FF",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
        },
        modalApplyText: {
            color: "#FFFFFF",
            fontWeight: "800",
        },
    });

export default InterviewHistoryScreen;
