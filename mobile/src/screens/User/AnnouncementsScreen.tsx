import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Platform,
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
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at?: string;
    created_by_name?: string;
    is_read: boolean;
}

const TYPE_LABELS: Record<string, string> = {
    general: "General",
    feature: "New Feature",
    maintenance: "Maintenance",
    important: "Important",
};

interface Props {
    navigation: any;
}

function AnnouncementsScreen({ navigation }: Props) {
    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";

    const styles = useMemo(
        () => createStyles(colors, isDark),
        [colors, isDark]
    );
    const [items, setItems] = useState<Announcement[]>([]);
    const [selectedAnnouncement, setSelectedAnnouncement] =
        useState<Announcement | null>(null);

    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [sortOrder, setSortOrder] = useState("newest");

    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const loadAnnouncements = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/api/announcements");

            setItems(response.data.announcements || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load announcements. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    const markAsRead = async (item: Announcement) => {
        if (item.is_read || updatingId === item.id) return;

        try {
            setUpdatingId(item.id);
            setError("");

            await api.post(`/api/announcements/${item.id}/read`);

            setItems((previous) =>
                previous.map((entry) =>
                    entry.id === item.id
                        ? { ...entry, is_read: true }
                        : entry
                )
            );

            setUnreadCount((previous) => Math.max(0, previous - 1));

            setSelectedAnnouncement((previous) =>
                previous?.id === item.id
                    ? { ...previous, is_read: true }
                    : previous
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to update announcement status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const hasActiveFilters =
        filter !== "all" ||
        typeFilter !== "all" ||
        startDate !== "" ||
        endDate !== "" ||
        sortOrder !== "newest";

    const clearFilters = () => {
        setFilter("all");
        setTypeFilter("all");
        setStartDate("");
        setEndDate("");
        setSortOrder("newest");
    };

    const visibleItems = useMemo(() => {
        return items
            .filter((item) => {
                if (filter === "unread" && item.is_read) return false;
                if (filter === "read" && !item.is_read) return false;

                const search = searchTerm.trim().toLowerCase();

                if (search) {
                    const searchableText = [
                        item.title,
                        item.message,
                        TYPE_LABELS[item.type],
                        item.created_by_name,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    if (!searchableText.includes(search)) return false;
                }

                if (typeFilter !== "all" && item.type !== typeFilter) {
                    return false;
                }

                const announcementDate = item.created_at
                    ? new Date(item.created_at)
                    : null;

                if (startDate) {
                    const start = new Date(`${startDate}T00:00:00`);

                    if (
                        !announcementDate ||
                        Number.isNaN(announcementDate.getTime()) ||
                        announcementDate < start
                    ) {
                        return false;
                    }
                }

                if (endDate) {
                    const end = new Date(`${endDate}T23:59:59.999`);

                    if (
                        !announcementDate ||
                        Number.isNaN(announcementDate.getTime()) ||
                        announcementDate > end
                    ) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                const dateA = a.created_at
                    ? new Date(a.created_at).getTime()
                    : 0;

                const dateB = b.created_at
                    ? new Date(b.created_at).getTime()
                    : 0;

                return sortOrder === "newest"
                    ? dateB - dateA
                    : dateA - dateB;
            });
    }, [
        items,
        filter,
        typeFilter,
        searchTerm,
        startDate,
        endDate,
        sortOrder,
    ]);

    const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const parseDateValue = (value: string) => {
        if (!value) return new Date();
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date?: string) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleString();
    };

    const openDetails = (item: Announcement) => {
        setSelectedAnnouncement(item);
        setDetailsModalVisible(true);
    };

    const renderAnnouncement = ({ item }: { item: Announcement }) => (
        <View
            style={[
                styles.announcementCard,
                item.is_read
                    ? styles.readCard
                    : styles.unreadCard,
            ]}
        >
            <View style={styles.cardTopRow}>
                <View
                    style={[
                        styles.typeBadge,
                        item.type === "feature"
                            ? styles.featureBadge
                            : item.type === "maintenance"
                                ? styles.maintenanceBadge
                                : item.type === "important"
                                    ? styles.importantBadge
                                    : styles.generalBadge,
                    ]}
                >
                    <Text style={styles.typeBadgeText}>
                        {TYPE_LABELS[item.type] || "Announcement"}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        item.is_read
                            ? styles.readBadge
                            : styles.unreadBadge,
                    ]}
                >
                    <Text style={styles.statusBadgeText}>
                        {item.is_read ? "✓ Read" : "● Unread"}
                    </Text>
                </View>
            </View>

            <Text style={styles.announcementTitle}>
                {item.title}
            </Text>

            <Text style={styles.announcementPreview} numberOfLines={3}>
                {item.message}
            </Text>

            <View style={styles.cardInfo}>
                <Text style={styles.cardInfoText}>
                    📅 {formatDate(item.created_at)}
                </Text>

                <Text style={styles.cardInfoText}>
                    👤 {item.created_by_name || "Admin"}
                </Text>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => openDetails(item)}
                >
                    <Text style={styles.viewButtonText}>
                        View Details →
                    </Text>
                </TouchableOpacity>

                {!item.is_read && (
                    <TouchableOpacity
                        style={styles.markReadButton}
                        disabled={updatingId === item.id}
                        onPress={() => markAsRead(item)}
                    >
                        <Text style={styles.markReadText}>
                            {updatingId === item.id
                                ? "Saving..."
                                : "✓ Mark as Read"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading && items.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={styles.loadingText}>
                    Loading Announcements...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={visibleItems}
                keyExtractor={(item) => item.id}
                renderItem={renderAnnouncement}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadAnnouncements(true)}
                        colors={["#7C3AED"]}
                    />
                }
                ListHeaderComponent={
                    <View>
                        {/* HEADER */}
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <Text style={styles.headerLabel}>
                                    STAY UPDATED
                                </Text>

                                <Text style={styles.headerTitle}>
                                    📢 Announcements
                                </Text>

                                <Text style={styles.headerSubtitle}>
                                    Important updates, new features and maintenance notices.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => navigation.navigate("UserDashboard")}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.backButtonText}>
                                    ← Back to Dashboard
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.refreshButton,
                                    refreshing && { opacity: 0.6 },
                                ]}
                                onPress={() => loadAnnouncements(true)}
                                disabled={refreshing}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.refreshButtonText}>
                                    {refreshing ? "↻ Refreshing..." : "↻ Refresh Announcements"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* ERROR */}
                        {!!error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    {error}
                                </Text>

                                <TouchableOpacity
                                    onPress={() => loadAnnouncements()}
                                >
                                    <Text style={styles.retryText}>
                                        Try Again
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* SUMMARY */}
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryIcon}>📢</Text>
                                <Text style={styles.summaryLabel}>
                                    Total Announcements
                                </Text>
                                <Text style={styles.summaryValue}>
                                    {items.length}
                                </Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryIcon}>🔔</Text>
                                <Text style={styles.summaryLabel}>
                                    Unread Announcements
                                </Text>
                                <Text style={styles.unreadValue}>
                                    {unreadCount}
                                </Text>
                            </View>
                        </View>

                        {/* SEARCH AND FILTER */}
                        <View style={styles.toolbar}>
                            <Text style={styles.sectionTitle}>
                                All Notifications
                            </Text>

                            <Text style={styles.resultCount}>
                                {visibleItems.length} of {items.length} announcements
                            </Text>

                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search title, message or admin..."
                                placeholderTextColor={isDark ? "#8993B0" : "#9CA3AF"}
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />

                            <TouchableOpacity
                                style={[
                                    styles.filterButton,
                                    hasActiveFilters && styles.activeFilterButton,
                                ]}
                                onPress={() => setFilterModalVisible(true)}
                            >
                                <Text
                                    style={[
                                        styles.filterButtonText,
                                        hasActiveFilters && styles.activeFilterText,
                                    ]}
                                >
                                    ☷ Filters {hasActiveFilters ? "• Active" : ""}
                                </Text>
                                <Text style={styles.filterArrow}>▼</Text>
                            </TouchableOpacity>

                            {hasActiveFilters && (
                                <TouchableOpacity
                                    style={styles.clearFiltersButton}
                                    onPress={clearFilters}
                                >
                                    <Text style={styles.clearFiltersText}>
                                        ✕ Clear All Filters
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.listHeading}>
                            Announcements ({visibleItems.length})
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyTitle}>
                            No announcements found
                        </Text>
                        <Text style={styles.emptyDescription}>
                            {filter === "unread"
                                ? "You are all caught up. There are no unread announcements."
                                : filter === "read"
                                    ? "You haven't read any announcements yet."
                                    : "New announcements will appear here when available."}
                        </Text>
                    </View>
                }
            />

            {/* FILTER MODAL */}
            <Modal
                visible={filterModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setFilterModalVisible(false);
                    setShowTypeDropdown(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.filterModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Filter Announcements
                            </Text>

                            <TouchableOpacity
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.filterLabel}>
                                Read Status
                            </Text>

                            <View style={styles.optionRow}>
                                {[
                                    { label: "All", value: "all" },
                                    { label: "Unread", value: "unread" },
                                    { label: "Read", value: "read" },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionButton,
                                            filter === option.value &&
                                            styles.selectedOption,
                                        ]}
                                        onPress={() => setFilter(option.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                filter === option.value &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.filterLabel}>
                                Announcement Type
                            </Text>

                            <View style={styles.typeDropdownContainer}>
                                <TouchableOpacity
                                    style={styles.typeDropdown}
                                    activeOpacity={0.8}
                                    onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                                >
                                    <Text style={styles.typeDropdownValue}>
                                        {[
                                            { label: "All Types", value: "all" },
                                            { label: "General", value: "general" },
                                            { label: "New Feature", value: "feature" },
                                            { label: "Maintenance", value: "maintenance" },
                                            { label: "Important", value: "important" },
                                        ].find(option => option.value === typeFilter)?.label || "All Types"}
                                    </Text>

                                    <Text style={styles.typeDropdownArrow}>
                                        {showTypeDropdown ? "▲" : "▼"}
                                    </Text>
                                </TouchableOpacity>

                                {showTypeDropdown && (
                                    <View style={styles.typeDropdownList}>
                                        {[
                                            { label: "All Types", value: "all" },
                                            { label: "General", value: "general" },
                                            { label: "New Feature", value: "feature" },
                                            { label: "Maintenance", value: "maintenance" },
                                            { label: "Important", value: "important" },
                                        ].map((option) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                    styles.typeDropdownOption,
                                                    typeFilter === option.value &&
                                                    styles.typeDropdownOptionSelected,
                                                ]}
                                                onPress={() => {
                                                    setTypeFilter(option.value);
                                                    setShowTypeDropdown(false);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.typeDropdownOptionText,
                                                        typeFilter === option.value &&
                                                        styles.typeDropdownOptionTextSelected,
                                                    ]}
                                                >
                                                    {option.label}
                                                </Text>

                                                {typeFilter === option.value && (
                                                    <Text style={styles.typeDropdownCheck}>✓</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <Text style={styles.filterLabel}>
                                From Date
                            </Text>

                            <TouchableOpacity
                                style={styles.datePickerButton}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setShowEndDatePicker(false);
                                    setShowStartDatePicker(true);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.datePickerText,
                                        !startDate && styles.datePickerPlaceholder,
                                    ]}
                                >
                                    {startDate || "Select Start Date"}
                                </Text>

                                <Text style={styles.datePickerIcon}>📅</Text>
                            </TouchableOpacity>

                            {showStartDatePicker && (
                                <DateTimePicker
                                    value={parseDateValue(startDate)}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    maximumDate={endDate ? parseDateValue(endDate) : undefined}
                                    onChange={(event, selectedDate) => {
                                        setShowStartDatePicker(false);

                                        if (event.type === "set" && selectedDate) {
                                            setStartDate(formatDateForInput(selectedDate));
                                        }
                                    }}
                                />
                            )}

                            <Text style={styles.filterLabel}>
                                To Date
                            </Text>

                            <TouchableOpacity
                                style={styles.datePickerButton}
                                activeOpacity={0.8}
                                onPress={() => {
                                    setShowStartDatePicker(false);
                                    setShowEndDatePicker(true);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.datePickerText,
                                        !endDate && styles.datePickerPlaceholder,
                                    ]}
                                >
                                    {endDate || "Select End Date"}
                                </Text>

                                <Text style={styles.datePickerIcon}>📅</Text>
                            </TouchableOpacity>

                            {showEndDatePicker && (
                                <DateTimePicker
                                    value={parseDateValue(endDate || startDate)}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    minimumDate={startDate ? parseDateValue(startDate) : undefined}
                                    onChange={(event, selectedDate) => {
                                        setShowEndDatePicker(false);

                                        if (event.type === "set" && selectedDate) {
                                            setEndDate(formatDateForInput(selectedDate));
                                        }
                                    }}
                                />
                            )}

                            <Text style={styles.filterLabel}>
                                Sort By
                            </Text>

                            <View style={styles.optionRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        sortOrder === "newest" &&
                                        styles.selectedOption,
                                    ]}
                                    onPress={() => setSortOrder("newest")}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            sortOrder === "newest" &&
                                            styles.selectedOptionText,
                                        ]}
                                    >
                                        Newest First
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.optionButton,
                                        sortOrder === "oldest" &&
                                        styles.selectedOption,
                                    ]}
                                    onPress={() => setSortOrder("oldest")}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            sortOrder === "oldest" &&
                                            styles.selectedOptionText,
                                        ]}
                                    >
                                        Oldest First
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalClearButton}
                                onPress={clearFilters}
                            >
                                <Text style={styles.modalClearText}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setFilterModalVisible(false)}
                            >
                                <Text style={styles.applyButtonText}>
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* DETAILS MODAL */}
            <Modal
                visible={detailsModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.detailsModal}>
                        {selectedAnnouncement && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        Announcement Details
                                    </Text>

                                    <TouchableOpacity
                                        onPress={() =>
                                            setDetailsModalVisible(false)
                                        }
                                    >
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView
                                    style={styles.detailsScroll}
                                    showsVerticalScrollIndicator={false}
                                >
                                    <View style={styles.detailTypeBadge}>
                                        <Text style={styles.detailTypeText}>
                                            {TYPE_LABELS[selectedAnnouncement.type] ||
                                                "Announcement"}
                                        </Text>
                                    </View>

                                    <Text style={styles.detailTitle}>
                                        {selectedAnnouncement.title}
                                    </Text>

                                    <View style={styles.detailInfoBox}>
                                        <Text style={styles.detailInfoText}>
                                            📅 Published:{" "}
                                            {formatDate(selectedAnnouncement.created_at)}
                                        </Text>

                                        <Text style={styles.detailInfoText}>
                                            👤 Admin:{" "}
                                            {selectedAnnouncement.created_by_name ||
                                                "Admin"}
                                        </Text>

                                        <Text style={styles.detailInfoText}>
                                            Status:{" "}
                                            {selectedAnnouncement.is_read
                                                ? "✓ Read"
                                                : "● Unread"}
                                        </Text>
                                    </View>

                                    <Text style={styles.detailMessageHeading}>
                                        Complete Message
                                    </Text>

                                    <Text style={styles.detailMessage}>
                                        {selectedAnnouncement.message}
                                    </Text>
                                </ScrollView>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.modalClearButton}
                                        onPress={() =>
                                            setDetailsModalVisible(false)
                                        }
                                    >
                                        <Text style={styles.modalClearText}>
                                            Close
                                        </Text>
                                    </TouchableOpacity>

                                    {!selectedAnnouncement.is_read && (
                                        <TouchableOpacity
                                            style={styles.applyButton}
                                            disabled={
                                                updatingId === selectedAnnouncement.id
                                            }
                                            onPress={() =>
                                                markAsRead(selectedAnnouncement)
                                            }
                                        >
                                            <Text style={styles.applyButtonText}>
                                                {updatingId === selectedAnnouncement.id
                                                    ? "Saving..."
                                                    : "✓ Mark as Read"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default AnnouncementsScreen;


const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? colors.background : "#F5F3FF",
        },
        listContent: {
            padding: 16,
            paddingTop: 30,
            paddingBottom: 30,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? colors.background : "#F5F3FF",
        },
        loadingText: {
            marginTop: 12,
            color: isDark ? colors.text : "#6B7280",
            fontWeight: "600",
        },
        header: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
            elevation: 3,
        },
        backButton: {
            alignSelf: "flex-start",
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            paddingHorizontal: 80,
            paddingVertical: 10,
            borderRadius: 10,
            marginBottom: 2,
        },
        backButtonText: {
            color: isDark ? "#D6C5FF" : "#554BD7",
            fontSize: 13,
            fontWeight: "800",
        },
        headerContent: {
            width: "100%",
        },
        headerLabel: {
            color: isDark ? "#B9A5FF" : "#7C3AED",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 1.5,
        },
        headerTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 25,
            fontWeight: "900",
            marginTop: 8,
        },
        headerSubtitle: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            lineHeight: 21,
            marginTop: 8,
        },
        refreshButton: {
            width: "100%",
            backgroundColor: isDark ? "#263B5A" : "#EAF3FF",
            borderWidth: 1,
            borderColor: isDark ? "#385B85" : "#BFDBFE",
            paddingVertical: 12,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 5,
        },
        refreshButtonText: {
            color: isDark ? "#93C5FD" : "#2563EB",
            fontSize: 13,
            fontWeight: "800",
        },
        errorBox: {
            backgroundColor: isDark ? "#43232D" : "#FEE2E2",
            borderColor: isDark ? "#814052" : "#FCA5A5",
            borderWidth: 1,
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
        },
        errorText: {
            color: isDark ? "#FDA4AF" : "#B91C1C",
            fontSize: 13,
        },
        retryText: {
            color: isDark ? "#FFC0C8" : "#7F1D1D",
            fontWeight: "800",
            marginTop: 8,
        },
        summaryRow: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 16,
        },
        summaryCard: {
            flex: 1,
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 15,
            padding: 13,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#DDD6FE",
        },
        summaryIcon: {
            fontSize: 24,
            marginBottom: 8,
        },
        summaryLabel: {
            fontSize: 11,
            color: isDark ? colors.muted : "#6B7280",
            fontWeight: "700",
            lineHeight: 16,
        },
        summaryValue: {
            fontSize: 25,
            color: isDark ? "#B9A5FF" : "#7C3AED",
            fontWeight: "900",
            marginTop: 6,
        },
        unreadValue: {
            fontSize: 25,
            color: isDark ? "#FDBA74" : "#EA580C",
            fontWeight: "900",
            marginTop: 6,
        },
        toolbar: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#DDD6FE",
            marginBottom: 16,
        },
        sectionTitle: {
            fontSize: 19,
            fontWeight: "900",
            color: isDark ? colors.text : "#1F2937",
        },
        resultCount: {
            color: isDark ? colors.muted : "#6B7280",
            fontSize: 12,
            marginTop: 5,
            marginBottom: 14,
        },
        searchInput: {
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            fontSize: 13,
            color: colors.text,
        },
        filterButton: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? "#252F50" : "#F3F4F6",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            padding: 13,
            marginTop: 10,
        },
        activeFilterButton: {
            backgroundColor: isDark ? "#3B3265" : "#EDE9FE",
            borderColor: isDark ? "#8064E8" : "#A78BFA",
        },
        filterButtonText: {
            fontSize: 13,
            color: isDark ? colors.text : "#374151",
            fontWeight: "800",
        },
        activeFilterText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
        },
        filterArrow: {
            color: isDark ? colors.muted : "#6B7280",
            fontSize: 12,
        },
        clearFiltersButton: {
            alignSelf: "flex-end",
            marginTop: 10,
            padding: 5,
        },
        clearFiltersText: {
            color: isDark ? "#FDA4AF" : "#DC2626",
            fontSize: 12,
            fontWeight: "800",
        },
        listHeading: {
            fontSize: 17,
            fontWeight: "900",
            color: isDark ? colors.text : "#1F2937",
            marginBottom: 12,
        },
        announcementCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 15,
            padding: 15,
            marginBottom: 13,
            borderWidth: 1,
        },
        readCard: {
            borderColor: isDark ? colors.border : "#D1D5DB",
        },
        unreadCard: {
            borderColor: isDark ? "#8064E8" : "#A78BFA",
        },
        cardTopRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
        },
        typeBadge: {
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 6,
        },
        generalBadge: {
            backgroundColor: isDark ? "#263B5A" : "#DBEAFE",
        },
        featureBadge: {
            backgroundColor: isDark ? "#1D3B30" : "#DCFCE7",
        },
        maintenanceBadge: {
            backgroundColor: isDark ? "#46351F" : "#FEF3C7",
        },
        importantBadge: {
            backgroundColor: isDark ? "#492631" : "#FEE2E2",
        },
        typeBadgeText: {
            color: isDark ? "#E2E8F0" : "#374151",
            fontSize: 11,
            fontWeight: "800",
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
        },
        readBadge: {
            backgroundColor: isDark ? "#1D3B30" : "#DCFCE7",
        },
        unreadBadge: {
            backgroundColor: isDark ? "#46351F" : "#FEF3C7",
        },
        statusBadgeText: {
            fontSize: 11,
            color: isDark ? "#E2E8F0" : "#374151",
            fontWeight: "800",
        },
        announcementTitle: {
            fontSize: 17,
            fontWeight: "900",
            color: isDark ? colors.text : "#1F2937",
            marginTop: 14,
        },
        announcementPreview: {
            fontSize: 13,
            color: isDark ? colors.muted : "#6B7280",
            lineHeight: 20,
            marginTop: 7,
        },
        cardInfo: {
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#E5E7EB",
            marginTop: 13,
            paddingTop: 11,
            gap: 7,
        },
        cardInfoText: {
            color: isDark ? colors.muted : "#6B7280",
            fontSize: 11,
        },
        cardActions: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 9,
            marginTop: 14,
        },
        viewButton: {
            backgroundColor: isDark ? "#30264F" : "#EDE9FE",
            borderColor: isDark ? "#59458A" : "#C4B5FD",
            borderWidth: 1,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 9,
        },
        viewButtonText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontSize: 12,
            fontWeight: "800",
        },
        markReadButton: {
            backgroundColor: isDark ? "#1D3B30" : "#DCFCE7",
            borderColor: isDark ? "#326B50" : "#86EFAC",
            borderWidth: 1,
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 9,
        },
        markReadText: {
            color: isDark ? "#86D6A5" : "#166534",
            fontSize: 12,
            fontWeight: "800",
        },
        emptyCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 15,
            padding: 25,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#DDD6FE",
        },
        emptyIcon: {
            fontSize: 42,
            marginBottom: 12,
        },
        emptyTitle: {
            fontSize: 17,
            fontWeight: "900",
            color: isDark ? colors.text : "#1F2937",
            textAlign: "center",
        },
        emptyDescription: {
            color: isDark ? colors.muted : "#6B7280",
            fontSize: 13,
            textAlign: "center",
            lineHeight: 20,
            marginTop: 8,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(17, 24, 39, 0.65)",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
        },
        filterModal: {
            width: "100%",
            maxHeight: "90%",
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 18,
            padding: 18,
        },
        detailsModal: {
            width: "100%",
            maxHeight: "85%",
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 18,
            padding: 18,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? colors.border : "#E5E7EB",
            marginBottom: 15,
        },
        modalTitle: {
            fontSize: 18,
            fontWeight: "900",
            color: isDark ? colors.text : "#1F2937",
            flex: 1,
        },
        closeButton: {
            fontSize: 22,
            color: isDark ? colors.muted : "#6B7280",
            paddingHorizontal: 8,
        },
        filterLabel: {
            color: isDark ? colors.text : "#374151",
            fontSize: 13,
            fontWeight: "800",
            marginTop: 17,
            marginBottom: 9,
        },
        datePickerButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 14,
        },

        datePickerText: {
            color: isDark ? colors.text : "#374151",
            fontSize: 13,
            fontWeight: "700",
        },

        datePickerPlaceholder: {
            color: isDark ? "#8993B0" : "#9CA3AF",
            fontWeight: "500",
        },

        datePickerIcon: {
            fontSize: 17,
        },
        typeDropdownContainer: {
            marginTop: 5,
            zIndex: 20,
        },

        typeDropdown: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 11,
            paddingHorizontal: 14,
            paddingVertical: 14,
        },

        typeDropdownValue: {
            color: isDark ? colors.text : "#374151",
            fontSize: 13,
            fontWeight: "800",
        },

        typeDropdownArrow: {
            color: isDark ? "#B9A5FF" : "#7048D8",
            fontSize: 12,
        },

        typeDropdownList: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 11,
            marginTop: 6,
            overflow: "hidden",
        },

        typeDropdownOption: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 13,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? colors.border : "#F0F0F0",
        },

        typeDropdownOptionSelected: {
            backgroundColor: isDark ? "#3B3265" : "#EDE9FF",
        },

        typeDropdownOptionText: {
            color: isDark ? colors.text : "#374151",
            fontSize: 13,
            fontWeight: "600",
        },

        typeDropdownOptionTextSelected: {
            color: isDark ? "#D6C5FF" : "#7048D8",
            fontWeight: "900",
        },

        typeDropdownCheck: {
            color: isDark ? "#B9A5FF" : "#7048D8",
            fontSize: 16,
            fontWeight: "900",
        },
        optionRow: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
        },
        optionButton: {
            flex: 1,
            minWidth: 75,
            alignItems: "center",
            backgroundColor: isDark ? colors.input : "#F3F4F6",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E5E7EB",
            borderRadius: 9,
            paddingVertical: 11,
            paddingHorizontal: 8,
        },
        selectedOption: {
            backgroundColor: isDark ? "#3B3265" : "#EDE9FE",
            borderColor: isDark ? "#8064E8" : "#8B5CF6",
        },
        optionText: {
            fontSize: 11,
            color: isDark ? colors.text : "#4B5563",
            fontWeight: "700",
            textAlign: "center",
        },
        selectedOptionText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontWeight: "900",
        },
        typeOption: {
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E5E7EB",
            borderRadius: 9,
            padding: 12,
            marginBottom: 7,
        },
        selectedTypeOption: {
            backgroundColor: isDark ? "#3B3265" : "#EDE9FE",
            borderColor: isDark ? "#8064E8" : "#8B5CF6",
        },
        typeOptionText: {
            color: isDark ? colors.text : "#4B5563",
            fontSize: 13,
            fontWeight: "700",
        },
        dateInput: {
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#D1D5DB",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 13,
            color: colors.text,
        },
        modalActions: {
            flexDirection: "row",
            gap: 10,
            marginTop: 17,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#E5E7EB",
        },
        modalClearButton: {
            flex: 1,
            backgroundColor: isDark ? "#303A55" : "#F3F4F6",
            borderRadius: 10,
            paddingVertical: 13,
            alignItems: "center",
        },
        modalClearText: {
            color: isDark ? "#D1D5E5" : "#4B5563",
            fontWeight: "800",
            fontSize: 13,
        },
        applyButton: {
            flex: 1,
            backgroundColor: "#7C3AED",
            borderRadius: 10,
            paddingVertical: 13,
            alignItems: "center",
        },
        applyButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 13,
        },
        detailsScroll: {
            flexGrow: 0,
        },
        detailTypeBadge: {
            alignSelf: "flex-start",
            backgroundColor: isDark ? "#30264F" : "#EDE9FE",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 7,
        },
        detailTypeText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontSize: 11,
            fontWeight: "900",
        },
        detailTitle: {
            color: isDark ? colors.text : "#1F2937",
            fontSize: 21,
            fontWeight: "900",
            marginTop: 15,
            lineHeight: 28,
        },
        detailInfoBox: {
            backgroundColor: isDark ? colors.input : "#F9FAFB",
            borderRadius: 11,
            padding: 13,
            marginTop: 16,
            gap: 10,
        },
        detailInfoText: {
            color: isDark ? colors.muted : "#4B5563",
            fontSize: 12,
            lineHeight: 19,
        },
        detailMessageHeading: {
            color: isDark ? colors.text : "#1F2937",
            fontSize: 15,
            fontWeight: "900",
            marginTop: 20,
            marginBottom: 9,
        },
        detailMessage: {
            color: isDark ? colors.muted : "#4B5563",
            fontSize: 14,
            lineHeight: 23,
            marginBottom: 15,
        },
    });

