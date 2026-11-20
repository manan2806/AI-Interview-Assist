
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";

import { UserStackParamList } from "../../navigation/UserNavigator";
import { useTheme } from "../../context/ThemeContext";

import {
    resumeInterview,
    generateQuestions,
    startInterview,
    submitAnswer,
    submitTimeout,
    evaluateInterview,
    generateOverallResult,
    getInterviewQuestion,
    updateInterviewAnswer,
} from "../../services/interviewService";

type Props = NativeStackScreenProps<
    UserStackParamList,
    "InterviewSession"
>;

const InterviewSessionScreen: React.FC<Props> = ({
    navigation,
    route,
}) => {
    const { interviewId, setup } = route.params;

    const { theme, colors } = useTheme();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(
        setup.number_of_questions
    );
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [editingQuestion, setEditingQuestion] = useState<number | null>(
        null
    );
    const [returnQuestion, setReturnQuestion] = useState<number | null>(
        null
    );
    const [finished, setFinished] = useState(false);

    const initialized = useRef(false);
    const timerHandled = useRef(false);

    const deadlineKey = `interview_deadline_${interviewId}`;

    const getQuestionText = (data: any): string => {
        if (!data) return "";
        if (typeof data === "string") return data;

        return (
            data.question_text ||
            data.question ||
            data.text ||
            data.title ||
            ""
        );
    };

    const getAnswerText = (data: any): string => {
        if (!data) return "";
        if (typeof data === "string") return data;

        return data.answer || data.user_answer || "";
    };

    const getDurationInSeconds = (): number | null => {
        if (setup.duration === "No Limit") return null;

        if (setup.duration === "Custom") {
            return setup.custom_duration
                ? setup.custom_duration * 60
                : null;
        }

        const minutes = Number.parseInt(setup.duration, 10);

        return Number.isNaN(minutes) ? null : minutes * 60;
    };

    const finishEvaluation = useCallback(async () => {
        try {
            setSubmitting(true);
            setError("");

            await evaluateInterview(interviewId);
            await generateOverallResult(interviewId);

            await SecureStore.deleteItemAsync(deadlineKey);

            setFinished(true);

            Alert.alert(
                "Interview Completed",
                "Your interview evaluation is complete. You can check your report from Interview History.",
                [
                    {
                        text: "Go to Dashboard",
                        onPress: () => navigation.navigate("UserDashboard"),
                    },
                ]
            );
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to evaluate interview."
            );
        } finally {
            setSubmitting(false);
        }
    }, [deadlineKey, interviewId, navigation]);

    const loadInterview = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response: any = await resumeInterview(interviewId);

            if (response?.success === false) {
                throw new Error(
                    response.message || "Unable to resume interview."
                );
            }

            const status = response?.status;

            if (status === "evaluation_pending") {
                await finishEvaluation();
                return;
            }

            if (status === "completed") {
                await SecureStore.deleteItemAsync(deadlineKey);
                setFinished(true);

                Alert.alert(
                    "Interview Already Completed",
                    "This interview has already been completed.",
                    [
                        {
                            text: "Go to Dashboard",
                            onPress: () =>
                                navigation.navigate("UserDashboard"),
                        },
                    ]
                );
                return;
            }

            let questionData = response?.question;
            let questionNumber =
                Number(response?.current_question) || 1;

            let total =
                Number(response?.total_questions) ||
                setup.number_of_questions;

            if (status === "created") {
                const generated: any = await generateQuestions(interviewId);

                if (generated?.success === false) {
                    throw new Error(
                        generated.message || "Unable to generate questions."
                    );
                }
            }

            if (status === "created" || status === "ready") {
                const started: any = await startInterview(interviewId);

                if (started?.success === false) {
                    throw new Error(
                        started.message || "Unable to start interview."
                    );
                }

                questionData = started?.question || questionData;
                questionNumber =
                    Number(started?.current_question) || questionNumber;
                total =
                    Number(started?.total_questions) || total;
            }

            if (!questionData) {
                const current: any = await resumeInterview(interviewId);
                questionData = current?.question;
                questionNumber =
                    Number(current?.current_question) || questionNumber;
                total =
                    Number(current?.total_questions) || total;
            }

            setQuestion(getQuestionText(questionData));
            setAnswer(getAnswerText(questionData));
            setCurrentQuestion(questionNumber);
            setTotalQuestions(total);

            const durationSeconds = getDurationInSeconds();

            if (durationSeconds !== null) {
                const savedDeadline =
                    await SecureStore.getItemAsync(deadlineKey);

                let deadline: number;

                if (savedDeadline) {
                    deadline = Number(savedDeadline);
                } else {
                    deadline = Date.now() + durationSeconds * 1000;

                    await SecureStore.setItemAsync(
                        deadlineKey,
                        String(deadline)
                    );
                }

                setTimeLeft(
                    Math.max(
                        0,
                        Math.floor((deadline - Date.now()) / 1000)
                    )
                );
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load interview."
            );
        } finally {
            setLoading(false);
        }
    }, [
        deadlineKey,
        finishEvaluation,
        interviewId,
        navigation,
        setup.number_of_questions,
    ]);

    useEffect(() => {
        if (initialized.current) return;

        initialized.current = true;
        loadInterview();
    }, [loadInterview]);

    useEffect(() => {
        if (timeLeft === null || finished || loading || submitting) {
            return;
        }

        if (timeLeft <= 0) {
            if (!timerHandled.current) {
                timerHandled.current = true;

                const handleTimeout = async () => {
                    try {
                        setSubmitting(true);
                        await submitTimeout(interviewId);
                        await finishEvaluation();
                    } catch (err: any) {
                        setError(
                            err?.response?.data?.message ||
                            "Unable to submit timed-out interview."
                        );
                        setSubmitting(false);
                    }
                };

                handleTimeout();
            }

            return;
        }

        const timer = setTimeout(() => {
            setTimeLeft((previous) =>
                previous === null
                    ? null
                    : Math.max(0, previous - 1)
            );
        }, 1000);

        return () => clearTimeout(timer);
    }, [
        timeLeft,
        finished,
        loading,
        submitting,
        interviewId,
        finishEvaluation,
    ]);

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return "No Limit";

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const loadPreviousQuestion = async () => {
        if (currentQuestion <= 1 || submitting) return;

        try {
            setSubmitting(true);
            setError("");

            const response: any = await getInterviewQuestion(
                interviewId,
                currentQuestion - 1
            );

            const questionData =
                response?.question ||
                response?.data?.question ||
                response;

            setReturnQuestion(currentQuestion);
            setEditingQuestion(currentQuestion - 1);
            setQuestion(getQuestionText(questionData));
            setAnswer(getAnswerText(questionData));
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Unable to load previous question."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const saveEditedAnswer = async () => {
        if (editingQuestion === null || returnQuestion === null) {
            return;
        }

        if (!answer.trim()) {
            Alert.alert("Answer Required", "Please enter your answer.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await updateInterviewAnswer(
                interviewId,
                editingQuestion,
                answer.trim()
            );

            const response: any = await getInterviewQuestion(
                interviewId,
                returnQuestion
            );

            const questionData =
                response?.question ||
                response?.data?.question ||
                response;

            setQuestion(getQuestionText(questionData));
            setAnswer(getAnswerText(questionData));
            setCurrentQuestion(returnQuestion);

            setEditingQuestion(null);
            setReturnQuestion(null);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Unable to update your answer."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) {
            Alert.alert(
                "Answer Required",
                "Please enter your answer before continuing."
            );
            return;
        }

        if (submitting) return;

        try {
            setSubmitting(true);
            setError("");

            if (editingQuestion !== null) {
                await saveEditedAnswer();
                return;
            }

            const response: any = await submitAnswer(
                interviewId,
                answer.trim()
            );

            if (response?.success === false) {
                throw new Error(
                    response.message || "Unable to submit answer."
                );
            }

            if (response?.status === "evaluation_pending") {
                await finishEvaluation();
                return;
            }

            const nextQuestion =
                response?.next_question ||
                response?.question;

            if (nextQuestion) {
                setQuestion(getQuestionText(nextQuestion));
                setAnswer(getAnswerText(nextQuestion));
            }

            if (response?.next_question_number) {
                setCurrentQuestion(
                    Number(response.next_question_number)
                );
            }

            if (response?.total_questions) {
                setTotalQuestions(Number(response.total_questions));
            }

            if (!nextQuestion) {
                const current: any = await resumeInterview(interviewId);

                if (
                    current?.status === "evaluation_pending" ||
                    current?.status === "completed"
                ) {
                    await finishEvaluation();
                    return;
                }

                setQuestion(getQuestionText(current?.question));
                setAnswer(getAnswerText(current?.question));
                setCurrentQuestion(
                    Number(current?.current_question) || currentQuestion
                );
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to submit your answer."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const progress =
        totalQuestions > 0
            ? Math.min((currentQuestion / totalQuestions) * 100, 100)
            : 0;

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#6C63FF" />
                <Text style={styles.loadingText}>
                    Preparing your interview...
                </Text>
            </View>
        );
    }

    if (finished) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.finishedIcon}>🎉</Text>

                <Text style={styles.finishedTitle}>
                    Interview Completed!
                </Text>

                <Text style={styles.finishedText}>
                    Your interview evaluation has been completed.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate("UserDashboard")}
                >
                    <Text style={styles.primaryButtonText}>
                        Go to Dashboard
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    Interview Session
                </Text>

                <Text style={styles.headerSubtitle}>
                    {setup.target_role} • {setup.interview_type}
                </Text>

                <View style={styles.timerContainer}>
                    <Text style={styles.timerLabel}>
                        TIME REMAINING
                    </Text>

                    <Text
                        style={[
                            styles.timer,
                            timeLeft !== null && timeLeft <= 60
                                ? styles.timerWarning
                                : null,
                        ]}
                    >
                        {formatTime(timeLeft)}
                    </Text>
                </View>
            </View>

            <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressTitle}>
                        Question {currentQuestion} of {totalQuestions}
                    </Text>

                    <Text style={styles.progressPercent}>
                        {Math.round(progress)}%
                    </Text>
                </View>

                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progress}%` },
                        ]}
                    />
                </View>
            </View>

            {!!error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <View style={styles.questionCard}>
                <Text style={styles.sectionLabel}>
                    {editingQuestion !== null
                        ? `EDITING QUESTION ${editingQuestion}`
                        : "YOUR QUESTION"}
                </Text>

                <Text style={styles.questionText}>
                    {question || "Question not available."}
                </Text>

                <Text style={styles.answerLabel}>
                    Your Answer
                </Text>

                <TextInput
                    style={styles.answerInput}
                    multiline
                    textAlignVertical="top"
                    placeholder="Type your answer here..."
                    placeholderTextColor={isDark ? "#9290A5" : "#9CA3AF"}
                    value={answer}
                    onChangeText={setAnswer}
                    editable={!submitting}
                />

                <Text style={styles.characterCount}>
                    {answer.length} characters
                </Text>

                <Text style={styles.answerTip}>
                    Tip: Explain your answer clearly and include examples
                    wherever possible.
                </Text>
            </View>

            <View style={styles.buttonRow}>
                {editingQuestion !== null ? (
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        disabled={submitting}
                        onPress={() => {
                            setEditingQuestion(null);
                            setReturnQuestion(null);
                            loadInterview();
                        }}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Cancel Edit
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            currentQuestion <= 1 && styles.disabledButton,
                        ]}
                        disabled={currentQuestion <= 1 || submitting}
                        onPress={loadPreviousQuestion}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Previous
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        submitting && styles.disabledButton,
                    ]}
                    disabled={submitting || !question}
                    onPress={handleSubmitAnswer}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.primaryButtonText}>
                            {editingQuestion !== null
                                ? "Update Answer"
                                : currentQuestion >= totalQuestions
                                    ? "Finish Interview"
                                    : "Submit & Next"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                    Interview Information
                </Text>

                <InfoRow label="Field" value={setup.field} styles={styles} />
                <InfoRow
                    label="Target Role"
                    value={setup.target_role}
                    styles={styles}
                />
                <InfoRow
                    label="Interview Type"
                    value={setup.interview_type}
                    styles={styles}
                />
                <InfoRow
                    label="Difficulty"
                    value={setup.difficulty}
                    styles={styles}
                />
                <InfoRow
                    label="Experience"
                    value={setup.experience_level}
                    styles={styles}
                />
                <InfoRow
                    label="Total Questions"
                    value={String(totalQuestions)}
                    styles={styles}
                />
            </View>
        </ScrollView>
    );
};

const InfoRow = ({
    label,
    value,
    styles,
}: {
    label: string;
    value: string;
    styles: any;
}) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
);

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 18,
            paddingBottom: 40,
        },
        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            padding: 25,
        },
        loadingText: {
            marginTop: 14,
            color: colors.muted,
            fontSize: 15,
        },
        header: {
            backgroundColor: "#6C63FF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
        },
        headerTitle: {
            color: "#FFFFFF",
            fontSize: 23,
            fontWeight: "800",
        },
        headerSubtitle: {
            color: "#E7E5FF",
            fontSize: 14,
            marginTop: 7,
        },
        timerContainer: {
            marginTop: 20,
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 14,
            padding: 13,
            alignItems: "center",
        },
        timerLabel: {
            color: "#E7E5FF",
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1,
        },
        timer: {
            color: "#FFFFFF",
            fontSize: 29,
            fontWeight: "800",
            marginTop: 4,
        },
        timerWarning: {
            color: "#FFD166",
        },
        progressCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 17,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        progressHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 12,
        },
        progressTitle: {
            color: colors.text,
            fontWeight: "700",
            fontSize: 14,
        },
        progressPercent: {
            color: "#6C63FF",
            fontWeight: "800",
        },
        progressTrack: {
            height: 9,
            backgroundColor: isDark ? "#39364F" : "#E9EAF5",
            borderRadius: 10,
            overflow: "hidden",
        },
        progressFill: {
            height: 9,
            backgroundColor: "#6C63FF",
            borderRadius: 10,
        },
        errorBox: {
            backgroundColor: isDark ? "#3A222B" : "#FEECEC",
            borderColor: isDark ? "#75404D" : "#F5B8B8",
            borderWidth: 1,
            padding: 12,
            borderRadius: 12,
            marginBottom: 15,
        },
        errorText: {
            color: isDark ? "#FF9AAE" : "#B42318",
            fontSize: 13,
        },
        questionCard: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 18,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionLabel: {
            color: "#6C63FF",
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 1,
            marginBottom: 13,
        },
        questionText: {
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
            lineHeight: 27,
            marginBottom: 24,
        },
        answerLabel: {
            color: colors.text,
            fontSize: 15,
            fontWeight: "700",
            marginBottom: 10,
        },
        answerInput: {
            minHeight: 180,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 13,
            padding: 14,
            color: colors.text,
            fontSize: 15,
            backgroundColor: colors.input,
        },
        characterCount: {
            color: colors.muted,
            fontSize: 12,
            textAlign: "right",
            marginTop: 8,
        },
        answerTip: {
            color: colors.muted,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 10,
        },
        buttonRow: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 17,
        },
        primaryButton: {
            flex: 1,
            minHeight: 49,
            backgroundColor: "#6C63FF",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 12,
        },
        primaryButtonText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 14,
        },
        secondaryButton: {
            flex: 0.8,
            minHeight: 49,
            backgroundColor: isDark ? "#302D55" : "#E9E8FF",
            borderWidth: 1,
            borderColor: isDark ? "#514B80" : "#DAD7FF",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 10,
        },
        secondaryButtonText: {
            color: isDark ? "#C5B8FF" : "#5148D8",
            fontWeight: "700",
            fontSize: 13,
        },
        disabledButton: {
            opacity: 0.5,
        },
        infoCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 18,
            borderWidth: 1,
            borderColor: colors.border,
        },
        infoTitle: {
            color: colors.text,
            fontSize: 17,
            fontWeight: "800",
            marginBottom: 14,
        },
        infoRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
        },
        infoLabel: {
            color: colors.muted,
            fontSize: 13,
            flex: 1,
        },
        infoValue: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            flex: 1,
            textAlign: "right",
        },
        finishedIcon: {
            fontSize: 55,
            marginBottom: 15,
        },
        finishedTitle: {
            color: colors.text,
            fontSize: 23,
            fontWeight: "800",
            textAlign: "center",
        },
        finishedText: {
            color: colors.muted,
            fontSize: 14,
            textAlign: "center",
            marginTop: 10,
            marginBottom: 25,
        },
    });

export default InterviewSessionScreen;
