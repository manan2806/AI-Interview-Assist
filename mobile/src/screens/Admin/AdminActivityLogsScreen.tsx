
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

interface Activity {
    log_id?: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
    role?: string;
    action?: string;
    description?: string;
    ip_address?: string;
    created_at?: string;
}

interface FilterOptions {
    actions: string[];
    roles: string[];
    users: any[];
}

const DEFAULT_FILTERS = {
    role: "all",
    action: "all",
    start_date: "",
    end_date: "",
    sort: "newest",
};

function formatDate(value?: string) {
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
}

function formatAction(action?: string) {
    return String(action || "unknown")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActionColor(action?: string, isDark = false) {
    const value = String(action || "").toLowerCase();

    if (value.includes("login") || value.includes("register")) {
        return {
            background: isDark ? "#14532D" : "#DCFCE7",
            text: isDark ? "#86EFAC" : "#166534",
        };
    }

    if (value.includes("logout")) {
        return {
            background: isDark ? "#374151" : "#E2E8F0",
            text: isDark ? "#D1D5DB" : "#475569",
        };
    }

    if (value.includes("delete")) {
        return {
            background: isDark ? "#7F1D1D" : "#FEE2E2",
            text: isDark ? "#FCA5A5" : "#B91C1C",
        };
    }

    if (value.includes("password")) {
        return {
            background: isDark ? "#78350F" : "#FEF3C7",
            text: isDark ? "#FCD34D" : "#92400E",
        };
    }

    if (value.includes("interview")) {
        return {
            background: isDark ? "#312E81" : "#E0E7FF",
            text: isDark ? "#C7D2FE" : "#4338CA",
        };
    }

    if (value.includes("profile")) {
        return {
            background: isDark ? "#164E63" : "#CFFAFE",
            text: isDark ? "#67E8F9" : "#0E7490",
        };
    }

    return {
        background: isDark ? "#374151" : "#F1F5F9",
        text: isDark ? "#D1D5DB" : "#475569",
    };
}

function AdminActivityLogsScreen() {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        actions: [],
        roles: ["user", "admin"],
        users: [],
    });

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [overallTotal, setOverallTotal] = useState(0);

    const [datePicker, setDatePicker] = useState<"start" | "end" | null>(null);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await api.get("/api/admin/activity-logs/filters");

            if (response.data?.success) {
                setFilterOptions({
                    actions: response.data.actions || [],
                    roles: response.data.roles || ["user", "admin"],
                    users: response.data.users || [],
                });
            }
        } catch (err) {
            console.error("Unable to load activity filters:", err);
        }
    }, []);

    const fetchActivities = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const params: any = {
                page,
                per_page: perPage,
                search: search.trim(),
                role: filters.role === "all" ? "" : filters.role,
                action: filters.action === "all" ? "" : filters.action,
                start_date: filters.start_date,
                end_date: filters.end_date,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === "") delete params[key];
            });

            const response = await api.get("/api/admin/activity-logs", {
                params,
            });

            const data = response.data;

            setActivities(data.activities || []);
            setTotal(data.total || 0);
            setOverallTotal(data.overall_total || 0);
            setTotalPages(data.total_pages || 1);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Unable to load activity logs. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, perPage, search, filters]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const updateFilter = (key: keyof typeof DEFAULT_FILTERS, value: string) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));

        if (key !== "sort") {
            setPage(1);
        }
    };

    const clearFilters = () => {
        setFilters({ ...DEFAULT_FILTERS });
        setSearch("");
        setPage(1);
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const activeFilterCount = [
        filters.role !== "all",
        filters.action !== "all",
        Boolean(filters.start_date),
        Boolean(filters.end_date),
        filters.sort !== "newest",
    ].filter(Boolean).length;

    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();

            return filters.sort === "oldest"
                ? dateA - dateB
                : dateB - dateA;
        });
    }, [activities, filters.sort]);

    const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
    const endItem = Math.min(page * perPage, total);

    const openDatePicker = (type: "start" | "end") => {
        setDatePicker(type);
    };

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        if (datePicker === null) return;

        setDatePicker(null);

        if (!selectedDate) return;

        const formattedDate = [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, "0"),
            String(selectedDate.getDate()).padStart(2, "0"),
        ].join("-");

        updateFilter(
            datePicker === "start" ? "start_date" : "end_date",
            formattedDate
        );
    };

    const renderActivity = ({ item }: { item: Activity }) => {
        const actionColor = getActionColor(item.action, isDark);

        return (
            <View
                style={[
                    styles.activityCard,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                    },
                ]}
            >
                <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardLabel, { color: colors.muted }]}>
                            LOG ID
                        </Text>

                        <Text style={[styles.logId, { color: colors.primary }]}>
                            {item.log_id || "—"}
                        </Text>
                    </View>

                    <View
                        style={[
                            styles.roleBadge,
                            {
                                backgroundColor:
                                    String(item.role).toLowerCase() === "admin"
                                        ? isDark ? "#312E81" : "#E0E7FF"
                                        : isDark ? "#164E63" : "#CFFAFE",
                            },
                        ]}
                    >
                        <Text
                            style={{
                                color:
                                    String(item.role).toLowerCase() === "admin"
                                        ? isDark ? "#C7D2FE" : "#4338CA"
                                        : isDark ? "#67E8F9" : "#0E7490",
                                fontSize: 11,
                                fontWeight: "800",
                            }}
                        >
                            {(item.role || "user").toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={[styles.separator, { backgroundColor: colors.border }]} />

                <Text style={[styles.userName, { color: colors.text }]}>
                    {item.user_name || "Unknown User"}
                </Text>

                <Text style={[styles.detailText, { color: colors.muted }]}>
                    ✉ {item.user_email || "—"}
                </Text>

                <Text style={[styles.detailText, { color: colors.muted }]}>
                    ID: {item.user_id || "—"}
                </Text>

                <View style={styles.actionRow}>
                    <Text style={[styles.cardLabel, { color: colors.muted }]}>
                        ACTIVITY
                    </Text>

                    <View
                        style={[
                            styles.actionBadge,
                            { backgroundColor: actionColor.background },
                        ]}
                    >
                        <Text
                            style={[
                                styles.actionBadgeText,
                                { color: actionColor.text },
                            ]}
                        >
                            {formatAction(item.action)}
                        </Text>
                    </View>
                </View>

                <View style={[styles.descriptionBox, { backgroundColor: colors.header }]}>
                    <Text style={[styles.cardLabel, { color: colors.muted }]}>
                        DESCRIPTION
                    </Text>

                    <Text style={[styles.descriptionText, { color: colors.text }]}>
                        {item.description || "—"}
                    </Text>
                </View>

                <View style={styles.bottomInfo}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardLabel, { color: colors.muted }]}>
                            IP ADDRESS
                        </Text>

                        <Text style={[styles.detailText, { color: colors.text }]}>
                            {item.ip_address || "—"}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardLabel, { color: colors.muted }]}>
                            DATE & TIME
                        </Text>

                        <Text style={[styles.dateText, { color: colors.text }]}>
                            {formatDate(item.created_at)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={sortedActivities}
                keyExtractor={(item, index) =>
                    item.log_id || `${item.user_id}-${index}`
                }
                renderItem={renderActivity}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            fetchFilterOptions();
                            fetchActivities(true);
                        }}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListHeaderComponent={
                    <View>
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
                                Activity Logs
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.muted }]}>
                                Monitor login, logout, profile updates, interviews and
                                account activities of all users and administrators.
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.dashboardButton,
                                    { backgroundColor: colors.header },
                                ]}
                                onPress={() => navigation.navigate("AdminDashboard")}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.dashboardButtonText, { color: colors.primary }]}>
                                    ← Dashboard
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View
                            style={[
                                styles.toolbar,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryIcon}>📜</Text>

                                <View>
                                    <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                                        Total Activity Logs
                                    </Text>

                                    <Text style={[styles.summaryValue, { color: colors.text }]}>
                                        {overallTotal.toLocaleString("en-IN")}
                                    </Text>
                                </View>
                            </View>

                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        backgroundColor: colors.input,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="⌕ Search user, email, action..."
                                placeholderTextColor={colors.muted}
                                value={search}
                                onChangeText={handleSearchChange}
                            />

                            <View style={styles.toolbarRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.toolbarButton,
                                        {
                                            backgroundColor: colors.header,
                                            borderColor: colors.primary,
                                        },
                                        activeFilterCount > 0 && styles.activeFilterButton,
                                    ]}
                                    onPress={() => setShowFilters(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toolbarButtonText, { color: colors.primary }]}>
                                        ☷ Filters {activeFilterCount > 0 ? "•" : ""} ▼
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.toolbarButton,
                                        { backgroundColor: colors.header },
                                    ]}
                                    onPress={() => {
                                        fetchFilterOptions();
                                        fetchActivities(true);
                                    }}
                                    disabled={loading || refreshing}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toolbarButtonText, { color: colors.primary }]}>
                                        {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.tableHeader,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                All Activity Logs
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.muted }]}>
                                Showing {startItem}-{endItem} of {total} activities
                            </Text>

                            <View style={styles.paginationTop}>
                                <Text style={[styles.pageInfo, { color: colors.muted }]}>
                                    Page {page} of {totalPages}
                                </Text>

                                <View style={[styles.pageSizePicker, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                    <Picker
                                        selectedValue={perPage}
                                        onValueChange={(value) => {
                                            setPerPage(Number(value));
                                            setPage(1);
                                        }}
                                        style={{ color: colors.text }}
                                        dropdownIconColor={colors.text}
                                    >
                                        <Picker.Item label="10 / page" value={10} />
                                        <Picker.Item label="20 / page" value={20} />
                                        <Picker.Item label="50 / page" value={50} />
                                        <Picker.Item label="100 / page" value={100} />
                                    </Picker>
                                </View>
                            </View>

                            {(search || activeFilterCount > 0) && (
                                <TouchableOpacity onPress={clearFilters}>
                                    <Text style={[styles.resetText, { color: colors.primary }]}>
                                        Reset filters
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {error ? (
                            <View style={[styles.stateCard, { backgroundColor: colors.card }]}>
                                <Text style={{ color: colors.danger, textAlign: "center" }}>
                                    {error}
                                </Text>

                                <TouchableOpacity
                                    style={[styles.applyButton, { backgroundColor: colors.primary }]}
                                    onPress={() => fetchActivities()}
                                >
                                    <Text style={styles.applyButtonText}>Try Again</Text>
                                </TouchableOpacity>
                            </View>
                        ) : null}

                        {loading && (
                            <View style={styles.stateContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.stateText, { color: colors.muted }]}>
                                    Loading activity logs...
                                </Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={[styles.stateCard, { backgroundColor: colors.card }]}>
                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            <>
                                <Text style={styles.emptyIcon}>📜</Text>

                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    No activity logs found
                                </Text>

                                <Text style={[styles.subtitle, { color: colors.muted, textAlign: "center" }]}>
                                    Try changing your search or clearing the filters.
                                </Text>

                                <TouchableOpacity onPress={clearFilters}>
                                    <Text style={[styles.resetText, { color: colors.primary }]}>
                                        Clear Search and Filters
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                }
                ListFooterComponent={
                    <View>
                        {!loading && !error && total > 0 && (
                            <View style={styles.pagination}>
                                <TouchableOpacity
                                    style={[
                                        styles.pageButton,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                            opacity: page <= 1 ? 0.4 : 1,
                                        },
                                    ]}
                                    disabled={page <= 1}
                                    onPress={() => setPage((previous) => previous - 1)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                                        ← Previous
                                    </Text>
                                </TouchableOpacity>

                                <Text style={[styles.pageNumber, { color: colors.text }]}>
                                    {page} / {totalPages}
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.pageButton,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                            opacity: page >= totalPages ? 0.4 : 1,
                                        },
                                    ]}
                                    disabled={page >= totalPages}
                                    onPress={() => setPage((previous) => previous + 1)}
                                >
                                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                                        Next →
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                }
            />

            <Modal
                visible={showFilters}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.filterModal, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Filter Activity Logs
                                </Text>
                                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                                    Refine the activity list
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <Text style={[styles.closeText, { color: colors.text }]}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Account Role
                            </Text>

                            <View style={[styles.pickerBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={filters.role}
                                    onValueChange={(value) => updateFilter("role", value)}
                                    style={{ color: colors.text }}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="All Roles" value="all" />
                                    <Picker.Item label="Users" value="user" />
                                    <Picker.Item label="Administrators" value="admin" />
                                </Picker>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Activity Type
                            </Text>

                            <View style={[styles.pickerBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={filters.action}
                                    onValueChange={(value) => updateFilter("action", value)}
                                    style={{ color: colors.text }}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="All Activities" value="all" />
                                    {filterOptions.actions.map((action) => (
                                        <Picker.Item
                                            key={action}
                                            label={formatAction(action)}
                                            value={action}
                                        />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Start Date
                            </Text>

                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                                onPress={() => openDatePicker("start")}
                            >
                                <Text style={{ color: colors.text }}>
                                    {filters.start_date || "Select Start Date"}
                                </Text>
                            </TouchableOpacity>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                End Date
                            </Text>

                            <TouchableOpacity
                                style={[styles.dateButton, { backgroundColor: colors.input, borderColor: colors.border }]}
                                onPress={() => openDatePicker("end")}
                            >
                                <Text style={{ color: colors.text }}>
                                    {filters.end_date || "Select End Date"}
                                </Text>
                            </TouchableOpacity>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Sort By
                            </Text>

                            <View style={[styles.pickerBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={filters.sort}
                                    onValueChange={(value) => updateFilter("sort", value)}
                                    style={{ color: colors.text }}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Newest First" value="newest" />
                                    <Picker.Item label="Oldest First" value="oldest" />
                                </Picker>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.clearButton, { borderColor: colors.border, marginTop: 0, flex: 1 }]}
                                onPress={clearFilters}
                            >
                                <Text style={[styles.clearButtonText, { color: colors.primary }]}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.applyButton, { backgroundColor: colors.primary, flex: 1, marginTop: 0 }]}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={styles.applyButtonText}>
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {datePicker !== null && (
                <DateTimePicker
                    value={
                        datePicker === "start" && filters.start_date
                            ? new Date(`${filters.start_date}T00:00:00`)
                            : datePicker === "end" && filters.end_date
                                ? new Date(`${filters.end_date}T00:00:00`)
                                : new Date()
                    }
                    mode="date"
                    display="default"
                    maximumDate={
                        datePicker === "start" && filters.end_date
                            ? new Date(`${filters.end_date}T00:00:00`)
                            : undefined
                    }
                    minimumDate={
                        datePicker === "end" && filters.start_date
                            ? new Date(`${filters.start_date}T00:00:00`)
                            : undefined
                    }
                    onChange={handleDateChange}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 35,
    },
    header: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 8,
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
    },
    dashboardButton: {
        marginTop: 18,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    dashboardButtonText: {
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },
    toolbar: {
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 12,
    },
    summaryIcon: {
        fontSize: 30,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    summaryValue: {
        fontSize: 23,
        fontWeight: "800",
        marginTop: 3,
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    toolbarRow: {
        flexDirection: "row",
        gap: 9,
        marginTop: 12,
    },

    toolbarButton: {
        marginTop: -7,
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        borderColor: "transparent",
    },

    toolbarButtonText: {
        fontSize: 12,
        fontWeight: "700",
    },

    activeFilterButton: {
        borderWidth: 1,
    },
    filtersContent: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: "800",
    },
    filterSubtitle: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 7,
        marginTop: 10,
    },
    pickerBox: {
        borderWidth: 1,
        borderRadius: 9,
        overflow: "hidden",
        minHeight: 50,
        justifyContent: "center",
    },
    dateButton: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 9,
        justifyContent: "center",
        paddingHorizontal: 13,
    },
    applyButton: {
        marginTop: 18,
        borderRadius: 10,
        padding: 13,
        alignItems: "center",
    },
    applyButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
    clearButton: {
        marginTop: 9,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
    },
    clearButtonText: {
        fontSize: 13,
        fontWeight: "700",
    },
    tableHeader: {
        padding: 15,
        borderWidth: 1,
        borderRadius: 14,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 5,
    },
    paginationTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 13,
        gap: 8,
    },
    pageInfo: {
        fontSize: 12,
        fontWeight: "600",
    },
    pageSizePicker: {
        flex: 1,
        maxWidth: 155,
        borderWidth: 1,
        borderRadius: 9,
        overflow: "hidden",
        height: 48,
        justifyContent: "center",
    },
    resetText: {
        fontWeight: "700",
        fontSize: 13,
        marginTop: 12,
    },
    activityCard: {
        borderWidth: 1,
        borderRadius: 15,
        padding: 15,
        marginBottom: 13,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.6,
        marginBottom: 5,
    },
    logId: {
        fontSize: 13,
        fontWeight: "800",
    },
    roleBadge: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 20,
    },
    separator: {
        height: 1,
        marginVertical: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 7,
    },
    detailText: {
        fontSize: 12,
        lineHeight: 19,
    },
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 15,
        marginBottom: 12,
    },
    actionBadge: {
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderRadius: 20,
    },
    actionBadgeText: {
        fontSize: 11,
        fontWeight: "800",
    },
    descriptionBox: {
        padding: 12,
        borderRadius: 10,
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 19,
    },
    bottomInfo: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15,
    },
    dateText: {
        fontSize: 11,
        lineHeight: 17,
    },
    stateContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 35,
    },
    stateText: {
        marginTop: 12,
        fontSize: 13,
    },
    stateCard: {
        padding: 22,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 15,
    },
    emptyIcon: {
        fontSize: 38,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 7,
    },
    pagination: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 5,
        marginBottom: 15,
        gap: 8,
    },
    pageButton: {
        borderWidth: 1,
        borderRadius: 9,
        paddingVertical: 11,
        paddingHorizontal: 12,
    },
    pageNumber: {
        fontSize: 13,
        fontWeight: "800",
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

export default AdminActivityLogsScreen;
