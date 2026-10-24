
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminReviews.css";

const STATUS_OPTIONS = ["pending", "approved", "hidden"];

function AdminReviews() {
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");

    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const [selectedReview, setSelectedReview] = useState(null);
    const [updatingId, setUpdatingId] = useState("");
    const [deletingId, setDeletingId] = useState("");

    const hasActiveFilters =
        search.trim() !== "" ||
        statusFilter !== "all" ||
        ratingFilter !== "all" ||
        dateFilter !== "all";

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setRatingFilter("all");
        setDateFilter("all");
        setSortBy("newest");
    };

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/reviews");

            if (response.data?.success) {
                setReviews(
                    Array.isArray(response.data.reviews)
                        ? response.data.reviews
                        : []
                );
            } else {
                setError(
                    response.data?.message || "Unable to load reviews."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load reviews. Please try again."
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

        loadReviews();
    }, [navigate, loadReviews]);

    const normalizeStatus = (status) =>
        String(status || "pending").toLowerCase();

    const reviewCounts = useMemo(
        () => ({
            total: reviews.length,
            pending: reviews.filter(
                (review) => normalizeStatus(review.status) === "pending"
            ).length,
            approved: reviews.filter(
                (review) => normalizeStatus(review.status) === "approved"
            ).length,
            hidden: reviews.filter(
                (review) => normalizeStatus(review.status) === "hidden"
            ).length,
        }),
        [reviews]
    );

    const filteredReviews = useMemo(() => {
        const query = search.trim().toLowerCase();
        const now = new Date();

        return reviews
            .filter((review) => {
                const matchesSearch = [
                    review.review_id,
                    review.user_id,
                    review.name,
                    review.comment,
                    review.rating,
                ].some((value) =>
                    String(value ?? "").toLowerCase().includes(query)
                );

                const matchesStatus =
                    statusFilter === "all" ||
                    normalizeStatus(review.status) === statusFilter;

                const matchesRating =
                    ratingFilter === "all" ||
                    Number(review.rating) === Number(ratingFilter);

                let matchesDate = true;

                if (dateFilter !== "all") {
                    const created = new Date(review.created_at);

                    if (
                        !review.created_at ||
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
                            now.getTime() - days * 24 * 60 * 60 * 1000
                        );

                        matchesDate = created >= cutoff && created <= now;
                    }
                }

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesRating &&
                    matchesDate
                );
            })
            .sort((a, b) => {
                if (sortBy === "highest") {
                    return Number(b.rating || 0) - Number(a.rating || 0);
                }

                if (sortBy === "lowest") {
                    return Number(a.rating || 0) - Number(b.rating || 0);
                }

                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();

                return sortBy === "oldest"
                    ? dateA - dateB
                    : dateB - dateA;
            });
    }, [reviews, search, statusFilter, ratingFilter, dateFilter, sortBy]);

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return date.toLocaleString();
    };

    const getStatusClass = (status) => {
        const normalized = normalizeStatus(status);

        if (normalized === "approved") return "approved";
        if (normalized === "hidden") return "hidden";
        return "pending";
    };

    const updateStatus = async (review, newStatus) => {
        if (!STATUS_OPTIONS.includes(newStatus)) return;

        if (normalizeStatus(review.status) === newStatus) return;

        setUpdatingId(review.review_id);
        setNotice("");
        setError("");

        try {
            const response = await api.patch(
                `/api/admin/reviews/${encodeURIComponent(review.review_id)}/status`,
                { status: newStatus }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Unable to update review status."
                );
            }

            const updatedReview = {
                ...review,
                ...(response.data.review || {}),
                status: newStatus,
            };

            setReviews((previous) =>
                previous.map((item) =>
                    item.review_id === review.review_id
                        ? { ...item, ...updatedReview }
                        : item
                )
            );

            setSelectedReview((previous) =>
                previous?.review_id === review.review_id
                    ? { ...previous, ...updatedReview }
                    : previous
            );

            setNotice(
                `Review ${review.review_id} is now ${newStatus}.`
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to update review status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const deleteReview = async (review) => {
        const confirmed = window.confirm(
            `Delete this review from ${review.name || "this user"} permanently?`
        );

        if (!confirmed) return;

        setDeletingId(review.review_id);
        setNotice("");
        setError("");

        try {
            const response = await api.delete(
                `/api/admin/reviews/${encodeURIComponent(review.review_id)}`
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message || "Unable to delete review."
                );
            }

            setReviews((previous) =>
                previous.filter(
                    (item) => item.review_id !== review.review_id
                )
            );

            setSelectedReview((previous) =>
                previous?.review_id === review.review_id ? null : previous
            );

            setNotice("Review deleted successfully.");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Unable to delete review."
            );
        } finally {
            setDeletingId("");
        }
    };

    return (
        <main className="admin-reviews-page">
            <header className="admin-reviews-header">
                <div>
                    <p className="admin-reviews-eyebrow">ADMINISTRATION</p>
                    <h1>Review Management</h1>
                    <p>
                        Review user feedback, moderate ratings and manage
                        published reviews.
                    </p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-reviews-back"
                >
                    ← Dashboard
                </Link>
            </header>

            {notice && (
                <div className="review-notice review-success" role="status">
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
                <div className="review-notice review-error" role="alert">
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

            <section className="review-stats-grid">
                <article className="review-stat-card review-stat-purple">
                    <span className="review-stat-icon">⭐</span>
                    <div>
                        <p>Total Reviews</p>
                        <h2>{loading ? "..." : reviewCounts.total}</h2>
                    </div>
                </article>

                <article className="review-stat-card review-stat-orange">
                    <span className="review-stat-icon">⏳</span>
                    <div>
                        <p>Pending</p>
                        <h2>{loading ? "..." : reviewCounts.pending}</h2>
                    </div>
                </article>

                <article className="review-stat-card review-stat-green">
                    <span className="review-stat-icon">✓</span>
                    <div>
                        <p>Approved</p>
                        <h2>{loading ? "..." : reviewCounts.approved}</h2>
                    </div>
                </article>

                <article className="review-stat-card review-stat-pink">
                    <span className="review-stat-icon">◉</span>
                    <div>
                        <p>Hidden</p>
                        <h2>{loading ? "..." : reviewCounts.hidden}</h2>
                    </div>
                </article>
            </section>

            <section className="reviews-content-card">
                <div className="reviews-toolbar">
                    <div>
                        <h2>User Reviews</h2>
                        <p>
                            {loading
                                ? "Loading reviews..."
                                : `${filteredReviews.length} out of ${reviews.length} results`}
                        </p>
                    </div>

                    <div className="admin-reviews-toolbar">
                        <input
                            type="search"
                            className="admin-reviews-search"
                            placeholder="Search user, comment or ID..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            aria-label="Search reviews"
                        />

                        <div className="reviews-filter-wrapper">
                            <button
                                type="button"
                                className={`reviews-filter-button ${hasActiveFilters ? "active" : ""
                                    }`}
                                onClick={() =>
                                    setFilterMenuOpen((previous) => !previous)
                                }
                                aria-expanded={filterMenuOpen}
                            >
                                <span>☷ Filters</span>
                                {hasActiveFilters && (
                                    <span className="reviews-filter-count">
                                        Active
                                    </span>
                                )}
                                <span>{filterMenuOpen ? "▲" : "▼"}</span>
                            </button>

                            {filterMenuOpen && (
                                <div className="reviews-filter-dropdown">
                                    <div className="reviews-filter-dropdown-header">
                                        <strong>Filter Reviews</strong>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="reviews-filter-clear"
                                        >
                                            Clear all
                                        </button>
                                    </div>

                                    <label>
                                        Status
                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(event.target.value)
                                            }
                                        >
                                            <option value="all">All statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="hidden">Hidden</option>
                                        </select>
                                    </label>

                                    <label>
                                        Rating
                                        <select
                                            value={ratingFilter}
                                            onChange={(event) =>
                                                setRatingFilter(event.target.value)
                                            }
                                        >
                                            <option value="all">All ratings</option>
                                            <option value="5">5 stars</option>
                                            <option value="4">4 stars</option>
                                            <option value="3">3 stars</option>
                                            <option value="2">2 stars</option>
                                            <option value="1">1 star</option>
                                        </select>
                                    </label>

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
                                            <option value="highest">Highest rating</option>
                                            <option value="lowest">Lowest rating</option>
                                        </select>
                                    </label>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className="admin-reviews-refresh"
                            onClick={loadReviews}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="reviews-state">
                        <div className="reviews-spinner" />
                        <p>Loading reviews...</p>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    <div className="reviews-state">
                        <span className="reviews-empty-icon">⭐</span>
                        <h3>No reviews found</h3>
                        <p>
                            {reviews.length === 0
                                ? "No user reviews have been submitted yet."
                                : "Try changing your search or filters."}
                        </p>
                    </div>
                ) : (
                    <div className="admin-reviews-table-wrapper">
                        <table className="admin-reviews-table">
                            <thead>
                                <tr>
                                    <th>Review ID</th>
                                    <th>Submitted By</th>
                                    <th>Rating</th>
                                    <th>Comment</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredReviews.map((review) => (
                                    <tr key={review.review_id}>
                                        <td>
                                            <span className="admin-review-id">
                                                {review.review_id || "—"}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-review-user">
                                                {review.name || "Unknown"}
                                            </div>
                                            <div className="admin-review-user-id">
                                                {review.user_id || "—"}
                                            </div>
                                        </td>

                                        <td>
                                            <span className="admin-review-rating">
                                                {"★".repeat(
                                                    Math.max(
                                                        0,
                                                        Math.min(5, Number(review.rating) || 0)
                                                    )
                                                )}
                                                <span className="admin-review-rating-number">
                                                    {Number(review.rating) || 0}/5
                                                </span>
                                            </span>
                                        </td>

                                        <td>
                                            <div className="admin-review-comment-preview">
                                                {review.comment || "No comment"}
                                            </div>
                                        </td>

                                        <td className="admin-review-date">
                                            {formatDate(review.created_at)}
                                        </td>

                                        <td>
                                            <span
                                                className={`admin-review-status ${getStatusClass(
                                                    review.status
                                                )}`}
                                            >
                                                {normalizeStatus(review.status)}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="admin-review-view-btn"
                                                onClick={() =>
                                                    setSelectedReview(review)
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

            {selectedReview && (
                <div
                    className="admin-review-modal-overlay"
                    onClick={() => setSelectedReview(null)}
                >
                    <section
                        className="admin-review-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-review-details-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="admin-review-modal-header">
                            <div>
                                <span className="admin-review-modal-eyebrow">
                                    {selectedReview.review_id || "User Review"}
                                </span>
                                <h2 id="admin-review-details-title">
                                    Review Details
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="admin-review-modal-close"
                                onClick={() => setSelectedReview(null)}
                                aria-label="Close review details"
                            >
                                ×
                            </button>
                        </header>

                        <div className="admin-review-modal-body">
                            <div className="admin-review-detail-highlight">
                                <span className="admin-review-detail-label">
                                    User Feedback
                                </span>
                                <div className="admin-review-modal-stars">
                                    {"★".repeat(
                                        Math.max(
                                            0,
                                            Math.min(
                                                5,
                                                Number(selectedReview.rating) || 0
                                            )
                                        )
                                    )}
                                    <span>
                                        {Number(selectedReview.rating) || 0} out of 5
                                    </span>
                                </div>
                                <p>
                                    {selectedReview.comment || "No comment provided."}
                                </p>
                            </div>

                            <div className="admin-review-detail-grid">
                                <div>
                                    <span className="admin-review-detail-label">
                                        Submitted By
                                    </span>
                                    <p>{selectedReview.name || "Unknown"}</p>
                                </div>

                                <div>
                                    <span className="admin-review-detail-label">
                                        User ID
                                    </span>
                                    <p>{selectedReview.user_id || "—"}</p>
                                </div>

                                <div>
                                    <span className="admin-review-detail-label">
                                        Submitted At
                                    </span>
                                    <p>{formatDate(selectedReview.created_at)}</p>
                                </div>

                                <div>
                                    <span className="admin-review-detail-label">
                                        Last Updated
                                    </span>
                                    <p>{formatDate(selectedReview.updated_at)}</p>
                                </div>

                                <div>
                                    <span className="admin-review-detail-label">
                                        Current Status
                                    </span>
                                    <p>
                                        <span
                                            className={`admin-review-status ${getStatusClass(
                                                selectedReview.status
                                            )}`}
                                        >
                                            {normalizeStatus(selectedReview.status)}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="admin-review-status-editor">
                                <label htmlFor="admin-review-status">
                                    Update Review Status
                                </label>

                                <select
                                    id="admin-review-status"
                                    value={normalizeStatus(selectedReview.status)}
                                    onChange={(event) =>
                                        updateStatus(
                                            selectedReview,
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        updatingId === selectedReview.review_id
                                    }
                                >
                                    {STATUS_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                            {status.charAt(0).toUpperCase() +
                                                status.slice(1)}
                                        </option>
                                    ))}
                                </select>

                                {updatingId === selectedReview.review_id && (
                                    <span className="admin-review-updating">
                                        Saving status...
                                    </span>
                                )}
                            </div>
                        </div>

                        <footer className="admin-review-modal-footer">
                            <button
                                type="button"
                                className="admin-review-delete-btn"
                                onClick={() => deleteReview(selectedReview)}
                                disabled={
                                    deletingId === selectedReview.review_id
                                }
                            >
                                {deletingId === selectedReview.review_id
                                    ? "Deleting..."
                                    : "🗑 Delete Review"}
                            </button>

                            <button
                                type="button"
                                className="admin-review-close-btn"
                                onClick={() => setSelectedReview(null)}
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

export default AdminReviews;
