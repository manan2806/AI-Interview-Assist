import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../../context/Auth/ForgotPassword.css";
import { verifyOTP } from "../../services/authService";
import AuthLayout from "../../components/AuthLayout";

function VerifyOTP() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const email =
        searchParams.get("email") ||
        sessionStorage.getItem("resetEmail") ||
        "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Email is missing. Please request a new OTP.");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await verifyOTP(email.trim(), otp);

            if (response?.success) {
                const resetToken = response?.reset_token;

                if (!resetToken) {
                    setError(
                        "OTP verified, but reset token was not received."
                    );
                    return;
                }

                sessionStorage.setItem("reset_token", resetToken);
                sessionStorage.setItem("resetEmail", email.trim());

                setSuccess(
                    response?.message || "OTP verified successfully!"
                );

                navigate("/reset-password", { replace: true });
            } else {
                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Invalid OTP. Please try again."
                );
            }
        } catch (err) {
            console.error("OTP Verification Error:", err);

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "OTP verification failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setOtp(value);

        if (error) setError("");
        if (success) setSuccess("");
    };

    return (
        <AuthLayout>
            <div className="verify-otp-card">
                <div className="verify-otp-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="4" y="10" width="16" height="11" rx="2.5" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        <path d="M12 14v3" />
                    </svg>
                </div>

                <div className="verify-otp-header">
                    <span className="verify-otp-eyebrow">
                        ACCOUNT SECURITY
                    </span>

                    <h2>Verify your email</h2>

                    <p>
                        We’ve sent a verification code to
                    </p>

                    <div className="verify-otp-email">
                        <span className="verify-otp-email-icon">✉</span>
                        <span>{email || "Your email address"}</span>
                    </div>
                </div>

                {error && (
                    <div className="verify-otp-alert verify-otp-alert-error" role="alert">
                        <span className="verify-otp-alert-icon">!</span>
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="verify-otp-alert verify-otp-alert-success" role="status">
                        <span className="verify-otp-alert-icon">✓</span>
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="verify-otp-field">
                        <label htmlFor="verify-otp-input">
                            Enter verification code
                        </label>

                        <input
                            id="verify-otp-input"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="verify-otp-input"
                            placeholder="000000"
                            value={otp}
                            onChange={handleOTPChange}
                            disabled={loading || !email.trim()}
                            autoComplete="one-time-code"
                            aria-describedby="verify-otp-hint"
                            autoFocus
                        />

                        <div className="verify-otp-input-footer">
                            <span id="verify-otp-hint">
                                Enter the 6-digit code from your email.
                            </span>
                            <span className="verify-otp-counter">
                                {otp.length}/6
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="verify-otp-submit"
                        disabled={loading || otp.length !== 6 || !email.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="verify-otp-spinner" />
                                Verifying code...
                            </>
                        ) : (
                            <>
                                Verify & Continue
                                <span className="verify-otp-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="verify-otp-divider">
                    <span />
                    <span>Need another code?</span>
                    <span />
                </div>

                <p className="verify-otp-resend">
                    Didn’t receive the OTP?{" "}
                    <Link to="/forgot-password">Request a new one</Link>
                </p>

                <Link to="/login" className="verify-otp-back">
                    <span>←</span> Back to Login
                </Link>

                <div className="verify-otp-security-note">
                    <span>✓</span>
                    Your verification code is private and secure.
                </div>
            </div>
        </AuthLayout>
    );
}

export default VerifyOTP;
