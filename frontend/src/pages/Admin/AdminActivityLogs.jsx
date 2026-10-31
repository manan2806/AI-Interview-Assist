import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../context/Admin/AdminInterview.css";
import "../../context/Admin/AdminActivityLogs.css";

const DEFAULT_FILTERS = {
    role: "all",
    action: "all",
    start_date: "",
    end_date: "",
    sort: "newest",
};

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAction(action) {
    return String(action || "unknown")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActionClass(action) {
    const value = String(action || "").toLowerCase();
    if (value.includes("login") || value.includes("register")) return "activity-success";
    if (value.includes("logout")) return "activity-logout";
    if (value.includes("delete")) return "activity-delete";
    if (value.includes("password")) return "activity-password";
    if (value.includes("interview")) return "activity-interview";
    if (value.includes("profile")) return "activity-profile";
    return "activity-default";
}

function AdminActivityLogs() {
    const navigate = useNavigate();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [filterOptions, setFilterOptions] = useState({
        actions: [],
        roles: ["user", "admin"],
        users: [],
    });
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchFilterOptions = useCallback(async () => {
        try {
            const response = await api.get("/api/admin/activity-logs/filters");
            if (response.data?.success) {
                setFilterOptions({
                    actions: response.data.actions || [],
                    roles: response.data.roles || ["user", "admin"],
                    users: response.data.users || [],
                });
            }
        } catch (err) {
            console.error("Unable to load activity filters:", err);
        }
    }, []);

    const fetchActivities = useCallback(async (isRefresh = false) => {
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
            const params = {
                page,
                per_page: perPage,
                search: search.trim(),
                role: filters.role === "all" ? "" : filters.role,
                action: filters.action === "all" ? "" : filters.action,
                start_date: filters.start_date,
                end_date: filters.end_date,
            };
            Object.keys(params).forEach((key) => {
                if (params[key] === "") delete params[key];
            });
            const response = await api.get("/api/admin/activity-logs", { params });
            const data = response.data;
            setActivities(data.activities || []);
            setTotal(data.total || 0);
            setTotalPages(data.total_pages || 1);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                navigate("/login");
                return;
            }
            setError(
                err?.response?.data?.message ||
                "Unable to load activity logs. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate, page, perPage, search, filters]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!event.target.closest(".admin-filter-wrapper")) {
                setFilterMenuOpen(false);
            }
        }
        function handleEscape(event) {
            if (event.key === "Escape") setFilterMenuOpen(false);
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
        setPage(1);
    };

    const activeFilterCount = [
        filters.role !== "all",
        filters.action !== "all",
        Boolean(filters.start_date),
        Boolean(filters.end_date),
        filters.sort !== "newest",
    ].filter(Boolean).length;

    const sortedActivities = useMemo(() => {
        return [...activities].sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return filters.sort === "oldest" ? dateA - dateB : dateB - dateA;
        });
    }, [activities, filters.sort]);

    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterChange = (key, value) => {
        updateFilter(key, value);
        setPage(1);
    };

    return (
        <main className="admin-interviews-page admin-activity-page">
            <div className="admin-interviews-heading">
                <div>
                    <span className="admin-interviews-eyebrow">ADMINISTRATION</span>
                    <h1>Activity Logs</h1>
                    <p>
                        Monitor login, logout, profile updates, interviews
                        and account activities of all users and administrators.
                    </p>
                </div>
                <Link to="/admin-dashboard" className="admin-interviews-back-btn">
                    ← Dashboard
                </Link>
            </div>
            <section className="admin-interviews-toolbar combined-toolbar">
                <div className="admin-interviews-summary-icon">📜</div>
                <div className="admin-interviews-summary-info">
                    <span>Total Activity Logs</span>
                    <strong>{total}</strong>
                </div>
                <div className="admin-interviews-search">
                    <span aria-hidden="true">⌕</span>
                    <input
                        type="search"
                        placeholder="Search user, email, action..."
                        value={search}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        aria-label="Search activity logs"
                    />
                    {search && (
                        <button
                            type="button"
                            className="admin-interviews-search-clear"
                            onClick={() => handleSearchChange("")}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="admin-filter-wrapper">
                    <button
                        type="button"
                        className={`admin-filter-button ${activeFilterCount > 0 ? "active" : ""}`}
                        onClick={() => setFilterMenuOpen((previous) => !previous)}
                        aria-expanded={filterMenuOpen}
                        aria-haspopup="true"
                    >
                        <span>☷ Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="admin-filter-count">Active</span>
                        )}
                        <span className="admin-filter-chevron">
                            {filterMenuOpen ? "▲" : "▼"}
                        </span>
                    </button>
                    {filterMenuOpen && (
                        <div className="admin-filter-dropdown">
                            <div className="admin-filter-dropdown-header">
                                <div>
                                    <h3>Filter Activity Logs</h3>
                                    <p>Refine the activity list</p>
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
                                <label htmlFor="activity-filter-role">Account Role</label>
                                <select
                                    id="activity-filter-role"
                                    value={filters.role}
                                    onChange={(event) => handleFilterChange("role", event.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Users</option>
                                    <option value="admin">Administrators</option>
                                </select>
                            </div>
                            <div className="admin-filter-field">
                                <label htmlFor="activity-filter-action">Activity Type</label>
                                <select
                                    id="activity-filter-action"
                                    value={filters.action}
                                    onChange={(event) => handleFilterChange("action", event.target.value)}
                                >
                                    <option value="all">All Activities</option>
                                    {filterOptions.actions.map((action) => (
                                        <option key={action} value={action}>
                                            {formatAction(action)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="admin-filter-field">
                                <label htmlFor="activity-start-date">Start Date</label>
                                <input
                                    id="activity-start-date"
                                    type="date"
                                    value={filters.start_date}
                                    max={filters.end_date || undefined}
                                    onChange={(event) => handleFilterChange("start_date", event.target.value)}
                                />
                            </div>
                            <div className="admin-filter-field">
                                <label htmlFor="activity-end-date">End Date</label>
                                <input
                                    id="activity-end-date"
                                    type="date"
                                    value={filters.end_date}
                                    min={filters.start_date || undefined}
                                    onChange={(event) => handleFilterChange("end_date", event.target.value)}
                                />
                            </div>
                            <div className="admin-filter-field">
                                <label htmlFor="activity-filter-sort">Sort By</label>
                                <select
                                    id="activity-filter-sort"
                                    value={filters.sort}
                                    onChange={(event) => updateFilter("sort", event.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                className="admin-filter-apply"
                                onClick={() => {
                                    setPage(1);
                                    setFilterMenuOpen(false);
                                }}
                            >
                                Show Activity Logs
                            </button>
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    className="admin-interviews-refresh-btn"
                    onClick={() => {
                        fetchFilterOptions();
                        fetchActivities(true);
                    }}
                    disabled={loading || refreshing}
                >
                    <span aria-hidden="true">↻</span>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </section>
            <section className="admin-interviews-table-card">
                <div className="admin-interviews-table-heading">
                    <div>
                        <h2>All Activity Logs</h2>
                        <p>Showing {activities.length} of {total} activities</p>
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
                        <button type="button" onClick={() => fetchActivities()}>
                            Try again
                        </button>
                    </div>
                )}
                {loading ? (
                    <div className="admin-interviews-state">
                        <span className="admin-interviews-spinner" />
                        <p>Loading activity logs...</p>
                    </div>
                ) : !error && sortedActivities.length === 0 ? (
                    <div className="admin-interviews-state">
                        <div className="admin-interviews-empty-icon">📜</div>
                        <h3>No activity logs found</h3>
                        <p>Try changing your search or clearing the filters.</p>
                        <button
                            type="button"
                            className="admin-interviews-reset-btn"
                            onClick={clearFilters}
                        >
                            Clear search and filters
                        </button>
                    </div>
                ) : !error ? (
                    <>
                        <div className="admin-interviews-table-scroll">
                            <table className="admin-interviews-table activity-logs-table">
                                <thead>
                                    <tr>
                                        <th>Log ID</th>
                                        <th>User Details</th>
                                        <th>Role</th>
                                        <th>Activity</th>
                                        <th>Description</th>
                                        <th>IP Address</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedActivities.map((activity, index) => (
                                        <tr key={activity.log_id || `${activity.user_id}-${index}`}>
                                            <td>
                                                <span className="admin-interviews-user-id">
                                                    {activity.log_id || "—"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="activity-table-user">
                                                    <strong>{activity.user_name || "Unknown User"}</strong>
                                                    <span>{activity.user_email || "—"}</span>
                                                    <small>{activity.user_id || "—"}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`activity-role-tag ${String(activity.role).toLowerCase() === "admin" ? "admin" : "user"}`}>
                                                    {activity.role || "user"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`activity-action-tag ${getActionClass(activity.action)}`}>
                                                    {formatAction(activity.action)}
                                                </span>
                                            </td>
                                            <td className="activity-table-description">
                                                {activity.description || "—"}
                                            </td>
                                            <td>{activity.ip_address || "—"}</td>
                                            <td className="admin-interviews-date">
                                                {formatDate(activity.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="activity-logs-pagination">
                            <p>Page {page} of {totalPages}</p>
                            <div>
                                <button
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => setPage((previous) => previous - 1)}
                                >
                                    ← Previous
                                </button>
                                <span>{page}</span>
                                <button
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((previous) => previous + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                ) : null}
            </section>
        </main>
    );
}

export default AdminActivityLogs;