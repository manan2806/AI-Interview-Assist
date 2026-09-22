import { useState } from "react";
import {
    Link,
    useNavigate,
    useSearchParams
} from "react-router-dom";

import { verifyOTP } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

function VerifyOTP() {

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    // Get email from URL
    const email =
        searchParams.get("email") ||
        sessionStorage.getItem("resetEmail") ||
        "";

    const [otp, setOtp] = useState("");

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    // ==========================================
    // VERIFY OTP
    // ==========================================
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // EMAIL VALIDATION
        if (!email.trim()) {

            setError(
                "Email is missing. Please request a new OTP."
            );

            return;
        }

        // OTP VALIDATION
        if (!otp.trim()) {

            setError(
                "Please enter the OTP."
            );

            return;
        }

        if (!/^\d{6}$/.test(otp)) {

            setError(
                "OTP must contain exactly 6 digits."
            );

            return;
        }

        try {

            setLoading(true);

            // API CALL
            const response = await verifyOTP(
                email.trim(),
                otp
            );

            console.log(
                "Verify OTP Response:",
                response
            );

            // SUCCESS
            if (response?.success) {

                const resetToken =
                    response?.reset_token;

                // Reset token is required
                if (!resetToken) {

                    setError(
                        "OTP verified, but reset token was not received."
                    );

                    return;
                }

                setSuccess(
                    response?.message ||
                    "OTP verified successfully."
                );

                // SAVE RESET INFORMATION
                sessionStorage.setItem(
                    "reset_token",
                    resetToken
                );

                sessionStorage.setItem(
                    "resetEmail",
                    email.trim()
                );

                // GO TO RESET PASSWORD
                setTimeout(() => {

                    navigate(
                        "/reset-password"
                    );

                }, 800);

            } else {

                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Invalid OTP. Please try again."
                );
            }

        } catch (err) {

            console.error(
                "OTP Verification Error:",
                err
            );


            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "OTP verification failed. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // OTP INPUT
    const handleOTPChange = (e) => {

        const value =
            e.target.value.replace(/\D/g, "");

        setOtp(value.slice(0, 6));

        // Clear error while typing
        if (error) {
            setError("");
        }
    };

    return (

        <AuthLayout>

            <div className="auth-card">

                {/* HEADER */}
                <div className="auth-header">

                    <div className="mobile-logo">
                        AI
                    </div>

                    <h2>
                        Verify OTP
                    </h2>

                    <p>
                        Enter the 6-digit OTP sent to:
                        <br />

                        <strong>
                            {email || "your email"}
                        </strong>
                    </p>

                </div>

                {/* ERROR */}
                {error && (

                    <div className="error-message forgot-error">

                        <span>⚠️</span>

                        <span>
                            {error}
                        </span>

                    </div>
                )}

                {/* SUCCESS */}
                {success && (

                    <div className="success-message forgot-success">

                        <span>✓</span>

                        <span>
                            {success}
                        </span>

                    </div>
                )}

                {/* OTP FORM */}
                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="otp">
                            OTP
                        </label>

                        <input
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="otp-input"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={handleOTPChange}
                            disabled={loading}
                            autoComplete="one-time-code"
                        />

                    </div>

                    {/* VERIFY BUTTON */}
                    <button
                        type="submit"
                        className="auth-button forgot-password-button"
                        disabled={
                            loading ||
                            otp.length !== 6
                        }
                    >

                        {loading ? (

                            <span className="forgot-loading-content">

                                <span className="forgot-loading-spinner"></span>

                                Verifying...

                            </span>

                        ) : (

                            "Verify OTP"

                        )}

                    </button>

                </form>

                {/* REQUEST NEW OTP */}
                <div className="resend-otp">

                    <span>
                        Didn't receive the OTP?{" "}
                    </span>

                    <Link to="/forgot-password">
                        Request New OTP
                    </Link>

                </div>

                {/* BACK TO LOGIN */}
                <div className="back-to-login">

                    <Link to="/login">
                        ← Back to Login
                    </Link>

                </div>

            </div>

        </AuthLayout>
    );
}

export default VerifyOTP;
