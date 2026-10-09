import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getUser, logout } from "../utils/auth";
import { getInterviewHistory } from "../services/interviewService";
import "../context/Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================

    const [user, setUser] = useState(null);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // ==========================================
    // LOAD DASHBOARD DATA
    // ==========================================

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const storedUser = getUser();

                if (!storedUser) {
                    navigate("/login");
                    return;
                }

                setUser(storedUser);

                const historyData = await getInterviewHistory();

                console.log("Dashboard History Data:", historyData);

                if (Array.isArray(historyData)) {
                    setInterviews(historyData);
                } else if (Array.isArray(historyData?.interviews)) {
                    setInterviews(historyData.interviews);
                } else {
                    setInterviews([]);
                }

            } catch (historyError) {
                console.error(
                    "Interview History Error:",
                    historyError
                );

                setInterviews([]);
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        try {
            logout();
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Logout Error:", err);
            navigate("/", { replace: true });
        }
    };

    // ==========================================
    // INTERVIEW STATISTICS
    // ==========================================

    const totalInterviews = interviews.length;

    const completedInterviews = interviews.filter(
        (interview) => interview?.status === "completed"
    ).length;

    const scoredInterviews = interviews.filter((interview) =>
        Number.isFinite(Number(interview?.overall_score))
    );

    const averageScore =
        scoredInterviews.length > 0
            ? Math.round(
                scoredInterviews.reduce(
                    (total, interview) =>
                        total + Number(interview.overall_score),
                    0
                ) / scoredInterviews.length
            )
            : 0;

    const latestInterview =
        interviews.length > 0 ? interviews[0] : null;

    const recentInterviews = interviews.slice(0, 3);

    // ==========================================
    // PERFORMANCE LABEL
    // ==========================================

    const getPerformanceLabel = (score) => {
        if (score >= 90) return "Excellent";
        if (score >= 75) return "Very Good";
        if (score >= 60) return "Good";
        if (score >= 40) return "Needs Improvement";
        if (score > 0) return "Needs Improvement";
        return "Not Available";
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "Date unavailable";
        }

        try {
            return new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "Date unavailable";
        }
    };

    // ==========================================
    // STATUS LABEL
    // ==========================================

    const getStatusLabel = (status) => {
        if (status === "completed") return "Completed";
        if (status === "evaluation_pending") return "Evaluation Pending";
        if (status === "in_progress") return "In Progress";
        if (status === "evaluating") return "Evaluating";
        return "Created";
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-loading">
                    <div className="dashboard-loader">⏳</div>

                    <h2>Loading Dashboard...</h2>

                    <p>
                        Please wait while we load your dashboard.
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================

    if (error || !user) {
        return (
            <div className="dashboard-page">
                <div className="dashboard-error">
                    <div className="dashboard-error-icon">⚠️</div>

                    <h2>Unable to Load Dashboard</h2>

                    <p>
                        {error || "User information is not available."}
                    </p>

                    <button
                        className="dashboard-login-button"
                        onClick={() => {
                            logout();
                            navigate("/login", { replace: true });
                        }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="dashboard-page">

            {/* ==========================================
                NAVBAR
            ========================================== */}

            <nav className="dashboard-navbar">

                {/* LOGO / BRAND */}
                <div className="dashboard-logo">
                    <div className="dashboard-logo-icon">AI</div>
                    <span>Interview Assist</span>
                </div>

                {/* ==========================================
                    DESKTOP NAVIGATION
                ========================================== */}

                <div className="dashboard-nav-right">

                    <Link to="/support">
                        Help & Support
                    </Link>

                    <Link to="/profile">
                        Profile
                    </Link>

                    <Link to="/settings">
                        Settings
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>

                </div>

                {/* ==========================================
                    MOBILE HAMBURGER
                ========================================== */}
                <div className="dashboard-mobile-nav">
                    <button
                        className="dashboard-menu-button"
                        onClick={() =>
                            setMobileMenuOpen(!mobileMenuOpen)
                        }
                        aria-label="Open menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        ☰
                    </button>

                    {mobileMenuOpen && (
                        <div className="dashboard-mobile-dropdown">
                            <Link
                                to="/profile"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            >
                                <span>👤</span>
                                <span>Profile</span>
                            </Link>

                            <Link
                                to="/settings"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </Link>

                            <Link
                                to="/support"
                                onClick={() =>
                                    setMobileMenuOpen(false)
                                }
                            >
                                <span>🛟</span>
                                <span>Help & Support</span>
                            </Link>

                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    handleLogout();
                                }}
                            >
                                <span>🚪</span>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* MAIN */}

            <main className="dashboard-container">

                {/* WELCOME */}

                <section className="welcome-section">
                    <div>
                        <p className="welcome-label">
                            Welcome back 👋
                        </p>

                        <h1>
                            Hello, {user?.name || "User"}!
                        </h1>

                        <p className="welcome-text">
                            Ready to improve your interview performance?
                        </p>
                    </div>

                    <Link
                        to="/interview/setup"
                        className="primary-button"
                    >
                        Start New Interview
                    </Link>
                </section>

                {/* PROFILE OVERVIEW */}

                <section className="dashboard-grid">

                    <div className="dashboard-card">
                        <div className="card-icon">👤</div>

                        <div>
                            <h3>Target Role</h3>

                            <p>
                                {user?.target_role || "Not set"}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🎓</div>

                        <div>
                            <h3>Experience Level</h3>

                            <p>
                                {user?.experience_level || "Fresher"}
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">🛠️</div>

                        <div>
                            <h3>Skills</h3>

                            <p>
                                {user?.skills?.length || 0} Skills Added
                            </p>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📊</div>

                        <div>
                            <h3>Interviews</h3>

                            <p>
                                {totalInterviews}{" "}
                                {totalInterviews === 1
                                    ? "Interview"
                                    : "Interviews"}
                            </p>
                        </div>
                    </div>

                </section>

                {/* PERFORMANCE OVERVIEW */}

                <section className="performance-section">

                    <div className="section-heading-row">

                        <div>
                            <h2>Performance Overview</h2>

                            <p>
                                A quick look at your interview practice progress.
                            </p>
                        </div>

                        <Link
                            to="/interview/history"
                            className="section-link"
                        >
                            View History →
                        </Link>

                    </div>

                    <div className="performance-grid">

                        {/* AVERAGE SCORE */}

                        <div className="performance-card performance-score-card">

                            <div className="performance-card-top">

                                <div className="performance-icon purple">
                                    📈
                                </div>

                                <span className="performance-small-label">
                                    Average Score
                                </span>

                            </div>

                            <div className="performance-score">
                                {averageScore > 0
                                    ? `${averageScore}%`
                                    : "—"}
                            </div>

                            <p className="performance-description">
                                {averageScore > 0
                                    ? getPerformanceLabel(averageScore)
                                    : "Complete an interview to see your score."}
                            </p>

                        </div>

                        {/* COMPLETED */}

                        <div className="performance-card">

                            <div className="performance-card-top">

                                <div className="performance-icon green">
                                    ✓
                                </div>

                                <span className="performance-small-label">
                                    Completed
                                </span>

                            </div>

                            <div className="performance-number">
                                {completedInterviews}
                            </div>

                            <p className="performance-description">
                                {completedInterviews === 1
                                    ? "Interview completed"
                                    : "Interviews completed"}
                            </p>

                        </div>

                        {/* PRACTICE */}

                        <div className="performance-card">

                            <div className="performance-card-top">

                                <div className="performance-icon orange">
                                    🎯
                                </div>

                                <span className="performance-small-label">
                                    Practice
                                </span>

                            </div>

                            <div className="performance-number">
                                {totalInterviews}
                            </div>

                            <p className="performance-description">
                                Total interviews attempted
                            </p>

                        </div>

                    </div>

                </section>

                {/* RECENT INTERVIEWS */}

                <section className="recent-section">

                    <div className="section-heading-row">

                        <div>
                            <h2>Recent Interviews</h2>

                            <p>
                                Your latest interview activity.
                            </p>
                        </div>

                        <Link
                            to="/interview/history"
                            className="section-link"
                        >
                            View All →
                        </Link>

                    </div>

                    {recentInterviews.length > 0 ? (

                        <div className="recent-interviews">

                            {recentInterviews.map((interview, index) => {

                                const score = Number(
                                    interview?.overall_score
                                );

                                const hasScore = Number.isFinite(score);

                                return (
                                    <div
                                        className="recent-interview-card"
                                        key={
                                            interview?.interview_id || index
                                        }
                                    >

                                        {/* LEFT */}

                                        <div className="recent-interview-main">

                                            <div className="recent-interview-icon">
                                                {index === 0 ? "🎯" : "📋"}
                                            </div>

                                            <div>

                                                <div className="recent-interview-title-row">

                                                    <h3>
                                                        {interview?.job_role ||
                                                            "Interview"}
                                                    </h3>

                                                    <span className="interview-code">
                                                        {interview?.interview_code ||
                                                            "N/A"}
                                                    </span>

                                                </div>

                                                <p>
                                                    {interview?.interview_type ||
                                                        "Mixed"}{" "}
                                                    •{" "}
                                                    {interview?.difficulty ||
                                                        "Medium"}{" "}
                                                    •{" "}
                                                    {formatDate(
                                                        interview?.created_at
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        {/* SCORE */}

                                        <div className="recent-interview-score">

                                            {hasScore ? (
                                                <>
                                                    <strong>
                                                        {score}%
                                                    </strong>

                                                    <span>
                                                        {interview?.performance_level ||
                                                            getPerformanceLabel(score)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="no-score">
                                                    {getStatusLabel(
                                                        interview?.status
                                                    )}
                                                </span>
                                            )}

                                        </div>

                                        {/* ACTION */}

                                        <Link
                                            to={
                                                hasScore
                                                    ? `/interview/result?id=${interview.interview_id}&from=dashboard`
                                                    : `/interview/start?id=${interview.interview_id}`
                                            }
                                            className="recent-view-button"
                                        >
                                            {hasScore
                                                ? "View Result"
                                                : "Continue"}{" "}
                                            →
                                        </Link>

                                    </div>
                                );
                            })}

                        </div>

                    ) : (

                        <div className="empty-interviews">

                            <div className="empty-interviews-icon">
                                📋
                            </div>

                            <h3>No interviews yet</h3>

                            <p>
                                Start your first AI-powered mock interview
                                and track your progress here.
                            </p>

                            <Link
                                to="/interview/setup"
                                className="empty-start-button"
                            >
                                Start Your First Interview
                            </Link>

                        </div>

                    )}

                </section>

                {/* ACTIONS */}

                <section className="action-section">

                    <h2>What would you like to do?</h2>

                    <div className="action-grid">

                        {/* PROFILE */}

                        <Link
                            to="/profile"
                            className="action-card"
                        >
                            <div className="action-icon">👤</div>

                            <div>
                                <h3>View Profile</h3>

                                <p>
                                    View and manage your profile information.
                                </p>
                            </div>

                            <span className="arrow">→</span>
                        </Link>

                        {/* PROFILE IMPROVEMENT */}

                        <Link
                            to="/profile-improvement"
                            className="action-card"
                        >
                            <div className="action-icon">🚀</div>

                            <div>
                                <h3>Improve Profile</h3>

                                <p>
                                    Improve your skills, role and experience
                                    information.
                                </p>
                            </div>

                            <span className="arrow">→</span>
                        </Link>

                        {/* INTERVIEW */}

                        <Link
                            to="/interview/setup"
                            className="action-card"
                        >
                            <div className="action-icon">🎯</div>

                            <div>
                                <h3>Practice Interview</h3>

                                <p>
                                    Start a new AI-powered mock interview.
                                </p>
                            </div>

                            <span className="arrow">→</span>
                        </Link>

                        {/* HISTORY */}

                        <Link
                            to="/interview/history"
                            className="action-card"
                        >
                            <div className="action-icon">📋</div>

                            <div>
                                <h3>Interview History</h3>

                                <p>
                                    View your previous interview results.
                                </p>
                            </div>

                            <span className="arrow">→</span>
                        </Link>

                    </div>

                </section>

            </main>

            <footer className="dashboard-footer">

                <div className="dashboard-footer-content">

                    <div className="dashboard-footer-brand">

                        <div className="dashboard-footer-logo">
                            AI
                        </div>

                        <div>
                            <h3>AI Interview Assist</h3>

                            <p>
                                Practice smarter. Perform better.
                            </p>
                        </div>

                    </div>

                    <div className="dashboard-footer-links">

                        <Link to="/dashboard">
                            Dashboard
                        </Link>

                        <Link to="/interview/history">
                            Interview History
                        </Link>

                        <Link to="/profile">
                            Profile
                        </Link>

                    </div>

                </div>

                <div className="dashboard-footer-bottom">

                    <span>
                        © {new Date().getFullYear()} AI Interview Assist
                    </span>

                    <span>
                        AI-powered interview practice platform
                    </span>

                </div>

            </footer>

        </div>
    );
}

export default Dashboard;
