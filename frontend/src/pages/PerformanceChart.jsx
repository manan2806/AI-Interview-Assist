import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getInterviewHistory
} from "../services/interviewService";

function PerformanceChart() {
    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
                            type="button"
                            className="history-back-link"
                            onClick={() =>
                                navigate(
                                    "/interview/history"
                                )
                            }
                        >
                            ← Back to Interview History
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
                <div className="result-card">
                    <h2>
                        Interview Performance
                    </h2>

                    {
                        interviews.length === 0 ? (
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
                                        navigate(
                                            "/interview/setup"
                                        )
                                    }
                                >
                                    Start New Interview →
                                </button>
                            </div>
                        ) : (
                            <div className="performance-chart-placeholder">
                                <div className="performance-chart-icon">
                                    📈
                                </div>

                                <h3>
                                    Performance Chart
                                </h3>

                                <p>
                                    Your interview performance
                                    chart will appear here.
                                </p>

                                <p>
                                    Completed Interviews:{" "}
                                    <strong>
                                        {interviews.length}
                                    </strong>
                                </p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}

export default PerformanceChart;
