import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../context/InterviewHistory.css";
import {
    getInterviewHistory,
    deleteInterview
} from "../services/interviewService";

function InterviewHistory() {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // ADVANCED SEARCH & FILTER STATES
    // ==========================================
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [experienceFilter, setExperienceFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [performanceFilter, setPerformanceFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

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
            console.error("Interview History Error:", err);

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
            const data = await deleteInterview(interviewId);

            console.log("Delete Interview Response:", data);

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
            console.error("Delete Interview Error:", err);

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
    // DATE FILTER HELPER
    // ==========================================
    const isWithinDateFilter = (date, filter) => {
        if (filter === "all") {
            return true;
        }

        if (!date) {
            return false;
        }

        const interviewDate = new Date(date);

        if (Number.isNaN(interviewDate.getTime())) {
            return false;
        }

        const now = new Date();

        // Start of today
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        if (filter === "today") {
            return interviewDate >= startOfToday;
        }

        if (filter === "7days") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);

            return interviewDate >= sevenDaysAgo;
        }

        if (filter === "30days") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            return interviewDate >= thirtyDaysAgo;
        }

        if (filter === "90days") {
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(now.getDate() - 90);

            return interviewDate >= ninetyDaysAgo;
        }

        return true;
    };

    // ==========================================
    // ADVANCED FILTER + SEARCH + SORT
    // ==========================================
    const filteredInterviews = useMemo(() => {
        let result = [...interviews];

        // ======================================
        // SEARCH
        // ======================================
        const search = searchTerm.trim().toLowerCase();

        if (search) {
            result = result.filter((interview) => {
                const jobRole = String(
                    interview.job_role || ""
                ).toLowerCase();

                const interviewCode = String(
                    interview.interview_code || ""
                ).toLowerCase();

                const interviewId = String(
                    interview.interview_id || ""
                ).toLowerCase();

                const interviewType = String(
                    interview.interview_type || ""
                ).toLowerCase();

                const experience = String(
                    interview.experience_level || ""
                ).toLowerCase();

                const difficulty = String(
                    interview.difficulty || ""
                ).toLowerCase();

                return (
                    jobRole.includes(search) ||
                    interviewCode.includes(search) ||
                    interviewId.includes(search) ||
                    interviewType.includes(search) ||
                    experience.includes(search) ||
                    difficulty.includes(search)
                );
            });
        }

        // ======================================
        // STATUS FILTER
        // ======================================
        if (statusFilter !== "all") {
            result = result.filter(
                (interview) =>
                    String(
                        interview.status || ""
                    ).toLowerCase() ===
                    statusFilter.toLowerCase()
            );
        }

        // ======================================
        // EXPERIENCE FILTER
        // ======================================
        if (experienceFilter !== "all") {
            result = result.filter(
                (interview) =>
                    String(
                        interview.experience_level || ""
                    ).toLowerCase() ===
                    experienceFilter.toLowerCase()
            );
        }

        // ======================================
        // DIFFICULTY FILTER
        // ======================================
        if (difficultyFilter !== "all") {
            result = result.filter(
                (interview) =>
                    String(
                        interview.difficulty || ""
                    ).toLowerCase() ===
                    difficultyFilter.toLowerCase()
            );
        }

        // ======================================
        // PERFORMANCE FILTER
        // ======================================
        if (performanceFilter !== "all") {
            result = result.filter(
                (interview) =>
                    String(
                        interview.performance_level || ""
                    ).toLowerCase() ===
                    performanceFilter.toLowerCase()
            );
        }

        // ======================================
        // DATE FILTER
        // ======================================
        if (dateFilter !== "all") {
            result = result.filter(
                (interview) =>
                    isWithinDateFilter(
                        interview.created_at,
                        dateFilter
                    )
            );
        }

        // ======================================
        // SORT
        // ======================================
        result.sort((a, b) => {
            if (sortBy === "newest") {
                return (
                    new Date(b.created_at || 0) -
                    new Date(a.created_at || 0)
                );
            }

            if (sortBy === "oldest") {
                return (
                    new Date(a.created_at || 0) -
                    new Date(b.created_at || 0)
                );
            }

            if (sortBy === "highest") {
                return (
                    Number(b.overall_score || 0) -
                    Number(a.overall_score || 0)
                );
            }

            if (sortBy === "lowest") {
                return (
                    Number(a.overall_score || 0) -
                    Number(b.overall_score || 0)
                );
            }

            return 0;
        });

        return result;
    }, [
        interviews,
        searchTerm,
        statusFilter,
        experienceFilter,
        difficultyFilter,
        performanceFilter,
        dateFilter,
        sortBy
    ]);

    // ==========================================
    // CLEAR ALL FILTERS
    // ==========================================
    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setExperienceFilter("all");
        setDifficultyFilter("all");
        setPerformanceFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    // ==========================================
    // CHECK ACTIVE FILTERS
    // ==========================================
    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        statusFilter !== "all" ||
        experienceFilter !== "all" ||
        difficultyFilter !== "all" ||
        performanceFilter !== "all" ||
        dateFilter !== "all" ||
        sortBy !== "newest";

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

                        <button
                            type="button"
                            className="history-performance-button"
                            onClick={() =>
                                navigate("/interview/performance")
                            }
                        >
                            📊 Performance Chart
                        </button>

                        <button
                            className="result-back-btn"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Dashboard
                        </button>
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
                                            item.status ===
                                            "completed"
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
                                            (
                                                total,
                                                item
                                            ) =>
                                                total +
                                                Number(
                                                    item.overall_score ||
                                                    0
                                                ),
                                            0
                                        ) /
                                        interviews.length
                                    ).toFixed(1)
                                    : "0.0"
                                }%
                            </strong>
                        </div>
                    </div>
                </div>

                {/* =====================================
                    ADVANCED SEARCH
                ===================================== */}
                {interviews.length > 0 && (
                    <div className="history-search-panel">
                        <div className="history-search-title">
                            <h3>
                                Search & Filter Interviews
                            </h3>

                            <p>
                                Find and filter your previous interviews quickly.
                            </p>
                        </div>

                        {/* SEARCH + FILTER BUTTON */}
                        <div className="history-search-toolbar">

                            {/* SEARCH */}
                            <div className="history-search-main">
                                <div className="history-search-input-wrapper">
                                    <span className="history-search-icon">
                                        🔍
                                    </span>

                                    <input
                                        type="text"
                                        className="history-search-input"
                                        placeholder="Search by job role, interview ID, type, experience..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(
                                                e.target.value
                                            )
                                        }
                                    />

                                    {searchTerm && (
                                        <button
                                            type="button"
                                            className="history-search-clear"
                                            onClick={() =>
                                                setSearchTerm("")
                                            }
                                            aria-label="Clear search"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* FILTER MENU */}
                            <div className="history-filter-menu-wrapper">
                                <button
                                    type="button"
                                    className="history-filter-menu-button"
                                    onClick={() =>
                                        setFilterMenuOpen(
                                            !filterMenuOpen
                                        )
                                    }
                                >
                                    ⚙️ Filters
                                    {hasActiveFilters && (
                                        <span className="history-filter-active-dot">
                                            •
                                        </span>
                                    )}

                                    <span
                                        className={
                                            filterMenuOpen
                                                ? "history-filter-arrow open"
                                                : "history-filter-arrow"
                                        }
                                    >
                                        ▾
                                    </span>
                                </button>

                                {filterMenuOpen && (
                                    <div className="history-filter-dropdown">

                                        {/* STATUS */}
                                        <div className="history-filter-group">
                                            <label>
                                                Status
                                            </label>

                                            <select
                                                value={statusFilter}
                                                onChange={(e) =>
                                                    setStatusFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    All Status
                                                </option>

                                                <option value="created">
                                                    Created
                                                </option>

                                                <option value="ready">
                                                    Ready
                                                </option>

                                                <option value="in_progress">
                                                    In Progress
                                                </option>

                                                <option value="completed">
                                                    Completed
                                                </option>
                                            </select>
                                        </div>

                                        {/* EXPERIENCE */}
                                        <div className="history-filter-group">
                                            <label>
                                                Experience
                                            </label>

                                            <select
                                                value={experienceFilter}
                                                onChange={(e) =>
                                                    setExperienceFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    All Experience
                                                </option>

                                                <option value="fresher">
                                                    Fresher
                                                </option>

                                                <option value="junior">
                                                    Junior
                                                </option>

                                                <option value="mid level">
                                                    Mid Level
                                                </option>

                                                <option value="senior">
                                                    Senior
                                                </option>
                                            </select>
                                        </div>

                                        {/* DIFFICULTY */}
                                        <div className="history-filter-group">
                                            <label>
                                                Difficulty
                                            </label>

                                            <select
                                                value={difficultyFilter}
                                                onChange={(e) =>
                                                    setDifficultyFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    All Difficulty
                                                </option>

                                                <option value="easy">
                                                    Easy
                                                </option>

                                                <option value="medium">
                                                    Medium
                                                </option>

                                                <option value="hard">
                                                    Hard
                                                </option>
                                            </select>
                                        </div>

                                        {/* PERFORMANCE */}
                                        <div className="history-filter-group">
                                            <label>
                                                Performance
                                            </label>

                                            <select
                                                value={performanceFilter}
                                                onChange={(e) =>
                                                    setPerformanceFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    All Performance
                                                </option>

                                                <option value="excellent">
                                                    Excellent
                                                </option>

                                                <option value="very good">
                                                    Very Good
                                                </option>

                                                <option value="good">
                                                    Good
                                                </option>

                                                <option value="needs improvement">
                                                    Needs Improvement
                                                </option>

                                                <option value="poor">
                                                    Poor
                                                </option>
                                            </select>
                                        </div>

                                        {/* DATE */}
                                        <div className="history-filter-group">
                                            <label>
                                                Date
                                            </label>

                                            <select
                                                value={dateFilter}
                                                onChange={(e) =>
                                                    setDateFilter(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="all">
                                                    All Dates
                                                </option>

                                                <option value="today">
                                                    Today
                                                </option>

                                                <option value="7days">
                                                    Last 7 Days
                                                </option>

                                                <option value="30days">
                                                    Last 30 Days
                                                </option>

                                                <option value="90days">
                                                    Last 90 Days
                                                </option>
                                            </select>
                                        </div>

                                        {/* SORT */}
                                        <div className="history-filter-group">
                                            <label>
                                                Sort By
                                            </label>

                                            <select
                                                value={sortBy}
                                                onChange={(e) =>
                                                    setSortBy(
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="newest">
                                                    Newest First
                                                </option>

                                                <option value="oldest">
                                                    Oldest First
                                                </option>

                                                <option value="highest">
                                                    Highest Score
                                                </option>

                                                <option value="lowest">
                                                    Lowest Score
                                                </option>
                                            </select>
                                        </div>

                                        {/* FILTER FOOTER */}
                                        <div className="history-filter-dropdown-footer">
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    className="history-clear-filters-button"
                                                    onClick={clearFilters}
                                                >
                                                    ✕ Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SEARCH RESULT INFO */}
                        <div className="history-search-footer">
                            <span>
                                Showing{" "}
                                <strong>
                                    {filteredInterviews.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {interviews.length}
                                </strong>{" "}
                                interviews
                            </span>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="history-clear-filters-button"
                                    onClick={clearFilters}
                                >
                                    ✕ Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                )}

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
                ) : filteredInterviews.length === 0 ? (

                    /* =====================================
                        NO SEARCH RESULTS
                    ===================================== */
                    <div className="history-empty">
                        <div className="history-empty-icon">
                            🔍
                        </div>

                        <h2>
                            No Matching Interviews
                        </h2>

                        <p>
                            No interviews match your current
                            search or filters.
                        </p>

                        <button
                            type="button"
                            className="history-start-button"
                            onClick={clearFilters}
                        >
                            Clear Search & Filters
                        </button>
                    </div>
                ) : (

                    /* =====================================
                        INTERVIEW LIST
                    ===================================== */
                    <div className="history-list">
                        {filteredInterviews.map(
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

                                        <div className="history-role-info">
                                            <h2>
                                                {
                                                    interview.job_role ||
                                                    "Unknown Role"
                                                }
                                            </h2>

                                            <p>
                                                {
                                                    interview.interview_type ||
                                                    "Interview"
                                                }
                                            </p>
                                        </div>

                                        <div className="history-interview-id">
                                            <span>
                                                Interview ID =
                                            </span>

                                            <strong>
                                                {
                                                    interview.interview_code ||
                                                    "N/A"
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    {/* DETAILS */}
                                    <div className="history-details">
                                        <div className="history-detail">
                                            <span>
                                                Experience
                                            </span>

                                            <strong>
                                                {
                                                    interview.experience_level ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div className="history-detail">
                                            <span>
                                                Difficulty
                                            </span>

                                            <strong>
                                                {
                                                    interview.difficulty ||
                                                    "-"
                                                }
                                            </strong>
                                        </div>

                                        <div className="history-detail">
                                            <span>
                                                Questions
                                            </span>

                                            <strong>
                                                {
                                                    interview.number_of_questions ||
                                                    0
                                                }
                                            </strong>
                                        </div>

                                        <div className="history-detail">
                                            <span>
                                                Date
                                            </span>

                                            <strong>
                                                {
                                                    formatDate(
                                                        interview.created_at
                                                    )
                                                }
                                            </strong>
                                        </div>
                                    </div>

                                    {/* BOTTOM */}
                                    <div className="history-card-bottom">
                                        <div className="history-badges">
                                            <span
                                                className={
                                                    getStatusClass(
                                                        interview.status
                                                    )
                                                }
                                            >
                                                {
                                                    interview.status ||
                                                    "Unknown"
                                                }
                                            </span>

                                            {interview.performance_level && (
                                                <span
                                                    className={
                                                        getPerformanceClass(
                                                            interview.performance_level
                                                        )
                                                    }
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
                                                                `/interview/result?id=${interview.interview_id}&from=history`
                                                            )
                                                        }
                                                    >
                                                        View Result
                                                    </button>
                                                )}

                                            {(
                                                interview.status === "in_progress" ||
                                                interview.status === "evaluation_pending" ||
                                                interview.status === "ready" ||
                                                interview.status === "created"
                                            ) && (
                                                    <button
                                                        type="button"
                                                        className="history-resume-button"
                                                        onClick={() => {
                                                            localStorage.setItem(
                                                                "interview_id",
                                                                interview.interview_id
                                                            );

                                                            navigate("/interview/start");
                                                        }}
                                                    >
                                                        ▶ Resume Interview
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
