
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminAnnouncements.css";

const EMPTY_FORM = {
    title: "",
    message: "",
    type: "general",
    status: "draft",
    publish_at: "",
};

const TYPES = [
    { value: "general", label: "General" },
    { value: "feature", label: "New Feature" },
    { value: "maintenance", label: "Maintenance" },
    { value: "important", label: "Important" },
];

function toLocalDateTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (number) => String(number).padStart(2, "0");

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-` +
        `${pad(date.getDate())}T${pad(date.getHours())}:` +
        pad(date.getMinutes())
    );
}

function formatDate(value) {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString();
}

function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const loadAnnouncements = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/announcements");
            setAnnouncements(response.data.announcements || []);
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

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormOpen(false);
    };


    const startEditing = (item) => {
        setEditingId(item.id);

        setForm({
            title: item.title || "",
            message: item.message || "",
            type: item.type || "general",
            status: item.status || "draft",
            publish_at: toLocalDateTime(item.publish_at),
        });

        setError("");
        setNotice("");
        setFormOpen(true);

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setNotice("");
        setError("");

        const payload = {
            title: form.title.trim(),
            message: form.message.trim(),
            type: form.type,
            status: form.status,
            publish_at: form.publish_at
                ? new Date(form.publish_at).toISOString()
                : null,
        };

        try {
            if (editingId) {
                await api.put(
                    `/api/admin/announcements/${editingId}`,
                    payload
                );

                setNotice("Announcement updated successfully.");
            } else {
                await api.post("/api/admin/announcements", payload);

                setNotice("Announcement created successfully.");
            }

            resetForm();
            await loadAnnouncements();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save announcement. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        const confirmed = window.confirm(
            `Delete "${item.title}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setNotice("");
        setError("");

        try {
            await api.delete(`/api/admin/announcements/${item.id}`);

            if (editingId === item.id) {
                resetForm();
            }

            setNotice("Announcement deleted successfully.");
            await loadAnnouncements();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to delete announcement."
            );
        }
    };

    const filteredAnnouncements = announcements.filter((item) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            !query ||
            item.title?.toLowerCase().includes(query) ||
            item.message?.toLowerCase().includes(query);

        const matchesStatus =
            statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const publishedCount = announcements.filter(
        (item) => item.status === "published"
    ).length;

    const scheduledCount = announcements.filter(
        (item) => item.status === "scheduled"
    ).length;

    const draftCount = announcements.filter(
        (item) => item.status === "draft"
    ).length;

    return (
        <main className="admin-announcements-page">
            <header className="announcement-page-header">
                <div>
                    <p className="announcement-eyebrow">
                        COMMUNICATION CENTER
                    </p>

                    <h1>Announcements & Notifications</h1>

                    <p className="announcement-subtitle">
                        Keep users informed about updates, new features and maintenance.
                    </p>
                </div>

                <div className="announcement-header-actions">
                    <button
                        type="button"
                        className="announcement-refresh-btn"
                        onClick={loadAnnouncements}
                        disabled={loading}
                    >
                        {loading ? "Refreshing..." : "↻ Refresh"}
                    </button>

                    <Link
                        to="/admin-dashboard"
                        className="announcement-back-link"
                    >
                        ← Dashboard
                    </Link>
                </div>
            </header>


            {notice && (
                <div className="announcement-notice success" role="status">
                    {notice}
                    <button type="button" onClick={() => setNotice("")}>
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div className="announcement-notice error" role="alert">
                    {error}
                    <button type="button" onClick={() => setError("")}>
                        ×
                    </button>
                </div>
            )}

            <section className="announcement-stats">
                <article className="announcement-stat-card purple">
                    <span className="announcement-stat-icon">📢</span>
                    <div>
                        <p>Total announcements</p>
                        <strong>{announcements.length}</strong>
                    </div>
                </article>

                <article className="announcement-stat-card green">
                    <span className="announcement-stat-icon">✓</span>
                    <div>
                        <p>Published</p>
                        <strong>{publishedCount}</strong>
                    </div>
                </article>

                <article className="announcement-stat-card blue">
                    <span className="announcement-stat-icon">◷</span>
                    <div>
                        <p>Scheduled</p>
                        <strong>{scheduledCount}</strong>
                    </div>
                </article>

                <article className="announcement-stat-card orange">
                    <span className="announcement-stat-icon">✎</span>
                    <div>
                        <p>Drafts</p>
                        <strong>{draftCount}</strong>
                    </div>
                </article>
            </section>

            {formOpen && (
                <div
                    className="announcement-modal-overlay"
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !saving) {
                            resetForm();
                        }
                    }}
                >
                    <div
                        className="announcement-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="announcement-modal-title"
                    >
                        <div className="announcement-modal-header">
                            <div>
                                <span className="announcement-modal-label">
                                    Communication Center
                                </span>

                                <h2 id="announcement-modal-title">
                                    {editingId
                                        ? "Edit Announcement"
                                        : "Create Announcement"}
                                </h2>

                                <p>
                                    Publish an update or schedule a notification for users.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="announcement-modal-close"
                                onClick={resetForm}
                                disabled={saving}
                                aria-label="Close announcement form"
                            >
                                ×
                            </button>
                        </div>

                        {error && (
                            <div className="announcement-modal-error" role="alert">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="announcement-form announcement-modal-form"
                        >
                            <div className="announcement-form-grid">
                                <label>
                                    Announcement title

                                    <input
                                        name="title"
                                        value={form.title}
                                        onChange={updateField}
                                        maxLength={150}
                                        placeholder="e.g. New AI Interview Feature"
                                        required
                                    />
                                </label>

                                <label>
                                    Announcement type

                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={updateField}
                                    >
                                        {TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label>
                                Message

                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={updateField}
                                    rows={5}
                                    maxLength={5000}
                                    placeholder="Write the announcement for your users..."
                                    required
                                />

                                <span className="announcement-character-count">
                                    {form.message.length}/5000 characters
                                </span>
                            </label>

                            <div className="announcement-form-grid">
                                <label>
                                    Publishing status

                                    <select
                                        name="status"
                                        value={form.status}
                                        onChange={updateField}
                                    >
                                        <option value="draft">Save as draft</option>
                                        <option value="published">Publish now</option>
                                        <option value="scheduled">Schedule for later</option>
                                    </select>
                                </label>

                                {form.status === "scheduled" && (
                                    <label>
                                        Publish date and time

                                        <input
                                            type="datetime-local"
                                            name="publish_at"
                                            value={form.publish_at}
                                            onChange={updateField}
                                            min={toLocalDateTime(new Date().toISOString())}
                                            required
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="announcement-form-footer">
                                <p>
                                    <strong>Audience:</strong> All logged-in users
                                </p>

                                <div className="announcement-modal-actions">
                                    <button
                                        type="button"
                                        className="announcement-secondary-btn"
                                        onClick={resetForm}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="announcement-primary-btn"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : editingId
                                                ? "Save Changes"
                                                : form.status === "published"
                                                    ? "Publish Announcement"
                                                    : form.status === "scheduled"
                                                        ? "Schedule Announcement"
                                                        : "Save Draft"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MANAGE ANNOUNCEMENTS - Always visible */}
            <section className="announcement-list-card">

                <div className="announcement-section-heading">
                    <div>
                        <h2>Manage Announcements</h2>
                        <p>
                            {loading
                                ? "Loading announcements..."
                                : `${filteredAnnouncements.length} of ${announcements.length} announcements`}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="announcement-create-btn"
                        onClick={() => {
                            setForm(EMPTY_FORM);
                            setEditingId(null);
                            setError("");
                            setNotice("");
                            setFormOpen(true);
                        }}
                    >
                        + Create Announcement
                    </button>
                </div>


                <div className="announcement-toolbar">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title or message..."
                        aria-label="Search announcements"
                    />

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="draft">Drafts</option>
                    </select>
                </div>

                {loading ? (
                    <div className="announcement-empty">
                        Loading...
                    </div>
                ) : filteredAnnouncements.length === 0 ? (
                    <div className="announcement-empty">
                        <span>📭</span>
                        <h3>No announcements found</h3>
                        <p>
                            Create an announcement or change your search filters.
                        </p>
                    </div>
                ) : (
                    <div className="announcement-table-wrapper">
                        <table className="announcement-table">
                            <thead>
                                <tr>
                                    <th>Announcement</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Publish date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredAnnouncements.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="announcement-table-title">
                                                {item.title}
                                            </div>

                                            <p className="announcement-table-message">
                                                {item.message}
                                            </p>
                                        </td>

                                        <td>
                                            <span
                                                className={`announcement-type ${item.type}`}
                                            >
                                                {TYPES.find(
                                                    (type) => type.value === item.type
                                                )?.label || item.type}
                                            </span>
                                        </td>

                                        <td>
                                            <span
                                                className={`announcement-status ${item.status}`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>

                                        <td>{formatDate(item.publish_at)}</td>

                                        <td>
                                            <div className="announcement-row-actions">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(item)}
                                                    className="announcement-edit-btn"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="announcement-delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminAnnouncements;
