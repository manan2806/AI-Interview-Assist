import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

function Register() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill all fields.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);

            const data = await registerUser({
                name,
                email,
                password
            });

            if (data.success) {

                setSuccess(
                    data.message ||
                    "Registration successful."
                );

                setTimeout(() => {
                    navigate("/login");
                }, 1200);

            } else {

                setError(
                    data.message ||
                    "Registration failed."
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
        <AuthLayout>

            <div className="auth-card register-card">

                <div className="auth-header">

                    <div className="mobile-logo">
                        AI
                    </div>

                    <h2>Create Account</h2>

                    <p>
                        Start your AI interview preparation journey
                    </p>

                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="success-message">
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister}>

                    <div className="form-group">

                        <label>Full Name</label>

                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            autoComplete="name"
                        />

                    </div>

                    <div className="form-group">

                        <label>Email Address</label>

                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            autoComplete="email"
                        />

                    </div>

                    <div className="form-group">

                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            autoComplete="new-password"
                        />

                    </div>

                    <div className="form-group">

                        <label>Confirm Password</label>

                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            autoComplete="new-password"
                        />

                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"
                        }
                    </button>

                </form>

                <div className="auth-footer">

                    <span>Already have an account?</span>

                    <Link to="/login">
                        Sign In
                    </Link>

                </div>

                {/* HOME LINK */}
                <div className="auth-home-link-container">

                    <Link
                        to="/"
                        className="auth-home-link"
                    >
                        ← Back to Home
                    </Link>

                </div>

            </div>

        </AuthLayout>
    );
}

export default Register;
