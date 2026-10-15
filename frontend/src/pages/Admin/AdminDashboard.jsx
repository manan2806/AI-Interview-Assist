import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div style={styles.page}>
            <header style={styles.navbar}>
                <div>
                    <h2 style={styles.logo}>AI Interview Assist</h2>
                    <span style={styles.badge}>ADMIN PANEL</span>
                </div>

                <button onClick={handleLogout} style={styles.logout}>
                    Logout
                </button>
            </header>

            <main style={styles.container}>
                <section style={styles.welcome}>
                    <p style={styles.eyebrow}>ADMIN DASHBOARD</p>
                    <h1>Welcome, {user.name || "Admin"}!</h1>
                    <p>
                        Manage your AI Interview Assist platform from here.
                    </p>
                </section>

                <section style={styles.grid}>
                    <div style={styles.card}>
                        <h3>Admin Profile</h3>
                        <p><strong>Name:</strong> {user.name || "N/A"}</p>
                        <p><strong>Email:</strong> {user.email || "N/A"}</p>
                        <p><strong>Role:</strong> {user.role || "N/A"}</p>
                    </div>

                    <div style={styles.card}>
                        <h3>User Management</h3>
                        <p>Manage registered users on the platform.</p>
                        <span style={styles.comingSoon}>Coming soon</span>
                    </div>

                    <div style={styles.card}>
                        <h3>Interview Management</h3>
                        <p>Monitor interview activity and results.</p>
                        <span style={styles.comingSoon}>Coming soon</span>
                    </div>

                    <div style={styles.card}>
                        <h3>Platform Overview</h3>
                        <p>View platform statistics and activity.</p>
                        <span style={styles.comingSoon}>Coming soon</span>
                    </div>
                </section>
            </main>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f3f6fc",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
    },
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 5%",
        background: "#ffffff",
        borderBottom: "1px solid #e5eaf3",
        gap: "16px",
        flexWrap: "wrap",
    },
    logo: {
        margin: 0,
        color: "#4f46e5",
        fontSize: "22px",
    },
    badge: {
        display: "inline-block",
        marginTop: "7px",
        fontSize: "11px",
        fontWeight: "bold",
        letterSpacing: "1px",
        color: "#4f46e5",
    },
    logout: {
        padding: "10px 20px",
        background: "#ef4444",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px 24px",
    },
    welcome: {
        padding: "30px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
        color: "#ffffff",
        marginBottom: "28px",
    },
    eyebrow: {
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "2px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
    },
    card: {
        background: "#ffffff",
        border: "1px solid #e5eaf3",
        borderRadius: "14px",
        padding: "24px",
        boxShadow: "0 5px 18px rgba(15, 23, 42, 0.04)",
    },
    comingSoon: {
        display: "inline-block",
        marginTop: "10px",
        padding: "6px 10px",
        background: "#eef2ff",
        color: "#4f46e5",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: "bold",
    },
};

export default AdminDashboard;