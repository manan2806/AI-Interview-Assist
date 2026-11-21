import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const STATUS_OPTIONS = ["pending", "approved", "hidden"];

interface Review {
    review_id: string;
    user_id?: string;
    name?: string;
    comment?: string;
    rating?: number;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    navigation: any;
}

function AdminReviewsScreen({ navigation }: Props) {
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");

    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [updatingId, setUpdatingId] = useState("");
    const [deletingId, setDeletingId] = useState("");

    const normalizeStatus = (status?: string) =>
        String(status || "pending").toLowerCase();

    const loadReviews = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/api/admin/reviews");

            if (response.data?.success) {
                setReviews(
                    Array.isArray(response.data.reviews)
                        ? response.data.reviews
                        : []
                );
            } else {
                setError(
                    response.data?.message || "Unable to load reviews."
                );
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load reviews. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const reviewCounts = useMemo(() => ({
        total: reviews.length,
        pending: reviews.filter(
            (review) => normalizeStatus(review.status) === "pending"
        ).length,
        approved: reviews.filter(
            (review) => normalizeStatus(review.status) === "approved"
        ).length,
        hidden: reviews.filter(
            (review) => normalizeStatus(review.status) === "hidden"
        ).length,
    }), [reviews]);

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        ratingFilter !== "all" ||
        dateFilter !== "all";

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setRatingFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    const filteredReviews = useMemo(() => {
        const query = search.trim().toLowerCase();
        const now = new Date();

        return reviews
            .filter((review) => {
                const matchesSearch = [
                    review.review_id,
                    review.user_id,
                    review.name,
                    review.comment,
                    review.rating,
                ].some((value) =>
                    String(value ?? "").toLowerCase().includes(query)
                );

                const matchesStatus =
                    statusFilter === "all" ||
                    normalizeStatus(review.status) === statusFilter;

                const matchesRating =
                    ratingFilter === "all" ||
                    Number(review.rating) === Number(ratingFilter);

                let matchesDate = true;

                if (dateFilter !== "all") {
                    const created = new Date(review.created_at || "");

                    if (
                        !review.created_at ||
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
                            now.getTime() - days * 24 * 60 * 60 * 1000
                        );

                        matchesDate = created >= cutoff && created <= now;
                    }
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesRating &&
                    matchesDate
                );
            })
            .sort((a, b) => {
                if (sortBy === "highest") {
                    return Number(b.rating || 0) - Number(a.rating || 0);
                }

                if (sortBy === "lowest") {
                    return Number(a.rating || 0) - Number(b.rating || 0);
                }

                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();

                return sortBy === "oldest"
                    ? dateA - dateB
                    : dateB - dateA;
            });
    }, [
        reviews,
        search,
        statusFilter,
        ratingFilter,
        dateFilter,
        sortBy,
    ]);

    const formatDate = (value?: string) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const getStatusColor = (status?: string) => {
        const normalized = normalizeStatus(status);

        if (normalized === "approved") return "#16A34A";
        if (normalized === "hidden") return "#DC2626";

        return "#D97706";
    };

    const updateStatus = async (
        review: Review,
        newStatus: string
    ) => {
        if (!STATUS_OPTIONS.includes(newStatus)) return;

        if (normalizeStatus(review.status) === newStatus) return;

        setUpdatingId(review.review_id);
        setNotice("");
        setError("");

        try {
            const response = await api.patch(
                `/api/admin/reviews/${encodeURIComponent(review.review_id)}/status`,
                { status: newStatus }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to update review status."
                );
            }

            const updatedReview = {
                ...review,
                ...(response.data.review || {}),
                status: newStatus,
            };

            setReviews((previous) =>
                previous.map((item) =>
                    item.review_id === review.review_id
                        ? { ...item, ...updatedReview }
                        : item
                )
            );

            setSelectedReview((previous) =>
                previous?.review_id === review.review_id
                    ? { ...previous, ...updatedReview }
                    : previous
            );

            setNotice(`Review is now ${newStatus}.`);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update review status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const deleteReview = (review: Review) => {
        Alert.alert(
            "Delete Review",
            `Delete this review from ${review.name || "this user"} permanently?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => confirmDeleteReview(review),
                },
            ]
        );
    };

    const confirmDeleteReview = async (review: Review) => {
        try {
            setDeletingId(review.review_id);
            setError("");
            setNotice("");

            const response = await api.delete(
                `/api/admin/reviews/${encodeURIComponent(review.review_id)}`
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to delete review."
                );
            }

            setReviews((previous) =>
                previous.filter(
                    (item) => item.review_id !== review.review_id
                )
            );

            setSelectedReview((previous) =>
                previous?.review_id === review.review_id ? null : previous
            );

            setNotice("Review deleted successfully.");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to delete review."
            );
        } finally {
            setDeletingId("");
        }
    };

    const renderStatCard = (
        title: string,
        value: number,
        icon: string,
        accent: string,
        background: string
    ) => (
        <View
            style={[
                styles.statCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <View style={[styles.statIcon, { backgroundColor: background }]}>
                <Text style={styles.statIconText}>{icon}</Text>
            </View>

            <Text style={[styles.statValue, { color: colors.text }]}>
                {loading ? "..." : value}
            </Text>

            <Text style={[styles.statTitle, { color: colors.muted }]}>
                {title}
            </Text>

            <View style={[styles.statAccent, { backgroundColor: accent }]} />
        </View>
    );

    const renderReview = ({ item }: { item: Review }) => (
        <View
            style={[
                styles.reviewCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
            ]}
        >
            <View style={styles.reviewTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewId, { color: colors.primary }]}>
                        {item.review_id || "—"}
                    </Text>

                    <Text style={[styles.reviewName, { color: colors.text }]}>
                        {item.name || "Unknown"}
                    </Text>

                    <Text style={[styles.reviewUserId, { color: colors.muted }]}>
                        User ID: {item.user_id || "—"}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(item.status) + "20" },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                        ]}
                    >
                        {normalizeStatus(item.status).toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.ratingRow}>
                <Text style={styles.stars}>
                    {"★".repeat(
                        Math.max(0, Math.min(5, Number(item.rating) || 0))
                    )}
                    {"☆".repeat(
                        5 - Math.max(0, Math.min(5, Number(item.rating) || 0))
                    )}
                </Text>

                <Text style={[styles.ratingNumber, { color: colors.text }]}>
                    {Number(item.rating) || 0}/5
                </Text>
            </View>

            <Text
                style={[styles.comment, { color: colors.text }]}
                numberOfLines={3}
            >
                {item.comment || "No comment provided."}
            </Text>

            <Text style={[styles.dateText, { color: colors.muted }]}>
                {formatDate(item.created_at)}
            </Text>

            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[
                        styles.viewButton,
                        { backgroundColor: colors.header },
                    ]}
                    onPress={() => setSelectedReview(item)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.viewButtonText, { color: colors.primary }]}>
                        View Details
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.deleteSmallButton,
                        { backgroundColor: "#FEE2E2" },
                    ]}
                    onPress={() => deleteReview(item)}
                    disabled={deletingId === item.review_id}
                    activeOpacity={0.8}
                >
                    <Text style={styles.deleteSmallText}>
                        {deletingId === item.review_id ? "..." : "🗑"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderFilterOption = (
        label: string,
        value: string,
        current: string,
        setter: (value: string) => void
    ) => (
        <TouchableOpacity
            key={value}
            style={[
                styles.filterOption,
                {
                    backgroundColor:
                        current === value ? colors.header : colors.card,
                    borderColor:
                        current === value ? colors.primary : colors.border,
                },
            ]}
            onPress={() => setter(value)}
            activeOpacity={0.8}
        >
            <Text
                style={[
                    styles.filterOptionText,
                    {
                        color: current === value
                            ? colors.primary
                            : colors.text,
                    },
                ]}
            >
                {label}
            </Text>

            {current === value && (
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                    ✓
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <FlatList
                data={filteredReviews}
                keyExtractor={(item, index) =>
                    item.review_id || String(index)
                }
                renderItem={renderReview}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadReviews(true)}
                        tintColor={colors.primary}
                    />
                }
                ListHeaderComponent={
                    <View>
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
                            <Text style={styles.eyebrow}>
                                ADMINISTRATION
                            </Text>

                            <Text style={[styles.heading, { color: colors.text }]}>
                                Review Management
                            </Text>

                            <Text style={[styles.subtitle, { color: colors.muted }]}>
                                Review user feedback, moderate ratings and manage
                                published reviews.
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.backButton,
                                    { backgroundColor: colors.header },
                                ]}
                                onPress={() =>
                                    navigation.navigate("AdminDashboard")
                                }
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

                        {/* Notifications */}
                        {notice !== "" && (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>
                                    ✓ {notice}
                                </Text>

                                <TouchableOpacity onPress={() => setNotice("")}>
                                    <Text style={styles.dismissText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {error !== "" && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    ⚠ {error}
                                </Text>

                                <TouchableOpacity onPress={() => setError("")}>
                                    <Text style={styles.dismissText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Statistics */}
                        <View style={styles.statsGrid}>
                            {renderStatCard(
                                "Total Reviews",
                                reviewCounts.total,
                                "⭐",
                                "#8B5CF6",
                                "#EDE9FE"
                            )}

                            {renderStatCard(
                                "Pending",
                                reviewCounts.pending,
                                "⏳",
                                "#D97706",
                                "#FEF3C7"
                            )}

                            {renderStatCard(
                                "Approved",
                                reviewCounts.approved,
                                "✓",
                                "#16A34A",
                                "#DCFCE7"
                            )}

                            {renderStatCard(
                                "Hidden",
                                reviewCounts.hidden,
                                "◉",
                                "#DB2777",
                                "#FCE7F3"
                            )}
                        </View>

                        {/* Toolbar */}
                        <View
                            style={[
                                styles.contentCard,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                User Reviews
                            </Text>

                            <Text style={[styles.resultText, { color: colors.muted }]}>
                                {loading
                                    ? "Loading reviews..."
                                    : `${filteredReviews.length} out of ${reviews.length} results`}
                            </Text>

                            <TextInput
                                style={[
                                    styles.searchInput,
                                    {
                                        backgroundColor: colors.input,
                                        borderColor: colors.border,
                                        color: colors.text,
                                    },
                                ]}
                                placeholder="Search user, comment or ID..."
                                placeholderTextColor={colors.muted}
                                value={search}
                                onChangeText={setSearch}
                            />

                            <View style={styles.toolbarRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.toolbarButton,
                                        {
                                            backgroundColor: colors.header,
                                            borderColor: colors.primary,
                                        },
                                        hasActiveFilters && styles.activeFilterButton,
                                    ]}
                                    onPress={() => setFilterMenuOpen(true)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toolbarButtonText, { color: colors.primary }]}>
                                        ☷ Filters {hasActiveFilters ? "•" : ""} ▼
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.toolbarButton,
                                        { backgroundColor: colors.header },
                                    ]}
                                    onPress={() => loadReviews(true)}
                                    disabled={loading || refreshing}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.toolbarButtonText, { color: colors.primary }]}>
                                        {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {loading && reviews.length === 0 && (
                            <View style={styles.stateContainer}>
                                <ActivityIndicator
                                    size="large"
                                    color={colors.primary}
                                />
                                <Text style={[styles.stateText, { color: colors.muted }]}>
                                    Loading reviews...
                                </Text>
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View
                        style={[
                            styles.emptyCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                    Loading reviews...
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyIcon}>⭐</Text>

                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    No reviews found
                                </Text>

                                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                    {reviews.length === 0
                                        ? "No user reviews have been submitted yet."
                                        : "Try changing your search or filters."}
                                </Text>
                            </>
                        )}
                    </View>
                }
            />

            {/* Filter Modal */}
            <Modal
                visible={filterMenuOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setFilterMenuOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.filterModal,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                Filter Reviews
                            </Text>

                            <TouchableOpacity
                                onPress={() => setFilterMenuOpen(false)}
                            >
                                <Text style={[styles.closeText, { color: colors.text }]}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Status */}
                            <Text style={[styles.filterHeading, { color: colors.text }]}>
                                Status
                            </Text>

                            <View style={[styles.dropdownContainer, { borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={statusFilter}
                                    onValueChange={(value) => setStatusFilter(value)}
                                    mode="dropdown"
                                    dropdownIconColor={colors.text}
                                    style={[styles.dropdown, { color: colors.text }]}
                                >
                                    <Picker.Item label="All statuses" value="all" />
                                    <Picker.Item label="Pending" value="pending" />
                                    <Picker.Item label="Approved" value="approved" />
                                    <Picker.Item label="Hidden" value="hidden" />
                                </Picker>
                            </View>

                            {/* Rating */}
                            <Text style={[styles.filterHeading, { color: colors.text }]}>
                                Rating
                            </Text>

                            <View style={[styles.dropdownContainer, { borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={ratingFilter}
                                    onValueChange={(value) => setRatingFilter(value)}
                                    mode="dropdown"
                                    dropdownIconColor={colors.text}
                                    style={[styles.dropdown, { color: colors.text }]}
                                >
                                    <Picker.Item label="All ratings" value="all" />
                                    <Picker.Item label="5 Stars" value="5" />
                                    <Picker.Item label="4 Stars" value="4" />
                                    <Picker.Item label="3 Stars" value="3" />
                                    <Picker.Item label="2 Stars" value="2" />
                                    <Picker.Item label="1 Star" value="1" />
                                </Picker>
                            </View>

                            {/* Submitted Date */}
                            <Text style={[styles.filterHeading, { color: colors.text }]}>
                                Submitted Date
                            </Text>

                            <View style={[styles.dropdownContainer, { borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={dateFilter}
                                    onValueChange={(value) => setDateFilter(value)}
                                    mode="dropdown"
                                    dropdownIconColor={colors.text}
                                    style={[styles.dropdown, { color: colors.text }]}
                                >
                                    <Picker.Item label="Any time" value="all" />
                                    <Picker.Item label="Today" value="today" />
                                    <Picker.Item label="Last 7 days" value="7days" />
                                    <Picker.Item label="Last 30 days" value="30days" />
                                    <Picker.Item label="Last 90 days" value="90days" />
                                </Picker>
                            </View>

                            {/* Sort By */}
                            <Text style={[styles.filterHeading, { color: colors.text }]}>
                                Sort By
                            </Text>

                            <View style={[styles.dropdownContainer, { borderColor: colors.border }]}>
                                <Picker
                                    selectedValue={sortBy}
                                    onValueChange={(value) => setSortBy(value)}
                                    mode="dropdown"
                                    dropdownIconColor={colors.text}
                                    style={[styles.dropdown, { color: colors.text }]}
                                >
                                    <Picker.Item label="Newest first" value="newest" />
                                    <Picker.Item label="Oldest first" value="oldest" />
                                    <Picker.Item label="Highest rating" value="highest" />
                                    <Picker.Item label="Lowest rating" value="lowest" />
                                </Picker>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[
                                    styles.clearButton,
                                    { borderColor: colors.border },
                                ]}
                                onPress={clearFilters}
                            >
                                <Text style={{ color: colors.text, fontWeight: "700" }}>
                                    Clear All
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.applyButton,
                                    { backgroundColor: colors.primary },
                                ]}
                                onPress={() => setFilterMenuOpen(false)}
                            >
                                <Text style={styles.applyButtonText}>
                                    Apply Filters
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Review Details Modal */}
            <Modal
                visible={selectedReview !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedReview(null)}
            >
                {selectedReview && (
                    <View style={styles.modalOverlay}>
                        <View
                            style={[
                                styles.detailModal,
                                { backgroundColor: colors.card },
                            ]}
                        >
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.reviewId, { color: colors.primary }]}>
                                        {selectedReview.review_id || "USER REVIEW"}
                                    </Text>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        Review Details
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setSelectedReview(null)}
                                >
                                    <Text style={[styles.closeText, { color: colors.text }]}>
                                        ×
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View
                                    style={[
                                        styles.feedbackCard,
                                        { backgroundColor: colors.background },
                                    ]}
                                >
                                    <Text style={[styles.detailLabel, { color: colors.muted }]}>
                                        USER FEEDBACK
                                    </Text>

                                    <Text style={styles.detailStars}>
                                        {"★".repeat(
                                            Math.max(
                                                0,
                                                Math.min(5, Number(selectedReview.rating) || 0)
                                            )
                                        )}
                                        {"☆".repeat(
                                            5 - Math.max(
                                                0,
                                                Math.min(5, Number(selectedReview.rating) || 0)
                                            )
                                        )}
                                    </Text>

                                    <Text style={[styles.feedbackText, { color: colors.text }]}>
                                        {selectedReview.comment || "No comment provided."}
                                    </Text>
                                </View>

                                {[
                                    ["Submitted By", selectedReview.name || "Unknown"],
                                    ["User ID", selectedReview.user_id || "—"],
                                    ["Submitted At", formatDate(selectedReview.created_at)],
                                    ["Last Updated", formatDate(selectedReview.updated_at)],
                                ].map(([label, value]) => (
                                    <View
                                        key={label}
                                        style={[
                                            styles.detailRow,
                                            { borderBottomColor: colors.border },
                                        ]}
                                    >
                                        <Text style={[styles.detailLabel, { color: colors.muted }]}>
                                            {label}
                                        </Text>

                                        <Text style={[styles.detailValue, { color: colors.text }]}>
                                            {value}
                                        </Text>
                                    </View>
                                ))}

                                <Text style={[styles.filterHeading, { color: colors.text }]}>
                                    Current Status
                                </Text>

                                <View
                                    style={[
                                        styles.statusBadge,
                                        {
                                            alignSelf: "flex-start",
                                            backgroundColor:
                                                getStatusColor(selectedReview.status) + "20",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: getStatusColor(selectedReview.status) },
                                        ]}
                                    >
                                        {normalizeStatus(selectedReview.status).toUpperCase()}
                                    </Text>
                                </View>

                                <Text style={[styles.filterHeading, { color: colors.text }]}>
                                    Update Review Status
                                </Text>

                                <View
                                    style={[
                                        styles.statusDropdownContainer,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <Picker
                                        selectedValue={normalizeStatus(selectedReview.status)}
                                        onValueChange={(value) => {
                                            if (value) {
                                                updateStatus(selectedReview, value);
                                            }
                                        }}
                                        enabled={updatingId !== selectedReview.review_id}
                                        dropdownIconColor={colors.text}
                                        style={{
                                            color: colors.text,
                                            height: 52,
                                        }}
                                    >
                                        {STATUS_OPTIONS.map((status) => (
                                            <Picker.Item
                                                key={status}
                                                label={status.charAt(0).toUpperCase() + status.slice(1)}
                                                value={status}
                                                color={colors.text}
                                            />
                                        ))}
                                    </Picker>
                                </View>

                                {updatingId === selectedReview.review_id && (
                                    <ActivityIndicator
                                        color={colors.primary}
                                        style={{ marginTop: 10 }}
                                    />
                                )}
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.modalDeleteButton}
                                    onPress={() => deleteReview(selectedReview)}
                                    disabled={deletingId === selectedReview.review_id}
                                >
                                    <Text style={styles.applyButtonText}>
                                        {deletingId === selectedReview.review_id
                                            ? "Deleting..."
                                            : "🗑 Delete"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.applyButton,
                                        { backgroundColor: colors.primary },
                                    ]}
                                    onPress={() => setSelectedReview(null)}
                                >
                                    <Text style={styles.applyButtonText}>
                                        Close
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingTop: 30,
        paddingBottom: 35,
    },
    header: {
        padding: 19,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 15,
    },
    eyebrow: {
        color: "#8B5CF6",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.4,
    },
    heading: {
        fontSize: 25,
        fontWeight: "800",
        marginTop: 8,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 6,
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
    successBox: {
        backgroundColor: "#DCFCE7",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    successText: {
        color: "#166534",
        fontWeight: "600",
        flex: 1,
        fontSize: 13,
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    errorText: {
        color: "#B91C1C",
        fontWeight: "600",
        flex: 1,
        fontSize: 13,
    },
    dismissText: {
        color: "#991B1B",
        fontSize: 22,
        paddingHorizontal: 5,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 15,
    },
    statCard: {
        width: "48%",
        flexGrow: 1,
        minWidth: "45%",
        borderRadius: 14,
        borderWidth: 1,
        padding: 13,
        overflow: "hidden",
    },
    statIcon: {
        width: 37,
        height: 37,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    statIconText: {
        fontSize: 19,
    },
    statValue: {
        fontSize: 25,
        fontWeight: "800",
    },
    statTitle: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 3,
    },
    statAccent: {
        height: 3,
        marginTop: 12,
        borderRadius: 5,
    },
    contentCard: {
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: "800",
    },
    resultText: {
        fontSize: 12,
        marginTop: 4,
        marginBottom: 14,
    },
    searchInput: {
        height: 47,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 13,
        fontSize: 13,
    },
    toolbarRow: {
        flexDirection: "row",
        gap: 9,
        marginBottom: 13,
    },

    toolbarButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
    },

    toolbarButtonText: {
        fontSize: 12,
        fontWeight: "700",
    },

    activeFilterButton: {
        borderWidth: 1,
    },
    reviewCard: {
        borderWidth: 1,
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
    },
    reviewTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    reviewId: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    reviewName: {
        fontSize: 15,
        fontWeight: "800",
        marginTop: 5,
    },
    reviewUserId: {
        fontSize: 11,
        marginTop: 3,
    },
    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "800",
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 13,
        gap: 8,
    },
    stars: {
        fontSize: 19,
        color: "#F59E0B",
        letterSpacing: 1,
    },
    ratingNumber: {
        fontSize: 12,
        fontWeight: "700",
    },
    comment: {
        fontSize: 13,
        lineHeight: 20,
        marginTop: 9,
    },
    dateText: {
        fontSize: 11,
        marginTop: 10,
    },
    cardActions: {
        flexDirection: "row",
        gap: 9,
        marginTop: 13,
    },
    viewButton: {
        flex: 1,
        padding: 11,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: "800",
    },
    deleteSmallButton: {
        width: 43,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    deleteSmallText: {
        fontSize: 17,
    },
    stateContainer: {
        padding: 30,
        alignItems: "center",
    },
    stateText: {
        marginTop: 10,
        fontSize: 13,
    },
    emptyCard: {
        padding: 25,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: "center",
        marginBottom: 15,
    },
    emptyIcon: {
        fontSize: 35,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginTop: 10,
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 6,
        lineHeight: 19,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.65)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },
    filterModal: {
        width: "100%",
        maxWidth: 480,
        maxHeight: "90%",
        borderRadius: 19,
        padding: 18,
    },
    detailModal: {
        width: "100%",
        maxWidth: 480,
        maxHeight: "90%",
        borderRadius: 19,
        padding: 18,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
    },
    closeText: {
        fontSize: 30,
        fontWeight: "400",
        paddingHorizontal: 6,
    },
    filterHeading: {
        fontSize: 14,
        fontWeight: "800",
        marginTop: 15,
        marginBottom: 8,
    },
    dropdownContainer: {
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 16,
        overflow: "hidden",
    },
    dropdown: {
        width: "100%",
        height: 52,
    },
    statusDropdownContainer: {
        borderWidth: 1,
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 8,
    },
    filterOption: {
        borderWidth: 1,
        borderRadius: 9,
        padding: 11,
        marginBottom: 7,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    filterOptionText: {
        fontSize: 13,
        fontWeight: "600",
    },
    modalFooter: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15,
        paddingTop: 12,
    },
    clearButton: {
        flex: 1,
        minHeight: 45,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    applyButton: {
        flex: 1,
        minHeight: 45,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    applyButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
        textAlign: "center",
    },
    feedbackCard: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    detailStars: {
        fontSize: 23,
        color: "#F59E0B",
        marginTop: 8,
    },
    feedbackText: {
        fontSize: 14,
        lineHeight: 22,
        marginTop: 8,
    },
    detailRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: "600",
        marginTop: 5,
    },
    statusOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderWidth: 1,
        borderRadius: 9,
        marginBottom: 8,
    },
    statusOptionText: {
        fontSize: 13,
        fontWeight: "700",
    },
    modalDeleteButton: {
        flex: 1,
        minHeight: 45,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#DC2626",
    },
});

export default AdminReviewsScreen;
