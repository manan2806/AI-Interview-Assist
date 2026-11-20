import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Svg, { Circle } from "react-native-svg";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

import {
    getInterviewDashboard,
    generateOverallResult,
} from "../../services/interviewService";

const InterviewResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);

    const interviewId = route.params?.interviewId;
    const from = route.params?.from;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    const loadResult = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            if (!interviewId) {
                setError("Interview ID is missing.");
                return;
            }

            const overallResponse =
                await generateOverallResult(interviewId);

            if (!overallResponse?.success) {
                setError(
                    overallResponse?.message ||
                    overallResponse?.error ||
                    "Unable to generate interview result."
                );
                return;
            }

            const dashboardResponse =
                await getInterviewDashboard(interviewId);

            if (!dashboardResponse?.success) {
                setError(
                    dashboardResponse?.message ||
                    dashboardResponse?.error ||
                    "Unable to load interview result."
                );
                return;
            }

            if (!dashboardResponse?.data) {
                setError("Interview result data was not found.");
                return;
            }

            setData(dashboardResponse.data);
        } catch (err: any) {
            console.error("Interview Result Error:", err);

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to load interview result."
            );
        } finally {
            setLoading(false);
        }
    }, [interviewId]);

    useEffect(() => {
        loadResult();
    }, [loadResult]);

    const handleDownloadPDF = async () => {
        try {
            if (!interviewId) {
                Alert.alert("Error", "Interview ID is missing.");
                return;
            }

            setDownloading(true);

            const token =
                await SecureStore.getItemAsync("access_token");

            const baseURL = api.defaults.baseURL;

            if (!baseURL) {
                throw new Error("API base URL is not configured.");
            }

            const fileUrl =
                `${baseURL}/api/interview/${interviewId}/download-report`;

            const fileUri =
                `${FileSystem.cacheDirectory}interview_report_${interviewId}.pdf`;

            const downloadResult =
                await FileSystem.downloadAsync(
                    fileUrl,
                    fileUri,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );

            if (
                downloadResult.status < 200 ||
                downloadResult.status >= 300
            ) {
                throw new Error("Unable to download PDF report.");
            }

            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
                await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Interview PDF Report",
                    UTI: "com.adobe.pdf",
                });
            } else {
                await Share.share({
                    message: "Your interview PDF report is ready.",
                });
            }
        } catch (err: any) {
            console.error("PDF Download Error:", err);

            Alert.alert(
                "Download Failed",
                err?.message || "Unable to download PDF report."
            );
        } finally {
            setDownloading(false);
        }
    };

    const renderList = (
        value: any,
        emptyMessage: string
    ) => {
        if (Array.isArray(value) && value.length > 0) {
            return value.map((item, index) => (
                <View style={styles.bulletRow} key={index}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listText}>
                        {String(item)}
                    </Text>
                </View>
            ));
        }

        if (typeof value === "string" && value.trim()) {
            return (
                <Text style={styles.bodyText}>
                    {value}
                </Text>
            );
        }

        return (
            <Text style={styles.emptyText}>
                {emptyMessage}
            </Text>
        );
    };

    const renderInfo = (label: string, value: any) => (
        <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>
                {value || "N/A"}
            </Text>
        </View>
    );

    const renderAnalysis = (
        title: string,
        content: any
    ) => (
        <View style={styles.analysisSection}>
            <Text style={styles.subHeading}>{title}</Text>
            <Text style={styles.bodyText}>
                {content || "No information available."}
            </Text>
        </View>
    );

    const goBack = () => {
        if (from === "dashboard") {
            navigation.navigate("UserDashboard");
        } else {
            navigation.navigate("InterviewHistory");
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />

                <Text style={styles.loadingTitle}>
                    Loading Interview Result...
                </Text>

                <Text style={styles.mutedText}>
                    Please wait while we prepare your report.
                </Text>
            </View>
        );
    }

    if (error && !data) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorIcon}>!</Text>

                <Text style={styles.errorTitle}>
                    Unable to Load Result
                </Text>

                <Text style={styles.errorText}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={loadResult}
                >
                    <Text style={styles.primaryButtonText}>
                        Try Again
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={goBack}
                >
                    <Text style={styles.secondaryButtonText}>
                        {from === "dashboard"
                            ? "Back to Dashboard"
                            : "Back to Interview History"}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const interview = data?.interview || {};
    const performance = data?.overall_performance || {};
    const analysis = data?.ai_analysis || {};

    const questionPerformance =
        Array.isArray(data?.question_performance)
            ? data.question_performance
            : [];

    const overallScore =
        performance.overall_score ??
        performance.overallScore ??
        0;

    const averageScore =
        performance.average_score ??
        performance.averageScore ??
        0;

    const totalScore =
        performance.total_score ??
        performance.totalScore ??
        0;

    const maxScore =
        performance.max_score ??
        performance.maxScore ??
        0;

    const performanceLevel =
        performance.performance_level ??
        performance.performanceLevel ??
        "N/A";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    Interview Result
                </Text>

                <Text style={styles.headerDescription}>
                    Your AI-powered interview performance report
                </Text>

                <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={handleDownloadPDF}
                    disabled={downloading}
                >
                    {downloading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.downloadButtonText}>
                            📄 Download PDF Report
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                >
                    <Text style={styles.backButtonText}>
                        {from === "dashboard"
                            ? "← Back to Dashboard"
                            : "← Back to History"}
                    </Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <View style={styles.inlineError}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : null}

            {/* INTERVIEW INFORMATION */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Interview Information
                </Text>

                <View style={styles.infoGrid}>
                    {renderInfo("Job Role", interview.job_role)}
                    {renderInfo("Experience Level", interview.experience_level)}
                    {renderInfo("Interview Type", interview.interview_type)}
                    {renderInfo("Difficulty", interview.difficulty)}
                    {renderInfo(
                        "Total Questions",
                        interview.number_of_questions ||
                        questionPerformance.length
                    )}
                </View>
            </View>

            {/* OVERALL PERFORMANCE */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Overall Performance
                </Text>

                <View style={styles.scoreContainer}>
                    <View style={styles.scoreCircle}>
                        <Svg width={155} height={155} viewBox="0 0 155 155">
                            <Circle
                                cx={77.5}
                                cy={77.5}
                                r={67}
                                stroke={isDark ? "#494365" : "#E2DEFF"}
                                strokeWidth={10}
                                fill="none"
                            />

                            <Circle
                                cx={77.5}
                                cy={77.5}
                                r={67}
                                stroke="#8B7CFF"
                                strokeWidth={10}
                                fill="none"
                                strokeDasharray={2 * Math.PI * 67}
                                strokeDashoffset={
                                    2 * Math.PI * 67 *
                                    (1 - Math.min(
                                        Math.max(Number(overallScore) || 0, 0),
                                        100
                                    ) / 100)
                                }
                                strokeLinecap="round"
                                rotation="-90"
                                origin="77.5, 77.5"
                            />
                        </Svg>

                        <View style={styles.scoreContent}>
                            <Text style={styles.scoreNumber}>
                                {overallScore}%
                            </Text>

                            <Text style={styles.scoreLabel}>
                                Overall Score
                            </Text>
                        </View>
                    </View>

                    <View style={styles.scoreDetails}>
                        {renderInfo("Average Score", `${averageScore}/10`)}
                        {renderInfo("Total Score", totalScore)}
                        {renderInfo("Maximum Score", maxScore)}
                        {renderInfo("Performance", performanceLevel)}
                    </View>
                </View>
            </View>

            {/* AI ANALYSIS */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>AI Analysis</Text>

                {renderAnalysis(
                    "Summary",
                    analysis.summary ||
                    performance.summary ||
                    "No summary available."
                )}

                <View style={styles.analysisSection}>
                    <Text style={styles.subHeading}>Strengths</Text>
                    {renderList(
                        analysis.strengths,
                        "No strengths available."
                    )}
                </View>

                <View style={styles.analysisSection}>
                    <Text style={styles.subHeading}>Weaknesses</Text>
                    {renderList(
                        analysis.weaknesses,
                        "No weaknesses available."
                    )}
                </View>

                <View style={styles.analysisSection}>
                    <Text style={styles.subHeading}>
                        Recommendations
                    </Text>
                    {renderList(
                        analysis.recommendations,
                        "No recommendations available."
                    )}
                </View>

                {renderAnalysis(
                    "Technical Skill Assessment",
                    analysis.technical_skill_assessment ||
                    performance.technical_skill_assessment
                )}

                {renderAnalysis(
                    "Readiness Assessment",
                    analysis.readiness_assessment ||
                    performance.readiness_assessment
                )}
            </View>

            {/* QUESTION PERFORMANCE */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    Question-wise Performance
                </Text>

                {questionPerformance.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No question performance available.
                    </Text>
                ) : (
                    questionPerformance.map(
                        (question: any, index: number) => (
                            <View
                                key={
                                    question.question_number || index
                                }
                                style={styles.questionCard}
                            >
                                <View style={styles.questionHeader}>
                                    <Text style={styles.questionTitle}>
                                        Question{" "}
                                        {question.question_number || index + 1}
                                    </Text>

                                    <Text style={styles.questionScore}>
                                        {question.score ?? 0}/10
                                    </Text>
                                </View>

                                <View style={styles.questionBlock}>
                                    <Text style={styles.blockLabel}>
                                        Question
                                    </Text>

                                    <Text style={styles.bodyText}>
                                        {question.question || "N/A"}
                                    </Text>
                                </View>

                                <View style={styles.questionBlock}>
                                    <Text style={styles.blockLabel}>
                                        Your Answer
                                    </Text>

                                    <Text style={styles.bodyText}>
                                        {question.answer ||
                                            question.candidate_answer ||
                                            "No answer"}
                                    </Text>
                                </View>

                                <View style={styles.evaluationGrid}>
                                    {renderInfo(
                                        "Correctness",
                                        question.correctness
                                    )}
                                    {renderInfo(
                                        "Relevance",
                                        question.relevance
                                    )}
                                    {renderInfo(
                                        "Technical Accuracy",
                                        question.technical_accuracy
                                    )}
                                </View>

                                {Array.isArray(question.strengths) &&
                                    question.strengths.length > 0 ? (
                                    <View style={styles.feedbackBlock}>
                                        <Text style={styles.blockLabel}>
                                            Strengths
                                        </Text>
                                        {renderList(question.strengths, "")}
                                    </View>
                                ) : null}

                                {Array.isArray(question.weaknesses) &&
                                    question.weaknesses.length > 0 ? (
                                    <View style={styles.feedbackBlock}>
                                        <Text style={styles.blockLabel}>
                                            Areas to Improve
                                        </Text>
                                        {renderList(question.weaknesses, "")}
                                    </View>
                                ) : null}

                                {question.feedback ? (
                                    <View style={styles.feedbackBlock}>
                                        <Text style={styles.blockLabel}>
                                            Feedback
                                        </Text>

                                        <Text style={styles.bodyText}>
                                            {question.feedback}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        )
                    )
                )}
            </View>
        </ScrollView>
    );
};

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 16,
            paddingTop: 30,
            paddingBottom: 35,
        },
        centerContainer: {
            flex: 1,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 25,
        },

        // HEADER
        header: {
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            paddingTop:30,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
        },
        headerTitle: {
            fontSize: 26,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 7,
        },
        headerDescription: {
            color: colors.muted,
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 18,
        },

        // DOWNLOAD BUTTON
        downloadButton: {
            backgroundColor: "#7567F8",
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            marginBottom: 10,
            minHeight: 48,
            justifyContent: "center",
            shadowColor: "#7567F8",
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 2,
        },
        downloadButtonText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "700",
        },

        // BACK BUTTON
        backButton: {
            backgroundColor: isDark ? "#302D55" : "#E5F1FF",
            padding: 13,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#514B80" : "#D1E5FF",
        },
        backButtonText: {
            color: isDark ? "#C5B8FF" : "#3478C5",
            fontWeight: "700",
            fontSize: 14,
        },

        // MAIN CARDS
        card: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: "#7166C5",
            shadowOpacity: isDark ? 0 : 0.04,
            shadowRadius: 5,
            elevation: isDark ? 0 : 1,
        },
        cardTitle: {
            fontSize: 19,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 18,
        },

        // INFORMATION GRID
        infoGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 15,
        },
        infoItem: {
            flex: 1,
            minWidth: "42%",
            backgroundColor: isDark ? "#302D48" : "#F0EEFF",
            padding: 12,
            borderRadius: 11,
            marginBottom: 5,
            borderWidth: 1,
            borderColor: isDark ? "#494365" : "#E2DEFF",
        },
        infoLabel: {
            fontSize: 12,
            color: colors.muted,
            marginBottom: 6,
        },
        infoValue: {
            fontSize: 14,
            color: colors.text,
            fontWeight: "700",
        },

        // SCORE
        scoreContainer: {
            alignItems: "center",
        },
        scoreCircle: {
            width: 155,
            height: 155,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
        },
        scoreContent: {
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
        },
        scoreNumber: {
            fontSize: 34,
            fontWeight: "900",
            color: isDark ? "#C5B8FF" : "#7161E8",
        },
        scoreLabel: {
            color: colors.muted,
            fontSize: 12,
            marginTop: 3,
        },
        scoreDetails: {
            width: "100%",
            gap: 8,
        },

        // ANALYSIS
        analysisSection: {
            marginBottom: 20,
        },
        subHeading: {
            fontSize: 16,
            fontWeight: "800",
            color: isDark ? "#B9A8FF" : "#5850B8",
            marginBottom: 9,
        },
        bodyText: {
            color: colors.text,
            fontSize: 14,
            lineHeight: 22,
        },

        // BULLET LIST
        bulletRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            marginBottom: 8,
        },
        bullet: {
            color: "#8A73F8",
            fontSize: 19,
            fontWeight: "900",
            marginRight: 9,
            lineHeight: 21,
        },
        listText: {
            flex: 1,
            color: colors.text,
            fontSize: 14,
            lineHeight: 21,
        },
        emptyText: {
            color: colors.muted,
            fontSize: 13,
            fontStyle: "italic",
        },

        // QUESTION CARDS
        questionCard: {
            backgroundColor: isDark ? "#29263F" : "#F5F3FF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: isDark ? "#494365" : "#E4DEFF",
        },
        questionHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 15,
        },
        questionTitle: {
            color: colors.text,
            fontSize: 16,
            fontWeight: "800",
        },
        questionScore: {
            color: "#16A078",
            fontSize: 16,
            fontWeight: "800",
        },
        questionBlock: {
            marginBottom: 15,
        },
        blockLabel: {
            color: isDark ? "#B9A8FF" : "#6154C9",
            fontSize: 13,
            fontWeight: "800",
            marginBottom: 6,
        },

        // EVALUATION
        evaluationGrid: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
        },
        feedbackBlock: {
            backgroundColor: isDark ? "#353149" : "#FFFFFF",
            borderRadius: 10,
            padding: 11,
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },

        // PRIMARY BUTTON
        primaryButton: {
            backgroundColor: "#7567F8",
            paddingVertical: 13,
            paddingHorizontal: 25,
            borderRadius: 11,
            marginTop: 18,
        },
        primaryButtonText: {
            color: "#FFFFFF",
            fontWeight: "700",
        },

        // SECONDARY BUTTON
        secondaryButton: {
            marginTop: 12,
            padding: 12,
        },
        secondaryButtonText: {
            color: isDark ? "#B9A8FF" : "#4384CE",
            fontWeight: "700",
        },

        // LOADING
        loadingTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: colors.text,
            marginTop: 18,
        },
        mutedText: {
            color: colors.muted,
            textAlign: "center",
            marginTop: 8,
        },

        // ERROR
        errorIcon: {
            backgroundColor: isDark ? "#512B38" : "#FFE8EC",
            color: isDark ? "#FF9AAE" : "#D64565",
            width: 55,
            height: 55,
            borderRadius: 28,
            textAlign: "center",
            textAlignVertical: "center",
            fontSize: 30,
            fontWeight: "800",
            overflow: "hidden",
        },
        errorTitle: {
            color: colors.text,
            fontSize: 21,
            fontWeight: "800",
            marginTop: 15,
        },
        errorText: {
            color: isDark ? "#FF9AAE" : "#D64565",
            textAlign: "center",
            marginTop: 10,
            lineHeight: 21,
        },
        inlineError: {
            backgroundColor: isDark ? "#3A222B" : "#FFF0F1",
            padding: 13,
            borderRadius: 10,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: isDark ? "#75404D" : "#FFD9DE",
        },

        // BOTTOM BUTTON
        bottomButton: {
            backgroundColor: "#7567F8",
            borderRadius: 12,
            padding: 15,
            alignItems: "center",
            marginTop: 5,
        },
        bottomButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "800",
        },
    });

export default InterviewResultScreen;
