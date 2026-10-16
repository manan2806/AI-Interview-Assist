import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminProfile.css";

function AdminProfile() {
    const [profile, setProfile] = useState({
        user_id: "",
        name: "",
        email: "",
        role: "admin",
    });

    const [form, setForm] = useState({
        name: "",
        email: "",
    });

    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/api/admin/profile");

                if (response.data?.success) {
                    const data = response.data.profile;

                    setProfile(data);
                    setForm({
                        name: data.name || "",
                        email: data.email || "",
                    });
                } else {
                    setError(
                        response.data?.message ||
                        "Unable to load profile."
                    );
                }
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load admin profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleCancel = () => {
        setForm({
            name: profile.name || "",
            email: profile.email || "",
        });

        setEditing(false);
        setError("");
        setMessage("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!form.name.trim() || !form.email.trim()) {
            setError("Name and email are required.");
            return;
        }

        setSaving(true);

        try {
            const response = await api.patch(
                "/api/admin/profile",
                {
                    name: form.name.trim(),
                    email: form.email.trim(),
                }
            );

            if (response.data?.success) {
                const updatedProfile = response.data.profile;

                setProfile(updatedProfile);
                setForm({
                    name: updatedProfile.name,
                    email: updatedProfile.email,
                });

                setEditing(false);
                setMessage("Profile updated successfully.");

                // Keep cached user details in sync, if available.
                try {
                    const cachedUser = JSON.parse(
                        localStorage.getItem("user") || "null"
                    );

                    if (cachedUser) {
                        localStorage.setItem(
                            "user",
                            JSON.stringify({
                                ...cachedUser,
                                name: updatedProfile.name,
                                email: updatedProfile.email,
                                user_id: updatedProfile.user_id,
                                role: updatedProfile.role,
                            })
                        );
                    }
                } catch {
                    // Profile is already saved on the backend.
                }
            } else {
                setError(
                    response.data?.message ||
                    "Unable to update profile."
                );
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="admin-profile-page">
                <div className="admin-profile-card">
                    Loading admin profile...
                </div>
            </main>
        );
    }

    return (
        <main className="admin-profile-page">
            <header className="admin-profile-header">
                <div>
                    <p className="admin-profile-eyebrow">
                        ADMINISTRATION
                    </p>
                    <h1>My Profile</h1>
                    <p>View and manage your administrator details.</p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-profile-back"
                >
                    ← Dashboard
                </Link>
            </header>

            <section className="admin-profile-card">
                <div className="admin-profile-identity">
                    <div className="admin-profile-avatar">
                        {(profile.name || "A")
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div>
                        <h2>{profile.name || "Administrator"}</h2>
                        <span className="admin-profile-role">
                            {profile.role || "admin"}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="admin-profile-error" role="alert">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="admin-profile-success" role="status">
                        {message}
                    </div>
                )}

                {!editing ? (
                    <>
                        <div className="admin-profile-details">
                            <div className="admin-profile-field">
                                <label>Admin User ID</label>
                                <p>{profile.user_id || "—"}</p>
                            </div>

                            <div className="admin-profile-field">
                                <label>Full Name</label>
                                <p>{profile.name || "—"}</p>
                            </div>

                            <div className="admin-profile-field">
                                <label>Email Address</label>
                                <p>{profile.email || "—"}</p>
                            </div>

                            <div className="admin-profile-field">
                                <label>Account Role</label>
                                <p>{profile.role || "admin"}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="admin-profile-primary"
                            onClick={() => {
                                setError("");
                                setMessage("");
                                setEditing(true);
                            }}
                        >
                            ✎ Edit Profile
                        </button>
                    </>
                ) : (
                    <form
                        className="admin-profile-form"
                        onSubmit={handleSave}
                    >
                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-name">
                                Full Name
                            </label>

                            <input
                                id="admin-profile-name"
                                name="name"
                                type="text"
                                value={form.name}
                                onChange={handleChange}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="admin-profile-field">
                            <label htmlFor="admin-profile-email">
                                Email Address
                            </label>

                            <input
                                id="admin-profile-email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                maxLength={254}
                                required
                            />
                        </div>

                        <div className="admin-profile-actions">
                            <button
                                type="submit"
                                className="admin-profile-primary"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                className="admin-profile-secondary"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    );
}

export default AdminProfile;