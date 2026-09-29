// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { loginUser } from "../services/authService";
// import AuthLayout from "../components/AuthLayout";

// function Login() {

//     const navigate = useNavigate();

//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");

//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleLogin = async (e) => {

//         e.preventDefault();

//         setError("");

//         if (!email || !password) {
//             setError("Please enter email and password.");
//             return;
//         }

//         try {

//             setLoading(true);

//             const data = await loginUser({
//                 email,
//                 password
//             });

//             if (data.success) {

//                 // Save JWT token
//                 localStorage.setItem(
//                     "token",
//                     data.token
//                 );

//                 // Save user information
//                 if (data.user) {
//                     localStorage.setItem(
//                         "user",
//                         JSON.stringify(data.user)
//                     );
//                 }

//                 // Dashboard
//                 navigate("/dashboard");

//             } else {

//                 setError(
//                     data.message || "Invalid email or password."
//                 );
//             }

//         } catch (error) {

//             console.error("Login Error:", error);

//             setError(
//                 error.response?.data?.message ||
//                 "Unable to login. Please try again."
//             );

//         } finally {

//             setLoading(false);
//         }
//     };

//     return (
//         <AuthLayout>

//             <div className="auth-card">

//                 <div className="auth-header">

//                     <div className="mobile-logo">
//                         AI
//                     </div>

//                     <h2>Welcome Back</h2>

//                     <p>
//                         Sign in to continue to your account
//                     </p>

//                 </div>

//                 {error && (
//                     <div className="error-message">
//                         {error}
//                     </div>
//                 )}

//                 <form onSubmit={handleLogin}>

//                     <div className="form-group">

//                         <label>Email Address</label>

//                         <input
//                             type="email"
//                             placeholder="Enter your email"
//                             value={email}
//                             onChange={(e) =>
//                                 setEmail(e.target.value)
//                             }
//                             autoComplete="email"
//                         />

//                     </div>

//                     <div className="form-group">

//                         <label>Password</label>

//                         <input
//                             type="password"
//                             placeholder="Enter your password"
//                             value={password}
//                             onChange={(e) =>
//                                 setPassword(e.target.value)
//                             }
//                             autoComplete="current-password"
//                         />

//                     </div>

//                     <div className="forgot-password">

//                         <Link to="/forgot-password">
//                             Forgot Password ?
//                         </Link>

//                     </div>

//                     <button
//                         type="submit"
//                         className="auth-button"
//                         disabled={loading}
//                     >
//                         {loading
//                             ? "Signing in..."
//                             : "Sign In"
//                         }
//                     </button>

//                 </form>

//                 <div className="auth-footer">

//                     <span>Don't have an account?</span>

//                     <Link to="/register">
//                         Create Account
//                     </Link>

//                 </div>

//                 {/* HOME LINK */}
//                 <div className="auth-home-link-container">

//                     <Link
//                         to="/"
//                         className="auth-home-link"
//                     >
//                         ← Back to Home
//                     </Link>

//                 </div>

//             </div>

//         </AuthLayout>
//     );
// }

// export default Login;
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import AuthLayout from "../components/AuthLayout";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
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
                password
            });

            if (data.success) {
                // Save JWT token
                localStorage.setItem("token", data.token);

                // Save user
                if (data.user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

                // Dashboard
                navigate("/dashboard");
            } else {
                setError(
                    data.message || "Invalid email or password."
                );
            }
        } catch (error) {
            console.error("Login Error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-card login-card">
                {/* Brand */}
                <div className="login-brand">
                    <div className="login-brand-icon">AI</div>

                    <span>AI Interview Assist</span>
                </div>

                {/* Header */}
                <div className="auth-header">
                    <h2>Welcome Back</h2>

                    <p>
                        Sign in to continue your interview preparation
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message login-error">
                        <span className="error-symbol">!</span>

                        <span>{error}</span>
                    </div>
                )}

                {/* Login Form */}
                <form
                    onSubmit={handleLogin}
                    className="login-form"
                >
                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <div className="login-input-wrapper">
                            <span className="login-input-icon">
                                @
                            </span>

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
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <div className="password-header">
                            <label htmlFor="password">
                                Password
                            </label>

                            <Link
                                to="/forgot-password"
                                className="forgot-password-link"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="login-input-wrapper">
                            <span className="login-input-icon">
                                🔒
                            </span>

                            <input
                                id="password"
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
                                className="show-password-btn"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <button
                        type="submit"
                        className="auth-button login-submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="login-spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <span className="login-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Register */}
                <div className="auth-footer">
                    <span>Don't have an account?</span>

                    <Link to="/register">
                        Create Account
                    </Link>
                </div>

                {/* Divider */}
                <div className="login-divider">
                    <span>AI Interview Assist</span>
                </div>

                {/* Home */}
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

export default Login;
