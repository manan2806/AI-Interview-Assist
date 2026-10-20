import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "../../context/User/Profile.css";
import "../../context/User/Announcements.css";

const TYPE_LABELS = {
    general: "General",
    feature: "New Feature",
    maintenance: "Maintenance",
    important: "Important",
};

function Announcements() {
    const [items, setItems] = useState([]);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        filter !== "all" ||
        typeFilter !== "all" ||
        startDate !== "" ||
        endDate !== "" ||
        sortOrder !== "newest";

    const clearFilters = () => {
        setSearchTerm("");
        setFilter("all");
        setTypeFilter("all");
        setStartDate("");
        setEndDate("");
        setSortOrder("newest");
    };

    const loadAnnouncements = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/announcements");

            setItems(response.data.announcements || []);
            setUnreadCount(response.data.unread_count || 0);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load announcements. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    const markAsRead = async (item) => {
        if (item.is_read || updatingId === item.id) return;

        setUpdatingId(item.id);
        setError("");

        try {
            await api.post(`/api/announcements/${item.id}/read`);

            setItems((previous) =>
                previous.map((entry) =>
                    entry.id === item.id
                        ? { ...entry, is_read: true }
                        : entry
                )
            );

            setUnreadCount((previous) => Math.max(0, previous - 1));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update announcement status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const visibleItems = items
        .filter((item) => {
            if (filter === "unread" && item.is_read) return false;
            if (filter === "read" && !item.is_read) return false;

            const search = searchTerm.trim().toLowerCase();

            if (search) {
                const searchableText = [
                    item.title,
                    item.message,
                    TYPE_LABELS[item.type],
                    item.created_by_name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!searchableText.includes(search)) return false;
            }

            // Announcement type filter
            if (typeFilter !== "all" && item.type !== typeFilter) {
                return false;
            }

            // Date filters
            const announcementDate = item.created_at
                ? new Date(item.created_at)
                : null;

            if (startDate) {
                if (
                    !announcementDate ||
                    Number.isNaN(announcementDate.getTime()) ||
                    announcementDate < new Date(`${startDate}T00:00:00`)
                ) {
                    return false;
                }
            }

            if (endDate) {
                if (
                    !announcementDate ||
                    Number.isNaN(announcementDate.getTime()) ||
                    announcementDate > new Date(`${endDate}T23:59:59.999`)
                ) {
                    return false;
                }
            }

            return true;
        })
        .sort((a, b) => {
            const dateA = a.created_at
                ? new Date(a.created_at).getTime()
                : 0;

            const dateB = b.created_at
                ? new Date(b.created_at).getTime()
                : 0;

            return sortOrder === "newest"
                ? dateB - dateA
                : dateA - dateB;
        });

    if (loading && items.length === 0) {
        return (
            <div className="profile-page announcements-page">
                <div className="profile-container">
                    <div className="profile-loading">
                        <div className="profile-loader">⟳</div>
                        <h2>Loading Announcements...</h2>
                        <p>Please wait while we load your announcements.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page announcements-page">
            <div className="profile-container">

                {/* HEADER */}
                <div className="profile-header announcements-header">
                    <div>
                        <p className="profile-label">STAY UPDATED</p>
                        <h1>Announcements</h1>
                        <p>
                            Important updates, new features and maintenance notices.
                        </p>
                    </div>

                    <div className="announcements-header-actions">
                        <button
                            type="button"
                            className="announcements-refresh-btn"
                            onClick={loadAnnouncements}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>

                        <Link
                            to="/dashboard"
                            className="announcements-back-btn"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>

                {/* MESSAGES */}
                {error && (
                    <div className="profile-error" role="alert">
                        {error}
                        {!items.length && (
                            <button
                                type="button"
                                className="announcements-retry-btn"
                                onClick={loadAnnouncements}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                )}

                {/* SUMMARY */}
                <div className="announcements-summary">
                    <div className="announcements-summary-card total">
                        <span className="announcements-summary-icon">📢</span>
                        <div>
                            <p>Total Announcements</p>
                            <h2>{items.length}</h2>
                        </div>
                    </div>

                    <div className="announcements-summary-card unread">
                        <span className="announcements-summary-icon">🔔</span>
                        <div>
                            <p>Unread Announcements</p>
                            <h2>{unreadCount}</h2>
                        </div>
                    </div>
                </div>

                {/* ANNOUNCEMENTS CARD */}
                <div className="profile-card announcements-main-card">

                    {/* SEARCH AND FILTER TOOLBAR */}
                    <div className="announcements-toolbar">
                        <div>
                            <h2>All Notifications</h2>
                            <p>
                                {visibleItems.length} of {items.length} announcements
                            </p>
                        </div>

                        <div className="announcements-search-toolbar">
                            {/* Search */}
                            <input
                                type="search"
                                className="announcements-advanced-search"
                                placeholder="Search title, message or admin..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                aria-label="Search announcements"
                            />

                            {/* Filters */}
                            <div className="announcements-filter-wrapper">
                                <button
                                    type="button"
                                    className={`announcements-filter-button ${hasActiveFilters ? "active" : ""
                                        }`}
                                    onClick={() =>
                                        setFilterMenuOpen((previous) => !previous)
                                    }
                                    aria-expanded={filterMenuOpen}
                                >
                                    <span>☷ Filters</span>
                                    {hasActiveFilters && <span>Active</span>}
                                    <span>{filterMenuOpen ? "▲" : "▼"}</span>
                                </button>

                                {filterMenuOpen && (
                                    <div className="announcements-filter-dropdown">
                                        <div className="announcements-filter-dropdown-header">
                                            <strong>Filter Announcements</strong>

                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>

                                        <label>
                                            Read Status
                                            <select
                                                value={filter}
                                                onChange={(event) => setFilter(event.target.value)}
                                            >
                                                <option value="all">All announcements</option>
                                                <option value="unread">Unread</option>
                                                <option value="read">Read</option>
                                            </select>
                                        </label>

                                        <label>
                                            Announcement Type
                                            <select
                                                value={typeFilter}
                                                onChange={(event) => setTypeFilter(event.target.value)}
                                            >
                                                <option value="all">All types</option>
                                                <option value="general">General</option>
                                                <option value="feature">New Feature</option>
                                                <option value="maintenance">Maintenance</option>
                                                <option value="important">Important</option>
                                            </select>
                                        </label>

                                        <label>
                                            From Date
                                            <input
                                                type="date"
                                                value={startDate}
                                                max={endDate || undefined}
                                                onChange={(event) => setStartDate(event.target.value)}
                                            />
                                        </label>

                                        <label>
                                            To Date
                                            <input
                                                type="date"
                                                value={endDate}
                                                min={startDate || undefined}
                                                onChange={(event) => setEndDate(event.target.value)}
                                            />
                                        </label>

                                        <label>
                                            Sort By
                                            <select
                                                value={sortOrder}
                                                onChange={(event) => setSortOrder(event.target.value)}
                                            >
                                                <option value="newest">Newest first</option>
                                                <option value="oldest">Oldest first</option>
                                            </select>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* LIST */}
                    {loading ? (
                        <div className="announcements-empty">
                            Refreshing announcements...
                        </div>
                    ) : visibleItems.length === 0 ? (
                        <div className="announcements-empty">
                            <span className="announcements-empty-icon">📭</span>
                            <h3>No announcements found</h3>
                            <p>
                                {filter === "unread"
                                    ? "You are all caught up. There are no unread announcements."
                                    : filter === "read"
                                        ? "You haven't read any announcements yet."
                                        : "New announcements will appear here when available."}
                            </p>
                        </div>
                    ) : (
                        <div className="announcements-table-wrapper">
                            <table className="announcements-table">
                                <thead>
                                    <tr>
                                        <th>Announcement</th>
                                        <th>Type</th>
                                        <th>Published Date</th>
                                        <th>Created By</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            className={item.is_read ? "is-read" : "is-unread"}
                                        >
                                            <td className="announcement-table-message">
                                                <strong>{item.title}</strong>

                                                <button
                                                    type="button"
                                                    className="announcement-view-details"
                                                    onClick={() => setSelectedAnnouncement(item)}
                                                >
                                                    View Details →
                                                </button>
                                            </td>

                                            <td>
                                                <span
                                                    className={`announcement-type type-${item.type}`}
                                                >
                                                    {TYPE_LABELS[item.type] || "Announcement"}
                                                </span>
                                            </td>

                                            <td>
                                                {item.created_at
                                                    ? new Date(item.created_at).toLocaleString()
                                                    : "Date unavailable"}
                                            </td>

                                            <td>{item.created_by_name || "Admin"}</td>

                                            <td>
                                                {item.is_read ? (
                                                    <span className="announcement-status-badge read">
                                                        ✓ Read
                                                    </span>
                                                ) : (
                                                    <span className="announcement-status-badge unread">
                                                        ● Unread
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {!item.is_read ? (
                                                    <button
                                                        type="button"
                                                        className="announcement-mark-read"
                                                        onClick={() => markAsRead(item)}
                                                        disabled={updatingId === item.id}
                                                    >
                                                        {updatingId === item.id
                                                            ? "Saving..."
                                                            : "✓ Mark as Read"}
                                                    </button>
                                                ) : (
                                                    <span className="announcement-read-label">
                                                        ✓ Read
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ANNOUNCEMENT DETAILS MODAL */}
                {selectedAnnouncement && (
                    <div
                        className="announcement-modal-overlay"
                        onClick={() => setSelectedAnnouncement(null)}
                    >
                        <section
                            className="announcement-modal-card"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="announcement-modal-title"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="announcement-modal-header">
                                <div>
                                    <span
                                        className={`announcement-modal-label announcement-type-badge ${selectedAnnouncement.type || "general"
                                            }`}
                                    >
                                        {TYPE_LABELS[selectedAnnouncement.type] || "ANNOUNCEMENT"}
                                    </span>

                                    <h2 id="announcement-modal-title">
                                        {selectedAnnouncement.title}
                                    </h2>

                                    <p>View your announcement details.</p>
                                </div>

                                <button
                                    type="button"
                                    className="announcement-modal-close"
                                    onClick={() => setSelectedAnnouncement(null)}
                                    aria-label="Close announcement details"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="announcement-modal-info">
                                <div>
                                    <span>Published Date</span>
                                    <strong>
                                        {selectedAnnouncement.created_at
                                            ? new Date(selectedAnnouncement.created_at).toLocaleString()
                                            : "Date unavailable"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Admin Name</span>
                                    <strong>
                                        {selectedAnnouncement.created_by_name || "Admin"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Announcement Type</span>
                                    <strong>
                                        {TYPE_LABELS[selectedAnnouncement.type] || "Announcement"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Read Status</span>
                                    <strong
                                        className={`announcement-read-status ${selectedAnnouncement.is_read ? "read" : "unread"
                                            }`}
                                    >
                                        {selectedAnnouncement.is_read ? "✓ Read" : "● Unread"}
                                    </strong>
                                </div>
                            </div>

                            <div className="announcement-modal-message">
                                <h3>Complete Message</h3>
                                <p>{selectedAnnouncement.message}</p>
                            </div>

                            <div className="announcement-modal-actions">
                                <button
                                    type="button"
                                    className="announcement-modal-cancel"
                                    onClick={() => setSelectedAnnouncement(null)}
                                >
                                    Cancel
                                </button>

                                {!selectedAnnouncement.is_read && (
                                    <button
                                        type="button"
                                        className="announcement-modal-submit"
                                        disabled={updatingId === selectedAnnouncement.id}
                                        onClick={() => markAsRead(selectedAnnouncement)}
                                    >
                                        {updatingId === selectedAnnouncement.id
                                            ? "Saving..."
                                            : "✓ Mark as Read"}
                                    </button>
                                )}
                            </div>
                        </section>
                    </div>
                )}



            </div>
        </div>
    );
}

export default Announcements;