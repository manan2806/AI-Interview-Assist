
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminInterview.css";

function AdminInterview() {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // FILTER HELPER
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [experienceFilter, setExperienceFilter] = useState("all");
    const [difficultyFilter, setDifficultyFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const hasActiveFilters =
        statusFilter !== "all" ||
        experienceFilter !== "all" ||
        difficultyFilter !== "all" ||
        dateFilter !== "all" ||
        sortBy !== "newest";

    const clearFilters = () => {
        setStatusFilter("all");
        setExperienceFilter("all");
        setDifficultyFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

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

    const filteredInterviews = interviews
        .filter((interview) => {
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

            const experience = String(interview.experience_level || "")
                .toLowerCase()
                .replace(/[-_]/g, " ")
                .trim();

            const matchesExperience =
                experienceFilter === "all" ||
                experience === experienceFilter;

            const matchesDifficulty =
                difficultyFilter === "all" ||
                String(interview.difficulty || "").toLowerCase() ===
                difficultyFilter;

            let matchesDate = true;

            if (dateFilter !== "all") {
                const createdDate = new Date(interview.created_at);
                const now = new Date();

                if (
                    !interview.created_at ||
                    Number.isNaN(createdDate.getTime())
                ) {
                    matchesDate = false;
                } else if (dateFilter === "today") {
                    matchesDate =
                        createdDate.getFullYear() === now.getFullYear() &&
                        createdDate.getMonth() === now.getMonth() &&
                        createdDate.getDate() === now.getDate();
                } else {
                    const days = Number(dateFilter.replace("days", ""));
                    const cutoff = new Date(
                        now.getTime() - days * 24 * 60 * 60 * 1000
                    );

                    matchesDate =
                        createdDate >= cutoff && createdDate <= now;
                }
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesExperience &&
                matchesDifficulty &&
                matchesDate
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();

            return sortBy === "oldest"
                ? dateA - dateB
                : dateB - dateA;
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


                <div className="admin-filter-wrapper">
                    <button
                        type="button"
                        className={`admin-filter-button ${hasActiveFilters ? "active" : ""}`}
                        onClick={() => setFilterMenuOpen((prev) => !prev)}
                        aria-expanded={filterMenuOpen}
                        aria-label="Open interview filters"
                    >
                        <span>☷ Filters</span>
                        {hasActiveFilters && (
                            <span className="admin-filter-count">Active</span>
                        )}
                        <span>{filterMenuOpen ? "▲" : "▼"}</span>
                    </button>

                    {filterMenuOpen && (
                        <div className="admin-filter-dropdown">
                            <div className="admin-filter-dropdown-header">
                                <strong>Filter Interviews</strong>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="admin-filter-clear"
                                >
                                    Clear all
                                </button>
                            </div>

                            <label>
                                Status
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                >
                                    <option value="all">All statuses</option>
                                    <option value="created">Created</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="evaluation_pending">Evaluation Pending</option>
                                </select>
                            </label>

                            <label>
                                Experience
                                <select
                                    value={experienceFilter}
                                    onChange={(event) => setExperienceFilter(event.target.value)}
                                >
                                    <option value="all">All Experience Levels</option>
                                    <option value="fresher">Fresher</option>
                                    <option value="junior">Junior</option>
                                    <option value="mid level">Mid Level</option>
                                    <option value="senior">Senior</option>
                                </select>
                            </label>

                            <label>
                                Difficulty
                                <select
                                    value={difficultyFilter}
                                    onChange={(event) => setDifficultyFilter(event.target.value)}
                                >
                                    <option value="all">All difficulties</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </label>

                            <label>
                                Created date
                                <select
                                    value={dateFilter}
                                    onChange={(event) => setDateFilter(event.target.value)}
                                >
                                    <option value="all">Any time</option>
                                    <option value="today">Today</option>
                                    <option value="7days">Last 7 days</option>
                                    <option value="30days">Last 30 days</option>
                                    <option value="90days">Last 90 days</option>
                                </select>
                            </label>

                            <label>
                                Sort by
                                <select
                                    value={sortBy}
                                    onChange={(event) => setSortBy(event.target.value)}
                                >
                                    <option value="newest">Newest first</option>
                                    <option value="oldest">Oldest first</option>
                                </select>
                            </label>
                        </div>
                    )}
                </div>

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
                                    <th>User ID</th>
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
                                        <td>{interview.user_id || "—"}</td>
                                        <td>{interview.job_role || "—"}</td>
                                        <td>{interview.interview_type || "—"}</td>
                                        <td>{interview.experience_level || "—"}</td>
                                        <td>{interview.difficulty || "—"}</td>
                                        <td>

                                            <span
                                                className={`status-badge ${statusClass(interview.status)}`}
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
