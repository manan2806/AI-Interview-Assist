import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    },
    {
        key: "total_interviews",
        title: "Total Interviews",
        description: "All interview records",
        icon: "📋",
    },
    {
        key: "completed_interviews",
        title: "Completed",
        description: "Finished evaluations",
        icon: "✅",
    },
    {
        key: "pending_evaluations",
        title: "Pending Evaluations",
        description: "Awaiting evaluation",
        icon: "⏳",
    },
    {
        key: "in_progress_interviews",
        title: "In Progress",
        description: "Currently running",
        icon: "🎯",
    },
];

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchStats = async () => {
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
                    response.data?.message || "Unable to load dashboard statistics."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load statistics. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-navbar">
                <div>
                    <h2>AI Interview Assist</h2>
                    <span className="admin-badge">ADMIN PANEL</span>
                </div>

                <div className="admin-navbar-actions">
                    <button
                        type="button"
                        className="admin-refresh-btn"
                        onClick={fetchStats}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>

                    <button
                        type="button"
                        className="admin-logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="admin-container">
                <section className="admin-welcome">
                    <p className="admin-eyebrow">ADMINISTRATION</p>
                    <h1>Welcome, {user.name || "Admin"}!</h1>
                    <p>
                        Monitor users, interviews, and platform activity
                        from your dashboard.
                    </p>
                </section>

                {error && (
                    <div className="admin-error" role="alert">
                        <span>{error}</span>
                        <button type="button" onClick={fetchStats}>
                            Try again
                        </button>
                    </div>
                )}

                <section className="admin-stats-grid">
                    {statCards.map((card) => (
                        <article className="admin-stat-card" key={card.key}>
                            <div className="admin-stat-top">
                                <span className="admin-stat-icon">
                                    {card.icon}
                                </span>
                                <span className="admin-stat-label">
                                    {card.title}
                                </span>
                            </div>

                            <div className="admin-stat-value">
                                {loading ? "..." : (stats[card.key] ?? 0)}
                            </div>

                            <p className="admin-stat-description">
                                {card.description}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="admin-profile-card">
                    <h2>Admin Profile</h2>

                    <div className="admin-profile-details">
                        <p>
                            <strong>Name:</strong> {user.name || "N/A"}
                        </p>
                        <p>
                            <strong>Email:</strong> {user.email || "N/A"}
                        </p>
                        <p>
                            <strong>Role:</strong> {user.role || "N/A"}
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default AdminDashboard;
