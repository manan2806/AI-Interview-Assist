
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
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

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

    const visibleItems = items.filter((item) => {
        if (filter === "unread") return !item.is_read;
        if (filter === "read") return item.is_read;
        return true;
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

                    {/* FILTERS */}
                    <div className="announcements-toolbar">
                        <div>
                            <h2>All Notifications</h2>
                            <p>View and manage your latest updates.</p>
                        </div>

                        <div className="announcements-filters">
                            {[
                                { value: "all", label: "All" },
                                {
                                    value: "unread",
                                    label: `Unread (${unreadCount})`,
                                },
                                { value: "read", label: "Read" },
                            ].map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    className={
                                        filter === option.value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() => setFilter(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* LIST */}
                    {loading ? (
                        <div className="announcements-empty">
                            Refreshing announcements...
                        </div>
                    ) : visibleItems.length === 0 ? (
                        <div className="announcements-empty">
                            <span className="announcements-empty-icon">
                                📭
                            </span>
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
                        <div className="announcements-list">
                            {visibleItems.map((item) => (
                                <article
                                    key={item.id}
                                    className={`announcement-item ${item.is_read ? "is-read" : "is-unread"
                                        }`}
                                >
                                    <div className="announcement-item-top">
                                        <span
                                            className={`announcement-type type-${item.type}`}
                                        >
                                            {TYPE_LABELS[item.type] ||
                                                "Announcement"}
                                        </span>

                                        {!item.is_read && (
                                            <span className="announcement-new">
                                                New
                                            </span>
                                        )}
                                    </div>

                                    <div className="announcement-item-content">
                                        <h3>{item.title}</h3>
                                        <p className="announcement-message">
                                            {item.message}
                                        </p>
                                    </div>

                                    <div className="announcement-item-footer">
                                        <div className="announcement-meta">
                                            <span>
                                                🕒{" "}
                                                {item.created_at
                                                    ? new Date(
                                                        item.created_at
                                                    ).toLocaleString()
                                                    : "Date unavailable"}
                                            </span>

                                            <span>
                                                👤 By{" "}
                                                {item.created_by_name || "Admin"}
                                            </span>
                                        </div>

                                        {!item.is_read ? (
                                            <button
                                                type="button"
                                                className="announcement-mark-read"
                                                onClick={() => markAsRead(item)}
                                                disabled={
                                                    updatingId === item.id
                                                }
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
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Announcements;
