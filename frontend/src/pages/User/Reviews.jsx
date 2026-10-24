
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../context/User/Reviews.css";

function Reviews() {
    const [review, setReview] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(false);

    const fetchMyReview = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/reviews/mine");
            const existingReview = response.data.review || null;

            setReview(existingReview);

            if (existingReview) {
                setRating(existingReview.rating);
                setComment(existingReview.comment || "");
            } else {
                setRating(5);
                setComment("");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your review. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReview();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!comment.trim()) {
            setError("Please write your review.");
            return;
        }

        if (comment.trim().length > 1000) {
            setError("Review cannot exceed 1000 characters.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                rating,
                comment: comment.trim(),
            };

            const response = review
                ? await api.put("/api/reviews/mine", payload)
                : await api.post("/api/reviews", payload);

            const savedReview = response.data.review;

            setReview(savedReview);
            setRating(savedReview.rating);
            setComment(savedReview.comment || "");
            setEditing(false);
            setMessage(
                response.data.message || "Your review has been saved."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save your review."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                "Are you sure you want to delete your review?"
            )
        ) {
            return;
        }

        setError("");
        setMessage("");

        try {
            setSaving(true);

            const response = await api.delete("/api/reviews/mine");

            setReview(null);
            setRating(5);
            setComment("");
            setEditing(false);
            setMessage(
                response.data.message || "Your review has been deleted."
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete your review."
            );
        } finally {
            setSaving(false);
        }
    };

    const startEditing = () => {
        setRating(review.rating);
        setComment(review.comment || "");
        setEditing(true);
        setMessage("");
        setError("");
    };

    const cancelEditing = () => {
        setRating(review.rating);
        setComment(review.comment || "");
        setEditing(false);
        setMessage("");
        setError("");
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "hidden":
                return "Hidden by admin";
            default:
                return "Pending approval";
        }
    };

    const getRatingLabel = (value) => {
        switch (value) {
            case 1:
                return "Poor";
            case 2:
                return "Fair";
            case 3:
                return "Good";
            case 4:
                return "Very Good";
            default:
                return "Excellent";
        }
    };

    return (
        <div className="reviews-page">
            <div className="reviews-container">

                {loading ? (
                    <>
                        <div className="reviews-topbar">
                            <div className="topbar-placeholder" />
                            <div className="topbar-placeholder" />
                        </div>

                        <div className="reviews-loading-card">
                            <div className="reviews-loader" />
                            <h2>Loading your review...</h2>
                            <p>Please wait a moment.</p>
                        </div>
                    </>
                ) : (
                    <div className="reviews-layout">
                        {/* TOP BAR INSIDE THE MAIN CARD */}
                        <div className="reviews-topbar">

                            <Link
                                to="/dashboard"
                                className="reviews-back-btn"
                            >
                                <span className="topbar-btn-text">
                                    <span className="topbar-arrow">
                                        ←
                                    </span>
                                    Back to Dashboard
                                </span>
                            </Link>

                            <div className="reviews-top-label">
                                <span>Your Feedback Matters</span>
                            </div>

                        </div>

                        {/* LEFT INTRO PANEL */}
                        <aside className="reviews-intro">

                            <div className="reviews-intro-icon">
                                ⭐
                            </div>

                            <span className="reviews-eyebrow">
                                AI INTERVIEW ASSIST
                            </span>

                            <h1>
                                Your Feedback
                                <span> Makes Us Better.</span>
                            </h1>

                            <p className="reviews-intro-text">
                                Tell us about your experience and help us
                                make interview preparation better for everyone.
                            </p>

                            <div className="reviews-benefits">

                                <div className="reviews-benefit">
                                    <span className="reviews-benefit-icon">
                                        ✦
                                    </span>

                                    <div>
                                        <strong>Share your experience</strong>
                                        <p>Tell us what worked well for you.</p>
                                    </div>
                                </div>

                                <div className="reviews-benefit">
                                    <span className="reviews-benefit-icon">
                                        ✓
                                    </span>

                                    <div>
                                        <strong>Your voice matters</strong>
                                        <p>Help us improve the platform.</p>
                                    </div>
                                </div>

                                <div className="reviews-benefit">
                                    <span className="reviews-benefit-icon">
                                        ♡
                                    </span>

                                    <div>
                                        <strong>Help other learners</strong>
                                        <p>
                                            Your approved review can help others.
                                        </p>
                                    </div>
                                </div>

                            </div>

                            <div className="reviews-quote">
                                <span className="reviews-quote-mark">“</span>
                                <p>
                                    Every suggestion helps us build a better
                                    interview preparation experience.
                                </p>
                            </div>

                        </aside>

                        {/* RIGHT REVIEW PANEL */}
                        <main className="reviews-form-card">

                            <div className="reviews-form-heading">
                                <div>
                                    <span className="reviews-section-label">
                                        YOUR REVIEW
                                    </span>

                                    <h2>
                                        {review && !editing
                                            ? "Your Submitted Review"
                                            : editing
                                                ? "Edit Your Review"
                                                : "Share Your Experience"}
                                    </h2>

                                    <p>
                                        Rate your experience and tell us what
                                        you think.
                                    </p>
                                </div>

                                <div className="reviews-heading-star">
                                    ✦
                                </div>
                            </div>

                            {message && (
                                <div
                                    className="review-message success"
                                    role="status"
                                >
                                    ✓ {message}
                                </div>
                            )}

                            {error && (
                                <div
                                    className="review-message error"
                                    role="alert"
                                >
                                    {error}
                                </div>
                            )}

                            {/* DISPLAY EXISTING REVIEW */}
                            {review && !editing ? (
                                <div className="my-review">

                                    <div className="my-review-top">
                                        <h3>Your Feedback</h3>

                                        <span
                                            className={`review-status ${review.status || "pending"}`}
                                        >
                                            {getStatusLabel(review.status)}
                                        </span>
                                    </div>

                                    <div
                                        className="review-stars display-stars"
                                        aria-label={`${review.rating} out of 5 stars`}
                                    >
                                        {"★".repeat(review.rating)}
                                        {"☆".repeat(
                                            5 - review.rating
                                        )}
                                    </div>

                                    <div className="reviews-rating-summary">
                                        <strong>
                                            {Number(review.rating).toFixed(1)}
                                        </strong>
                                        <span>out of 5 stars</span>
                                    </div>

                                    <div className="my-review-comment">
                                        {review.comment}
                                    </div>

                                    {review.status !== "approved" && (
                                        <div className="review-note">
                                            <span>ⓘ</span>
                                            Your review will appear publicly
                                            after admin approval.
                                        </div>
                                    )}

                                    <div className="review-actions">
                                        <button
                                            type="button"
                                            className="review-btn primary"
                                            disabled={saving}
                                            onClick={startEditing}
                                        >
                                            ✎ Edit Review
                                        </button>

                                        <button
                                            type="button"
                                            className="review-btn danger"
                                            disabled={saving}
                                            onClick={handleDelete}
                                        >
                                            {saving
                                                ? "Deleting..."
                                                : "Delete Review"}
                                        </button>
                                    </div>

                                </div>
                            ) : (
                                /* REVIEW FORM */
                                <form
                                    className="review-form"
                                    onSubmit={handleSubmit}
                                >

                                    <label className="review-label">
                                        How was your experience?
                                    </label>

                                    <div
                                        className="rating-selector"
                                        role="group"
                                        aria-label="Choose a rating from 1 to 5 stars"
                                    >
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`rating-star ${star <= rating ? "active" : ""
                                                    }`}
                                                onClick={() => setRating(star)}
                                                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                                aria-pressed={rating === star}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>

                                    <p className="rating-caption">
                                        {getRatingLabel(rating)}
                                    </p>

                                    <label
                                        htmlFor="review-comment"
                                        className="review-label"
                                    >
                                        Tell us more
                                    </label>

                                    <textarea
                                        id="review-comment"
                                        className="review-textarea"
                                        placeholder="What did you like? How did AI Interview Assist help you prepare?"
                                        value={comment}
                                        onChange={(e) =>
                                            setComment(e.target.value)
                                        }
                                        maxLength={1000}
                                        rows={6}
                                        required
                                    />

                                    <div className="review-character-count">
                                        {comment.length}/1000 characters
                                    </div>

                                    <div className="review-actions">
                                        <button
                                            type="submit"
                                            className="review-btn primary"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? "Saving..."
                                                : review
                                                    ? "Update Review →"
                                                    : "Submit Review →"}
                                        </button>

                                        {editing && (
                                            <button
                                                type="button"
                                                className="review-btn secondary"
                                                disabled={saving}
                                                onClick={cancelEditing}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>

                                    <p className="review-note">
                                        <span>🔒</span>
                                        Reviews are checked by the admin
                                        before being displayed publicly.
                                    </p>

                                </form>
                            )}

                        </main>

                    </div>
                )}
            </div>
        </div>
    );
}

export default Reviews;