
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../context/Admin/AdminInterview.css";

const DEFAULT_FILTERS = {
    status: "all",
    experience: "all",
    difficulty: "all",
    date: "",
    sort: "newest",
};

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "created", label: "Created" },
    { value: "ready", label: "Ready" },
    { value: "in_progress", label: "In Progress" },
    { value: "evaluation_pending", label: "Evaluation Pending" },
    { value: "completed", label: "Completed" },
];

const EXPERIENCE_OPTIONS = [
    { value: "all", label: "All Experience Levels" },
    { value: "Fresher", label: "Fresher" },
    { value: "Junior", label: "Junior" },
    { value: "Mid Level", label: "Mid Level" },
    { value: "Senior", label: "Senior" },
];

const DIFFICULTY_OPTIONS = [
    { value: "all", label: "All Difficulties" },
    { value: "Easy", label: "Easy" },
    { value: "Medium", label: "Medium" },
    { value: "Hard", label: "Hard" },
];

function getInterviewDate(value) {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value) {
    const date = getInterviewDate(value);

    if (!date) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function normalizeStatus(status) {
    return String(status || "unknown")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status) {
    const normalized = String(status || "unknown").toLowerCase();

    const classes = {
        created: "status-created",
        ready: "status-ready",
        in_progress: "status-in-progress",
        evaluation_pending: "status-pending",
        completed: "status-completed",
    };

    return classes[normalized] || "status-unknown";
}

function AdminInterview() {
    const navigate = useNavigate();

    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const fetchInterviews = useCallback(async (isRefresh = false) => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await api.get("/api/admin/interviews");
            const data = response.data;

            const list = Array.isArray(data)
                ? data
                : data?.interviews || [];

            setInterviews(list);
        } catch (err) {
            const status = err?.response?.status;

            if (status === 401 || status === 403) {
                navigate("/login");
                return;
            }

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Unable to load interviews. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchInterviews();
    }, [fetchInterviews]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!event.target.closest(".admin-filter-wrapper")) {
                setFilterMenuOpen(false);
            }
        }

        function handleEscape(event) {
            if (event.key === "Escape") {
                setFilterMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const updateFilter = (key, value) => {
        setFilters((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setSearch("");
    };

    const activeFilterCount = [
        filters.status !== "all",
        filters.experience !== "all",
        filters.difficulty !== "all",
        Boolean(filters.date),
        filters.sort !== "newest",
    ].filter(Boolean).length;

    const filteredInterviews = useMemo(() => {
        const searchText = search.trim().toLowerCase();

        return interviews
            .filter((interview) => {
                const searchableValues = [
                    interview.user_id,
                    interview.interview_id,
                    interview.job_role,
                    interview.interview_type,
                    interview.experience_level,
                    interview.difficulty,
                    interview.status,
                ];

                const matchesSearch =
                    !searchText ||
                    searchableValues.some((value) =>
                        String(value ?? "")
                            .toLowerCase()
                            .includes(searchText)
                    );

                const matchesStatus =
                    filters.status === "all" ||
                    String(interview.status || "").toLowerCase() ===
                    filters.status;

                const matchesExperience =
                    filters.experience === "all" ||
                    String(interview.experience_level || "").toLowerCase() ===
                    filters.experience.toLowerCase();

                const matchesDifficulty =
                    filters.difficulty === "all" ||
                    String(interview.difficulty || "").toLowerCase() ===
                    filters.difficulty.toLowerCase();

                const interviewDate = getInterviewDate(interview.created_at);

                const matchesDate =
                    !filters.date ||
                    (interviewDate &&
                        interviewDate.toISOString().slice(0, 10) ===
                        filters.date);

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesExperience &&
                    matchesDifficulty &&
                    matchesDate
                );
            })
            .sort((a, b) => {
                const dateA = getInterviewDate(a.created_at)?.getTime() || 0;
                const dateB = getInterviewDate(b.created_at)?.getTime() || 0;

                return filters.sort === "oldest"
                    ? dateA - dateB
                    : dateB - dateA;
            });
    }, [interviews, search, filters]);

    return (
        <main className="admin-interviews-page">
            <div className="admin-interviews-heading">
                <div>
                    <span className="admin-interviews-eyebrow">
                        ADMINISTRATION
                    </span>
                    <h1>Interview Management</h1>
                    <p>
                        View, search and filter interviews created by users.
                    </p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-interviews-back-btn"
                >
                    ← Dashboard
                </Link>
            </div>


            <section className="admin-interviews-toolbar combined-toolbar">
                {/* LEFT: TOTAL INTERVIEWS */}
                <div className="admin-interviews-summary-icon">▤</div>
                <div className="admin-interviews-summary-info">
                    <span>Total Interviews</span>
                    <strong>{interviews.length}</strong>
                </div>

                {/* RIGHT: SEARCH BAR */}
                <div className="admin-interviews-search">
                    <span aria-hidden="true">⌕</span>

                    <input
                        type="search"
                        placeholder="Search user, role, status..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Search interviews"
                    />

                    {search && (
                        <button
                            type="button"
                            className="admin-interviews-search-clear"
                            onClick={() => setSearch("")}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* FILTER DROPDOWN */}
                <div className="admin-filter-wrapper">
                    <button
                        type="button"
                        className={`admin-filter-button ${activeFilterCount > 0 ? "active" : ""
                            }`}
                        onClick={() =>
                            setFilterMenuOpen((previous) => !previous)
                        }
                        aria-expanded={filterMenuOpen}
                        aria-haspopup="true"
                    >
                        <span>☷ Filters</span>

                        {activeFilterCount > 0 && (
                            <span className="admin-filter-count">
                                Active
                            </span>
                        )}

                        <span className="admin-filter-chevron">
                            {filterMenuOpen ? "▲" : "▼"}
                        </span>
                    </button>

                    {filterMenuOpen && (
                        <div className="admin-filter-dropdown">
                            <div className="admin-filter-dropdown-header">
                                <div>
                                    <h3>Filter Interviews</h3>
                                    <p>Refine the interview list</p>
                                </div>

                                <button
                                    type="button"
                                    className="admin-filter-clear"
                                    onClick={clearFilters}
                                >
                                    Clear all
                                </button>
                            </div>

                            <div className="admin-filter-field">
                                <label htmlFor="interview-filter-status">Status</label>
                                <select
                                    id="interview-filter-status"
                                    value={filters.status}
                                    onChange={(event) =>
                                        updateFilter("status", event.target.value)
                                    }
                                >
                                    {STATUS_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-filter-field">
                                <label htmlFor="interview-filter-experience">
                                    Experience Level
                                </label>
                                <select
                                    id="interview-filter-experience"
                                    value={filters.experience}
                                    onChange={(event) =>
                                        updateFilter("experience", event.target.value)
                                    }
                                >
                                    {EXPERIENCE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-filter-field">
                                <label htmlFor="interview-filter-difficulty">
                                    Difficulty
                                </label>
                                <select
                                    id="interview-filter-difficulty"
                                    value={filters.difficulty}
                                    onChange={(event) =>
                                        updateFilter("difficulty", event.target.value)
                                    }
                                >
                                    {DIFFICULTY_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-filter-field">
                                <label htmlFor="interview-filter-date">Created Date</label>
                                <input
                                    id="interview-filter-date"
                                    type="date"
                                    value={filters.date}
                                    onChange={(event) =>
                                        updateFilter("date", event.target.value)
                                    }
                                />
                            </div>

                            <div className="admin-filter-field">
                                <label htmlFor="interview-filter-sort">Sort By</label>
                                <select
                                    id="interview-filter-sort"
                                    value={filters.sort}
                                    onChange={(event) =>
                                        updateFilter("sort", event.target.value)
                                    }
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                className="admin-filter-apply"
                                onClick={() => setFilterMenuOpen(false)}
                            >
                                Show {filteredInterviews.length} Interviews
                            </button>
                        </div>
                    )}
                </div>

                {/* RIGHT: REFRESH */}
                <button
                    type="button"
                    className="admin-interviews-refresh-btn"
                    onClick={() => fetchInterviews(true)}
                    disabled={loading || refreshing}
                >
                    <span aria-hidden="true">↻</span>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </section>

            <section className="admin-interviews-table-card">
                <div className="admin-interviews-table-heading">
                    <div>
                        <h2>All Interviews</h2>
                        <p>
                            Showing {filteredInterviews.length} of{" "}
                            {interviews.length} interviews
                        </p>
                    </div>

                    {(search || activeFilterCount > 0) && (
                        <button
                            type="button"
                            className="admin-interviews-reset-btn"
                            onClick={clearFilters}
                        >
                            Reset filters
                        </button>
                    )}
                </div>

                {error && (
                    <div className="admin-interviews-error" role="alert">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => fetchInterviews()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="admin-interviews-state">
                        <span className="admin-interviews-spinner" />
                        <p>Loading interviews...</p>
                    </div>
                ) : !error && filteredInterviews.length === 0 ? (
                    <div className="admin-interviews-state">
                        <div className="admin-interviews-empty-icon">⌕</div>
                        <h3>No interviews found</h3>
                        <p>
                            Try changing your search or clearing the filters.
                        </p>
                        <button
                            type="button"
                            className="admin-interviews-reset-btn"
                            onClick={clearFilters}
                        >
                            Clear search and filters
                        </button>
                    </div>
                ) : !error ? (
                    <div className="admin-interviews-table-scroll">
                        <table className="admin-interviews-table">
                            <thead>
                                <tr>
                                    <th>Interview ID</th>
                                    <th>User ID</th>
                                    <th>Job Role</th>
                                    <th>Type</th>
                                    <th>Experience</th>
                                    <th>Difficulty</th>
                                    <th>Questions</th>
                                    <th>Status</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredInterviews.map((interview, index) => (
                                    <tr
                                        key={
                                            interview._id ||
                                            interview.interview_id ||
                                            `${interview.user_id}-${index}`
                                        }
                                    >
                                        <td>
                                            <span className="admin-interviews-interview-id">
                                                {interview.interview_code || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="admin-interviews-user-id">
                                                {interview.user_id || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="admin-interviews-job-role">
                                                {interview.job_role || "—"}
                                            </span>
                                        </td>

                                        <td>{interview.interview_type || "—"}</td>

                                        <td>{interview.experience_level || "—"}</td>

                                        <td>
                                            <span
                                                className={`admin-interviews-difficulty difficulty-${String(
                                                    interview.difficulty || ""
                                                ).toLowerCase()}`}
                                            >
                                                {interview.difficulty || "—"}
                                            </span>
                                        </td>

                                        <td>{interview.number_of_questions ?? "—"}</td>

                                        <td>
                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    interview.status
                                                )}`}
                                            >
                                                {normalizeStatus(interview.status)}
                                            </span>
                                        </td>

                                        <td className="admin-interviews-date">
                                            {formatDate(interview.created_at)}
                                        </td>
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
