import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import {
    LineChart,
    BarChart,
    PieChart,
} from "react-native-chart-kit";
import { getInterviewHistory } from "../../services/interviewService";

// ==========================================
// TYPES
// ==========================================

interface Interview {
    _id?: string;
    id?: string;
    interview_id?: string;
    interview_code?: string;

    status?: string;
    overall_score?: number;
    score?: number;

    job_role?: string;
    target_role?: string;
    experience_level?: string;
    difficulty?: string;

    created_at?: string;
    completed_at?: string;

    overall_result?: any;
}

const screenWidth = Dimensions.get("window").width - 52;

// ==========================================
// MAIN COMPONENT
// ==========================================

const PerformanceChartScreen = () => {
    const { colors, theme } = useTheme();
    const navigation = useNavigation<any>();
    const isDark = theme === "Dark";
    const styles = createStyles(colors, isDark);
    const chartTheme = {
        backgroundColor: colors.card,
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: isDark ? "#273449" : "#F5F3FF",
        color: (opacity = 1) =>
            `rgba(${isDark ? "167, 139, 250" : "124, 58, 237"}, ${opacity})`,
        labelColor: (opacity = 1) =>
            isDark
                ? `rgba(229, 231, 235, ${opacity})`
                : `rgba(75, 85, 99, ${opacity})`,
        propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: "5,5",
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: colors.primary,
        },
    };
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [firstInterview, setFirstInterview] =
        useState<Interview | null>(null);

    const [secondInterview, setSecondInterview] =
        useState<Interview | null>(null);

    const [selectorVisible, setSelectorVisible] = useState(false);
    const [selectingFor, setSelectingFor] = useState<1 | 2>(1);

    // ==========================================
    // LOAD INTERVIEW HISTORY
    // ==========================================

    const loadPerformance = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await getInterviewHistory();

            let data: any[] = [];

            if (Array.isArray(response)) {
                data = response;
            } else if (Array.isArray(response?.interviews)) {
                data = response.interviews;
            } else if (Array.isArray(response?.data)) {
                data = response.data;
            }

            const completed = data.filter(
                (item: Interview) =>
                    item.status?.toLowerCase() === "completed"
            );

            const sorted = completed.sort(
                (a: Interview, b: Interview) =>
                    new Date(
                        b.completed_at || b.created_at || 0
                    ).getTime() -
                    new Date(
                        a.completed_at || a.created_at || 0
                    ).getTime()
            );

            setInterviews(sorted);

            // Initially, no interviews selected
            setFirstInterview(null);
            setSecondInterview(null);

        } catch (err: any) {

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to load performance data."
            );

        } finally {

            setLoading(false);
        }
    };

    useEffect(() => {
        loadPerformance();
    }, []);

    // ==========================================
    // SCORE HELPERS
    // ==========================================

    const getScore = (interview: Interview) => {

        const score = Number(
            interview.overall_score ?? interview.score ?? 0
        );

        return Math.max(0, Math.min(100, score));
    };

    const getInterviewLabel = (interview: Interview) => {

        return (
            interview.interview_code ||
            interview.interview_id ||
            interview._id ||
            interview.id ||
            "Interview"
        );
    };

    const getInterviewDate = (interview: Interview) => {

        const date =
            interview.completed_at ||
            interview.created_at;

        if (!date) return "Date unavailable";

        const parsed = new Date(date);

        if (isNaN(parsed.getTime())) {
            return "Date unavailable";
        }

        return parsed.toLocaleDateString();
    };

    const getRole = (interview: Interview) => {

        return (
            interview.job_role ||
            interview.target_role ||
            "Not specified"
        );
    };

    // ==========================================
    // PERFORMANCE SUMMARY
    // ==========================================

    const totalInterviews = interviews.length;

    const averageScore = totalInterviews > 0
        ? interviews.reduce(
            (total, item) => total + getScore(item),
            0
        ) / totalInterviews
        : 0;

    const highestScore = totalInterviews > 0
        ? Math.max(...interviews.map(getScore))
        : 0;

    const latestInterview = totalInterviews > 0
        ? interviews[totalInterviews - 1]
        : null;

    // ==========================================
    // SCORE DISTRIBUTION
    // ==========================================

    const scoreDistribution = useMemo(() => {

        return [
            {
                label: "0-40",
                count: interviews.filter(
                    item => getScore(item) <= 40
                ).length,
            },
            {
                label: "41-60",
                count: interviews.filter(
                    item => getScore(item) > 40 &&
                        getScore(item) <= 60
                ).length,
            },
            {
                label: "61-75",
                count: interviews.filter(
                    item => getScore(item) > 60 &&
                        getScore(item) <= 75
                ).length,
            },
            {
                label: "76-89",
                count: interviews.filter(
                    item => getScore(item) > 75 &&
                        getScore(item) < 90
                ).length,
            },
            {
                label: "90-100",
                count: interviews.filter(
                    item => getScore(item) >= 90
                ).length,
            },
        ];

    }, [interviews]);

    // ==========================================
    // RATING DISTRIBUTION
    // ==========================================

    const ratingDistribution = useMemo(() => {

        return [
            {
                name: "Excellent",
                population: interviews.filter(
                    item => getScore(item) >= 90
                ).length,
                color: "#22C55E",
                legendFontColor: isDark ? "#E5E7EB" : "#374151",
                legendFontSize: 12,
            },
            {
                name: "Very Good",
                population: interviews.filter(
                    item => getScore(item) >= 75 &&
                        getScore(item) < 90
                ).length,
                color: "#3B82F6",
                legendFontColor: isDark ? "#E5E7EB" : "#374151",
                legendFontSize: 12,
            },
            {
                name: "Good",
                population: interviews.filter(
                    item => getScore(item) >= 60 &&
                        getScore(item) < 75
                ).length,
                color: "#8B5CF6",
                legendFontColor: isDark ? "#E5E7EB" : "#374151",
                legendFontSize: 12,
            },
            {
                name: "Needs Improvement",
                population: interviews.filter(
                    item => getScore(item) >= 40 &&
                        getScore(item) < 60
                ).length,
                color: "#F59E0B",
                legendFontColor: isDark ? "#E5E7EB" : "#374151",
                legendFontSize: 12,
            },
            {
                name: "Poor",
                population: interviews.filter(
                    item => getScore(item) < 40
                ).length,
                color: "#EF4444",
                legendFontColor: isDark ? "#E5E7EB" : "#374151",
                legendFontSize: 12,
            },
        ].filter(item => item.population > 0);

    }, [interviews]);

    // ==========================================
    // LINE CHART DATA
    // ==========================================

    const lineChartData = {

        labels: interviews.map(
            (_, index) => `${index + 1}`
        ),

        datasets: [
            {
                data: interviews.map(getScore),
                strokeWidth: 3,
            },
        ],
    };

    // ==========================================
    // BAR CHART DATA
    // ==========================================

    const barChartData = {

        labels: scoreDistribution.map(
            item => item.label
        ),

        datasets: [
            {
                data: scoreDistribution.map(
                    item => item.count
                ),
            },
        ],
    };

    // ==========================================
    // OPEN INTERVIEW SELECTOR
    // ==========================================

    const openSelector = (which: 1 | 2) => {

        setSelectingFor(which);
        setSelectorVisible(true);
    };

    const selectInterview = (interview: Interview) => {

        if (selectingFor === 1) {

            if (
                secondInterview &&
                getInterviewLabel(secondInterview) ===
                getInterviewLabel(interview)
            ) {
                setSecondInterview(null);
            }

            setFirstInterview(interview);

        } else {

            if (
                firstInterview &&
                getInterviewLabel(firstInterview) ===
                getInterviewLabel(interview)
            ) {
                Alert.alert(
                    "Select Different Interviews",
                    "Please select two different interviews for comparison."
                );

                return;
            }

            setSecondInterview(interview);
        }

        setSelectorVisible(false);
    };

    // ==========================================
    // COMPARISON
    // ==========================================

    const scoreDifference =
        firstInterview && secondInterview
            ? getScore(secondInterview) -
            getScore(firstInterview)
            : 0;

    const comparisonVerdict = scoreDifference > 0
        ? "📈 Performance Improved"
        : scoreDifference < 0
            ? "📉 Performance Decreased"
            : "➡️ Performance Maintained";

    const getEvaluation = (interview: Interview) => {

        const result = interview.overall_result || {};

        return {
            strengths:
                result.strengths ||
                result.strong_points ||
                result.positive_points ||
                [],

            weaknesses:
                result.weaknesses ||
                result.areas_for_improvement ||
                result.improvement_areas ||
                [],
        };
    };

    const renderList = (items: any) => {

        if (!items) return ["No data available"];

        if (typeof items === "string") {
            return [items];
        }

        if (Array.isArray(items)) {
            return items.map((item: any) => {

                if (typeof item === "string") {
                    return item;
                }

                return (
                    item?.text ||
                    item?.description ||
                    item?.point ||
                    JSON.stringify(item)
                );
            });
        }

        return [String(items)];
    };

    // ==========================================
    // COMPARISON CARD
    // ==========================================

    const renderComparisonCard = (
        interview: Interview,
        label: string,
        color: string
    ) => {

        const evaluation = getEvaluation(interview);

        return (

            <View style={styles.comparisonCard}>

                <View
                    style={[
                        styles.comparisonHeader,
                        { backgroundColor: color },
                    ]}
                >

                    <Text style={styles.comparisonHeaderText}>
                        {label}
                    </Text>

                    <Text style={styles.comparisonScore}>
                        {getScore(interview)}%
                    </Text>

                </View>

                <View style={styles.comparisonBody}>

                    <Text style={styles.comparisonRole}>
                        💼 {getRole(interview)}
                    </Text>

                    <Text style={styles.comparisonDetail}>
                        🎯 Experience:{" "}
                        {interview.experience_level || "N/A"}
                    </Text>

                    <Text style={styles.comparisonDetail}>
                        ⚡ Difficulty:{" "}
                        {interview.difficulty || "N/A"}
                    </Text>

                    <Text style={styles.comparisonDetail}>
                        📅 {getInterviewDate(interview)}
                    </Text>

                    <View style={styles.evaluationSection}>

                        <Text style={styles.strengthTitle}>
                            💪 Strengths
                        </Text>

                        {renderList(evaluation.strengths).map(
                            (item, index) => (
                                <Text
                                    key={`s-${index}`}
                                    style={styles.evaluationText}
                                >
                                    • {item}
                                </Text>
                            )
                        )}

                    </View>

                    <View style={styles.evaluationSection}>

                        <Text style={styles.weaknessTitle}>
                            ⚠️ Areas to Improve
                        </Text>

                        {renderList(evaluation.weaknesses).map(
                            (item, index) => (
                                <Text
                                    key={`w-${index}`}
                                    style={styles.evaluationText}
                                >
                                    • {item}
                                </Text>
                            )
                        )}

                    </View>

                </View>

            </View>
        );
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <View
                style={[
                    styles.centerContainer,
                    { backgroundColor: colors.background },
                ]}
            >

                <ActivityIndicator
                    size="large"
                    color="#7C3AED"
                />

                <Text style={styles.loadingText}>
                    Loading Performance Data...
                </Text>

            </View>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error) {

        return (

            <View
                style={[
                    styles.centerContainer,
                    { backgroundColor: colors.background },
                ]}
            >

                <Text style={styles.errorIcon}>
                    ⚠️
                </Text>

                <Text style={styles.errorTitle}>
                    Unable to Load Performance
                </Text>

                <Text style={styles.errorText}>
                    {error}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadPerformance}
                >
                    <Text style={styles.retryButtonText}>
                        🔄 Retry
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() =>
                        navigation.navigate("InterviewHistory")
                    }
                >
                    <Text style={styles.backButtonText}>
                        ← Back to History
                    </Text>
                </TouchableOpacity>

            </View>
        );
    }

    // ==========================================
    // EMPTY STATE
    // ==========================================

    if (totalInterviews === 0) {

        return (

            <View
                style={[
                    styles.centerContainer,
                    { backgroundColor: colors.background },
                ]}
            >

                <Text style={styles.emptyIcon}>
                    📊
                </Text>

                <Text style={styles.emptyTitle}>
                    No Performance Data Yet
                </Text>

                <Text style={styles.emptyText}>
                    Complete your first interview to see your
                    performance analytics and progress.
                </Text>

                <TouchableOpacity
                    style={styles.startButton}
                    onPress={() =>
                        navigation.navigate("InterviewSetup")
                    }
                >
                    <Text style={styles.startButtonText}>
                        🚀 Start New Interview
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() =>
                        navigation.navigate("InterviewHistory")
                    }
                >
                    <Text style={styles.backButtonText}>
                        ← Back to History
                    </Text>
                </TouchableOpacity>

            </View>
        );
    }

    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
        >

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >

                {/* HEADER CONTAINER */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        📊 Performance Analytics
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Track your interview progress
                    </Text>

                    <TouchableOpacity
                        style={styles.headerBackButton}
                        onPress={() => navigation.navigate("InterviewHistory")}
                    >
                        <Text style={styles.headerBackText}>
                            ← Back to Interview History
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* SUMMARY CARDS */}

                <View style={styles.summaryGrid}>

                    <View style={styles.summaryCardPurple}>
                        <Text style={styles.summaryIcon}>
                            🎯
                        </Text>

                        <Text style={styles.summaryValue}>
                            {totalInterviews}
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Completed
                        </Text>
                    </View>

                    <View style={styles.summaryCardBlue}>
                        <Text style={styles.summaryIcon}>
                            📈
                        </Text>

                        <Text style={styles.summaryValue}>
                            {averageScore.toFixed(1)}%
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Average Score
                        </Text>
                    </View>

                    <View style={styles.summaryCardGreen}>
                        <Text style={styles.summaryIcon}>
                            🏆
                        </Text>

                        <Text style={styles.summaryValue}>
                            {highestScore}%
                        </Text>

                        <Text style={styles.summaryLabel}>
                            Highest Score
                        </Text>
                    </View>

                </View>

                {/* PERFORMANCE LINE CHART */}

                <View
                    style={[
                        styles.chartCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >

                    <Text style={styles.cardTitle}>
                        📈 Performance Progress
                    </Text>

                    <Text style={styles.cardSubtitle}>
                        Score trends across completed interviews
                    </Text>

                    <View style={styles.chartInfoRow}>
                        <View style={styles.chartInfoBadge}>
                            <Text style={styles.chartInfoText}>
                                📋 {interviews.length} Interviews
                            </Text>
                        </View>

                        <View style={styles.chartInfoBadge}>
                            <Text style={styles.chartInfoText}>
                                🎯 0–100%
                            </Text>
                        </View>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        nestedScrollEnabled
                    >
                        <LineChart
                            data={lineChartData}
                            width={Math.max(
                                screenWidth,
                                interviews.length * 48 + 70
                            )}
                            height={280}
                            yAxisSuffix="%"
                            fromZero
                            bezier
                            withDots
                            withShadow={false}
                            withInnerLines
                            withOuterLines
                            withVerticalLabels
                            withHorizontalLabels
                            segments={5}
                            formatYLabel={(value) => `${Math.round(Number(value))}`}
                            chartConfig={{
                                ...chartTheme,
                                decimalPlaces: 0,
                                propsForLabels: {
                                    fontSize: 11,
                                },
                                fillShadowGradient: isDark ? "#8B80FF" : "#8B5CF6",
                                fillShadowGradientOpacity: 0.12,
                            }}
                            style={styles.chartStyle}
                        />
                    </ScrollView>

                    <Text style={styles.chartFooterText}>
                        Swipe horizontally to view all interviews →
                    </Text>

                </View>

                {/* SCORE DISTRIBUTION */}

                <View style={styles.chartCard}>

                    <Text style={styles.cardTitle}>
                        📊 Score Distribution
                    </Text>

                    <Text style={styles.cardSubtitle}>
                        Number of interviews in each score range
                    </Text>

                    <BarChart
                        data={barChartData}
                        width={screenWidth}
                        height={250}
                        fromZero
                        showValuesOnTopOfBars
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            ...chartTheme,
                            decimalPlaces: 0,
                            barPercentage: 0.65,
                        }}
                        style={styles.chartStyle}
                    />

                </View>

                {/* RATING DISTRIBUTION */}

                <View style={styles.chartCard}>

                    <Text style={styles.cardTitle}>
                        🍩 Rating Distribution
                    </Text>

                    <Text style={styles.cardSubtitle}>
                        Performance rating breakdown
                    </Text>

                    {ratingDistribution.length > 0 ? (

                        <PieChart
                            data={ratingDistribution}
                            width={screenWidth}
                            height={230}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="10"
                            hasLegend
                            chartConfig={{
                                color: (opacity = 1) =>
                                    `rgba(124, 58, 237, ${opacity})`,
                            }}
                        />

                    ) : (

                        <Text style={styles.noChartData}>
                            No rating data available.
                        </Text>

                    )}

                    {/* RATING DETAILS */}

                    {ratingDistribution.map((item, index) => (

                        <View
                            key={index}
                            style={styles.ratingRow}
                        >

                            <View
                                style={[
                                    styles.ratingDot,
                                    { backgroundColor: item.color },
                                ]}
                            />

                            <Text style={styles.ratingName}>
                                {item.name}
                            </Text>

                            <Text style={styles.ratingCount}>
                                {item.population}
                            </Text>

                        </View>

                    ))}

                </View>

                {/* LATEST INTERVIEW */}

                {latestInterview && (

                    <View
                        style={[
                            styles.latestCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={styles.cardTitle}>
                            🕒 Latest Interview
                        </Text>

                        <View style={styles.latestScoreRow}>

                            <View>
                                <Text style={styles.latestRole}>
                                    {getRole(latestInterview)}
                                </Text>

                                <Text style={styles.latestDate}>
                                    {getInterviewDate(latestInterview)}
                                </Text>
                            </View>

                            <View style={styles.latestScoreBadge}>
                                <Text style={styles.latestScore}>
                                    {getScore(latestInterview)}%
                                </Text>
                            </View>

                        </View>

                        <TouchableOpacity
                            style={styles.latestDetailsButton}
                            onPress={() =>
                                navigation.navigate(
                                    "InterviewDetails",
                                    {
                                        interviewId:
                                            latestInterview.interview_id ||
                                            latestInterview._id ||
                                            latestInterview.id,
                                    }
                                )
                            }
                        >

                            <Text style={styles.latestDetailsButtonText}>
                                📄 View Interview Details
                            </Text>

                        </TouchableOpacity>

                    </View>

                )}

                {/* INTERVIEW COMPARISON */}

                <View
                    style={[
                        styles.comparisonSection,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >

                    <View style={styles.comparisonHeaderRow}>

                        <View style={styles.comparisonHeaderInfo}>
                            <Text style={styles.cardTitle}>
                                🔍 Interview Comparison
                            </Text>

                            <Text style={styles.cardSubtitle}>
                                Compare two interviews to identify progress
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.clearAllButton}
                            onPress={() => {
                                setFirstInterview(null);
                                setSecondInterview(null);
                            }}
                        >
                            <Text style={styles.clearAllButtonText}>
                                ✕ Clear
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* SELECT FIRST */}
                    <TouchableOpacity
                        style={styles.selectInterviewButton}
                        onPress={() => openSelector(1)}
                    >

                        <Text style={styles.selectLabel}>
                            First Interview
                        </Text>

                        <Text style={styles.selectValue}>
                            {firstInterview
                                ? `${getRole(firstInterview)} - ${getScore(firstInterview)}%`
                                : "Select Interview"}
                        </Text>

                        <Text style={styles.selectArrow}>
                            ▼
                        </Text>

                    </TouchableOpacity>

                    {/* SELECT SECOND */}
                    <TouchableOpacity
                        style={styles.selectInterviewButton}
                        onPress={() => openSelector(2)}
                    >

                        <Text style={styles.selectLabel}>
                            Second Interview
                        </Text>

                        <Text style={styles.selectValue}>
                            {secondInterview
                                ? `${getRole(secondInterview)} - ${getScore(secondInterview)}%`
                                : "Select Interview"}
                        </Text>

                        <Text style={styles.selectArrow}>
                            ▼
                        </Text>

                    </TouchableOpacity>

                    {/* COMPARISON RESULT */}

                    {firstInterview && secondInterview && (

                        <View style={styles.comparisonResult}>

                            <Text style={styles.verdictText}>
                                {comparisonVerdict}
                            </Text>

                            <Text
                                style={[
                                    styles.differenceText,
                                    {
                                        color: scoreDifference > 0
                                            ? "#16A34A"
                                            : scoreDifference < 0
                                                ? "#DC2626"
                                                : "#6B7280",
                                    },
                                ]}
                            >

                                {scoreDifference > 0
                                    ? `+${scoreDifference}%`
                                    : `${scoreDifference}%`}
                            </Text>

                            <Text style={styles.differenceDescription}>
                                Score difference between selected interviews
                            </Text>

                            <View style={styles.comparisonCards}>

                                {renderComparisonCard(
                                    firstInterview,
                                    "Interview 1",
                                    "#8B5CF6"
                                )}

                                {renderComparisonCard(
                                    secondInterview,
                                    "Interview 2",
                                    "#3B82F6"
                                )}

                            </View>

                        </View>

                    )}

                    {!secondInterview && (

                        <View style={styles.compareHint}>

                            <Text style={styles.compareHintText}>
                                Select another completed interview to
                                compare your scores, strengths and
                                improvement areas.
                            </Text>

                        </View>

                    )}

                </View>
            </ScrollView>

            {/* INTERVIEW SELECTOR MODAL */}

            <Modal
                visible={selectorVisible}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    setSelectorVisible(false)
                }
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <Text style={styles.modalTitle}>
                            Select Interview {selectingFor}
                        </Text>

                        <Text style={styles.modalSubtitle}>
                            Choose an interview to compare
                        </Text>

                        <ScrollView
                            style={styles.modalScroll}
                        >

                            {interviews.map((interview, index) => {

                                const selected =
                                    selectingFor === 1
                                        ? firstInterview &&
                                        getInterviewLabel(firstInterview) ===
                                        getInterviewLabel(interview)
                                        : secondInterview &&
                                        getInterviewLabel(secondInterview) ===
                                        getInterviewLabel(interview);

                                return (

                                    <TouchableOpacity
                                        key={
                                            getInterviewLabel(interview) ||
                                            index.toString()
                                        }
                                        style={[
                                            styles.modalInterviewItem,
                                            selected && styles.modalSelectedItem,
                                        ]}
                                        onPress={() =>
                                            selectInterview(interview)
                                        }
                                    >

                                        <View style={styles.modalInterviewInfo}>

                                            <Text style={styles.modalInterviewRole}>
                                                {getRole(interview)}
                                            </Text>

                                            <Text style={styles.modalInterviewDate}>
                                                {getInterviewDate(interview)}
                                            </Text>

                                            <Text style={styles.modalInterviewCode}>
                                                {getInterviewLabel(interview)}
                                            </Text>

                                        </View>

                                        <Text style={styles.modalInterviewScore}>
                                            {getScore(interview)}%
                                        </Text>

                                    </TouchableOpacity>
                                );
                            })}

                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() =>
                                setSelectorVisible(false)
                            }
                        >

                            <Text style={styles.modalCloseText}>
                                Close
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>

        </View>
    );
};

export default PerformanceChartScreen;

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({

        // MAIN CONTAINER
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        scrollContent: {
            padding: 16,
            paddingBottom: 35,
            paddingTop: 32,
        },

        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            padding: 25,
        },

        header: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
            elevation: 2,
        },

        headerTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 23,
            fontWeight: "900",
        },

        headerSubtitle: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            marginTop: 7,
        },

        headerBackButton: {
            backgroundColor: isDark ? "#263B5A" : "#EAF3FF",
            borderRadius: 11,
            padding: 13,
            alignItems: "center",
            marginTop: 16,
        },

        headerBackText: {
            color: isDark ? "#93C5FD" : "#2878D0",
            fontSize: 13,
            fontWeight: "800",
            textAlign: "center",
        },

        // SUMMARY
        summaryGrid: {
            flexDirection: "row",
            gap: 10,
            marginBottom: 18,
        },

        summaryCardPurple: {
            flex: 1,
            backgroundColor: isDark ? "#302653" : "#EDE9FE",
            borderRadius: 16,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#514078" : "#DDD6FE",
        },

        summaryCardBlue: {
            flex: 1,
            backgroundColor: isDark ? "#1E3552" : "#DBEAFE",
            borderRadius: 16,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#34577D" : "#BFDBFE",
        },

        summaryCardGreen: {
            flex: 1,
            backgroundColor: isDark ? "#1D3D35" : "#DCFCE7",
            borderRadius: 16,
            padding: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? "#315E4D" : "#BBF7D0",
        },

        summaryIcon: {
            fontSize: 23,
            marginBottom: 5,
        },

        summaryValue: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.text,
        },

        summaryLabel: {
            fontSize: 11,
            fontWeight: "600",
            color: colors.muted,
            marginTop: 4,
            textAlign: "center",
        },

        // CHART CARDS
        chartCard: {
            backgroundColor: colors.card,
            borderRadius: 18,
            paddingVertical: 18,
            paddingHorizontal: 10,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: isDark ? 0 : 2,
        },

        cardTitle: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 6,
            paddingHorizontal: 6,
        },

        cardSubtitle: {
            fontSize: 12,
            color: colors.muted,
            marginBottom: 12,
            paddingHorizontal: 6,
        },

        chartInfoRow: {
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
            paddingHorizontal: 6,
        },

        chartInfoBadge: {
            backgroundColor: isDark ? "#302653" : "#EDE9FE",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 20,
        },

        chartInfoText: {
            color: isDark ? "#C4B5FD" : "#6D28D9",
            fontSize: 11,
            fontWeight: "700",
        },

        chartFooterText: {
            textAlign: "center",
            fontSize: 11,
            color: isDark ? "#B4A0FF" : "#8B5CF6",
            marginTop: 8,
        },

        chartStyle: {
            borderRadius: 12,
            marginLeft: -5,
        },

        noChartData: {
            textAlign: "center",
            padding: 25,
            color: colors.muted,
        },

        // RATING DISTRIBUTION
        ratingRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
        },

        ratingDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
            marginRight: 10,
        },

        ratingName: {
            flex: 1,
            fontSize: 13,
            color: colors.text,
        },

        ratingCount: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },

        // LATEST INTERVIEW
        latestCard: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 16,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: isDark ? 0 : 2,
        },

        latestScoreRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
            marginBottom: 16,
        },

        latestRole: {
            fontSize: 17,
            fontWeight: "700",
            color: colors.text,
        },

        latestDate: {
            fontSize: 13,
            color: colors.muted,
            marginTop: 5,
        },

        latestScoreBadge: {
            backgroundColor: isDark ? "#1D3D35" : "#DCFCE7",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 14,
        },

        latestScore: {
            fontSize: 22,
            fontWeight: "800",
            color: isDark ? "#86EFAC" : "#15803D",
        },

        latestDetailsButton: {
            backgroundColor: isDark ? "#263452" : "#EEF2FF",
            padding: 12,
            borderRadius: 12,
            alignItems: "center",
        },

        latestDetailsButtonText: {
            color: isDark ? "#A5B4FC" : "#4F46E5",
            fontWeight: "700",
        },

        // COMPARISON SECTION
        comparisonSection: {
            backgroundColor: colors.card,
            borderRadius: 18,
            padding: 14,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: isDark ? 0 : 2,
        },

        comparisonHeaderRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 10,
        },

        comparisonHeaderInfo: {
            flex: 1,
            paddingRight: 8,
        },

        clearAllButton: {
            backgroundColor: isDark ? "#492A32" : "#FEE2E2",
            borderWidth: 1,
            borderColor: isDark ? "#713B47" : "#FECACA",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9,
            marginTop: 2,
        },

        clearAllButtonText: {
            color: isDark ? "#FCA5A5" : "#DC2626",
            fontSize: 12,
            fontWeight: "800",
        },

        selectInterviewButton: {
            backgroundColor: isDark ? "#25213B" : "#F5F3FF",
            borderWidth: 1,
            borderColor: isDark ? "#514078" : "#DDD6FE",
            borderRadius: 12,
            padding: 13,
            marginTop: 12,
        },

        selectLabel: {
            fontSize: 12,
            color: isDark ? "#C4B5FD" : "#7C3AED",
            fontWeight: "700",
        },

        selectValue: {
            fontSize: 14,
            color: colors.text,
            fontWeight: "600",
            marginTop: 6,
            paddingRight: 25,
        },

        selectArrow: {
            position: "absolute",
            right: 14,
            top: 24,
            color: isDark ? "#C4B5FD" : "#7C3AED",
        },

        clearSelectionButton: {
            alignSelf: "flex-end",
            backgroundColor: isDark ? "#492A32" : "#FEE2E2",
            borderWidth: 1,
            borderColor: isDark ? "#713B47" : "#FECACA",
            paddingVertical: 7,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginTop: 6,
            marginBottom: 8,
        },

        clearSelectionText: {
            color: isDark ? "#FCA5A5" : "#DC2626",
            fontSize: 12,
            fontWeight: "700",
        },

        comparisonResult: {
            marginTop: 18,
        },

        verdictText: {
            textAlign: "center",
            fontSize: 18,
            fontWeight: "800",
            color: isDark ? "#A5B4FC" : "#4F46E5",
        },

        differenceText: {
            textAlign: "center",
            fontSize: 30,
            fontWeight: "900",
            marginTop: 8,
        },

        differenceDescription: {
            textAlign: "center",
            fontSize: 12,
            color: colors.muted,
            marginBottom: 16,
        },

        comparisonCards: {
            gap: 14,
        },

        // COMPARISON CARDS
        comparisonCard: {
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
        },

        comparisonHeader: {
            padding: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
        },

        comparisonHeaderText: {
            fontSize: 16,
            fontWeight: "800",
            color: "#FFFFFF",
        },

        comparisonScore: {
            fontSize: 24,
            fontWeight: "900",
            color: "#FFFFFF",
        },

        comparisonBody: {
            padding: 14,
            backgroundColor: colors.card,
        },

        comparisonRole: {
            fontSize: 16,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 10,
        },

        comparisonDetail: {
            fontSize: 13,
            color: colors.muted,
            marginBottom: 6,
        },

        evaluationSection: {
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            backgroundColor: isDark ? "#252D3C" : "#F9FAFB",
        },

        strengthTitle: {
            fontSize: 14,
            fontWeight: "800",
            color: isDark ? "#86EFAC" : "#15803D",
            marginBottom: 8,
        },

        weaknessTitle: {
            fontSize: 14,
            fontWeight: "800",
            color: isDark ? "#FCD34D" : "#D97706",
            marginBottom: 8,
        },

        evaluationText: {
            fontSize: 13,
            lineHeight: 20,
            color: colors.text,
            marginBottom: 4,
        },

        compareHint: {
            backgroundColor: isDark ? "#1E3552" : "#EFF6FF",
            borderRadius: 12,
            padding: 12,
            marginTop: 14,
        },

        compareHintText: {
            color: isDark ? "#BFDBFE" : "#1D4ED8",
            fontSize: 13,
            lineHeight: 19,
        },

        // ACTION BUTTONS
        startButton: {
            backgroundColor: colors.primary,
            borderRadius: 14,
            padding: 15,
            alignItems: "center",
            marginBottom: 12,
        },

        startButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "800",
        },

        retryButton: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 14,
            alignItems: "center",
            marginBottom: 12,
        },

        retryButtonText: {
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "800",
        },

        backButton: {
            backgroundColor: isDark ? "#263A55" : "#DBEAFE",
            borderRadius: 14,
            padding: 14,
            alignItems: "center",
            marginBottom: 12,
        },

        backButtonText: {
            color: isDark ? "#BFDBFE" : "#1D4ED8",
            fontSize: 14,
            fontWeight: "700",
        },

        // LOADING / ERROR / EMPTY
        loadingText: {
            color: colors.muted,
            fontSize: 14,
            marginTop: 15,
        },

        errorIcon: {
            fontSize: 42,
            marginBottom: 12,
        },

        errorTitle: {
            fontSize: 20,
            fontWeight: "800",
            color: isDark ? "#FCA5A5" : "#DC2626",
            textAlign: "center",
        },

        errorText: {
            color: colors.muted,
            fontSize: 14,
            textAlign: "center",
            marginTop: 12,
            marginBottom: 20,
            lineHeight: 21,
        },

        emptyIcon: {
            fontSize: 48,
            marginBottom: 15,
        },

        emptyTitle: {
            fontSize: 22,
            fontWeight: "800",
            color: colors.primary,
            textAlign: "center",
        },

        emptyText: {
            color: colors.muted,
            fontSize: 14,
            lineHeight: 21,
            textAlign: "center",
            marginTop: 12,
            marginBottom: 22,
        },

        // MODAL
        modalOverlay: {
            flex: 1,
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            padding: 20,
        },

        modalContainer: {
            backgroundColor: colors.card,
            borderRadius: 22,
            padding: 18,
            maxHeight: "85%",
            borderWidth: 1,
            borderColor: colors.border,
        },

        modalTitle: {
            fontSize: 20,
            fontWeight: "800",
            color: colors.primary,
        },

        modalSubtitle: {
            fontSize: 13,
            color: colors.muted,
            marginTop: 5,
            marginBottom: 12,
        },

        modalScroll: {
            maxHeight: 400,
        },

        modalInterviewItem: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 13,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            marginBottom: 10,
            backgroundColor: isDark ? "#252D3C" : "#FFFFFF",
        },

        modalSelectedItem: {
            borderColor: colors.primary,
            backgroundColor: isDark ? "#302653" : "#F5F3FF",
        },

        modalInterviewInfo: {
            flex: 1,
            paddingRight: 10,
        },

        modalInterviewRole: {
            fontSize: 14,
            fontWeight: "700",
            color: colors.text,
        },

        modalInterviewDate: {
            fontSize: 12,
            color: colors.muted,
            marginTop: 4,
        },

        modalInterviewCode: {
            fontSize: 11,
            color: colors.muted,
            marginTop: 3,
        },

        modalInterviewScore: {
            fontSize: 18,
            fontWeight: "800",
            color: colors.primary,
        },

        modalCloseButton: {
            backgroundColor: colors.primary,
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 12,
        },

        modalCloseText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 15,
        },
    });
