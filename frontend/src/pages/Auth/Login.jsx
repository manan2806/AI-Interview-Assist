
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authService";
import "../../context/Auth/AuthPage.css";


function generateCaptcha() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";

    const randomChar = (characters) =>
        characters[Math.floor(Math.random() * characters.length)];

    const characters = [
        randomChar(letters),
        randomChar(letters),
        randomChar(numbers),
        randomChar(numbers),
        randomChar(letters),
        randomChar(numbers),
    ];

    // Randomize character positions
    for (let i = characters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [characters[i], characters[j]] = [
            characters[j],
            characters[i],
        ];
    }

    return characters.join("");
}


function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // CAPTCHA state
    const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
    const [captchaInput, setCaptchaInput] = useState("");

    const refreshCaptcha = () => {
        setCaptchaCode(generateCaptcha());
        setCaptchaInput("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        // Validate CAPTCHA before calling the login API
        if (!captchaInput.trim()) {
            setError("Please enter the CAPTCHA code.");
            return;
        }

        if (
            captchaInput.trim().toUpperCase() !== captchaCode
        ) {
            setError("Incorrect CAPTCHA. Please try again.");
            setCaptchaCode(generateCaptcha());
            setCaptchaInput("");
            return;
        }

        try {
            setLoading(true);

            const data = await loginUser({
                email: email.trim(),
                password: password,
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

                const role = data.user?.role;

                if (role === "admin") {
                    navigate("/admin-dashboard", {
                        replace: true,
                    });
                } else if (role === "user") {
                    navigate("/dashboard", {
                        replace: true,
                    });
                } else {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");

                    setError(
                        "Unable to verify account role. Please contact support."
                    );
                }
            } else {
                setError(
                    data.message || "Invalid email or password."
                );
                refreshCaptcha();
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
            refreshCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            {/* LEFT PANEL */}
            <div className="auth-left">
                <div className="brand">
                    <div className="brand-icon">AI</div>

                    <h1>AI Interview Assist</h1>

                    <p>
                        Prepare smarter and perform better
                        with AI-powered interview practice.
                    </p>
                </div>

                <div className="feature-list">
                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>AI-Powered Questions</strong>
                            <p>
                                Get interview questions based
                                on your job role and experience.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>Smart Answer Evaluation</strong>
                            <p>
                                Receive AI-based feedback on
                                your interview answers.
                            </p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>Track Your Progress</strong>
                            <p>
                                Review your interview history,
                                scores and improvements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="auth-right">
                <div className="auth-card">
                    <div className="mobile-logo">AI</div>

                    <div className="auth-header">
                        <h2>Welcome Back</h2>
                        <p>
                            Sign in to continue your
                            interview preparation
                        </p>
                    </div>

                    {error && (
                        <div
                            className="error-message"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

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

                        {/* MULTICOLOUR CAPTCHA */}
                        <div className="form-group captcha-group">
                            <label htmlFor="captcha-input">
                                Security Verification
                            </label>

                            <div className="captcha-panel">
                                <div
                                    className="captcha-code"
                                    aria-label="CAPTCHA code"
                                >
                                    <span className="captcha-decor captcha-decor-one"></span>
                                    <span className="captcha-decor captcha-decor-two"></span>

                                    {captchaCode.split("").map((character, index) => (
                                        <span
                                            key={`${index}-${captchaCode}`}
                                            className={`captcha-char captcha-char-${index % 6}`}
                                        >
                                            {character}
                                        </span>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className="captcha-refresh"
                                    onClick={refreshCaptcha}
                                    disabled={loading}
                                    aria-label="Generate a new CAPTCHA"
                                    title="Refresh CAPTCHA"
                                >
                                    ↻
                                </button>
                            </div>

                            <input
                                id="captcha-input"
                                type="text"
                                className="captcha-input"
                                placeholder="Enter CAPTCHA code"
                                value={captchaInput}
                                onChange={(e) =>
                                    setCaptchaInput(
                                        e.target.value.toUpperCase().slice(0, 6)
                                    )
                                }
                                autoComplete="off"
                                maxLength={6}
                                spellCheck="false"
                                disabled={loading}
                                aria-describedby="captcha-help"
                            />

                            <small id="captcha-help" className="captcha-help">
                                Enter the 6-character code shown above.
                            </small>
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

                        {/* SIGN IN */}
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
                        <span>Don't have an account?</span>
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
