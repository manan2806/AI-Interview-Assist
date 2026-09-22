import {
    useEffect,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import {
    getUser,
    logout
} from "../utils/auth";


function Dashboard() {

    const navigate = useNavigate();

    // STATE
    const [user, setUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {

        try {

            setLoading(true);
            setError("");

            const storedUser =
                getUser();

            // CHECK USER
            if (!storedUser) {

                setError(
                    "Your session has expired. Please login again."
                );

                return;
            }

            setUser(
                storedUser
            );

        } catch (err) {

            console.error(
                "Dashboard User Error:",
                err
            );

            setError(
                "Unable to load dashboard. Please login again."
            );

        } finally {

            setLoading(false);

        }

    }, []);

    // LOGOUT
    const handleLogout = () => {
        try {

            logout();

            navigate("/", {
                replace: true
            });

        } catch (err) {

            console.error(
                "Logout Error:",
                err
            );

            // Error aaye tab bhi Home Page par redirect
            navigate("/", {
                replace: true
            });

        }

    };

    // LOADING
    if (loading) {

        return (

            <div className="dashboard-page">

                <div className="dashboard-loading">

                    <div className="dashboard-loader">
                        ⏳
                    </div>

                    <h2>
                        Loading Dashboard...
                    </h2>

                    <p>
                        Please wait while we load
                        your dashboard.
                    </p>

                </div>

            </div>

        );

    }

    // ERROR
    if (error || !user) {

        return (

            <div className="dashboard-page">

                <div className="dashboard-error">

                    <div className="dashboard-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Load Dashboard
                    </h2>

                    <p>
                        {error ||
                            "User information is not available."}
                    </p>

                    <button
                        className="dashboard-login-button"
                        onClick={() => {

                            logout();

                            navigate(
                                "/login",
                                {
                                    replace: true
                                }
                            );

                        }}
                    >
                        Go to Login
                    </button>

                </div>

            </div>

        );

    }

    // DASHBOARD
    return (

        <div className="dashboard-page">

            {/* NAVBAR */}
            <nav className="dashboard-navbar">

                <div className="dashboard-logo">

                    <div className="dashboard-logo-icon">
                        AI
                    </div>

                    <span>
                        Interview Assist
                    </span>

                </div>


                <div className="dashboard-nav-right">

                    <Link to="/profile">
                        Profile
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        Logout
                    </button>

                </div>

            </nav>


            {/* MAIN CONTENT */}
            <main className="dashboard-container">


                {/* WELCOME */}
                <section className="welcome-section">

                    <div>

                        <p className="welcome-label">
                            Welcome back 👋
                        </p>

                        <h1>
                            Hello, {user?.name || "User"}!
                        </h1>

                        <p className="welcome-text">
                            Ready to improve your interview
                            performance?
                        </p>

                    </div>


                    <Link
                        to="/interview/setup"
                        className="primary-button"
                    >
                        Start New Interview
                    </Link>

                </section>


                {/* PROFILE OVERVIEW */}
                <section className="dashboard-grid">

                    {/* TARGET ROLE */}
                    <div className="dashboard-card">

                        <div className="card-icon">
                            👤
                        </div>

                        <div>

                            <h3>
                                Target Role
                            </h3>

                            <p>
                                {user?.target_role ||
                                    "Not set"}
                            </p>

                        </div>

                    </div>


                    {/* EXPERIENCE LEVEL */}
                    <div className="dashboard-card">

                        <div className="card-icon">
                            🎓
                        </div>

                        <div>

                            <h3>
                                Experience Level
                            </h3>

                            <p>
                                {user?.experience_level ||
                                    "Fresher"}
                            </p>

                        </div>

                    </div>


                    {/* SKILLS */}
                    <div className="dashboard-card">

                        <div className="card-icon">
                            🛠️
                        </div>

                        <div>

                            <h3>
                                Skills
                            </h3>

                            <p>
                                {user?.skills?.length || 0}
                                {" "}
                                Skills Added
                            </p>

                        </div>

                    </div>


                    {/* INTERVIEWS */}
                    <div className="dashboard-card">

                        <div className="card-icon">
                            📊
                        </div>

                        <div>

                            <h3>
                                Interviews
                            </h3>

                            <p>
                                Start practicing today
                            </p>

                        </div>

                    </div>

                </section>


                {/* ==================================
                    ACTION CARDS
                ================================== */}

                <section className="action-section">

                    <h2>
                        What would you like to do?
                    </h2>


                    <div className="action-grid">


                        {/* PROFILE */}
                        <Link
                            to="/profile"
                            className="action-card"
                        >

                            <div className="action-icon">
                                👤
                            </div>

                            <div>

                                <h3>
                                    View Profile
                                </h3>

                                <p>
                                    View and manage your
                                    profile information.
                                </p>

                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </Link>


                        {/* PROFILE IMPROVEMENT */}
                        <Link
                            to="/profile-improvement"
                            className="action-card"
                        >

                            <div className="action-icon">
                                🚀
                            </div>

                            <div>

                                <h3>
                                    Improve Profile
                                </h3>

                                <p>
                                    Improve your skills,
                                    role and experience
                                    information.
                                </p>

                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </Link>


                        {/* INTERVIEW */}
                        <Link
                            to="/interview/setup"
                            className="action-card"
                        >

                            <div className="action-icon">
                                🎯
                            </div>

                            <div>

                                <h3>
                                    Practice Interview
                                </h3>

                                <p>
                                    Start a new AI-powered
                                    mock interview.
                                </p>

                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </Link>


                        {/* HISTORY */}
                        <Link
                            to="/interview/history"
                            className="action-card"
                        >

                            <div className="action-icon">
                                📋
                            </div>

                            <div>

                                <h3>
                                    Interview History
                                </h3>

                                <p>
                                    View your previous
                                    interview results.
                                </p>

                            </div>

                            <span className="arrow">
                                →
                            </span>

                        </Link>

                    </div>

                </section>

            </main>

        </div>

    );

}


export default Dashboard;
