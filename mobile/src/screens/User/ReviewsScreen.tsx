import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";

interface Review {
    rating: number;
    comment: string;
    status?: string;
}

interface Props {
    navigation: any;
}

function ReviewsScreen({ navigation }: Props) {
    const { theme, colors } = useTheme();

    const isDark = theme === "Dark";

    const themeColors = {
        background: colors.background,
        card: colors.card,
        text: colors.text,
        muted: colors.muted,
        border: colors.border,
        input: colors.input,
    };

    const styles = createStyles(themeColors, isDark);

    const [review, setReview] = useState<Review | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchMyReview = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/reviews/mine");
            const existingReview = response.data.review || null;

            setReview(existingReview);

            if (existingReview) {
                setRating(existingReview.rating);
                setComment(existingReview.comment || "");
            } else {
                setRating(5);
                setComment("");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load your review. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReview();
    }, []);

    const getRatingLabel = (value: number) => {
        switch (value) {
            case 1:
                return "Poor";
            case 2:
                return "Fair";
            case 3:
                return "Good";
            case 4:
                return "Very Good";
            default:
                return "Excellent";
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "hidden":
                return "Hidden by admin";
            default:
                return "Pending approval";
        }
    };

    const handleSubmit = async () => {
        setMessage("");
        setError("");

        if (!comment.trim()) {
            setError("Please write your review.");
            return;
        }

        if (comment.trim().length > 1000) {
            setError("Review cannot exceed 1000 characters.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                rating,
                comment: comment.trim(),
            };

            const response = review
                ? await api.put("/api/reviews/mine", payload)
                : await api.post("/api/reviews", payload);

            const savedReview = response.data.review;

            setReview(savedReview);
            setRating(savedReview.rating);
            setComment(savedReview.comment || "");
            setEditing(false);

            setMessage(
                response.data.message ||
                "Your review has been saved."
            );
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save your review."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Review",
            "Are you sure you want to delete your review?",
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
                            setSaving(true);
                            setError("");
                            setMessage("");

                            const response = await api.delete(
                                "/api/reviews/mine"
                            );

                            setReview(null);
                            setRating(5);
                            setComment("");
                            setEditing(false);

                            setMessage(
                                response.data.message ||
                                "Your review has been deleted."
                            );
                        } catch (err: any) {
                            setError(
                                err.response?.data?.message ||
                                "Unable to delete your review."
                            );
                        } finally {
                            setSaving(false);
                        }
                    },
                },
            ]
        );
    };

    const startEditing = () => {
        if (!review) return;

        setRating(review.rating);
        setComment(review.comment || "");
        setEditing(true);
        setMessage("");
        setError("");
    };

    const cancelEditing = () => {
        if (review) {
            setRating(review.rating);
            setComment(review.comment || "");
        }

        setEditing(false);
        setMessage("");
        setError("");
    };

    if (loading) {
        return (
            <View style={[
                styles.loadingContainer,
                { backgroundColor: themeColors.background },
            ]}>
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text style={[
                    styles.loadingText,
                    { color: themeColors.text },
                ]}>
                    Loading your review...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: themeColors.background },
            ]}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={styles.headerIcon}>⭐</Text>

                <Text style={styles.headerTitle}>
                    Your Feedback Matters
                </Text>

                <Text style={[styles.headerSubtitle, { color: themeColors.text }]}>
                    Your Feedback Makes Us Better.
                </Text>

                <Text style={[styles.headerDescription, { color: themeColors.muted }]}>
                    Tell us about your experience and help us improve
                    interview preparation for everyone.
                </Text>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate("UserDashboard")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.backButtonText}>
                        ←  Back to Dashboard
                    </Text>
                </TouchableOpacity>
            </View>

            {/* BENEFITS */}
            <View
                style={[
                    styles.benefitsCard,
                    {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                    },
                ]}
            >
                <Text style={[styles.benefitsTitle, { color: themeColors.text }]}>
                    Why Your Feedback Matters
                </Text>

                <View style={styles.benefitRow}>
                    <Text style={styles.benefitIcon}>✦</Text>
                    <View style={styles.benefitContent}>
                        <Text style={[styles.benefitHeading, { color: themeColors.text }]}>
                            Share your experience
                        </Text>
                        <Text style={[styles.benefitDescription, { color: themeColors.muted }]}>
                            Tell us what worked well for you.
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitRow}>
                    <Text style={styles.benefitIcon}>✓</Text>
                    <View style={styles.benefitContent}>
                        <Text style={[styles.benefitHeading, { color: themeColors.text }]}>
                            Your voice matters
                        </Text>
                        <Text style={[styles.benefitDescription, { color: themeColors.muted }]}>
                            Help us improve the platform.
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitRow}>
                    <Text style={styles.benefitIcon}>♡</Text>
                    <View style={styles.benefitContent}>
                        <Text style={[styles.benefitHeading, { color: themeColors.text }]}>
                            Help other learners
                        </Text>
                        <Text style={[styles.benefitDescription, { color: themeColors.muted }]}>
                            Your approved review can help others.
                        </Text>
                    </View>
                </View>
            </View>

            {/* REVIEW FORM CARD */}
            <View style={[styles.formCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Text style={styles.sectionLabel}>
                    YOUR REVIEW
                </Text>

                <Text style={[styles.formTitle, { color: themeColors.text }]}>
                    {review && !editing
                        ? "Your Submitted Review"
                        : editing
                            ? "Edit Your Review"
                            : "Share Your Experience"}
                </Text>

                <Text style={[styles.formSubtitle, { color: themeColors.muted }]}>
                    Rate your experience and tell us what you think.
                </Text>

                {/* SUCCESS MESSAGE */}
                {!!message && (
                    <View style={styles.successBox}>
                        <Text style={styles.successText}>
                            ✓ {message}
                        </Text>
                    </View>
                )}

                {/* ERROR MESSAGE */}
                {!!error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            {error}
                        </Text>
                    </View>
                )}

                {/* EXISTING REVIEW */}
                {review && !editing ? (
                    <View style={styles.reviewDisplay}>
                        <View style={styles.reviewTop}>
                            <Text style={[styles.reviewHeading, { color: themeColors.text }]}>
                                Your Feedback
                            </Text>

                            <View
                                style={[
                                    styles.statusBadge,
                                    review.status === "approved"
                                        ? styles.approvedBadge
                                        : review.status === "hidden"
                                            ? styles.hiddenBadge
                                            : styles.pendingBadge,
                                ]}
                            >
                                <Text style={styles.statusText}>
                                    {getStatusLabel(review.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.displayStars}>
                            <Text style={styles.starsText}>
                                {"★".repeat(review.rating)}
                                {"☆".repeat(5 - review.rating)}
                            </Text>
                        </View>

                        <Text style={[styles.ratingSummary, { color: themeColors.muted }]}>
                            {Number(review.rating).toFixed(1)} / 5 stars
                        </Text>

                        <View style={[styles.commentBox, { backgroundColor: themeColors.input, borderColor: themeColors.border }]}>
                            <Text style={[styles.commentText, { color: themeColors.text }]}>
                                {review.comment}
                            </Text>
                        </View>

                        {review.status !== "approved" && (
                            <View style={styles.noteBox}>
                                <Text style={styles.noteText}>
                                    ⓘ Your review will appear publicly
                                    after admin approval.
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            disabled={saving}
                            onPress={startEditing}
                        >
                            <Text style={styles.primaryButtonText}>
                                ✎ Edit Review
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            disabled={saving}
                            onPress={handleDelete}
                        >
                            <Text style={styles.deleteButtonText}>
                                {saving ? "Deleting..." : "Delete Review"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* NEW / EDIT REVIEW FORM */
                    <View>
                        <Text style={[styles.inputLabel, { color: themeColors.text }]}>
                            How was your experience?
                        </Text>

                        <View style={styles.ratingSelector}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setRating(star)}
                                    disabled={saving}
                                    style={styles.starButton}
                                >
                                    <Text
                                        style={[
                                            styles.starText,
                                            star <= rating
                                                ? styles.activeStar
                                                : styles.inactiveStar,
                                        ]}
                                    >
                                        ★
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.ratingCaption}>
                            {getRatingLabel(rating)}
                        </Text>

                        <Text style={styles.inputLabel}>
                            Tell us more
                        </Text>

                        <TextInput
                            style={[styles.textArea, { backgroundColor: themeColors.input, borderColor: themeColors.border, color: themeColors.text }]}
                            placeholder="What did you like? How did AI Interview Assist help you prepare?"
                            placeholderTextColor={themeColors.muted}
                            value={comment}
                            onChangeText={setComment}
                            multiline
                            textAlignVertical="top"
                            maxLength={1000}
                            editable={!saving}
                        />

                        <Text style={[styles.characterCount, { color: themeColors.muted }]}>
                            {comment.length}/1000 characters
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                saving && styles.disabledButton,
                            ]}
                            onPress={handleSubmit}
                            disabled={saving}
                        >
                            <Text style={styles.primaryButtonText}>
                                {saving
                                    ? "Saving..."
                                    : review
                                        ? "Update Review →"
                                        : "Submit Review →"}
                            </Text>
                        </TouchableOpacity>

                        {editing && (
                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    {
                                        backgroundColor: themeColors.input,
                                        borderColor: themeColors.border,
                                    },
                                ]}
                                onPress={cancelEditing}
                                disabled={saving}
                            >
                                <Text style={[
                                    styles.cancelButtonText,
                                    { color: themeColors.text },
                                ]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.securityNote}>
                            <Text style={styles.securityText}>
                                🔒 Reviews are checked by the admin before
                                being displayed publicly.
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

export default ReviewsScreen;

const createStyles = (themeColors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#F5F3FF",
        },
        scrollContent: {
            padding: 16,
            paddingTop: 32,
            paddingBottom: 30,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F5F3FF",
        },
        loadingText: {
            marginTop: 12,
            color: "#6B7280",
            fontSize: 15,
            fontWeight: "600",
        },
        header: {
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 20,
            alignItems: "center",
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#DDD6FE",
        },
        backButton: {
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#30264F" : "#EDE9FE",
            paddingHorizontal: 76,
            paddingVertical: 11,
            borderRadius: 10,
            marginTop: 5,
            marginBottom: 5,
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#C4B5FD",
        },

        backButtonText: {
            color: isDark ? "#D6C5FF" : "#6D28D9",
            fontSize: 13,
            fontWeight: "800",
        },
        headerIcon: {
            fontSize: 38,
            marginBottom: 10,
        },
        headerTitle: {
            fontSize: 14,
            color: "#7C3AED",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
            textAlign: "center",
        },
        headerSubtitle: {
            fontSize: 23,
            fontWeight: "900",
            color: "#1F2937",
            textAlign: "center",
        },
        headerDescription: {
            fontSize: 14,
            lineHeight: 21,
            color: "#6B7280",
            textAlign: "center",
            marginTop: 12,
        },
        benefitsCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#BFDBFE",
        },
        benefitsTitle: {
            fontSize: 17,
            fontWeight: "800",
            color: "#1F2937",
            marginBottom: 16,
        },
        benefitRow: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 15,
        },
        benefitIcon: {
            width: 38,
            height: 38,
            textAlign: "center",
            textAlignVertical: "center",
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: isDark ? "#30264F" : "#EDE9FE",
            color: isDark ? "#D6C5FF" : "#7C3AED",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#DDD6FE",
            fontSize: 20,
            fontWeight: "800",
            marginRight: 12,
        },
        benefitContent: {
            flex: 1,
        },
        benefitHeading: {
            fontSize: 14,
            color: "#1F2937",
            fontWeight: "800",
        },
        benefitDescription: {
            fontSize: 12,
            color: "#6B7280",
            marginTop: 3,
        },
        formCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 18,
            borderWidth: 1,
            borderColor: "#DDD6FE",
        },
        sectionLabel: {
            fontSize: 11,
            fontWeight: "900",
            color: "#7C3AED",
            letterSpacing: 1,
            marginBottom: 8,
        },
        formTitle: {
            fontSize: 22,
            fontWeight: "900",
            color: "#1F2937",
        },
        formSubtitle: {
            fontSize: 13,
            color: "#6B7280",
            marginTop: 7,
            marginBottom: 18,
            lineHeight: 19,
        },
        successBox: {
            backgroundColor: "#DCFCE7",
            borderColor: "#86EFAC",
            borderWidth: 1,
            padding: 12,
            borderRadius: 10,
            marginBottom: 14,
        },
        successText: {
            color: "#166534",
            fontSize: 13,
            fontWeight: "600",
        },
        errorBox: {
            backgroundColor: "#FEE2E2",
            borderColor: "#FCA5A5",
            borderWidth: 1,
            padding: 12,
            borderRadius: 10,
            marginBottom: 14,
        },
        errorText: {
            color: "#B91C1C",
            fontSize: 13,
            fontWeight: "600",
        },
        reviewDisplay: {
            marginTop: 5,
        },
        reviewTop: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
        },
        reviewHeading: {
            fontSize: 17,
            fontWeight: "800",
            color: "#1F2937",
        },
        statusBadge: {
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 20,
        },
        approvedBadge: {
            backgroundColor: "#DCFCE7",
        },
        pendingBadge: {
            backgroundColor: "#FEF3C7",
        },
        hiddenBadge: {
            backgroundColor: "#FEE2E2",
        },
        statusText: {
            fontSize: 11,
            fontWeight: "800",
            color: "#374151",
        },
        displayStars: {
            marginTop: 18,
        },
        starsText: {
            fontSize: 32,
            color: "#F59E0B",
            letterSpacing: 3,
        },
        ratingSummary: {
            color: "#6B7280",
            fontSize: 13,
            marginTop: 5,
            fontWeight: "600",
        },
        commentBox: {
            backgroundColor: "#F9FAFB",
            borderRadius: 12,
            padding: 15,
            marginTop: 18,
            borderWidth: 1,
            borderColor: "#E5E7EB",
        },
        commentText: {
            fontSize: 14,
            color: "#374151",
            lineHeight: 22,
        },
        noteBox: {
            backgroundColor: "#EFF6FF",
            padding: 12,
            borderRadius: 10,
            marginTop: 14,
        },
        noteText: {
            color: "#1D4ED8",
            fontSize: 12,
            lineHeight: 19,
        },
        inputLabel: {
            color: "#374151",
            fontSize: 14,
            fontWeight: "800",
            marginBottom: 12,
            marginTop: 12,
        },
        ratingSelector: {
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginVertical: 8,
        },
        starButton: {
            paddingHorizontal: 7,
            paddingVertical: 5,
        },
        starText: {
            fontSize: 39,
        },
        activeStar: {
            color: "#F59E0B",
        },
        inactiveStar: {
            color: "#D1D5DB",
        },
        ratingCaption: {
            textAlign: "center",
            color: "#7C3AED",
            fontWeight: "800",
            fontSize: 14,
            marginBottom: 16,
        },
        textArea: {
            minHeight: 145,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            color: "#1F2937",
            lineHeight: 21,
        },
        characterCount: {
            textAlign: "right",
            color: "#9CA3AF",
            fontSize: 11,
            marginTop: 7,
            marginBottom: 14,
        },
        primaryButton: {
            backgroundColor: "#7C3AED",
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 12,
        },
        primaryButtonText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "800",
        },
        disabledButton: {
            opacity: 0.6,
        },
        deleteButton: {
            backgroundColor: "#FEE2E2",
            borderWidth: 1,
            borderColor: "#FCA5A5",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 12,
        },
        deleteButtonText: {
            color: "#DC2626",
            fontSize: 14,
            fontWeight: "800",
        },
        cancelButton: {
            backgroundColor: "#F3F4F6",
            borderWidth: 1,
            borderColor: "#D1D5DB",
            paddingVertical: 13,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 10,
        },
        cancelButtonText: {
            color: "#374151",
            fontWeight: "800",
            fontSize: 14,
        },
        securityNote: {
            backgroundColor: "#F0FDF4",
            borderRadius: 10,
            padding: 12,
            marginTop: 16,
        },
        securityText: {
            color: "#166534",
            fontSize: 12,
            lineHeight: 19,
        },
    });
