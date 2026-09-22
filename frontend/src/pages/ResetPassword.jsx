import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

function ResetPassword() {

    const navigate = useNavigate();

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // GET RESET DATA FROM SESSION
    const email =
        sessionStorage.getItem("resetEmail") || "";

    const resetToken =
        sessionStorage.getItem("reset_token") || "";

    // HANDLE RESET PASSWORD
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // CHECK RESET SESSION
        if (!email || !resetToken) {

            setError(
                "Reset session is missing or expired. Please start again."
            );

            return;
        }

        // VALIDATE NEW PASSWORD
        if (!newPassword.trim()) {

            setError(
                "Please enter a new password."
            );

            return;
        }

        if (newPassword.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }

        // VALIDATE CONFIRM PASSWORD
        if (!confirmPassword.trim()) {

            setError(
                "Please confirm your password."
            );

            return;
        }

        if (newPassword !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }

        // RESET PASSWORD API
        try {

            setLoading(true);

            const response = await resetPassword(
                email,
                resetToken,
                newPassword
            );

            console.log(
                "Reset Password Response:",
                response
            );

            // SUCCESS
            if (response?.success) {

                setSuccess(
                    response?.message ||
                    "Password reset successfully! Redirecting to login..."
                );

                // REMOVE RESET SESSION
                sessionStorage.removeItem(
                    "reset_token"
                );

                sessionStorage.removeItem(
                    "resetEmail"
                );

                // Remove old key too, if present
                sessionStorage.removeItem(
                    "reset_email"
                );

                // REDIRECT TO LOGIN
                setTimeout(() => {

                    navigate("/login");

                }, 1500);

            } else {

                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Unable to reset password."
                );
            }

        } catch (err) {

            console.error(
                "Reset Password Error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to reset password. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // PASSWORD CHANGE HANDLER
    const handlePasswordChange = (e) => {

        setNewPassword(e.target.value);

        if (error) {
            setError("");
        }
    };


    // CONFIRM PASSWORD CHANGE HANDLER
    const handleConfirmPasswordChange = (e) => {

        setConfirmPassword(e.target.value);

        if (error) {
            setError("");
        }
    };

    return (

        <AuthLayout>

            <div className="auth-card">

                {/* ==================================
                    HEADER
                ================================== */}
                <div className="auth-header">

                    <div className="mobile-logo">
                        AI
                    </div>

                    <h2>
                        Reset Password
                    </h2>

                    <p>
                        Create a new password for your account.
                    </p>

                </div>

                {/* ==================================
                    ERROR MESSAGE
                ================================== */}
                {error && (

                    <div className="error-message forgot-error">

                        <span>⚠️</span>

                        <span>
                            {error}
                        </span>

                    </div>

                )}

                {/* ==================================
                    SUCCESS MESSAGE
                ================================== */}
                {success && (

                    <div className="success-message forgot-success">

                        <span>✓</span>

                        <span>
                            {success}
                        </span>

                    </div>

                )}

                {/* ==================================
                    FORM
                ================================== */}
                <form onSubmit={handleSubmit}>


                    {/* NEW PASSWORD */}
                    <div className="form-group">

                        <label htmlFor="new-password">
                            New Password
                        </label>

                        <input
                            id="new-password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={
                                handlePasswordChange
                            }
                            disabled={loading}
                            autoComplete="new-password"
                        />

                    </div>

                    <div className="password-info">
                        Password must be at least 6 characters.
                    </div>

                    {/* CONFIRM PASSWORD */}
                    <div className="form-group">

                        <label htmlFor="confirm-password">
                            Confirm Password
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={
                                handleConfirmPasswordChange
                            }
                            disabled={loading}
                            autoComplete="new-password"
                        />

                    </div>

                    {/* RESET BUTTON */}
                    <button
                        type="submit"
                        className="auth-button forgot-password-button"
                        disabled={loading}
                    >

                        {loading ? (

                            <span className="forgot-loading-content">

                                <span className="forgot-loading-spinner"></span>

                                Resetting Password...

                            </span>

                        ) : (

                            "Reset Password"

                        )}

                    </button>

                </form>

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

export default ResetPassword;
