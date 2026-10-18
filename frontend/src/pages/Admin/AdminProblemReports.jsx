
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminProblemReports.css";

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

function AdminProblemReports() {
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const [selectedReport, setSelectedReport] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState("");
    const [notice, setNotice] = useState("");

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        typeFilter !== "all" ||
        dateFilter !== "all";

    const clearFilters = () => {
        setStatusFilter("all");
        setTypeFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    const loadReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/problem-reports");

            if (response.data?.success) {
                setReports(
                    Array.isArray(response.data.reports)
                        ? response.data.reports
                        : []
                );
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load problem reports."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load reports. Please try again."
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

        loadReports();
    }, [navigate, loadReports]);

    const reportTypes = useMemo(
        () => [
            ...new Set(
                reports
                    .map((report) => report.problem_type)
                    .filter(Boolean)
            ),
        ].sort(),
        [reports]
    );

    const filteredReports = useMemo(() => {
        const query = search.trim().toLowerCase();
        const now = new Date();

        return reports
            .filter((report) => {
                const matchesSearch = [
                    report.report_id,
                    report.user_name,
                    report.user_email,
                    report.subject,
                    report.problem_type,
                    report.description,
                    report.user_id,
                ].some((value) =>
                    String(value || "").toLowerCase().includes(query)
                );

                const matchesStatus =
                    statusFilter === "all" ||
                    String(report.status || "Open").toLowerCase() ===
                    statusFilter.toLowerCase();

                const matchesType =
                    typeFilter === "all" ||
                    report.problem_type === typeFilter;

                let matchesDate = true;

                if (dateFilter !== "all") {
                    const created = new Date(report.created_at);

                    if (
                        !report.created_at ||
                        Number.isNaN(created.getTime())
                    ) {
                        matchesDate = false;
                    } else if (dateFilter === "today") {
                        matchesDate =
                            created.getFullYear() === now.getFullYear() &&
                            created.getMonth() === now.getMonth() &&
                            created.getDate() === now.getDate();
                    } else {
                        const days = Number(
                            dateFilter.replace("days", "")
                        );

                        const cutoff = new Date(
                            now.getTime() -
                            days * 24 * 60 * 60 * 1000
                        );

                        matchesDate =
                            created >= cutoff && created <= now;
                    }
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType &&
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
    }, [
        reports,
        search,
        statusFilter,
        typeFilter,
        dateFilter,
        sortBy,
    ]);

    const statusCounts = useMemo(
        () => ({
            total: reports.length,
            open: reports.filter(
                (report) => report.status === "Open"
            ).length,
            progress: reports.filter(
                (report) => report.status === "In Progress"
            ).length,
            resolved: reports.filter(
                (report) => report.status === "Resolved"
            ).length,
        }),
        [reports]
    );

    const openDetails = async (reportId) => {
        setDetailsLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await api.get(
                `/api/admin/problem-reports/${encodeURIComponent(reportId)}`
            );

            if (response.data?.success) {
                setSelectedReport(response.data.report);
            } else {
                setError(
                    response.data?.message ||
                    "Unable to load report details."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load report details."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    const updateStatus = async (reportId, newStatus) => {
        if (!STATUS_OPTIONS.includes(newStatus)) return;

        setUpdatingId(reportId);
        setNotice("");
        setError("");

        try {
            const response = await api.patch(
                `/api/admin/problem-reports/${encodeURIComponent(reportId)}/status`,
                { status: newStatus }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to update report status."
                );
            }

            setReports((previous) =>
                previous.map((report) =>
                    report.report_id === reportId
                        ? { ...report, status: newStatus }
                        : report
                )
            );

            setSelectedReport((previous) =>
                previous?.report_id === reportId
                    ? {
                        ...previous,
                        status: newStatus,
                        updated_at:
                            response.data.report?.updated_at ||
                            previous.updated_at,
                    }
                    : previous
            );

            setNotice(`Report ${reportId} updated to ${newStatus}.`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update report status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const getStatusClass = (status) => {
        if (status === "Resolved") return "resolved";
        if (status === "In Progress") return "in-progress";
        return "open";
    };

    return (
        <main className="admin-reports-page">
            <header className="admin-reports-header">
                <div>
                    <p className="admin-reports-eyebrow">
                        ADMINISTRATION
                    </p>
                    <h1>Problem Reports</h1>
                    <p>
                        Review user-submitted issues and track their resolution.
                    </p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-reports-back"
                >
                    ← Dashboard
                </Link>
            </header>

            {notice && (
                <div className="reports-notice reports-success" role="status">
                    <span>{notice}</span>
                    <button
                        type="button"
                        onClick={() => setNotice("")}
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div className="reports-notice reports-error" role="alert">
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="reports-stats-grid">
                <article className="reports-stat-card stat-purple">
                    <span className="reports-stat-icon">📋</span>
                    <div>
                        <p>Total Reports</p>
                        <h2>{loading ? "..." : statusCounts.total}</h2>
                    </div>
                </article>

                <article className="reports-stat-card stat-orange">
                    <span className="reports-stat-icon">📨</span>
                    <div>
                        <p>Open</p>
                        <h2>{loading ? "..." : statusCounts.open}</h2>
                    </div>
                </article>

                <article className="reports-stat-card stat-blue">
                    <span className="reports-stat-icon">⚙️</span>
                    <div>
                        <p>In Progress</p>
                        <h2>{loading ? "..." : statusCounts.progress}</h2>
                    </div>
                </article>

                <article className="reports-stat-card stat-green">
                    <span className="reports-stat-icon">✓</span>
                    <div>
                        <p>Resolved</p>
                        <h2>{loading ? "..." : statusCounts.resolved}</h2>
                    </div>
                </article>
            </section>

            <section className="reports-content-card">
                <div className="reports-toolbar">
                    <div>
                        <h2>Problem Report Records</h2>
                        <p>
                            {loading
                                ? "Loading reports..."
                                : `${filteredReports.length} out of ${reports.length} results`}
                        </p>
                    </div>

                    <div className="admin-reports-toolbar">
                        {/* Search */}
                        <input
                            type="search"
                            className="admin-reports-search"
                            placeholder="Search subject, user or ID..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search problem reports"
                        />

                        {/* Filters */}
                        <div className="admin-filter-wrapper">
                            <button
                                type="button"
                                className={`admin-filter-button ${hasActiveFilters ? "active" : ""
                                    }`}
                                onClick={() =>
                                    setFilterMenuOpen((previous) => !previous)
                                }
                                aria-expanded={filterMenuOpen}
                            >
                                <span>☷ Filters</span>

                                {hasActiveFilters && (
                                    <span className="admin-filter-count">
                                        Active
                                    </span>
                                )}

                                <span>
                                    {filterMenuOpen ? "▲" : "▼"}
                                </span>
                            </button>

                            {/* Filter Dropdown */}
                            {filterMenuOpen && (
                                <div className="admin-filter-dropdown">
                                    <div className="admin-filter-dropdown-header">
                                        <strong>Filter Reports</strong>

                                        {(search.trim() !== "" ||
                                            statusFilter !== "all" ||
                                            typeFilter !== "all" ||
                                            dateFilter !== "all" ||
                                            sortBy !== "newest") && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="admin-filter-clear"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                    </div>

                                    {/* Status */}
                                    <label>
                                        Status
                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(event.target.value)
                                            }
                                        >
                                            <option value="all">All statuses</option>
                                            <option value="Open">Open</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                        </select>
                                    </label>

                                    {/* Problem Type */}
                                    <label>
                                        Problem type
                                        <select
                                            value={typeFilter}
                                            onChange={(event) =>
                                                setTypeFilter(event.target.value)
                                            }
                                        >
                                            <option value="all">All problem types</option>

                                            {reportTypes.map((type) => (
                                                <option key={type} value={type}>
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {/* Submitted Date */}
                                    <label>
                                        Submitted date
                                        <select
                                            value={dateFilter}
                                            onChange={(event) =>
                                                setDateFilter(event.target.value)
                                            }
                                        >
                                            <option value="all">Any time</option>
                                            <option value="today">Today</option>
                                            <option value="7days">Last 7 days</option>
                                            <option value="30days">Last 30 days</option>
                                            <option value="90days">Last 90 days</option>
                                        </select>
                                    </label>

                                    {/* Sorting */}
                                    <label>
                                        Sort by
                                        <select
                                            value={sortBy}
                                            onChange={(event) =>
                                                setSortBy(event.target.value)
                                            }
                                        >
                                            <option value="newest">Newest first</option>
                                            <option value="oldest">Oldest first</option>
                                        </select>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Refresh */}
                        <button
                            type="button"
                            className="admin-reports-refresh"
                            onClick={loadReports}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="reports-state">
                        <div className="reports-spinner" />
                        <p>Loading problem reports...</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="reports-state">
                        <span className="reports-empty-icon">📭</span>
                        <h3>No reports found</h3>
                        <p>
                            {reports.length === 0
                                ? "No problem reports have been submitted yet."
                                : "Try changing your search or filters."}
                        </p>
                    </div>
                ) : (
                    <div className="reports-table-wrapper">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Report ID</th>
                                    <th>Subject</th>
                                    <th>Submitted By</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredReports.map((report) => (
                                    <tr key={report.report_id}>
                                        <td>
                                            <span className="reports-id">
                                                {report.report_id || "—"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="reports-subject">
                                                {report.subject || "Untitled"}
                                            </div>
                                            <div className="reports-description-preview">
                                                {report.description || ""}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="reports-user-name">
                                                {report.user_name || "Unknown"}
                                            </div>
                                            <div className="reports-user-email">
                                                {report.user_email || "—"}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="reports-type">
                                                {report.problem_type || "Other"}
                                            </span>
                                        </td>
                                        <td className="reports-date">
                                            {formatDate(report.created_at)}
                                        </td>
                                        <td>
                                            <span
                                                className={`reports-status ${getStatusClass(
                                                    report.status
                                                )}`}
                                            >
                                                {report.status || "Open"}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="reports-view-btn"
                                                onClick={() =>
                                                    openDetails(report.report_id)
                                                }
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {detailsLoading && (
                <div className="reports-modal-overlay">
                    <div className="reports-modal reports-loading-modal">
                        <div className="reports-spinner" />
                        <p>Loading report details...</p>
                    </div>
                </div>
            )}

            {selectedReport && (
                <div
                    className="reports-modal-overlay"
                    onClick={() => setSelectedReport(null)}
                >
                    <section
                        className="reports-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-details-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="reports-modal-header">
                            <div>
                                <span className="reports-modal-eyebrow">
                                    {selectedReport.report_id}
                                </span>
                                <h2 id="report-details-title">
                                    Report Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="reports-modal-close"
                                onClick={() => setSelectedReport(null)}
                                aria-label="Close report details"
                            >
                                ×
                            </button>
                        </header>

                        <div className="reports-modal-body">
                            <div className="reports-detail-highlight">
                                <span className="reports-detail-label">
                                    Subject
                                </span>
                                <h3>
                                    {selectedReport.subject || "Untitled"}
                                </h3>
                            </div>

                            <div className="reports-detail-grid">
                                <div>
                                    <span className="reports-detail-label">
                                        Submitted By
                                    </span>
                                    <p>
                                        {selectedReport.user_name || "Unknown"}
                                    </p>
                                </div>

                                <div>
                                    <span className="reports-detail-label">
                                        Email
                                    </span>
                                    <p>{selectedReport.user_email || "—"}</p>
                                </div>

                                <div>
                                    <span className="reports-detail-label">
                                        Problem Type
                                    </span>
                                    <p>
                                        {selectedReport.problem_type || "Other"}
                                    </p>
                                </div>

                                <div>
                                    <span className="reports-detail-label">
                                        Submitted At
                                    </span>
                                    <p>
                                        {formatDate(selectedReport.created_at)}
                                    </p>
                                </div>

                                <div>
                                    <span className="reports-detail-label">
                                        Last Updated
                                    </span>
                                    <p>
                                        {formatDate(selectedReport.updated_at)}
                                    </p>
                                </div>

                                <div>
                                    <span className="reports-detail-label">
                                        User ID
                                    </span>
                                    <p>{selectedReport.user_id || "—"}</p>
                                </div>
                            </div>

                            <div className="reports-full-description">
                                <span className="reports-detail-label">
                                    Description
                                </span>
                                <p>
                                    {selectedReport.description ||
                                        "No description provided."}
                                </p>
                            </div>

                            <div className="reports-status-editor">
                                <label htmlFor="report-status-select">
                                    Update Report Status
                                </label>

                                <select
                                    id="report-status-select"
                                    value={selectedReport.status || "Open"}
                                    onChange={(event) =>
                                        updateStatus(
                                            selectedReport.report_id,
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        updatingId === selectedReport.report_id
                                    }
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>

                                {updatingId === selectedReport.report_id && (
                                    <span className="reports-updating-text">
                                        Saving status...
                                    </span>
                                )}
                            </div>
                        </div>

                        <footer className="reports-modal-footer">
                            <button
                                type="button"
                                className="reports-close-btn"
                                onClick={() => setSelectedReport(null)}
                            >
                                Close
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </main>
    );
}

export default AdminProblemReports;
