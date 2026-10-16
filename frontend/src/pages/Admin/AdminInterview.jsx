
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminInterview.css";

function AdminInterview() {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchInterviews = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/interviews");

            if (response.data?.success) {
                setInterviews(
                    Array.isArray(response.data.interviews)
                        ? response.data.interviews
                        : []
                );
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load interviews."
                );
            }
        } catch (err) {
            console.error("Admin interviews error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to load interviews."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!localStorage.getItem("token")) {
            navigate("/login", { replace: true });
            return;
        }

        fetchInterviews();
    }, [navigate, fetchInterviews]);

    const filteredInterviews = interviews.filter((interview) => {
        const query = search.trim().toLowerCase();

        const matchesSearch = [
            interview.job_role,
            interview.interview_type,
            interview.experience_level,
            interview.difficulty,
            interview.status,
            interview.interview_id,
            interview.user_id,
        ].some((value) =>
            String(value || "").toLowerCase().includes(query)
        );

        const matchesStatus =
            statusFilter === "all" ||
            String(interview.status || "unknown").toLowerCase() ===
            statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const statusClass = (status) =>
        String(status || "unknown")
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "-");

    return (
        <main className="admin-interviews-page">
            <header className="admin-interviews-header">
                <div>
                    <p className="admin-interviews-eyebrow">
                        ADMINISTRATION
                    </p>
                    <h1>Interview Management</h1>
                    <p>
                        View and monitor interview records across the platform.
                    </p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-interviews-back"
                >
                    ← Dashboard
                </Link>
            </header>

            <section className="admin-interviews-toolbar">
                <div className="admin-interviews-count">
                    <span>Total Interviews</span>
                    <strong>
                        {loading ? "..." : interviews.length}
                    </strong>
                </div>

                <input
                    type="search"
                    className="admin-interviews-search"
                    placeholder="Search role, type, status or ID..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search interviews"
                />

                <select
                    className="admin-interviews-filter"
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(event.target.value)
                    }
                    aria-label="Filter by status"
                >
                    <option value="all">All statuses</option>
                    <option value="created">Created</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="evaluation_pending">
                        Evaluation Pending
                    </option>
                </select>

                <button
                    type="button"
                    className="admin-interviews-refresh"
                    onClick={fetchInterviews}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "↻ Refresh"}
                </button>
            </section>

            {error && (
                <div className="admin-interviews-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={fetchInterviews}
                        disabled={loading}
                    >
                        Try Again
                    </button>
                </div>
            )}

            <section className="admin-interviews-table-card">
                <div className="admin-interviews-table-heading">
                    <h2>Interview Records</h2>
                    <span>{filteredInterviews.length} results</span>
                </div>

                {loading ? (
                    <div className="admin-interviews-empty">
                        Loading interviews...
                    </div>
                ) : !error && filteredInterviews.length === 0 ? (
                    <div className="admin-interviews-empty">
                        No interviews found.
                    </div>
                ) : !error ? (
                    <div className="admin-interviews-table-wrapper">
                        <table className="admin-interviews-table">
                            <thead>
                                <tr>
                                    <th>Job Role</th>
                                    <th>Type</th>
                                    <th>Experience</th>
                                    <th>Difficulty</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInterviews.map((interview) => (
                                    <tr key={interview.interview_id}>
                                        <td>{interview.job_role || "—"}</td>
                                        <td>{interview.interview_type || "—"}</td>
                                        <td>{interview.experience_level || "—"}</td>
                                        <td>{interview.difficulty || "—"}</td>
                                        <td>
                                            <span
                                                className={`status-badge ${interview.status}`}
                                            >
                                                {interview.status || "Unknown"}
                                            </span>
                                        </td>
                                        <td>{formatDate(interview.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </section>
        </main>
    );
}

export default AdminInterview;
