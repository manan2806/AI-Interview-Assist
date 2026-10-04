import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

import { getInterviewHistory } from "../services/interviewService";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function PerformanceChart() {
    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [comparisonInterview1, setComparisonInterview1] = useState("");
    const [comparisonInterview2, setComparisonInterview2] = useState("");

    // ==========================================
    // LOAD INTERVIEW HISTORY
    // ==========================================
    useEffect(() => {
        const loadPerformanceData = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getInterviewHistory();

                console.log(
                    "Performance Chart Data:",
                    data
                );

                if (!data?.success) {
                    setError(
                        data?.message ||
                        "Unable to load performance data."
                    );
                    return;
                }

                const completedInterviews =
                    Array.isArray(data.interviews)
                        ? data.interviews.filter(
                            (interview) =>
                                interview.status ===
                                "completed"
                        )
                        : [];

                setInterviews(completedInterviews);
            } catch (err) {
                console.error(
                    "Performance Chart Error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load performance data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadPerformanceData();
    }, []);

    // ==========================================
    // CHART DATA
    // ==========================================
    const chartInterviews = [...interviews].sort(
        (a, b) =>
            new Date(a.created_at || 0) -
            new Date(b.created_at || 0)
    );

    // ==========================================
    // INTERVIEW COMPARISON
    // ==========================================
    const selectedInterview1 = chartInterviews.find(
        (interview) =>
            String(
                interview.interview_code ||
                interview._id ||
                interview.id
            ) === String(comparisonInterview1)
    );

    const selectedInterview2 = chartInterviews.find(
        (interview) =>
            String(
                interview.interview_code ||
                interview._id ||
                interview.id
            ) === String(comparisonInterview2)
    );

    // console.log("Comparison Interview 1:", selectedInterview1);
    // console.log("Comparison Interview 2:", selectedInterview2);
    // console.log("Selected Interview 1 ID:", comparisonInterview1);
    // console.log("Selected Interview 2 ID:", comparisonInterview2);

    const chartData = {
        labels: chartInterviews.map(
            (_, index) => `Interview ${index + 1}`
        ),

        datasets: [
            {
                label: "Overall Score",
                data: chartInterviews.map(
                    (interview) =>
                        Number(interview.overall_score || 0)
                ),
                borderColor: "#6c63ff",
                backgroundColor: "rgba(108, 99, 255, 0.12)",
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBorderWidth: 3,
                pointBackgroundColor: "#ffffff",
                pointBorderColor: "#6c63ff",
                pointHoverBackgroundColor: "#6c63ff",
                pointHoverBorderColor: "#ffffff"
            }
        ]
    };

    const scoreDistribution = {
        labels: [
            "0–40",
            "40–60",
            "60–75",
            "75–90",
            "90–100"
        ],

        datasets: [
            {
                label: "Interviews",
                data: [
                    chartInterviews.filter(
                        (interview) =>
                            Number(interview.overall_score || 0) <= 40
                    ).length,

                    chartInterviews.filter(
                        (interview) => {
                            const score = Number(interview.overall_score || 0);
                            return score > 40 && score <= 60;
                        }
                    ).length,

                    chartInterviews.filter(
                        (interview) => {
                            const score = Number(interview.overall_score || 0);
                            return score > 60 && score <= 75;
                        }
                    ).length,

                    chartInterviews.filter(
                        (interview) => {
                            const score = Number(interview.overall_score || 0);
                            return score > 75 && score <= 90;
                        }
                    ).length,

                    chartInterviews.filter(
                        (interview) => {
                            const score = Number(interview.overall_score || 0);
                            return score > 90 && score <= 100;
                        }
                    ).length
                ],
                borderRadius: 8,
                borderSkipped: false
            }
        ]
    };

    const scoreDistributionOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: "easeOutQuart" },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0,
                    color: "#6b7280",
                    font: { size: 12 }
                },
                grid: { color: "rgba(107, 114, 128, 0.12)" },
                border: { display: false },
                title: {
                    display: true,
                    text: "Number of Interviews",
                    color: "#4b5563",
                    font: { size: 13, weight: "600" }
                }
            },

            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: "#6b7280",
                    font: { size: 12 }
                },
                title: {
                    display: true,
                    text: "Score Range",
                    color: "#4b5563",
                    font: { size: 13, weight: "600" }
                }
            }
        },

        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#1f2937",
                titleColor: "#ffffff",
                bodyColor: "#e5e7eb",
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: (context) =>
                        `${context.parsed.y} interview${context.parsed.y === 1 ? "" : "s"}`
                }
            }
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        animation: { duration: 1000, easing: "easeOutQuart" },
        scales: {
            y: {
                min: 0,
                max: 100,
                beginAtZero: true,
                grid: { color: "rgba(107, 114, 128, 0.12)", drawBorder: false },
                border: { display: false },
                ticks: {
                    stepSize: 10,
                    color: "#6b7280",
                    font: { size: 12 },
                    callback: (value) =>
                        `${value}%`
                },

                title: {
                    display: true,
                    text: "Score (%)",
                    color: "#4b5563",
                    font: { size: 13, weight: "600" }
                }
            },

            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    color: "#6b7280",
                    font: { size: 12 }
                },
                title: {
                    display: true,
                    text: "Interviews",
                    color: "#4b5563",
                    font: { size: 13, weight: "600" }
                }
            }
        },

        plugins: {
            legend: {
                display: true,
                position: "top",
                align: "end",
                labels: {
                    usePointStyle: true,
                    pointStyle: "circle",
                    padding: 18,
                    color: "#374151",
                    font: { size: 13, weight: "600" }
                }
            },

            tooltip: {
                backgroundColor: "#1f2937",
                titleColor: "#ffffff",
                bodyColor: "#e5e7eb",
                borderColor: "rgba(255, 255, 255, 0.1)",
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                titleFont: { size: 13, weight: "700" },
                bodyFont: { size: 13, weight: "500" },
                callbacks: {
                    title: (tooltipItems) => {
                        const index = tooltipItems[0].dataIndex;
                        const interview = chartInterviews[index];
                        return (interview?.interview_code || `Interview ${index + 1}`);
                    },

                    label: (context) => `Score: ${context.parsed.y}%`,

                    afterLabel: (context) => {
                        const interview =
                            chartInterviews[context.dataIndex];
                        const details = [];
                        if (interview?.job_role) {
                            details.push(`Role: ${interview.job_role}`);
                        }

                        if (interview?.created_at) {
                            details.push(`Date: ${new Date(interview.created_at).toLocaleDateString()}`
                            );
                        }
                        return details;
                    }
                }
            }
        }
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <div className="history-page">
                <div className="history-container">
                    <div className="history-loading-card">
                        <div className="history-loading-spinner">
                            <span>📊</span>
                        </div>

                        <h2>
                            Loading Performance...
                        </h2>

                        <p>
                            Please wait while we prepare
                            your performance data.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================
    if (error) {
        return (
            <div className="history-page">
                <div className="history-container">
                    <div className="history-error-card">
                        <div className="history-error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Unable to Load Performance
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            className="result-back-btn"
                            onClick={() =>
                                navigate("/interview/history")
                            }
                        >
                            Back to Interview History
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // PAGE
    // ==========================================
    return (
        <div className="history-page">
            <div className="history-container">

                {/* ======================================
                    HEADER
                ====================================== */}
                <div className="history-header">
                    <div>
                        <p className="history-label">
                            Your Progress
                        </p>

                        <h1>
                            Performance Chart
                        </h1>

                        <p>
                            Track your interview performance
                            and progress over time.
                        </p>
                    </div>

                    <div className="history-header-actions">
                        <button
                            className="result-back-btn"
                            onClick={() =>
                                navigate("/interview/history")
                            }
                        >
                            Interview History
                        </button>
                    </div>
                </div>

                {/* ======================================
                    PERFORMANCE SUMMARY
                ====================================== */}
                <div className="history-summary">
                    <div className="history-summary-card">
                        <div className="history-summary-icon">
                            🎯
                        </div>

                        <div>
                            <span>
                                Completed Interviews
                            </span>

                            <strong>
                                {interviews.length}
                            </strong>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <div className="history-summary-icon">
                            📊
                        </div>

                        <div>
                            <span>
                                Average Score
                            </span>

                            <strong>
                                {
                                    interviews.length > 0
                                        ? (
                                            interviews.reduce(
                                                (
                                                    total,
                                                    interview
                                                ) =>
                                                    total +
                                                    Number(
                                                        interview.overall_score ||
                                                        0
                                                    ),
                                                0
                                            ) /
                                            interviews.length
                                        ).toFixed(1)
                                        : "0.0"
                                }
                                %
                            </strong>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <div className="history-summary-icon">
                            🏆
                        </div>

                        <div>
                            <span>
                                Highest Score
                            </span>

                            <strong>
                                {
                                    interviews.length > 0
                                        ? Math.max(
                                            ...interviews.map(
                                                (interview) =>
                                                    Number(
                                                        interview.overall_score ||
                                                        0
                                                    )
                                            )
                                        )
                                        : 0
                                }
                                %
                            </strong>
                        </div>
                    </div>
                </div>

                {/* ======================================
                    CHART PLACEHOLDER
                ====================================== */}
                {
                    interviews.length === 0 ? (
                        <div className="result-card">
                            <div className="history-empty">
                                <div className="history-empty-icon">
                                    📊
                                </div>

                                <h2>
                                    No Performance Data
                                </h2>

                                <p>
                                    Complete an interview to see
                                    your performance chart.
                                </p>

                                <button
                                    type="button"
                                    className="history-start-button"
                                    onClick={() =>
                                        navigate("/interview/setup")
                                    }
                                >
                                    Start New Interview →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* PERFORMANCE PROGRESS CARD */}
                            <div className="performance-chart-container">

                                {/* Chart Header */}
                                <div className="performance-chart-header">
                                    <div>
                                        <h3>
                                            Performance Progress
                                        </h3>

                                        <p>
                                            Your overall interview scores
                                            over time.
                                        </p>
                                    </div>

                                    <div className="performance-chart-header-stats">
                                        <span className="performance-chart-scale">
                                            0–100%
                                        </span>
                                    </div>
                                </div>

                                {/* Chart */}
                                <div className="performance-chart-wrapper">
                                    <Line
                                        data={chartData}
                                        options={chartOptions}
                                    />
                                </div>

                                {/* Latest Interview Details */}
                                <div className="performance-latest-interview">

                                    <div className="performance-latest-info">
                                        <span className="performance-latest-label">
                                            Latest Interview
                                        </span>

                                        <strong>
                                            Interview {chartInterviews.length}
                                        </strong>
                                    </div>

                                    <div className="performance-latest-info">
                                        <span className="performance-latest-label">
                                            Role
                                        </span>

                                        <strong>
                                            {
                                                chartInterviews[
                                                    chartInterviews.length - 1
                                                ]?.job_role || "N/A"
                                            }
                                        </strong>
                                    </div>

                                    <div className="performance-latest-info">
                                        <span className="performance-latest-label">
                                            Score
                                        </span>

                                        <strong>
                                            {Number(
                                                chartInterviews[
                                                    chartInterviews.length - 1
                                                ]?.overall_score || 0
                                            ).toFixed(1)}
                                            %
                                        </strong>
                                    </div>

                                    <div className="performance-latest-info">
                                        <span className="performance-latest-label">
                                            Date
                                        </span>

                                        <strong>
                                            {
                                                chartInterviews[
                                                    chartInterviews.length - 1
                                                ]?.created_at
                                                    ? new Date(
                                                        chartInterviews[
                                                            chartInterviews.length - 1
                                                        ].created_at
                                                    ).toLocaleDateString()
                                                    : "N/A"
                                            }
                                        </strong>
                                    </div>

                                </div>

                            </div>


                            {/* SCORE DISTRIBUTION - SEPARATE CARD */}
                            <div className="score-distribution-container">

                                <div className="score-distribution-header">
                                    <div>
                                        <h3>
                                            Score Distribution
                                        </h3>

                                        <p>
                                            Number of interviews completed
                                            within each score range.
                                        </p>
                                    </div>
                                </div>

                                <div className="score-distribution-wrapper">
                                    <Bar
                                        data={scoreDistribution}
                                        options={scoreDistributionOptions}
                                    />
                                </div>

                            </div>

                            {/* ======================================
                                INTERVIEW COMPARISON
                            ====================================== */}
                            <div className="interview-comparison-container">
                                <div className="interview-comparison-header">
                                    <div>
                                        <h3>Interview Comparison</h3>
                                        <p>Compare the performance of two completed interviews.</p>
                                    </div>

                                    {(comparisonInterview1 || comparisonInterview2) && (
                                        <div className="interview-comparison-clear-wrapper">
                                            {(comparisonInterview1 || comparisonInterview2) && (
                                                <button
                                                    type="button"
                                                    className="interview-comparison-clear-button"
                                                    onClick={() => {
                                                        setComparisonInterview1("");
                                                        setComparisonInterview2("");
                                                    }}
                                                >
                                                    ✕ Clear
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="interview-comparison-selectors">
                                    <div className="interview-comparison-select-group">
                                        <label>First Interview</label>

                                        <select
                                            value={comparisonInterview1}
                                            onChange={(e) => {
                                                setComparisonInterview1(e.target.value);
                                                console.log(
                                                    "First Interview Selected:",
                                                    e.target.value
                                                );
                                            }}
                                        >
                                            <option value="">Select interview</option>

                                            {chartInterviews.map((interview, index) => {
                                                const interviewValue =
                                                    interview.interview_code ||
                                                    interview._id ||
                                                    interview.id ||
                                                    String(index);

                                                return (
                                                    <option
                                                        key={interviewValue}
                                                        value={String(interviewValue)}
                                                    >
                                                        Interview {index + 1}
                                                        {interview.interview_code
                                                            ? ` — ${interview.interview_code}`
                                                            : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <div className="interview-comparison-vs">
                                        VS
                                    </div>

                                    <div className="interview-comparison-select-group">
                                        <label>Second Interview</label>

                                        <select
                                            value={comparisonInterview2}
                                            onChange={(e) => {
                                                setComparisonInterview2(e.target.value);
                                                console.log(
                                                    "Second Interview Selected:",
                                                    e.target.value
                                                );
                                            }}
                                        >
                                            <option value="">Select interview</option>

                                            {chartInterviews.map((interview, index) => {
                                                const interviewValue =
                                                    interview.interview_code ||
                                                    interview._id ||
                                                    interview.id ||
                                                    String(index);

                                                return (
                                                    <option
                                                        key={interviewValue}
                                                        value={String(interviewValue)}
                                                    >
                                                        Interview {index + 1}
                                                        {interview.interview_code
                                                            ? ` — ${interview.interview_code}`
                                                            : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {selectedInterview1 && selectedInterview2 ? (
                                    <div className="interview-comparison-result">
                                        <div className="interview-comparison-card">
                                            <span className="interview-comparison-card-label">
                                                Interview 1
                                            </span>

                                            <h4>
                                                {selectedInterview1.interview_code ||
                                                    "Interview 1"}
                                            </h4>

                                            <div className="interview-comparison-score">
                                                {Number(
                                                    selectedInterview1.overall_score || 0
                                                ).toFixed(1)}
                                                %
                                            </div>

                                            <div className="interview-comparison-details">
                                                <div>
                                                    <span>Role</span>
                                                    <strong>
                                                        {selectedInterview1.job_role || "N/A"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Experience</span>
                                                    <strong>
                                                        {selectedInterview1.experience_level ||
                                                            "N/A"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Date</span>
                                                    <strong>
                                                        {selectedInterview1.created_at
                                                            ? new Date(
                                                                selectedInterview1.created_at
                                                            ).toLocaleDateString()
                                                            : "N/A"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="interview-comparison-middle">
                                            <span>VS</span>

                                            {(() => {
                                                const score1 = Number(selectedInterview1.overall_score || 0);
                                                const score2 = Number(selectedInterview2.overall_score || 0);
                                                const difference = score2 - score1;

                                                return (
                                                    <strong
                                                        className={
                                                            difference > 0
                                                                ? "comparison-positive"
                                                                : difference < 0
                                                                    ? "comparison-negative"
                                                                    : "comparison-neutral"
                                                        }
                                                    >
                                                        {difference > 0 ? "+" : ""}
                                                        {difference.toFixed(1)}%
                                                    </strong>
                                                );
                                            })()}
                                        </div>

                                        <div className="interview-comparison-card">
                                            <span className="interview-comparison-card-label">
                                                Interview 2
                                            </span>

                                            <h4>
                                                {selectedInterview2.interview_code ||
                                                    "Interview 2"}
                                            </h4>

                                            <div className="interview-comparison-score">
                                                {Number(
                                                    selectedInterview2.overall_score || 0
                                                ).toFixed(1)}
                                                %
                                            </div>

                                            <div className="interview-comparison-details">
                                                <div>
                                                    <span>Role</span>
                                                    <strong>
                                                        {selectedInterview2.job_role || "N/A"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Experience</span>
                                                    <strong>
                                                        {selectedInterview2.experience_level ||
                                                            "N/A"}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>Date</span>
                                                    <strong>
                                                        {selectedInterview2.created_at
                                                            ? new Date(
                                                                selectedInterview2.created_at
                                                            ).toLocaleDateString()
                                                            : "N/A"}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="interview-comparison-empty">
                                        <span>📊</span>
                                        <p>
                                            Select two interviews to compare their performance.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    );
}

export default PerformanceChart;
