import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminUsers.css";

function AdminUsers() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/api/admin/users");

            if (response.data?.success) {
                setUsers(
                    Array.isArray(response.data.users)
                        ? response.data.users
                        : []
                );
            } else {
                setError(
                    response.data?.message || "Unable to load users."
                );
            }
        } catch (err) {
            console.error("Admin users error:", err);
            console.error("API URL:", err.config?.url);
            console.error("Status:", err.response?.status);
            console.error("Response data:", err.response?.data);

            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
            } else if (err.response?.status === 403) {
                setError("Admin access denied.");
            } else if (err.response?.status === 404) {
                setError("Users API route not found.");
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to load users. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        fetchUsers();
    }, [navigate, fetchUsers]);

    const filteredUsers = users.filter((user) => {
        const query = search.trim().toLowerCase();

        return (
            String(user.name || "").toLowerCase().includes(query) ||
            String(user.email || "").toLowerCase().includes(query) ||
            String(user.role || "").toLowerCase().includes(query)
        );
    });

    return (
        <main className="admin-users-page">
            <header className="admin-users-header">
                <div>
                    <p className="admin-users-eyebrow">
                        ADMINISTRATION
                    </p>

                    <h1>User Management</h1>

                    <p>
                        View and search registered platform accounts.
                    </p>
                </div>

                <Link
                    to="/admin-dashboard"
                    className="admin-users-back"
                >
                    ← Dashboard
                </Link>
            </header>

            <section className="admin-users-toolbar">
                <div className="admin-users-count">
                    <span>Total Users</span>
                    <strong>{loading ? "..." : users.length}</strong>
                </div>

                <input
                    type="search"
                    className="admin-users-search"
                    placeholder="Search name, email or role..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search users"
                />

                <button
                    type="button"
                    className="admin-users-refresh"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "↻ Refresh"}
                </button>
            </section>

            {error && (
                <div className="admin-users-error" role="alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={fetchUsers}
                        disabled={loading}
                    >
                        Try Again
                    </button>
                </div>
            )}

            <section className="admin-users-table-card">
                <div className="admin-users-table-heading">
                    <h2>Registered Accounts</h2>
                    <span>{filteredUsers.length} results</span>
                </div>

                {loading ? (
                    <div className="admin-users-empty">
                        Loading users...
                    </div>
                ) : !error && filteredUsers.length === 0 ? (
                    <div className="admin-users-empty">
                        {search
                            ? "No users match your search."
                            : "No registered users found."}
                    </div>
                ) : !error ? (
                    <div className="admin-users-table-wrapper">
                        <table className="admin-users-table">
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map((user) => (
                                    <tr key={user.user_id}>
                                        <td>
                                            <div className="admin-user-id-cell">
                                                <span>{user.user_id || "—"}</span>
                                                {user.user_id && (
                                                    <button
                                                        type="button"
                                                        className="admin-copy-id-btn"
                                                        title="Copy User ID"
                                                        aria-label={`Copy user ID ${user.user_id}`}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.user_id);
                                                        }}
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            width="15"
                                                            height="15"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <rect x="8" y="8" width="13" height="13" rx="2" />
                                                            <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <div className="admin-users-identity">
                                                <span className="admin-users-avatar">
                                                    {(user.name || "U")
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>

                                                <strong>
                                                    {user.name || "Unnamed User"}
                                                </strong>
                                            </div>
                                        </td>

                                        <td>
                                            {user.email || "—"}
                                        </td>

                                        <td>
                                            <span className="admin-users-role">
                                                {user.role || "user"}
                                            </span>
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

export default AdminUsers;
