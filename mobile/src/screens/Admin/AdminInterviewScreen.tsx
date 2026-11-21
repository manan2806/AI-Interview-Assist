
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

interface Interview {
    interview_id?: string;
    interview_code?: string;
    user_id?: string;
    job_role?: string;
    interview_type?: string;
    experience_level?: string;
    difficulty?: string;
    number_of_questions?: number;
    status?: string;
    created_at?: string;
}

interface Filters {
    status: string;
    experience: string;
    difficulty: string;
    date: string;
    sort: string;
}

const DEFAULT_FILTERS: Filters = {
    status: "all",
    experience: "all",
    difficulty: "all",
    date: "",
    sort: "newest",
};

const AdminInterviewScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchInterviews = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/api/admin/interviews");

            const data = response.data;
            const list = Array.isArray(data)
                ? data
                : data?.interviews || [];

            setInterviews(list);
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to load interviews.";

            setError(message);

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                Alert.alert("Session Error", message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    const updateFilter = (key: keyof Filters, value: string) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearch("");
    };

    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).filter(([key, value]) => {
            return value !== DEFAULT_FILTERS[key as keyof Filters];
        }).length;
    }, [filters]);

    const filteredInterviews = useMemo(() => {
        let result = [...interviews];

        const query = search.trim().toLowerCase();

        if (query) {
            result = result.filter((interview) => {
                const searchableValues = [
                    interview.user_id,
                    interview.interview_id,
                    interview.interview_code,
                    interview.job_role,
                    interview.interview_type,
                    interview.experience_level,
                    interview.difficulty,
                    interview.status,
                ];

                return searchableValues.some((value) =>
                    String(value || "").toLowerCase().includes(query)
                );
            });
        }

        if (filters.status !== "all") {
            result = result.filter(
                (item) =>
                    (item.status || "").toLowerCase() ===
                    filters.status.toLowerCase()
            );
        }

        if (filters.experience !== "all") {
            result = result.filter(
                (item) =>
                    (item.experience_level || "").toLowerCase() ===
                    filters.experience.toLowerCase()
            );
        }

        if (filters.difficulty !== "all") {
            result = result.filter(
                (item) =>
                    (item.difficulty || "").toLowerCase() ===
                    filters.difficulty.toLowerCase()
            );
        }

        if (filters.date) {
            result = result.filter((item) => {
                if (!item.created_at) return false;

                const date = new Date(item.created_at);

                if (Number.isNaN(date.getTime())) return false;

                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");

                return `${year}-${month}-${day}` === filters.date;
            });
        }

        result.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();

            return filters.sort === "oldest"
                ? dateA - dateB
                : dateB - dateA;
        });

        return result;
    }, [interviews, search, filters]);

    const formatDate = (value?: string) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatStatus = (status?: string) => {
        if (!status) return "Unknown";

        return status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getStatusColor = (status?: string) => {
        switch ((status || "").toLowerCase()) {
            case "completed":
                return "#16A34A";
            case "in_progress":
                return "#2563EB";
            case "evaluation_pending":
                return "#D97706";
            case "ready":
                return "#0891B2";
            case "created":
                return "#7C3AED";
            default:
                return colors.muted;
        }
    };

    const getStatusBackground = (status?: string) => {
        const color = getStatusColor(status);
        return `${color}18`;
    };

    const selectDate = (date?: Date) => {
        setShowDatePicker(false);

        if (!date) return;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        updateFilter("date", `${year}-${month}-${day}`);
    };

    const renderPicker = (
        label: string,
        value: string,
        options: { label: string; value: string }[],
        onChange: (value: string) => void
    ) => (
        <View style={styles.filterGroup}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
                {label}
            </Text>

            <View
                style={[
                    styles.pickerContainer,
                    {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    dropdownIconColor={colors.text}
                    style={{ color: colors.text }}
                >
                    {options.map((option) => (
                        <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                        />
                    ))}
                </Picker>
            </View>
        </View>
    );

    const renderInterviewCard = (item: Interview, index: number) => (
        <View
            key={`${item.interview_id || item.interview_code || index}`}
            style={[
                styles.interviewCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardLabel, { color: colors.muted }]}>
                        INTERVIEW ID
                    </Text>

                    <Text
                        style={[styles.interviewId, { color: colors.primary }]}
                        selectable
                    >
                        {item.interview_code || item.interview_id || "—"}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusBackground(item.status) },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                        ]}
                    >
                        {formatStatus(item.status)}
                    </Text>
                </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    User ID
                </Text>
                <Text
                    style={[styles.detailValue, { color: colors.text }]}
                    selectable
                >
                    {item.user_id || "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Job Role
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.job_role || "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Interview Type
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.interview_type || "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Experience
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.experience_level || "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Difficulty
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.difficulty || "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Questions
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                    {item.number_of_questions ?? "—"}
                </Text>
            </View>

            <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    Created At
                </Text>
                <Text style={[styles.dateValue, { color: colors.text }]}>
                    {formatDate(item.created_at)}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchInterviews(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.content}>
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
                        <Text style={[styles.eyebrow, { color: colors.primary }]}>
                            ADMINISTRATION
                        </Text>

                        <Text style={[styles.title, { color: colors.text }]}>
                            Interview Management
                        </Text>

                        <Text style={[styles.subtitle, { color: colors.muted }]}>
                            View, search and filter interviews created by users.
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.backButton,
                                { backgroundColor: colors.header },
                            ]}
                            onPress={() => navigation.navigate("AdminDashboard")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.backButtonText,
                                    { color: colors.primary },
                                ]}
                            >
                                ← Dashboard
                            </Text>
                        </TouchableOpacity>
                    </View>


                    {/* Total Interviews */}
                    <View
                        style={[
                            styles.statsCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.statsIcon,
                                { backgroundColor: "#6257D920" },
                            ]}
                        >
                            <Text style={styles.statsEmoji}>📋</Text>
                        </View>

                        <View>
                            <Text style={[styles.statsLabel, { color: colors.muted }]}>
                                Total Interviews
                            </Text>
                            <Text style={[styles.statsValue, { color: colors.text }]}>
                                {interviews.length}
                            </Text>
                        </View>
                    </View>


                    {/* Search & Filters Container */}
                    <View
                        style={[
                            styles.searchFiltersContainer,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {/* Search */}
                        <View
                            style={[
                                styles.searchContainer,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={styles.searchIcon}>🔍</Text>

                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search user, role, status..."
                                placeholderTextColor={colors.muted}
                                style={[styles.searchInput, { color: colors.text }]}
                                autoCapitalize="none"
                            />

                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch("")}>
                                    <Text style={{ color: colors.muted, fontSize: 20 }}>
                                        ×
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Filter Toggle */}
                        <TouchableOpacity
                            style={[
                                styles.filterToggle,
                                {
                                    backgroundColor: colors.header,
                                    borderColor: colors.border,
                                },
                            ]}
                            onPress={() => setShowFilters(true)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.filterToggleText, { color: colors.text }]}>
                                ⚙️ Filters
                                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                            </Text>

                            <Text style={{ color: colors.primary, fontWeight: "700" }}>
                                ▼
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Results */}
                    <View style={styles.resultsHeader}>
                        <Text style={[styles.resultsTitle, { color: colors.text }]}>
                            Interview Records
                        </Text>

                        <Text style={[styles.resultsCount, { color: colors.muted }]}>
                            {filteredInterviews.length} found
                        </Text>
                    </View>

                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.muted }]}>
                                Loading interviews...
                            </Text>
                        </View>
                    ) : error ? (
                        <View
                            style={[
                                styles.emptyCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={styles.emptyEmoji}>⚠️</Text>
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                Something went wrong
                            </Text>
                            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                {error}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.retryButton,
                                    { backgroundColor: colors.primary },
                                ]}
                                onPress={() => fetchInterviews()}
                            >
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredInterviews.length === 0 ? (
                        <View
                            style={[
                                styles.emptyCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={styles.emptyEmoji}>📭</Text>

                            <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                No interviews found
                            </Text>

                            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                Try changing your search or filters.
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.retryButton,
                                    { backgroundColor: colors.primary },
                                ]}
                                onPress={clearFilters}
                            >
                                <Text style={styles.retryButtonText}>
                                    Reset Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredInterviews.map(renderInterviewCard)
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={showFilters}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.filterModal,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Filter Interviews
                                </Text>

                                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                                    Refine your interview records
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Text style={[styles.closeText, { color: colors.text }]}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Filter Options */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderPicker(
                                "Status",
                                filters.status,
                                [
                                    { label: "All Statuses", value: "all" },
                                    { label: "Created", value: "created" },
                                    { label: "Ready", value: "ready" },
                                    { label: "In Progress", value: "in_progress" },
                                    { label: "Evaluation Pending", value: "evaluation_pending" },
                                    { label: "Completed", value: "completed" },
                                ],
                                (value) => updateFilter("status", value)
                            )}

                            {renderPicker(
                                "Experience",
                                filters.experience,
                                [
                                    { label: "All Experience", value: "all" },
                                    { label: "Fresher", value: "Fresher" },
                                    { label: "Junior", value: "Junior" },
                                    { label: "Mid Level", value: "Mid Level" },
                                    { label: "Senior", value: "Senior" },
                                ],
                                (value) => updateFilter("experience", value)
                            )}

                            {renderPicker(
                                "Difficulty",
                                filters.difficulty,
                                [
                                    { label: "All Difficulties", value: "all" },
                                    { label: "Easy", value: "Easy" },
                                    { label: "Medium", value: "Medium" },
                                    { label: "Hard", value: "Hard" },
                                ],
                                (value) => updateFilter("difficulty", value)
                            )}

                            {/* Created Date */}
                            <View style={styles.filterGroup}>
                                <Text style={[styles.filterLabel, { color: colors.text }]}>
                                    Created Date
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.dateButton,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={{ color: colors.text }}>
                                        {filters.date || "Select Date"}
                                    </Text>

                                    <Text>📅</Text>
                                </TouchableOpacity>

                                {filters.date !== "" && (
                                    <TouchableOpacity
                                        onPress={() => updateFilter("date", "")}
                                        style={{ marginTop: 8 }}
                                    >
                                        <Text
                                            style={{
                                                color: colors.danger,
                                                fontSize: 12,
                                                fontWeight: "600",
                                            }}
                                        >
                                            Clear selected date
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {renderPicker(
                                "Sort By",
                                filters.sort,
                                [
                                    { label: "Newest First", value: "newest" },
                                    { label: "Oldest First", value: "oldest" },
                                ],
                                (value) => updateFilter("sort", value)
                            )}

                            {showDatePicker && (
                                <DateTimePicker
                                    value={
                                        filters.date
                                            ? new Date(`${filters.date}T00:00:00`)
                                            : new Date()
                                    }
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        if (event.type === "set") {
                                            selectDate(selectedDate);
                                        } else {
                                            setShowDatePicker(false);
                                        }
                                    }}
                                />
                            )}
                        </ScrollView>

                        {/* Modal Footer */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[
                                    styles.clearButton,
                                    {
                                        borderColor: colors.border,
                                        flex: 1,
                                    },
                                ]}
                                onPress={clearFilters}
                            >
                                <Text
                                    style={[
                                        styles.clearButtonText,
                                        { color: colors.primary },
                                    ]}
                                >
                                    Clear All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.applyButton,
                                    {
                                        backgroundColor: colors.primary,
                                        flex: 1.5,
                                    },
                                ]}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={styles.applyButtonText}>
                                    Show {filteredInterviews.length} Interviews
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AdminInterviewScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 18,
        paddingTop: 30,
        paddingBottom: 40,
    },
    header: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
        marginBottom: 7,
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        marginBottom: 7,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
    },
    backButton: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },
    statsCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 17,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 17,
        gap: 14,
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    statsEmoji: {
        fontSize: 23,
    },
    statsLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statsValue: {
        fontSize: 23,
        fontWeight: "800",
    },
    searchFiltersContainer: {
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
    },
    filtersContent: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#64748B30",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 13,
        marginBottom: 13,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 9,
    },
    searchInput: {
        flex: 1,
        minHeight: 48,
        fontSize: 13,
    },
    filterToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 14,
    },
    filterToggleText: {
        fontSize: 14,
        fontWeight: "700",
    },
    filtersCard: {
        padding: 15,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 18,
    },
    filterGroup: {
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 7,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 9,
        overflow: "hidden",
    },
    dateButton: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 9,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    filterActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 3,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 13,
        borderWidth: 1,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    clearButtonText: {
        fontSize: 12,
        fontWeight: "700",
    },
    applyButton: {
        flex: 1.5,
        paddingVertical: 13,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    applyButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "center",
    },
    resultsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 5,
        marginBottom: 13,
    },
    resultsTitle: {
        fontSize: 17,
        fontWeight: "800",
    },
    resultsCount: {
        fontSize: 12,
        fontWeight: "600",
    },
    interviewCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 15,
        marginBottom: 13,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 5,
    },
    interviewId: {
        fontSize: 15,
        fontWeight: "800",
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "800",
    },
    cardDivider: {
        height: 1,
        marginVertical: 13,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 11,
    },
    detailLabel: {
        fontSize: 12,
        flex: 1,
    },
    detailValue: {
        fontSize: 12,
        fontWeight: "700",
        flex: 1.3,
        textAlign: "right",
    },
    dateValue: {
        fontSize: 11,
        fontWeight: "600",
        flex: 1.3,
        textAlign: "right",
    },
    centerContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 45,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
    },
    emptyCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 25,
        alignItems: "center",
        marginTop: 5,
    },
    emptyEmoji: {
        fontSize: 35,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 7,
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: "center",
        lineHeight: 19,
    },
    retryButton: {
        marginTop: 17,
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 9,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
    },
    filterModal: {
        width: "100%",
        maxHeight: "88%",
        borderRadius: 20,
        padding: 18,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
    },
    modalSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    closeText: {
        fontSize: 30,
        paddingHorizontal: 6,
    },
    modalFooter: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15,
        paddingTop: 12,
    },
});
