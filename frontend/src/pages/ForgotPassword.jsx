import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

function ForgotPassword() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // VALIDATION
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        // Basic email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        try {

            setLoading(true);

            const response = await forgotPassword(
                email.trim()
            );

            console.log(
                "Forgot Password Response:",
                response
            );

            if (response?.success) {

                setSuccess(
                    response.message ||
                    "OTP sent successfully to your email."
                );

                // Save email for next step
                sessionStorage.setItem(
                    "resetEmail",
                    email.trim()
                );

                // Move to OTP page
                setTimeout(() => {

                    navigate(
                        `/verify-otp?email=${encodeURIComponent(
                            email.trim()
                        )}`
                    );

                }, 1000);

            } else {

                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Unable to send OTP."
                );
            }

        } catch (err) {

            console.error(
                "Forgot Password Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to send OTP. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <AuthLayout>

            <div className="auth-card">

                {/* ==============================
                    HEADER
                ============================== */}

                <div className="auth-header">

                    <div className="mobile-logo">
                        AI
                    </div>

                    <h2>Forgot Password?</h2>

                    <p>
                        Enter your registered email address
                        and we'll send you an OTP.
                    </p>

                </div>


                {/* ERROR MESSAGE */}
                {error && (
                    <div className="error-message forgot-error">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}


                {/* SUCCESS MESSAGE */}
                {success && (
                    <div className="success-message forgot-success">
                        <span>✓</span>
                        <span>{success}</span>
                    </div>
                )}


                {/* FORM */}
                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="forgot-email">
                            Email Address
                        </label>

                        <input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError("");
                            }}
                            disabled={loading}
                            autoComplete="email"
                        />

                    </div>


                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        className="auth-button forgot-password-button"
                        disabled={loading}
                    >

                        {loading ? (
                            <span className="forgot-loading-content">

                                <span className="forgot-loading-spinner"></span>

                                Sending OTP...

                            </span>
                        ) : (
                            "Send OTP"
                        )}

                    </button>

                </form>


                {/* FOOTER */}
                <div className="auth-footer">

                    <Link
                        to="/login"
                        className="forgot-back-login"
                    >
                        ← Back to Login
                    </Link>

                </div>

            </div>

        </AuthLayout>
    );
}

export default ForgotPassword;
