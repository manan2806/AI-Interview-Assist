import { useEffect, useState } from "react";
import api from "../../services/api";
import "./AdminProfile.css";

function AdminProfile() {
    const [profile, setProfile] = useState({
        user_id: "",
        name: "",
        email: "",
        role: "admin",
        created_at: "",
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // ==========================================
    // FETCH ADMIN PROFILE
    // ==========================================
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/api/admin/profile");
            const data = response.data;

            if (data.success && data.profile) {
                setProfile(data.profile);

                setFormData({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                });
            } else {
                setError(data.message || "Unable to load profile.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load admin profile."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // HANDLE INPUT CHANGE
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // ==========================================
    // ENABLE EDIT MODE
    // ==========================================
    const handleEdit = () => {
        setFormData({
            name: profile.name || "",
            email: profile.email || "",
        });

        setError("");
        setMessage("");
        setEditing(true);
    };

    // ==========================================
    // CANCEL EDIT
    // ==========================================
    const handleCancel = () => {
        setFormData({
            name: profile.name || "",
            email: profile.email || "",
        });

        setEditing(false);
        setError("");
        setMessage("");
    };

    // ==========================================
    // SAVE PROFILE
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        const name = formData.name.trim();
        const email = formData.email.trim().toLowerCase();

        if (!name || !email) {
            setError("Name and email are required.");
            return;
        }

        if (name.length > 100) {
            setError("Name cannot exceed 100 characters.");
            return;
        }

        if (email.length > 254) {
            setError("Email cannot exceed 254 characters.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.patch(
                "/api/admin/profile",
                { name, email }
            );

            const data = response.data;

            if (data.success && data.profile) {
                setProfile(data.profile);

                setFormData({
                    name: data.profile.name || "",
                    email: data.profile.email || "",
                });

                setEditing(false);
                setMessage(
                    data.message || "Profile updated successfully."
                );
            } else {
                setError(data.message || "Unable to update profile.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to update admin profile."
            );
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // FORMAT ACCOUNT CREATION DATE
    // ==========================================
    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "Not available";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return String(dateValue);
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // ==========================================
    // LOADING STATE
    // ==========================================
    if (loading) {
        return (
            <div className="admin-profile-page">
                <div className="admin-profile-loading">
                    <div className="admin-profile-spinner"></div>
                    <p>Loading admin profile...</p>
                </div>
            </div>
        );
    }

    // ==========================================
    // PROFILE PAGE
    // ==========================================
    return (
        <div className="admin-profile-page">
            <div className="admin-profile-container">

                <div className="admin-profile-heading">
                    <div>
                        <h1>My Profile</h1>
                        <p>View and manage your admin profile information.</p>
                    </div>

                    {!editing && (
                        <button
                            type="button"
                            className="admin-profile-edit-btn"
                            onClick={handleEdit}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>

                {error && (
                    <div className="admin-profile-alert error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="admin-profile-alert success">
                        {message}
                    </div>
                )}

                <div className="admin-profile-card">

                    <div className="admin-profile-banner">
                        <div className="admin-profile-avatar">
                            {(profile.name || "A")
                                .trim()
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="admin-profile-banner-info">
                            <h2>{profile.name || "Admin"}</h2>
                            <p>{profile.email || "No email available"}</p>
                            <span className="admin-profile-role">
                                {profile.role || "admin"}
                            </span>
                        </div>
                    </div>

                    {editing ? (
                        <form
                            className="admin-profile-form"
                            onSubmit={handleSubmit}
                        >
                            <h3>Edit Profile Information</h3>

                            <div className="admin-profile-field">
                                <label htmlFor="admin-name">
                                    Full Name
                                </label>

                                <input
                                    id="admin-name"
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your name"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="admin-profile-field">
                                <label htmlFor="admin-email">
                                    Email Address
                                </label>

                                <input
                                    id="admin-email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    maxLength={254}
                                    required
                                />
                            </div>

                            <div className="admin-profile-actions">
                                <button
                                    type="button"
                                    className="admin-profile-cancel-btn"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="admin-profile-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="admin-profile-details">
                            <h3>Profile Information</h3>

                            <div className="admin-profile-detail-grid">
                                <div className="admin-profile-detail">
                                    <span>Full Name</span>
                                    <strong>{profile.name || "Not available"}</strong>
                                </div>

                                <div className="admin-profile-detail">
                                    <span>Email Address</span>
                                    <strong>{profile.email || "Not available"}</strong>
                                </div>

                                <div className="admin-profile-detail">
                                    <span>Admin Role</span>
                                    <strong className="admin-profile-role-text">
                                        {profile.role || "admin"}
                                    </strong>
                                </div>

                                <div className="admin-profile-detail">
                                    <span>Account Created</span>
                                    <strong>
                                        {formatDate(profile.created_at)}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default AdminProfile;
