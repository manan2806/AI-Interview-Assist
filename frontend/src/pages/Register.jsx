import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter a password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!confirmPassword) {
            setError("Please confirm your password.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const data = await registerUser({
                name: name.trim(),
                email: email.trim(),
                password: password
            });

            if (data.success) {
                setSuccess(
                    data.message ||
                    "Account created successfully."
                );

                setName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");

                setTimeout(() => {
                    navigate("/login");
                }, 1200);
            } else {
                setError(
                    data.message ||
                    "Unable to create account."
                );
            }
        } catch (error) {
            console.error("Register Error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to create account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* LEFT SECTION */}
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

            {/* RIGHT SECTION */}
            <div className="auth-right">
                <div className="auth-card register-card">
                    {/* MOBILE LOGO */}
                    <div className="mobile-logo">
                        AI
                    </div>

                    {/* HEADER */}
                    <div className="auth-header">
                        <h2>
                            Create Account
                        </h2>

                        <p>
                            Start your AI-powered interview preparation
                        </p>
                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {/* SUCCESS */}
                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleRegister}>
                        {/* NAME */}
                        <div className="form-group">
                            <label htmlFor="name">
                                Full Name
                            </label>

                            <input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                autoComplete="name"
                                disabled={loading}
                            />
                        </div>

                        {/* EMAIL */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address
                            </label>

                            <input
                                id="email"
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
                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="new-password"
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

                        {/* CONFIRM PASSWORD */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password
                            </label>

                            <div className="password-input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                    autoComplete="new-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    disabled={loading}
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showConfirmPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}
                        </button>
                    </form>

                    {/* LOGIN */}
                    <div className="auth-footer">
                        <span>
                            Already have an account?
                        </span>

                        <Link to="/login">
                            Sign In
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

export default Register;
