import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminDashboard.css";

const initialStats = {
    total_users: 0,
    total_interviews: 0,
    completed_interviews: 0,
    pending_evaluations: 0,
    in_progress_interviews: 0,
};

const statCards = [
    {
        key: "total_users",
        title: "Total Users",
        description: "Registered accounts",
        icon: "👥",
        color: "users",
    },
    {
        key: "total_interviews",
        title: "Total Interviews",
        description: "All interview records",
        icon: "📋",
        color: "interviews",
    },
    {
        key: "completed_interviews",
        title: "Completed",
        description: "Finished interviews",
        icon: "✅",
        color: "completed",
    },
    {
        key: "pending_evaluations",
        title: "Pending Evaluations",
        description: "Awaiting evaluation",
        icon: "⏳",
        color: "pending",
    },
    {
        key: "in_progress_interviews",
        title: "In Progress",
        description: "Currently running",
        icon: "🎯",
        color: "progress",
    },
];

function AdminDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // ==========================================
    // LOAD ADMIN INFORMATION
    // ==========================================

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        try {
            const storedUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (!storedUser) {
                navigate("/login", { replace: true });
                return;
            }

            setUser(storedUser);
        } catch (err) {
            console.error("Admin information error:", err);
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    }, [navigate]);

    // ==========================================
    // FETCH ADMIN STATISTICS
    // ==========================================

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/stats");

            if (response.data?.success) {
                setStats({
                    ...initialStats,
                    ...response.data.stats,
                });
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load dashboard statistics."
                );
            }
        } catch (err) {
            console.error("Admin stats error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load statistics. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, fetchStats]);

    // ==========================================
    // CLOSE MOBILE MENU ON OUTSIDE CLICK
    // ==========================================

    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickedButton = event.target.closest(
                ".admin-menu-button"
            );

            const clickedDropdown = event.target.closest(
                ".admin-mobile-dropdown"
            );

            if (!clickedButton && !clickedDropdown) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("click", handleOutsideClick);

        return () => {
            document.removeEventListener(
                "click",
                handleOutsideClick
            );
        };
    }, []);

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", { replace: true });
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (!user) {
        return (
            <div className="admin-dashboard">
                <div className="admin-loading">
                    <div className="admin-loading-icon">⏳</div>
                    <h2>Loading Admin Dashboard...</h2>
                    <p>Please wait while we prepare your dashboard.</p>
                </div>
            </div>
        );
    }

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="admin-dashboard">

            {/* NAVBAR */}

            <nav className="admin-navbar">

                <Link to="/admin-dashboard" className="admin-brand">
                    <div className="admin-brand-icon">AI</div>

                    <div className="admin-brand-text">
                        <h2>Interview Assist</h2>
                        <span className="admin-badge">ADMIN PANEL</span>
                    </div>
                </Link>

                {/* DESKTOP: LOGOUT ONLY */}
                <div className="admin-navbar-actions admin-desktop-nav">
                    <Link
                        to="/admin-profile"
                        className="admin-profile-nav-link"
                    >
                        👤 My Profile
                    </Link>

                    <button
                        type="button"
                        className="admin-logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* MOBILE MENU */}
                <div className="admin-mobile-nav">
                    <button
                        type="button"
                        className="admin-menu-button"
                        onClick={() =>
                            setMobileMenuOpen((previous) => !previous)
                        }
                        aria-label="Toggle menu"
                        aria-expanded={mobileMenuOpen}
                    >
                        ☰
                    </button>

                    {mobileMenuOpen && (
                        <div className="admin-mobile-dropdown">
                            <Link
                                to="/admin-profile"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span>👤</span>
                                <span>My Profile</span>
                            </Link>

                            <button
                                type="button"
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

            {/* MAIN CONTENT */}

            <main className="admin-container">

                {/* WELCOME SECTION */}

                <section className="admin-welcome">
                    <div>
                        <p className="admin-eyebrow">
                            ADMINISTRATION
                        </p>

                        <h1>
                            Welcome back, {user.name || "Admin"}! 👋
                        </h1>

                        <p className="admin-welcome-description">
                            Monitor users, manage interview activity,
                            and track your platform's performance.
                        </p>
                    </div>

                    <div className="admin-welcome-icon">
                        🛡️
                    </div>
                </section>

                {/* ERROR MESSAGE */}

                {error && (
                    <div className="admin-error" role="alert">
                        <span>⚠️ {error}</span>

                        <button
                            type="button"
                            onClick={fetchStats}
                            disabled={loading}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* STATISTICS */}

                <section className="admin-stats-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Platform Overview</h2>
                            <p>
                                A summary of your platform's current activity.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="admin-refresh-btn"
                            onClick={fetchStats}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>
                    </div>

                    <div className="admin-stats-grid">
                        {statCards.map((card) => (
                            <article
                                className={`admin-stat-card admin-stat-${card.color}`}
                                key={card.key}
                            >
                                <div className="admin-stat-top">
                                    <span className="admin-stat-icon">
                                        {card.icon}
                                    </span>

                                    <span className="admin-stat-label">
                                        {card.title}
                                    </span>
                                </div>

                                <div className="admin-stat-value">
                                    {loading ? "..." : (
                                        Number(stats[card.key]) || 0
                                    )}
                                </div>

                                <p className="admin-stat-description">
                                    {card.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* PLATFORM ACTIVITY */}

                <section className="admin-action-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Platform Activity</h2>
                            <p>
                                Keep track of important interview operations.
                            </p>
                        </div>
                    </div>

                    <div className="admin-action-grid">

                        <Link
                            to="/admin-dashboard"
                            className="admin-action-card"
                        >
                            <div className="admin-action-icon purple">
                                📊
                            </div>

                            <div className="admin-action-content">
                                <h3>Dashboard Overview</h3>
                                <p>
                                    Review platform statistics and activity.
                                </p>
                            </div>

                            <span className="admin-action-arrow">→</span>
                        </Link>

                        <Link
                            to="/admin-users"
                            className="admin-action-card"
                        >
                            <div className="admin-action-icon blue">
                                👥
                            </div>

                            <div className="admin-action-content">
                                <h3>User Management</h3>
                                <p>
                                    Open the admin user management section.
                                </p>
                            </div>

                            <span className="admin-action-arrow">→</span>
                        </Link>

                        <Link
                            to="/admin-interviews"
                            className="admin-action-card"
                        >
                            <div className="admin-action-icon green">
                                📋
                            </div>

                            <div className="admin-action-content">
                                <h3>Interview Management</h3>
                                <p>
                                    Open interview records and activity.
                                </p>
                            </div>

                            <span className="admin-action-arrow">→</span>
                        </Link>

                        <Link
                            to="/admin-profile"
                            className="admin-action-card"
                        >
                            <div className="admin-action-icon orange">
                                🛡️
                            </div>

                            <div className="admin-action-content">
                                <h3>Admin Profile</h3>
                                <p>
                                    View your administrator account details.
                                </p>
                            </div>

                            <span className="admin-action-arrow">→</span>
                        </Link>

                    </div>
                </section>

                {/* ADMIN ACCOUNT */}

                <section className="admin-account-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>Administrator Account</h2>
                            <p>Your currently signed-in account details.</p>
                        </div>
                    </div>

                    <div className="admin-account-card">
                        <div className="admin-account-avatar">
                            {(user.name || "A")
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="admin-account-info">
                            <h3>{user.name || "Admin"}</h3>
                            <p>{user.email || "Email not available"}</p>
                        </div>

                        <span className="admin-role-badge">
                            {user.role || "Admin"}
                        </span>
                    </div>
                </section>

            </main>

            {/* FOOTER */}

            <footer className="admin-dashboard-footer">
                <div className="admin-footer-content">
                    <div className="admin-footer-brand">
                        <div className="admin-footer-logo">AI</div>

                        <div>
                            <h3>AI Interview Assist</h3>
                            <p>Manage smarter. Perform better.</p>
                        </div>
                    </div>

                    <div className="admin-footer-links">
                        <Link to="/admin-dashboard">
                            Admin Dashboard
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className="admin-footer-bottom">
                    <span>
                        © {new Date().getFullYear()} AI Interview Assist
                    </span>

                    <span>Administrator Dashboard</span>
                </div>
            </footer>

        </div>
    );
}

export default AdminDashboard;
