import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getInterviewHistory, deleteInterview } from "../services/interviewService";

function InterviewHistory() {

    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD INTERVIEW HISTORY
    // ==========================================
    useEffect(() => {
        loadHistory();
    }, []);


    const loadHistory = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getInterviewHistory();

            console.log("Interview History:", data);

            if (!data?.success) {

                setInterviews([]);

                setError(
                    data?.message ||
                    "Unable to load interview history."
                );

                return;
            }

            setInterviews(
                Array.isArray(data.interviews)
                    ? data.interviews
                    : []
            );

        } catch (err) {

            console.error(
                "Interview History Error:",
                err
            );

            setInterviews([]);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load interview history. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    // ==========================================
    // DELETE INTERVIEW
    // ==========================================

    const handleDelete = async (interviewId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this interview?"
        );

        if (!confirmed) {
            return;
        }

        try {

            const data = await deleteInterview(
                interviewId
            );

            console.log(
                "Delete Interview Response:",
                data
            );

            if (data?.success) {

                setInterviews((prevInterviews) =>
                    prevInterviews.filter(
                        (interview) =>
                            interview.interview_id !== interviewId
                    )
                );

            } else {

                alert(
                    data?.message ||
                    "Failed to delete interview."
                );
            }

        } catch (err) {

            console.error(
                "Delete Interview Error:",
                err
            );

            alert(
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong while deleting interview."
            );
        }
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================
    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        try {

            const formattedDate = new Date(date);

            if (Number.isNaN(formattedDate.getTime())) {
                return "-";
            }

            return formattedDate.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        } catch {

            return "-";

        }
    };

    // ==========================================
    // STATUS CLASS
    // ==========================================
    const getStatusClass = (status) => {

        if (!status) {
            return "history-status";
        }

        return `history-status ${status
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
    };

    // ==========================================
    // PERFORMANCE CLASS
    // ==========================================
    const getPerformanceClass = (level) => {

        if (!level) {
            return "performance-badge";
        }

        const value = level.toLowerCase();

        if (value.includes("excellent")) {
            return "performance-badge excellent";
        }

        if (value.includes("very good")) {
            return "performance-badge very-good";
        }

        if (value.includes("good")) {
            return "performance-badge good";
        }

        if (value.includes("improvement")) {
            return "performance-badge improvement";
        }

        if (value.includes("poor")) {
            return "performance-badge poor";
        }

        return "performance-badge";
    };

    // ==========================================
    // LOADING STATE
    // ==========================================
    if (loading) {

        return (
            <div className="history-page">

                <div className="history-container">

                    <div className="history-loading-card">

                        <div className="history-loading-spinner">
                            <span>📋</span>
                        </div>

                        <h2>
                            Loading Interview History...
                        </h2>

                        <p>
                            Please wait while we fetch your previous interviews.
                        </p>

                    </div>

                </div>

            </div>
        );
    }

    // ==========================================
    // ERROR STATE
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
                            Unable to Load History
                        </h2>

                        <p>
                            {error}
                        </p>

                        <div className="history-error-actions">

                            <button
                                type="button"
                                className="history-retry-button"
                                onClick={loadHistory}
                            >
                                Try Again
                            </button>

                            <Link
                                to="/dashboard"
                                className="history-dashboard-button"
                            >
                                Dashboard
                            </Link>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ==========================================
    // MAIN UI
    // ==========================================
    return (

        <div className="history-page">

            <div className="history-container">

                {/* =====================================
                    HEADER
                ===================================== */}
                <div className="history-header">

                    <div>

                        <p className="history-label">
                            Your Progress
                        </p>

                        <h1>
                            Interview History
                        </h1>

                        <p>
                            Review your previous interview attempts
                            and track your performance.
                        </p>

                    </div>

                    <div className="history-header-actions">

                        <Link
                            to="/interview/setup"
                            className="history-start-button"
                        >
                            + Start New Interview
                        </Link>

                        <Link
                            to="/dashboard"
                            className="history-back-link"
                        >
                            Dashboard
                        </Link>

                    </div>

                </div>

                {/* =====================================
                    SUMMARY
                ===================================== */}
                <div className="history-summary">

                    <div className="history-summary-card">

                        <div className="history-summary-icon">
                            🎯
                        </div>

                        <div>

                            <span>
                                Total Interviews
                            </span>

                            <strong>
                                {interviews.length}
                            </strong>

                        </div>

                    </div>

                    <div className="history-summary-card">

                        <div className="history-summary-icon">
                            🏆
                        </div>

                        <div>

                            <span>
                                Completed
                            </span>

                            <strong>
                                {
                                    interviews.filter(
                                        (item) =>
                                            item.status === "completed"
                                    ).length
                                }
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

                                {interviews.length > 0
                                    ? (
                                        interviews.reduce(
                                            (total, item) =>
                                                total +
                                                Number(
                                                    item.overall_score || 0
                                                ),
                                            0
                                        ) / interviews.length
                                    ).toFixed(1)
                                    : "0.0"
                                }%

                            </strong>

                        </div>

                    </div>

                </div>

                {/* =====================================
                    EMPTY STATE
                ===================================== */}
                {interviews.length === 0 ? (

                    <div className="history-empty">

                        <div className="history-empty-icon">
                            📝
                        </div>

                        <h2>
                            No Interviews Yet
                        </h2>

                        <p>
                            You haven't completed any interviews yet.
                            Start your first AI-powered interview
                            and your results will appear here.
                        </p>

                        <Link
                            to="/interview/setup"
                            className="history-start-button"
                        >
                            Start New Interview →
                        </Link>

                    </div>

                ) : (

                    /* =====================================
                        INTERVIEW LIST
                    ===================================== */
                    <div className="history-list">

                        {interviews.map(
                            (interview, index) => (

                                <div
                                    className="history-card"
                                    key={
                                        interview.interview_id ||
                                        index
                                    }
                                >
                                    {/* TOP */}
                                    <div className="history-role">

                                        <div className="history-role-icon">
                                            💼
                                        </div>

                                        <div>

                                            <h2>
                                                {interview.job_role || "Unknown Role"}
                                            </h2>

                                            <p>
                                                {interview.interview_type || "Interview"}
                                            </p>

                                            <p className="history-interview-id">
                                                Interview ID:{" "}
                                                <span>
                                                    {interview.interview_code || "N/A"}
                                                </span>
                                            </p>

                                        </div>

                                    </div>

                                    {/* DETAILS */}
                                    <div className="history-details">

                                        <div className="history-detail">

                                            <span>
                                                Experience
                                            </span>

                                            <strong>
                                                {interview.experience_level ||
                                                    "-"}
                                            </strong>

                                        </div>

                                        <div className="history-detail">

                                            <span>
                                                Difficulty
                                            </span>

                                            <strong>
                                                {interview.difficulty ||
                                                    "-"}
                                            </strong>

                                        </div>

                                        <div className="history-detail">

                                            <span>
                                                Questions
                                            </span>

                                            <strong>
                                                {interview.number_of_questions ||
                                                    0}
                                            </strong>

                                        </div>

                                        <div className="history-detail">

                                            <span>
                                                Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    interview.created_at
                                                )}
                                            </strong>

                                        </div>

                                    </div>

                                    {/* BOTTOM */}
                                    <div className="history-card-bottom">

                                        <div className="history-badges">

                                            <span
                                                className={getStatusClass(
                                                    interview.status
                                                )}
                                            >
                                                {interview.status ||
                                                    "Unknown"}
                                            </span>

                                            {interview.performance_level && (

                                                <span
                                                    className={getPerformanceClass(
                                                        interview.performance_level
                                                    )}
                                                >
                                                    {
                                                        interview.performance_level
                                                    }
                                                </span>

                                            )}

                                        </div>

                                        <div className="history-actions">

                                            <button
                                                type="button"
                                                className="history-view-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/interview/details/${interview.interview_id}`
                                                    )
                                                }
                                            >
                                                View Details
                                            </button>

                                            {interview.status ===
                                                "completed" && (

                                                    <button
                                                        type="button"
                                                        className="history-result-button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/interview/result?id=${interview.interview_id}`
                                                            )
                                                        }
                                                    >
                                                        View Result
                                                    </button>
                                                )}

                                            <button
                                                type="button"
                                                className="history-delete-button"
                                                onClick={() =>
                                                    handleDelete(
                                                        interview.interview_id
                                                    )
                                                }
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>
                )}

            </div>

        </div>
    );
}

export default InterviewHistory;
