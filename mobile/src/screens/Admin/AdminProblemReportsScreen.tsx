
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import { useNavigation } from "@react-navigation/native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

interface ProblemReport {
    report_id: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
    subject?: string;
    problem_type?: string;
    description?: string;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

const AdminProblemReportsScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();

    const isDark = theme === "Dark";

    const [reports, setReports] = useState<ProblemReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");

    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const [selectedReport, setSelectedReport] =
        useState<ProblemReport | null>(null);

    const [detailsLoading, setDetailsLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState("");

    // ==========================================
    // FETCH REPORTS
    // ==========================================

    const loadReports = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            setNotice("");

            const response = await api.get("/api/admin/problem-reports");

            if (response.data?.success) {
                setReports(
                    Array.isArray(response.data.reports)
                        ? response.data.reports
                        : []
                );
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load problem reports."
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load reports. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    // ==========================================
    // REPORT TYPES
    // ==========================================

    const reportTypes = useMemo(() => {
        return [
            ...new Set(
                reports
                    .map((report) => report.problem_type)
                    .filter((type): type is string => Boolean(type))
            ),
        ].sort();
    }, [reports]);

    // ==========================================
    // FILTER REPORTS
    // ==========================================

    const filteredReports = useMemo(() => {
        const query = search.trim().toLowerCase();
        const now = new Date();

        return reports
            .filter((report) => {
                const matchesSearch = [
                    report.report_id,
                    report.user_name,
                    report.user_email,
                    report.subject,
                    report.problem_type,
                    report.description,
                    report.user_id,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(query)
                );

                const matchesStatus =
                    statusFilter === "all" ||
                    String(report.status || "Open").toLowerCase() ===
                    statusFilter.toLowerCase();

                const matchesType =
                    typeFilter === "all" ||
                    report.problem_type === typeFilter;

                let matchesDate = true;

                if (dateFilter !== "all") {
                    const created = new Date(report.created_at || "");

                    if (
                        !report.created_at ||
                        Number.isNaN(created.getTime())
                    ) {
                        matchesDate = false;
                    } else if (dateFilter === "today") {
                        matchesDate =
                            created.getFullYear() === now.getFullYear() &&
                            created.getMonth() === now.getMonth() &&
                            created.getDate() === now.getDate();
                    } else {
                        const days = Number(
                            dateFilter.replace("days", "")
                        );

                        const cutoff = new Date(
                            now.getTime() -
                            days * 24 * 60 * 60 * 1000
                        );

                        matchesDate =
                            created >= cutoff && created <= now;
                    }
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType &&
                    matchesDate
                );
            })
            .sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();

                return sortBy === "oldest"
                    ? dateA - dateB
                    : dateB - dateA;
            });
    }, [
        reports,
        search,
        statusFilter,
        typeFilter,
        dateFilter,
        sortBy,
    ]);

    // ==========================================
    // STATUS COUNTS
    // ==========================================

    const statusCounts = useMemo(() => ({
        total: reports.length,
        open: reports.filter(
            (report) => (report.status || "Open") === "Open"
        ).length,
        progress: reports.filter(
            (report) => report.status === "In Progress"
        ).length,
        resolved: reports.filter(
            (report) => report.status === "Resolved"
        ).length,
    }), [reports]);

    // ==========================================
    // ACTIVE FILTERS
    // ==========================================

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        typeFilter !== "all" ||
        dateFilter !== "all";

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setTypeFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

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

    // ==========================================
    // STATUS COLORS
    // ==========================================

    const getStatusColor = (status?: string) => {
        if (status === "Resolved") {
            return {
                background: isDark ? "#173D32" : "#DCFCE7",
                text: isDark ? "#86EFAC" : "#15803D",
            };
        }

        if (status === "In Progress") {
            return {
                background: isDark ? "#1E3A5F" : "#DBEAFE",
                text: isDark ? "#93C5FD" : "#1D4ED8",
            };
        }

        return {
            background: isDark ? "#4A3219" : "#FFEDD5",
            text: isDark ? "#FDBA74" : "#C2410C",
        };
    };

    // ==========================================
    // OPEN REPORT DETAILS
    // ==========================================

    const openDetails = async (reportId: string) => {
        try {
            setDetailsLoading(true);
            setError("");
            setNotice("");

            const response = await api.get(
                `/api/admin/problem-reports/${encodeURIComponent(reportId)}`
            );

            if (response.data?.success) {
                setSelectedReport(response.data.report);
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load report details."
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load report details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // ==========================================
    // UPDATE REPORT STATUS
    // ==========================================

    const updateStatus = async (
        reportId: string,
        newStatus: string
    ) => {
        if (!STATUS_OPTIONS.includes(newStatus)) return;

        if (updatingId) return;

        try {
            setUpdatingId(reportId);
            setNotice("");
            setError("");

            const response = await api.patch(
                `/api/admin/problem-reports/${encodeURIComponent(reportId)}/status`,
                { status: newStatus }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to update report status."
                );
            }

            setReports((previous) =>
                previous.map((report) =>
                    report.report_id === reportId
                        ? { ...report, status: newStatus }
                        : report
                )
            );

            setSelectedReport((previous) =>
                previous?.report_id === reportId
                    ? {
                        ...previous,
                        status: newStatus,
                        updated_at:
                            response.data.report?.updated_at ||
                            previous.updated_at,
                    }
                    : previous
            );

            setNotice(
                `Report ${reportId} updated to ${newStatus}.`
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update report status."
            );
        } finally {
            setUpdatingId("");
        }
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
            padding: 16,
            paddingBottom: 35,
        },
        headerCard: {
            backgroundColor: colors.card,
            borderRadius: 15,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 18,
        },
        eyebrow: {
            color: colors.primary,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.2,
            marginBottom: 8,
        },
        title: {
            color: colors.text,
            fontSize: 25,
            fontWeight: "800",
        },
        subtitle: {
            color: colors.muted,
            fontSize: 13,
            lineHeight: 20,
            marginTop: 7,
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
            color: colors.primary,
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
        },
        notice: {
            padding: 13,
            borderRadius: 10,
            marginBottom: 14,
            borderWidth: 1,
        },
        errorNotice: {
            backgroundColor: isDark ? "#451F25" : "#FEF2F2",
            borderColor: isDark ? "#7F303B" : "#FECACA",
        },
        successNotice: {
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
        statsGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 18,
        },
        statCard: {
            width: "48%",
            flexGrow: 1,
            minHeight: 105,
            padding: 14,
            borderRadius: 13,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "space-between",
        },
        statTop: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        statIcon: {
            fontSize: 21,
        },
        statValue: {
            fontSize: 25,
            fontWeight: "800",
            color: colors.text,
        },
        statLabel: {
            color: colors.muted,
            fontSize: 12,
            fontWeight: "600",
            marginTop: 5,
        },
        purpleAccent: {
            borderLeftWidth: 4,
            borderLeftColor: "#8B5CF6",
        },
        orangeAccent: {
            borderLeftWidth: 4,
            borderLeftColor: "#F59E0B",
        },
        blueAccent: {
            borderLeftWidth: 4,
            borderLeftColor: "#3B82F6",
        },
        greenAccent: {
            borderLeftWidth: 4,
            borderLeftColor: "#22C55E",
        },
        recordsCard: {
            backgroundColor: colors.card,
            borderRadius: 15,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
        },
        recordsTitle: {
            color: colors.text,
            fontSize: 18,
            fontWeight: "800",
        },
        recordsSubtitle: {
            color: colors.muted,
            fontSize: 12,
            marginTop: 5,
            marginBottom: 15,
        },
        searchInput: {
            backgroundColor: colors.input,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            fontSize: 13,
            marginBottom: 11,
        },
        toolbarRow: {
            flexDirection: "row",
            gap: 9,
            marginBottom: 13,
        },
        toolbarButton: {
            flex: 1,
            paddingVertical: 11,
            borderRadius: 9,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.header,
        },
        toolbarButtonText: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: "700",
        },
        activeFilterButton: {
            borderWidth: 1,
            borderColor: colors.primary,
        },
        filterPanel: {
            backgroundColor: colors.background,
            borderRadius: 12,
            padding: 13,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 15,
        },
        filterHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
        },
        filterTitle: {
            fontSize: 14,
            color: colors.text,
            fontWeight: "800",
        },
        clearText: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: "700",
        },
        filterLabel: {
            color: colors.text,
            fontSize: 12,
            fontWeight: "700",
            marginBottom: 5,
            marginTop: 8,
        },
        pickerWrapper: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 9,
            overflow: "hidden",
            backgroundColor: colors.input,
        },
        picker: {
            color: colors.text,
            height: 53,
            width: "100%",
        },
        reportCard: {
            backgroundColor: colors.background,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            marginBottom: 12,
        },
        reportTop: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
        },
        reportId: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: "800",
            flex: 1,
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
        },
        statusBadgeText: {
            fontSize: 10,
            fontWeight: "800",
        },
        reportSubject: {
            color: colors.text,
            fontSize: 15,
            fontWeight: "800",
            marginBottom: 5,
        },
        reportDescription: {
            color: colors.muted,
            fontSize: 12,
            lineHeight: 18,
            marginBottom: 12,
        },
        reportInfo: {
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 10,
            gap: 6,
        },
        reportInfoText: {
            color: colors.muted,
            fontSize: 11,
        },
        viewButton: {
            backgroundColor: colors.primary,
            borderRadius: 9,
            paddingVertical: 11,
            alignItems: "center",
            marginTop: 13,
        },
        viewButtonText: {
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: "700",
        },
        emptyContainer: {
            paddingVertical: 35,
            alignItems: "center",
        },
        emptyIcon: {
            fontSize: 35,
            marginBottom: 12,
        },
        emptyTitle: {
            color: colors.text,
            fontSize: 16,
            fontWeight: "800",
        },
        emptyText: {
            color: colors.muted,
            fontSize: 12,
            textAlign: "center",
            marginTop: 7,
            lineHeight: 19,
        },
        loadingContainer: {
            paddingVertical: 35,
            alignItems: "center",
        },
        loadingText: {
            color: colors.muted,
            marginTop: 10,
            fontSize: 13,
        },
        // Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            padding: 15,
        },
        modalCard: {
            backgroundColor: colors.card,
            borderRadius: 17,
            maxHeight: "90%",
            overflow: "hidden",
        },
        modalHeader: {
            padding: 18,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        modalEyebrow: {
            color: colors.primary,
            fontSize: 11,
            fontWeight: "800",
        },
        modalTitle: {
            color: colors.text,
            fontSize: 19,
            fontWeight: "800",
            marginTop: 5,
        },
        closeButton: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
        },
        closeButtonText: {
            color: colors.text,
            fontSize: 22,
        },
        modalBody: {
            padding: 17,
        },
        highlightBox: {
            backgroundColor: colors.header,
            padding: 14,
            borderRadius: 11,
            marginBottom: 15,
        },
        detailLabel: {
            color: colors.muted,
            fontSize: 11,
            fontWeight: "700",
            marginBottom: 6,
        },
        highlightTitle: {
            color: colors.text,
            fontSize: 16,
            fontWeight: "800",
        },
        detailGrid: {
            gap: 12,
            marginBottom: 17,
        },
        detailItem: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 12,
        },
        detailValue: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "600",
        },
        descriptionBox: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            padding: 13,
            marginBottom: 17,
        },
        descriptionText: {
            color: colors.text,
            fontSize: 13,
            lineHeight: 21,
        },
        statusEditor: {
            marginBottom: 10,
        },
        statusEditorLabel: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "800",
            marginBottom: 8,
        },
        updatingText: {
            color: colors.primary,
            fontSize: 11,
            marginTop: 8,
        },
        modalFooter: {
            padding: 15,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        closeModalButton: {
            backgroundColor: colors.header,
            paddingVertical: 13,
            borderRadius: 10,
            alignItems: "center",
        },
        closeModalText: {
            color: colors.primary,
            fontSize: 13,
            fontWeight: "800",
        },

        filterModalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
        },

        filterModalCard: {
            width: "100%",
            maxWidth: 500,
            maxHeight: "85%",
            backgroundColor: colors.card,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
        },

        filterModalHeader: {
            padding: 18,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },

        filterModalTitle: {
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
            marginTop: 5,
        },

        filterModalSubtitle: {
            color: colors.muted,
            fontSize: 12,
            marginTop: 5,
        },

        filterModalBody: {
            padding: 18,
            paddingBottom: 20,
        },

        filterModalFooter: {
            flexDirection: "row",
            gap: 10,
            padding: 15,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },

        clearFilterButton: {
            flex: 1,
            paddingVertical: 13,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.header,
        },

        clearFilterButtonText: {
            color: colors.primary,
            fontSize: 13,
            fontWeight: "800",
        },

        applyFilterButton: {
            flex: 1.5,
            paddingVertical: 13,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
        },

        applyFilterButtonText: {
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: "800",
        },
    });

    // ==========================================
    // REPORT CARD
    // ==========================================

    const renderReport = ({ item }: { item: ProblemReport }) => {
        const status = item.status || "Open";
        const statusColor = getStatusColor(status);

        return (
            <View style={styles.reportCard}>
                <View style={styles.reportTop}>
                    <Text style={styles.reportId}>
                        {item.report_id || "No Report ID"}
                    </Text>

                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: statusColor.background },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusBadgeText,
                                { color: statusColor.text },
                            ]}
                        >
                            {status}
                        </Text>
                    </View>
                </View>

                <Text style={styles.reportSubject}>
                    {item.subject || "Untitled"}
                </Text>

                <Text
                    style={styles.reportDescription}
                    numberOfLines={2}
                >
                    {item.description || "No description provided."}
                </Text>

                <View style={styles.reportInfo}>
                    <Text style={styles.reportInfoText}>
                        👤 {item.user_name || "Unknown"}
                    </Text>

                    <Text style={styles.reportInfoText}>
                        ✉️ {item.user_email || "—"}
                    </Text>

                    <Text style={styles.reportInfoText}>
                        🏷️ {item.problem_type || "Other"}
                    </Text>

                    <Text style={styles.reportInfoText}>
                        📅 {formatDate(item.created_at)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => openDetails(item.report_id)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.viewButtonText}>
                        View Details →
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    // ==========================================
    // SCREEN
    // ==========================================

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadReports(true)}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* HEADER */}

                <View style={styles.headerCard}>
                    <Text style={styles.eyebrow}>
                        ADMINISTRATION
                    </Text>

                    <Text style={styles.title}>
                        Problem Reports
                    </Text>

                    <Text style={styles.subtitle}>
                        Review user-submitted issues and track their resolution.
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

                {/* NOTICES */}

                {notice ? (
                    <View style={[styles.notice, styles.successNotice]}>
                        <Text style={styles.successText}>
                            {notice}
                        </Text>
                    </View>
                ) : null}

                {error ? (
                    <View style={[styles.notice, styles.errorNotice]}>
                        <Text style={styles.errorText}>
                            {error}
                        </Text>
                    </View>
                ) : null}

                {/* STATISTICS */}

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, styles.purpleAccent]}>
                        <View style={styles.statTop}>
                            <Text style={styles.statIcon}>📋</Text>
                            <Text style={styles.statValue}>
                                {loading ? "..." : statusCounts.total}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>
                            Total Reports
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.orangeAccent]}>
                        <View style={styles.statTop}>
                            <Text style={styles.statIcon}>📨</Text>
                            <Text style={styles.statValue}>
                                {loading ? "..." : statusCounts.open}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>
                            Open
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.blueAccent]}>
                        <View style={styles.statTop}>
                            <Text style={styles.statIcon}>⚙️</Text>
                            <Text style={styles.statValue}>
                                {loading ? "..." : statusCounts.progress}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>
                            In Progress
                        </Text>
                    </View>

                    <View style={[styles.statCard, styles.greenAccent]}>
                        <View style={styles.statTop}>
                            <Text style={styles.statIcon}>✓</Text>
                            <Text style={styles.statValue}>
                                {loading ? "..." : statusCounts.resolved}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>
                            Resolved
                        </Text>
                    </View>
                </View>

                {/* REPORT RECORDS */}
                <View style={styles.recordsCard}>
                    <Text style={styles.recordsTitle}>
                        Problem Report Records
                    </Text>

                    <Text style={styles.recordsSubtitle}>
                        {loading
                            ? "Loading reports..."
                            : `${filteredReports.length} out of ${reports.length} results`}
                    </Text>

                    {/* SEARCH */}

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search subject, user or ID..."
                        placeholderTextColor={colors.muted}
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                    />

                    {/* TOOLBAR */}

                    <View style={styles.toolbarRow}>
                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                hasActiveFilters && styles.activeFilterButton,
                            ]}
                            onPress={() => setFilterMenuOpen(true)}
                        >
                            <Text style={styles.toolbarButtonText}>
                                ☷ Filters {hasActiveFilters ? "•" : ""} ▼
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.toolbarButton}
                            onPress={() => loadReports(true)}
                            disabled={loading || refreshing}
                        >
                            <Text style={styles.toolbarButtonText}>
                                ↻ Refresh
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* REPORT LIST - OUTSIDE RECORDS CONTAINER */}

                <View style={{ marginTop: 14 }}>
                    {loading ? (
                        <View style={[styles.recordsCard, styles.loadingContainer]}>
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                            />
                            <Text style={styles.loadingText}>
                                Loading problem reports...
                            </Text>
                        </View>
                    ) : filteredReports.length === 0 ? (
                        <View style={[styles.recordsCard, styles.emptyContainer]}>
                            <Text style={styles.emptyIcon}>📭</Text>

                            <Text style={styles.emptyTitle}>
                                No reports found
                            </Text>

                            <Text style={styles.emptyText}>
                                {reports.length === 0
                                    ? "No problem reports have been submitted yet."
                                    : "Try changing your search or filters."}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredReports}
                            renderItem={renderReport}
                            keyExtractor={(item, index) =>
                                item.report_id || String(index)
                            }
                            scrollEnabled={false}
                            removeClippedSubviews={false}
                        />
                    )}
                </View>
            </ScrollView>

            {/* FILTER MODAL */}
            <Modal
                visible={filterMenuOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFilterMenuOpen(false)}
            >
                <View style={styles.filterModalOverlay}>
                    <View style={styles.filterModalCard}>

                        {/* HEADER */}

                        <View style={styles.filterModalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalEyebrow}>
                                    REPORT MANAGEMENT
                                </Text>

                                <Text style={styles.filterModalTitle}>
                                    Filter Reports
                                </Text>

                                <Text style={styles.filterModalSubtitle}>
                                    Customize your report list.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setFilterMenuOpen(false)}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* FILTER OPTIONS */}

                        <ScrollView
                            style={{ flexGrow: 0 }}
                            contentContainerStyle={styles.filterModalBody}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style={styles.filterLabel}>Status</Text>

                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={statusFilter}
                                    onValueChange={setStatusFilter}
                                    style={styles.picker}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="All statuses" value="all" />
                                    <Picker.Item label="Open" value="Open" />
                                    <Picker.Item label="In Progress" value="In Progress" />
                                    <Picker.Item label="Resolved" value="Resolved" />
                                </Picker>
                            </View>

                            <Text style={styles.filterLabel}>Problem Type</Text>

                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={typeFilter}
                                    onValueChange={setTypeFilter}
                                    style={styles.picker}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item
                                        label="All problem types"
                                        value="all"
                                    />

                                    {reportTypes.map((type) => (
                                        <Picker.Item
                                            key={type}
                                            label={type}
                                            value={type}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.filterLabel}>Submitted Date</Text>

                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={dateFilter}
                                    onValueChange={setDateFilter}
                                    style={styles.picker}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Any time" value="all" />
                                    <Picker.Item label="Today" value="today" />
                                    <Picker.Item label="Last 7 days" value="7days" />
                                    <Picker.Item label="Last 30 days" value="30days" />
                                    <Picker.Item label="Last 90 days" value="90days" />
                                </Picker>
                            </View>

                            <Text style={styles.filterLabel}>Sort By</Text>

                            <View style={styles.pickerWrapper}>
                                <Picker
                                    selectedValue={sortBy}
                                    onValueChange={setSortBy}
                                    style={styles.picker}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item
                                        label="Newest first"
                                        value="newest"
                                    />
                                    <Picker.Item
                                        label="Oldest first"
                                        value="oldest"
                                    />
                                </Picker>
                            </View>
                        </ScrollView>

                        {/* FOOTER */}

                        <View style={styles.filterModalFooter}>
                            <TouchableOpacity
                                style={styles.clearFilterButton}
                                onPress={clearFilters}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.clearFilterButtonText}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyFilterButton}
                                onPress={() => setFilterMenuOpen(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.applyFilterButtonText}>
                                    Show {filteredReports.length} Reports
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </View>
            </Modal>
            {/* DETAILS LOADING MODAL */}
            <Modal
                visible={detailsLoading}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailsLoading(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalCard,
                        {
                            padding: 30,
                            alignItems: "center",
                            justifyContent: "center",
                        },
                    ]}>
                        <ActivityIndicator
                            size="large"
                            color={colors.primary}
                        />
                        <Text style={styles.loadingText}>
                            Loading report details...
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* REPORT DETAILS MODAL */}

            <Modal
                visible={Boolean(selectedReport)}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedReport(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalEyebrow}>
                                    {selectedReport?.report_id}
                                </Text>

                                <Text style={styles.modalTitle}>
                                    Report Details
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedReport(null)}
                            >
                                <Text style={styles.closeButtonText}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={{ flexGrow: 0 }}
                            contentContainerStyle={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* SUBJECT */}

                            <View style={styles.highlightBox}>
                                <Text style={styles.detailLabel}>
                                    SUBJECT
                                </Text>

                                <Text style={styles.highlightTitle}>
                                    {selectedReport?.subject || "Untitled"}
                                </Text>
                            </View>

                            {/* REPORT INFORMATION */}

                            <View style={styles.detailGrid}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Submitted By
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {selectedReport?.user_name || "Unknown"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Email
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {selectedReport?.user_email || "—"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Problem Type
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {selectedReport?.problem_type || "Other"}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Submitted At
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(selectedReport?.created_at)}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        Last Updated
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {formatDate(selectedReport?.updated_at)}
                                    </Text>
                                </View>

                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>
                                        User ID
                                    </Text>
                                    <Text style={styles.detailValue}>
                                        {selectedReport?.user_id || "—"}
                                    </Text>
                                </View>
                            </View>

                            {/* DESCRIPTION */}

                            <View style={styles.descriptionBox}>
                                <Text style={styles.detailLabel}>
                                    DESCRIPTION
                                </Text>

                                <Text style={styles.descriptionText}>
                                    {selectedReport?.description ||
                                        "No description provided."}
                                </Text>
                            </View>

                            {/* STATUS EDITOR */}

                            <View style={styles.statusEditor}>
                                <Text style={styles.statusEditorLabel}>
                                    Update Report Status
                                </Text>

                                <View style={styles.pickerWrapper}>
                                    <Picker
                                        selectedValue={
                                            selectedReport?.status || "Open"
                                        }
                                        onValueChange={(value) => {
                                            if (
                                                selectedReport &&
                                                value !== selectedReport.status
                                            ) {
                                                updateStatus(
                                                    selectedReport.report_id,
                                                    value
                                                );
                                            }
                                        }}
                                        enabled={
                                            updatingId !== selectedReport?.report_id
                                        }
                                        style={styles.picker}
                                        dropdownIconColor={colors.text}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <Picker.Item
                                                key={status}
                                                label={status}
                                                value={status}
                                            />
                                        ))}
                                    </Picker>
                                </View>

                                {updatingId === selectedReport?.report_id && (
                                    <Text style={styles.updatingText}>
                                        Saving status...
                                    </Text>
                                )}
                            </View>
                        </ScrollView>
                        {/* MODAL FOOTER */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setSelectedReport(null)}
                            >
                                <Text style={styles.closeModalText}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AdminProblemReportsScreen;
