import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(false);

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            const data = await loginUser({
                email: email.trim(),
                password: password
            });

            if (data.success) {
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }

                if (data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

                navigate("/dashboard");
            } else {
                setError(
                    data.message ||
                    "Invalid email or password."
                );
            }
        } catch (err) {
            console.error("Login Error:", err);

            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                (err.response?.status === 401
                    ? "Invalid email or password."
                    : err.response?.status === 404
                        ? "Login service not found. Please try again."
                        : err.code === "ERR_NETWORK"
                            ? "Unable to connect to server. Please try again."
                            : "Unable to login. Please try again.");

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* LEFT */}
            <div className="auth-left">
                <div className="brand">
                    <div className="brand-icon">
                        AI
                    </div>

                    <h1>
                        AI Interview Assist
                    </h1>

                    <p>
                        Prepare smarter and perform better
                        with AI-powered interview practice.
                    </p>
                </div>

                <div className="feature-list">
                    <div className="feature">
                        <span>✓</span>

                        <div>
                            <strong>
                                AI-Powered Questions
                            </strong>

                            <p>
                                Get interview questions based
                                on your job role and experience.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>

                        <div>
                            <strong>
                                Smart Answer Evaluation
                            </strong>

                            <p>
                                Receive AI-based feedback on
                                your interview answers.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>

                        <div>
                            <strong>
                                Track Your Progress
                            </strong>

                            <p>
                                Review your interview history,
                                scores and improvements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT */}
            <div className="auth-right">
                <div className="auth-card">
                    {/* MOBILE LOGO */}
                    <div className="mobile-logo">
                        AI
                    </div>

                    {/* HEADER */}
                    <div className="auth-header">
                        <h2>
                            Welcome Back
                        </h2>

                        <p>
                            Sign in to continue your
                            interview preparation
                        </p>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleLogin}>
                        {/* EMAIL */}
                        <div className="form-group">
                            <label htmlFor="login-email">
                                Email Address
                            </label>

                            <input
                                id="login-email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                autoComplete="email"
                                disabled={loading}
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="form-group">
                            <label htmlFor="login-password">
                                Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="login-password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {/* FORGOT PASSWORD */}
                        <div
                            className="forgot-password"
                            onClick={() =>
                                navigate("/forgot-password")
                            }
                        >
                            Forgot Password?
                        </div>

                        {/* SIGN IN BUTTON */}
                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Signing In..."
                                : "Sign In"}
                        </button>
                    </form>

                    {/* REGISTER */}
                    <div className="auth-footer">
                        <span>
                            Don't have an account?
                        </span>

                        <Link to="/register">
                            Create Account
                        </Link>
                    </div>

                    {/* HOME */}
                    <div className="auth-home-link-container">
                        <Link
                            to="/"
                            className="auth-home-link"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
