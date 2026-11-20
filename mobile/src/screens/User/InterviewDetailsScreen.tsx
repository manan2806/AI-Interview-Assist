import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import {
    getInterviewDetails,
    retakeInterview,
} from "../../services/interviewService";

interface QuestionDetail {
    question_number?: number;
    question?: string;
    answer?: string;
    score?: number;
    correctness?: string;
    relevance?: string;
    technical_accuracy?: string;
    strengths?: string[];
    weaknesses?: string[];
    missing_concepts?: string[];
    feedback?: string;
}

interface Interview {
    interview_id?: string;
    job_role?: string;
    field?: string;
    experience_level?: string;
    interview_type?: string;
    difficulty?: string;
    number_of_questions?: number;
    duration?: string;
    custom_duration?: number | null;
    status?: string;
    created_at?: string;
    started_at?: string;
    completed_at?: string;
}

const InterviewDetailsScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);
    const interviewId = route.params?.interviewId || route.params?.id;
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retaking, setRetaking] = useState(false);

    // ==========================================
    // LOAD INTERVIEW DETAILS
    // ==========================================

    const loadDetails = useCallback(async () => {
        if (!interviewId) {
            setError("Interview ID is missing.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const data: any = await getInterviewDetails(interviewId);

            if (!data?.success) {
                setDetails(null);
                setError(
                    data?.message || "Unable to load interview details."
                );
                return;
            }

            setDetails(data);
        } catch (err: any) {
            setDetails(null);
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load interview details. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [interviewId]);

    useEffect(() => {
        loadDetails();
    }, [loadDetails]);

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date?: string) => {
        if (!date) return "-";

        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // ==========================================
    // RETAKE INTERVIEW
    // ==========================================

    const handleRetake = async () => {
        try {
            setRetaking(true);

            const data: any = await retakeInterview(interviewId);

            if (!data?.success) {
                Alert.alert(
                    "Unable to Retake",
                    data?.message || "Unable to retake interview."
                );
                return;
            }

            const newInterviewId = data.interview_id;

            if (!newInterviewId) {
                Alert.alert(
                    "Error",
                    "New interview ID was not received."
                );
                return;
            }

            const interview = details?.interview || {};

            const setup = {
                field: interview.field || "",
                target_role: interview.job_role || "",
                job_role: interview.job_role || "",
                experience_level: interview.experience_level || "Fresher",
                interview_type: interview.interview_type || "Technical",
                difficulty: interview.difficulty || "Medium",
                number_of_questions:
                    Number(interview.number_of_questions) || 5,
                duration: interview.duration || "No Limit",
                custom_duration: interview.custom_duration ?? null,
            };

            navigation.navigate("InterviewSession", {
                interviewId: newInterviewId,
                setup,
            });
        } catch (err: any) {
            Alert.alert(
                "Retake Failed",
                err?.response?.data?.message ||
                err?.message ||
                "Unable to retake interview. Please try again."
            );
        } finally {
            setRetaking(false);
        }
    };

    // ==========================================
    // BACK TO HISTORY
    // ==========================================

    const goToHistory = () => {
        navigation.navigate("InterviewHistory");
    };

    // ==========================================
    // VIEW RESULT
    // ==========================================

    const goToResult = () => {
        navigation.navigate("InterviewResult", {
            interviewId,
            from: "history",
        });
    };

    // ==========================================
    // LOADING SCREEN
    // ==========================================

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />

                <Text style={styles.loadingTitle}>
                    Loading Interview Details...
                </Text>

                <Text style={styles.loadingDescription}>
                    Please wait while we fetch your complete interview report.
                </Text>
            </View>
        );
    }

    // ==========================================
    // ERROR SCREEN
    // ==========================================

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>

                <Text style={styles.errorTitle}>
                    Unable to Load Details
                </Text>

                <Text style={styles.errorDescription}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={loadDetails}
                >
                    <Text style={styles.primaryButtonText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={goToHistory}
                >
                    <Text style={styles.secondaryButtonText}>
                        Interview History
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ==========================================
    // DATA
    // ==========================================

    if (!details) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>📄</Text>

                <Text style={styles.errorTitle}>
                    Interview Details Not Found
                </Text>

                <Text style={styles.errorDescription}>
                    We could not find details for this interview.
                </Text>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={goToHistory}
                >
                    <Text style={styles.secondaryButtonText}>
                        Back to History
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const interview: Interview = details.interview || {};

    const questionDetails: QuestionDetail[] =
        Array.isArray(details.question_details)
            ? details.question_details
            : [];

    // ==========================================
    // MAIN SCREEN
    // ==========================================

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER */}

                <View style={styles.headerCard}>
                    <Text style={styles.headerLabel}>
                        INTERVIEW REPORT
                    </Text>

                    <Text style={styles.headerTitle}>
                        Interview Details
                    </Text>

                    <Text style={styles.headerDescription}>
                        Complete information about your interview attempt.
                    </Text>

                    {interview.status === "completed" && (
                        <>
                            <TouchableOpacity
                                style={styles.resultButton}
                                onPress={goToResult}
                            >
                                <Text style={styles.resultButtonText}>
                                    📊 View Interview Result
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.retakeButton}
                                disabled={retaking}
                                onPress={handleRetake}
                            >
                                {retaking ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.retakeButtonText}>
                                        🔄 Retake Interview
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goToHistory}
                    >
                        <Text style={styles.backButtonText}>
                            ← Back to History
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* INTERVIEW INFORMATION */}

                <View style={styles.card}>
                    <View style={styles.cardHeading}>
                        <Text style={styles.cardHeadingIcon}>🎯</Text>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardSubtitle}>
                                Interview Information
                            </Text>

                            <Text style={styles.cardTitle}>
                                {interview.job_role || "Interview"}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoGrid}>
                        <InfoItem
                            label="Job Role"
                            value={interview.job_role || "-"}
                            styles={styles}
                        />

                        <InfoItem
                            label="Experience Level"
                            value={interview.experience_level || "-"}
                            styles={styles}
                        />

                        <InfoItem
                            label="Interview Type"
                            value={interview.interview_type || "-"}
                            styles={styles}
                        />

                        <InfoItem
                            label="Difficulty"
                            value={interview.difficulty || "-"}
                            styles={styles}
                        />

                        <InfoItem
                            label="Total Questions"
                            value={String(
                                interview.number_of_questions ||
                                questionDetails.length ||
                                0
                            )}
                            styles={styles}
                        />

                        <InfoItem
                            label="Status"
                            value={interview.status || "-"}
                            highlight
                            styles={styles}
                        />
                    </View>
                </View>

                {/* DATE INFORMATION */}

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        📅 Interview Timeline
                    </Text>

                    <DateItem
                        label="Created At"
                        value={formatDate(interview.created_at)}
                        color="#6C63FF"
                        styles={styles}
                    />

                    <DateItem
                        label="Started At"
                        value={formatDate(interview.started_at)}
                        color="#2878D0"
                        styles={styles}
                    />

                    <DateItem
                        label="Completed At"
                        value={formatDate(interview.completed_at)}
                        color="#16A085"
                        styles={styles}
                    />
                </View>

                {/* QUESTIONS */}

                <View style={styles.questionsSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionSubtitle}>
                            INTERVIEW QUESTIONS
                        </Text>

                        <Text style={styles.sectionTitle}>
                            Question-wise Details
                        </Text>

                        <Text style={styles.sectionDescription}>
                            Review your answers and AI evaluation for every question.
                        </Text>
                    </View>

                    {questionDetails.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyIcon}>📝</Text>

                            <Text style={styles.emptyText}>
                                No question details available.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.questionList}>
                            {questionDetails.map((item, index) => (
                                <QuestionCard
                                    key={item.question_number || index}
                                    item={item}
                                    index={index}
                                    styles={styles}
                                    colors={colors}
                                    isDark={isDark}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

// ==========================================
// INFORMATION ITEM
// ==========================================

const InfoItem = ({
    label,
    value,
    highlight = false,
    styles,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    styles: any;
}) => (
    <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text
            style={[
                styles.infoValue,
                highlight && styles.infoHighlight,
            ]}
        >
            {value.replace(/_/g, " ")}
        </Text>
    </View>
);

// ==========================================
// DATE ITEM
// ==========================================

const DateItem = ({
    label,
    value,
    color,
    styles,
}: {
    label: string;
    value: string;
    color: string;
    styles: any;
}) => (
    <View style={styles.dateItem}>
        <View
            style={[
                styles.dateDot,
                { backgroundColor: color },
            ]}
        />

        <View style={styles.dateContent}>
            <Text style={styles.dateLabel}>{label}</Text>
            <Text style={styles.dateValue}>{value}</Text>
        </View>
    </View>
);

// ==========================================
// QUESTION CARD
// ==========================================

const QuestionCard = ({
    item,
    index,
    styles,
    colors,
    isDark,
}: {
    item: QuestionDetail;
    index: number;
    styles: any;
    colors: any;
    isDark: boolean;
}) => (
    <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
            <View style={styles.questionHeading}>
                <Text style={styles.questionNumber}>
                    Question {item.question_number || index + 1}
                </Text>

                <Text style={styles.questionText}>
                    {item.question || "Question not available"}
                </Text>
            </View>

            <View style={styles.scoreBadge}>
                <Text style={styles.scoreNumber}>
                    {item.score ?? 0}
                </Text>

                <Text style={styles.scoreTotal}>/10</Text>
            </View>
        </View>

        <View style={styles.answerBox}>
            <Text style={styles.answerTitle}>💬 Your Answer</Text>

            <Text style={styles.answerText}>
                {item.answer || "No answer provided."}
            </Text>
        </View>

        <View style={styles.evaluationGrid}>
            <EvaluationItem
                label="Correctness"
                value={item.correctness}
                styles={styles}
            />

            <EvaluationItem
                label="Relevance"
                value={item.relevance}
                styles={styles}
            />

            <EvaluationItem
                label="Technical Accuracy"
                value={item.technical_accuracy}
                styles={styles}
            />
        </View>

        {Array.isArray(item.strengths) &&
            item.strengths.length > 0 && (
                <FeedbackBox
                    title="💪 Strengths"
                    items={item.strengths}
                    background={isDark ? "#19382D" : "#EAF8F0"}
                    color={isDark ? "#86D6A5" : "#16845B"}
                    styles={styles}
                />
            )}

        {Array.isArray(item.weaknesses) &&
            item.weaknesses.length > 0 && (
                <FeedbackBox
                    title="⚠️ Weaknesses"
                    items={item.weaknesses}
                    background={isDark ? "#3D3020" : "#FFF0D6"}
                    color={isDark ? "#F5C477" : "#A56812"}
                    styles={styles}
                />
            )}

        {Array.isArray(item.missing_concepts) &&
            item.missing_concepts.length > 0 && (
                <FeedbackBox
                    title="📚 Missing Concepts"
                    items={item.missing_concepts}
                    background={isDark ? "#1D3047" : "#EAF3FF"}
                    color={isDark ? "#8FC5FF" : "#2878D0"}
                    styles={styles}
                />
            )}

        {!!item.feedback && (
            <View style={styles.feedbackBox}>
                <Text style={styles.feedbackTitle}>
                    🤖 AI Feedback
                </Text>

                <Text style={styles.feedbackText}>
                    {item.feedback}
                </Text>
            </View>
        )}
    </View>
);

// ==========================================
// EVALUATION ITEM
// ==========================================

const EvaluationItem = ({
    label,
    value,
    styles,
}: {
    label: string;
    value?: string;
    styles: any;
}) => (
    <View style={styles.evaluationItem}>
        <Text style={styles.evaluationLabel}>{label}</Text>

        <Text style={styles.evaluationValue}>
            {value || "-"}
        </Text>
    </View>
);

// ==========================================
// FEEDBACK BOX
// ==========================================

const FeedbackBox = ({
    title,
    items,
    background,
    color,
    styles,
}: {
    title: string;
    items: string[];
    background: string;
    color: string;
    styles: any;
}) => (
    <View
        style={[
            styles.feedbackListBox,
            { backgroundColor: background },
        ]}
    >
        <Text
            style={[
                styles.feedbackListTitle,
                { color },
            ]}
        >
            {title}
        </Text>

        {items.map((item, index) => (
            <View
                key={index}
                style={styles.feedbackListItem}
            >
                <Text style={[styles.feedbackBullet, { color }]}>
                    •
                </Text>

                <Text style={styles.feedbackListText}>
                    {item}
                </Text>
            </View>
        ))}
    </View>
);
const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDark ? colors.background : "#F5F6FF",
        },

        content: {
            padding: 16,
            paddingTop: 30,
            paddingBottom: 35,
        },

        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? colors.background : "#F5F6FF",
            padding: 25,
        },

        loadingTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 18,
            fontWeight: "800",
            marginTop: 16,
            textAlign: "center",
        },

        loadingDescription: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            textAlign: "center",
            lineHeight: 20,
            marginTop: 8,
        },

        errorIcon: {
            fontSize: 48,
            marginBottom: 12,
        },

        errorTitle: {
            fontSize: 21,
            color: isDark ? colors.text : "#252943",
            fontWeight: "800",
            textAlign: "center",
        },

        errorDescription: {
            fontSize: 13,
            color: isDark ? colors.muted : "#777C90",
            textAlign: "center",
            lineHeight: 20,
            marginTop: 9,
            marginBottom: 15,
        },

        primaryButton: {
            backgroundColor: isDark ? "#5141B8" : "#6C63FF",
            paddingVertical: 13,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginTop: 10,
            alignItems: "center",
        },

        primaryButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
        },

        secondaryButton: {
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            paddingVertical: 13,
            paddingHorizontal: 24,
            borderRadius: 12,
            marginTop: 10,
            alignItems: "center",
        },

        secondaryButtonText: {
            color: isDark ? "#D6C5FF" : "#554BD7",
            fontWeight: "800",
        },

        // HEADER

        headerCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 17,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
        },

        headerLabel: {
            color: isDark ? "#A99CFF" : "#6C63FF",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.5,
        },

        headerTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 27,
            fontWeight: "900",
            marginTop: 8,
        },

        headerDescription: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            lineHeight: 20,
            marginTop: 8,
            marginBottom: 15,
        },

        resultButton: {
            backgroundColor: isDark ? "#116B59" : "#16A085",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
            marginBottom: 10,
        },

        resultButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 13,
        },

        retakeButton: {
            backgroundColor: isDark ? "#5141B8" : "#6C63FF",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
            marginBottom: 10,
        },

        retakeButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 13,
        },

        backButton: {
            backgroundColor: isDark ? "#1D3047" : "#EAF3FF",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
        },

        backButtonText: {
            color: isDark ? "#8FC5FF" : "#2878D0",
            fontWeight: "800",
            fontSize: 13,
        },

        // INFORMATION CARD

        card: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 17,
            padding: 17,
            marginBottom: 17,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#ECECF5",
        },

        cardHeading: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
        },

        cardHeadingIcon: {
            fontSize: 29,
            marginRight: 12,
        },

        cardSubtitle: {
            color: isDark ? colors.muted : "#85899B",
            fontSize: 12,
            fontWeight: "600",
        },

        cardTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 19,
            fontWeight: "800",
            marginTop: 4,
        },

        infoGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#F0F0F6",
            paddingTop: 7,
        },

        infoItem: {
            width: "50%",
            paddingVertical: 12,
            paddingRight: 8,
        },

        infoLabel: {
            color: isDark ? colors.muted : "#85899B",
            fontSize: 11,
        },

        infoValue: {
            color: isDark ? colors.text : "#252943",
            fontSize: 13,
            fontWeight: "800",
            marginTop: 5,
            textTransform: "capitalize",
        },

        infoHighlight: {
            color: isDark ? "#A99CFF" : "#6C63FF",
        },

        // TIMELINE

        sectionTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 17,
            fontWeight: "800",
            marginBottom: 15,
        },

        dateItem: {
            flexDirection: "row",
            alignItems: "flex-start",
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#F0F0F6",
        },

        dateDot: {
            width: 11,
            height: 11,
            borderRadius: 6,
            marginTop: 4,
            marginRight: 12,
        },

        dateContent: {
            flex: 1,
        },

        dateLabel: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 12,
            fontWeight: "600",
        },

        dateValue: {
            color: isDark ? colors.text : "#252943",
            fontSize: 13,
            fontWeight: "700",
            marginTop: 5,
        },

        // QUESTIONS SECTION

        questionsSection: {
            marginTop: 3,
        },

        sectionHeader: {
            marginBottom: 15,
        },

        sectionSubtitle: {
            color: isDark ? "#A99CFF" : "#6C63FF",
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.2,
        },

        sectionDescription: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 12,
            lineHeight: 19,
            marginTop: 6,
        },

        questionList: {
            gap: 15,
        },

        questionCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 17,
            padding: 15,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#ECECF5",
        },

        questionHeader: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 15,
        },

        questionHeading: {
            flex: 1,
            paddingRight: 8,
        },

        questionNumber: {
            color: isDark ? "#A99CFF" : "#6C63FF",
            fontSize: 11,
            fontWeight: "800",
            marginBottom: 8,
        },

        questionText: {
            color: isDark ? colors.text : "#252943",
            fontSize: 15,
            fontWeight: "800",
            lineHeight: 22,
        },

        scoreBadge: {
            flexDirection: "row",
            alignItems: "baseline",
            backgroundColor: isDark ? "#19382D" : "#EAF8F0",
            borderRadius: 11,
            paddingHorizontal: 10,
            paddingVertical: 8,
        },

        scoreNumber: {
            color: isDark ? "#86D6A5" : "#16845B",
            fontSize: 18,
            fontWeight: "900",
        },

        scoreTotal: {
            color: isDark ? "#86D6A5" : "#16845B",
            fontSize: 11,
            fontWeight: "700",
        },

        // ANSWER

        answerBox: {
            backgroundColor: isDark ? colors.input : "#F7F7FC",
            borderRadius: 12,
            padding: 13,
            marginBottom: 12,
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
        },

        answerTitle: {
            color: isDark ? "#C4B5FD" : "#554BD7",
            fontSize: 12,
            fontWeight: "800",
            marginBottom: 8,
        },

        answerText: {
            color: isDark ? colors.text : "#555B70",
            fontSize: 13,
            lineHeight: 21,
        },

        // EVALUATION

        evaluationGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 12,
        },

        evaluationItem: {
            width: "50%",
            paddingVertical: 10,
            paddingRight: 8,
            borderTopWidth: 1,
            borderTopColor: isDark ? colors.border : "#F0F0F6",
        },

        evaluationLabel: {
            color: isDark ? colors.muted : "#85899B",
            fontSize: 10,
        },

        evaluationValue: {
            color: isDark ? colors.text : "#252943",
            fontSize: 12,
            fontWeight: "800",
            marginTop: 5,
        },

        // FEEDBACK

        feedbackListBox: {
            borderRadius: 12,
            padding: 13,
            marginBottom: 11,
        },

        feedbackListTitle: {
            fontSize: 12,
            fontWeight: "900",
            marginBottom: 8,
        },

        feedbackListItem: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginTop: 5,
        },

        feedbackBullet: {
            fontSize: 17,
            fontWeight: "900",
            marginRight: 7,
            lineHeight: 20,
        },

        feedbackListText: {
            flex: 1,
            color: isDark ? colors.text : "#555B70",
            fontSize: 12,
            lineHeight: 19,
        },

        feedbackBox: {
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderRadius: 12,
            padding: 13,
            marginBottom: 5,
        },

        feedbackTitle: {
            color: isDark ? "#D6C5FF" : "#554BD7",
            fontSize: 12,
            fontWeight: "900",
            marginBottom: 8,
        },

        feedbackText: {
            color: isDark ? colors.text : "#555B70",
            fontSize: 12,
            lineHeight: 20,
        },

        emptyCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 16,
            padding: 22,
            alignItems: "center",
            borderWidth: isDark ? 1 : 0,
            borderColor: colors.border,
        },

        emptyIcon: {
            fontSize: 35,
            marginBottom: 10,
        },

        emptyText: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            textAlign: "center",
        },
    });

export default InterviewDetailsScreen;