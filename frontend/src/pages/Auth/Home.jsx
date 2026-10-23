import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../context/Auth/Home.css";

function Home() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    // Close mobile menu when clicking outside or pressing Escape
    useEffect(() => {
        const handleOutsideClick = (event) => {
            const clickedMenuButton = event.target.closest(".home-menu-btn");
            const clickedMenu = event.target.closest(".home-nav-links");

            if (!clickedMenuButton && !clickedMenu) {
                setMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
            }
        };

        document.addEventListener("click", handleOutsideClick);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("click", handleOutsideClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Reveal sections and feature cards on scroll
    useEffect(() => {
        const elements = document.querySelectorAll(
            ".home-page .section-heading, " +
            ".home-page .feature-card, " +
            ".home-page .contact-content, " +
            ".home-page .contact-info"
        );

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reducedMotion || !("IntersectionObserver" in window)) {
            elements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -25px 0px",
            }
        );

        elements.forEach((element) => {
            element.classList.add("reveal-on-scroll");
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-page">
            {/* ================= NAVBAR ================= */}
            <nav className="home-navbar">
                <a
                    href="#home"
                    className="home-logo"
                    onClick={closeMenu}
                    aria-label="AI Interview Assist home"
                >
                    <span>AI</span>
                    Interview Assist
                </a>

                <div
                    id="home-navigation"
                    className={`home-nav-links ${menuOpen ? "mobile-menu-open" : ""
                        }`}
                >
                    <a href="#home" onClick={closeMenu}>
                        Home
                    </a>

                    <a href="#about" onClick={closeMenu}>
                        About
                    </a>

                    <a href="#features" onClick={closeMenu}>
                        Features
                    </a>

                    <a href="#how-it-works" onClick={closeMenu}>
                        How It Works
                    </a>

                    <a href="#contact" onClick={closeMenu}>
                        Contact Us
                    </a>

                    <Link to="/login" onClick={closeMenu}>
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="home-register-btn"
                        onClick={closeMenu}
                    >
                        Register
                    </Link>
                </div>

                <button
                    type="button"
                    className={`home-menu-btn ${menuOpen ? "menu-active" : ""
                        }`}
                    onClick={() => setMenuOpen((previous) => !previous)}
                    aria-label={
                        menuOpen ? "Close navigation menu" : "Open navigation menu"
                    }
                    aria-controls="home-navigation"
                    aria-expanded={menuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </nav>

            {/* ================= HERO SECTION ================= */}
            <section id="home" className="home-hero">
                <div className="hero-bg-blob hero-bg-blob-one"></div>
                <div className="hero-bg-blob hero-bg-blob-two"></div>
                <div className="hero-bg-grid"></div>

                <div className="hero-content">
                    {/* LEFT SIDE */}
                    <div className="hero-text">
                        <div className="hero-eyebrow">
                            <span className="hero-live-dot"></span>
                            <span>YOUR JOURNEY TO INTERVIEW SUCCESS</span>
                        </div>

                        <h1>
                            Your Potential.
                            <br />
                            <span className="hero-gradient-text">
                                Your Next Big
                            </span>
                            <br />
                            Opportunity.
                        </h1>

                        <p>
                            Turn interview preparation into your competitive
                            advantage. Practice with AI-generated questions,
                            get personalized feedback and build the confidence
                            to take on your next opportunity.
                        </p>

                        <div className="hero-buttons">
                            <Link to="/register" className="primary-home-btn">
                                Start Practicing
                                <span aria-hidden="true"> ↗</span>
                            </Link>

                            <a href="#about" className="secondary-home-btn">
                                <span className="hero-play-symbol">▶</span>
                                Discover More
                            </a>
                        </div>

                        <div className="hero-trust-row">
                            <div className="hero-trust-item">
                                <span className="trust-icon trust-purple">✦</span>
                                <div>
                                    <strong>AI-Powered</strong>
                                    <small>Smart Questions</small>
                                </div>
                            </div>

                            <div className="hero-trust-item">
                                <span className="trust-icon trust-blue">◈</span>
                                <div>
                                    <strong>Personalized</strong>
                                    <small>Instant Feedback</small>
                                </div>
                            </div>

                            <div className="hero-trust-item">
                                <span className="trust-icon trust-green">↗</span>
                                <div>
                                    <strong>Skill Growth</strong>
                                    <small>Track Progress</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: AI DASHBOARD VISUAL */}
                    <div className="hero-visual">
                        <div className="hero-visual-glow"></div>

                        <div className="hero-dashboard">
                            <div className="hero-dashboard-header">
                                <div className="hero-dashboard-brand">
                                    <div className="hero-brand-icon">AI</div>
                                    <div>
                                        <strong>Interview Studio</strong>
                                        <small>Your personal practice space</small>
                                    </div>
                                </div>

                                <span className="hero-live-pill">
                                    <span></span> LIVE
                                </span>
                            </div>

                            <div className="hero-dashboard-welcome">
                                <div>
                                    <span className="hero-mini-label">
                                        YOUR NEXT CHALLENGE
                                    </span>
                                    <h3>Ready to shine?</h3>
                                    <p>Every answer takes you one step closer.</p>
                                </div>

                                <div className="hero-avatar-art">
                                    {/* Animated outer rings */}
                                    <div className="avatar-art-ring avatar-ring-one"></div>
                                    <div className="avatar-art-ring avatar-ring-two"></div>

                                    {/* Orbiting particles */}
                                    <span className="avatar-particle particle-one">✦</span>
                                    <span className="avatar-particle particle-two">+</span>
                                    <span className="avatar-particle particle-three"></span>

                                    {/* AI Avatar */}
                                    <div className="avatar-art-face">
                                        <div className="avatar-art-hair"></div>

                                        {/* Headphones */}
                                        <div className="avatar-headphone-band"></div>
                                        <div className="avatar-headphone headphone-left"></div>
                                        <div className="avatar-headphone headphone-right"></div>

                                        {/* Face details */}
                                        <div className="avatar-art-eyebrows">
                                            <span></span>
                                            <span></span>
                                        </div>

                                        <div className="avatar-art-eyes">
                                            <span></span>
                                            <span></span>
                                        </div>

                                        <div className="avatar-art-nose"></div>
                                        <div className="avatar-art-smile"></div>

                                        {/* Cheeks */}
                                        <span className="avatar-cheek cheek-left"></span>
                                        <span className="avatar-cheek cheek-right"></span>

                                        {/* Microphone */}
                                        <div className="avatar-mic">
                                            <span></span>
                                        </div>
                                    </div>

                                    {/* Voice activity indicator */}
                                    <div className="avatar-voice-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>

                                    {/* AI status badge */}
                                    <div className="avatar-ai-badge">
                                        <span className="avatar-ai-spark">✦</span>
                                        AI COACH
                                    </div>
                                </div>
                            </div>

                            <div className="hero-score-panel">
                                <div className="hero-score-heading">
                                    <div>
                                        <span className="hero-mini-label">
                                            PERFORMANCE PREVIEW
                                        </span>
                                        <strong>Your growth potential</strong>
                                    </div>
                                    <span className="hero-score-icon">↗</span>
                                </div>

                                <div className="hero-score-content">
                                    <div className="hero-score-ring">
                                        <div className="hero-score-ring-inner">
                                            <strong>AI</strong>
                                            <small>INSIGHTS</small>
                                        </div>
                                    </div>

                                    <div className="hero-score-details">
                                        <div className="hero-score-row">
                                            <span>Communication</span>
                                            <strong>Build</strong>
                                        </div>
                                        <div className="hero-progress">
                                            <span className="progress-purple"></span>
                                        </div>

                                        <div className="hero-score-row">
                                            <span>Confidence</span>
                                            <strong>Grow</strong>
                                        </div>
                                        <div className="hero-progress">
                                            <span className="progress-blue"></span>
                                        </div>

                                        <div className="hero-score-row">
                                            <span>Answer Quality</span>
                                            <strong>Improve</strong>
                                        </div>
                                        <div className="hero-progress">
                                            <span className="progress-green"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hero-dashboard-bottom">
                                <div className="hero-bottom-icon">✦</div>
                                <div>
                                    <strong>Every answer is an opportunity.</strong>
                                    <small>Practice. Learn. Improve.</small>
                                </div>
                                <span className="hero-bottom-arrow">↗</span>
                            </div>
                        </div>
                        <div className="hero-decoration hero-decoration-one">✦</div>
                        <div className="hero-decoration hero-decoration-two">+</div>
                        <div className="hero-decoration hero-decoration-three"></div>
                    </div>
                </div>
            </section>

            {/* ================= ABOUT / INTRODUCTION ================= */}
            <section id="about" className="home-about">
                <div className="section-heading">
                    <h2>Your Personal Interview Preparation Assistant</h2>

                    <p>
                        Preparing for an interview can be stressful.
                        AI Interview Assist provides a structured environment
                        where you can practice interviews, evaluate your
                        answers and understand the areas that need improvement.
                    </p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Targeted Preparation</h3>
                        <p>
                            Practice questions based on your selected job role,
                            experience level, interview type and difficulty.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🧠</div>
                        <h3>AI Intelligence</h3>
                        <p>
                            Artificial intelligence helps generate relevant
                            questions and analyze your interview answers.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📈</div>
                        <h3>Continuous Improvement</h3>
                        <p>
                            Track your performance and identify strengths,
                            weaknesses and areas where you need more preparation.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section id="features" className="home-about">
                <div className="section-heading">
                    <h2>Powerful Features</h2>
                    <p>
                        Everything you need to make your interview preparation
                        more effective and organized.
                    </p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Generated Questions</h3>
                        <p>
                            Generate interview questions according to your job
                            role, experience level, interview type and selected
                            difficulty.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📝</div>
                        <h3>Interactive Interviews</h3>
                        <p>
                            Answer questions one by one and experience a
                            structured interview practice session.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Answer Evaluation</h3>
                        <p>
                            Get AI-based analysis of your answers, including
                            correctness, relevance, technical accuracy and score.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💪</div>
                        <h3>Strengths &amp; Weaknesses</h3>
                        <p>
                            Understand what you are doing well and which areas
                            require more preparation.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💡</div>
                        <h3>Personalized Feedback</h3>
                        <p>
                            Receive AI-generated recommendations designed to
                            help you improve your interview performance.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📚</div>
                        <h3>Interview History</h3>
                        <p>
                            Keep track of previous interviews, results and
                            performance so you can monitor your progress.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= HOW IT WORKS ================= */}
            <section id="how-it-works" className="home-contact">
                <div className="section-heading">
                    <h2>How AI Interview Assist Works</h2>
                    <p>
                        Start preparing for your next interview in just a few
                        simple steps.
                    </p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <div className="feature-icon">1</div>
                        <h3>Create Your Account</h3>
                        <p>
                            Register on the platform and create your personal
                            interview preparation profile.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">2</div>
                        <h3>Setup Interview</h3>
                        <p>
                            Select your job role, experience level, interview
                            type, difficulty and number of questions.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">3</div>
                        <h3>Answer Questions</h3>
                        <p>
                            Start your interview and answer the AI-generated
                            questions one by one.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">4</div>
                        <h3>Get Your Results</h3>
                        <p>
                            Receive your performance analysis, scores, strengths,
                            weaknesses and improvement recommendations.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= INTERVIEW TYPES ================= */}
            <section className="home-about">
                <div className="section-heading">
                    <h2>Prepare for Different Types of Interviews</h2>
                    <p>
                        AI Interview Assist can help you prepare for interviews
                        across different careers and professional fields.
                    </p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <div className="feature-icon">💻</div>
                        <h3>IT &amp; Software</h3>
                        <p>
                            Prepare for software development, web development,
                            databases, networking, cybersecurity and other
                            technical roles.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🏥</div>
                        <h3>Healthcare</h3>
                        <p>
                            Practice interviews for nursing, healthcare,
                            medical support and other healthcare-related
                            positions.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">⚙️</div>
                        <h3>Engineering</h3>
                        <p>
                            Prepare for mechanical, civil, chemical, electrical
                            and other engineering roles.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">💼</div>
                        <h3>Business &amp; Management</h3>
                        <p>
                            Practice HR, management, finance, marketing,
                            business administration and related interviews.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎓</div>
                        <h3>Freshers</h3>
                        <p>
                            Build confidence and prepare for your first job
                            interview with structured practice.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🚀</div>
                        <h3>Experienced Professionals</h3>
                        <p>
                            Improve your interview performance and prepare for
                            challenging professional opportunities.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= BENEFITS ================= */}
            <section className="home-contact">
                <div className="section-heading">
                    <h2>Why Choose AI Interview Assist?</h2>
                    <p>
                        Designed to make interview preparation simple,
                        practical and personalized.
                    </p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Easy to Use</h3>
                        <p>
                            Simple and user-friendly interface designed for
                            quick and comfortable interview practice.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Personalized</h3>
                        <p>
                            Questions and feedback are tailored according to
                            your selected interview requirements.
                        </p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Data-Driven Results</h3>
                        <p>
                            Understand your performance using scores,
                            evaluation and detailed interview analysis.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= FAQ ================= */}
            <section className="home-about">
                <div className="section-heading">
                    <h2>Frequently Asked Questions</h2>
                    <p>Some common questions about the platform.</p>
                </div>

                <div className="feature-container">
                    <div className="feature-card">
                        <h3>Can I practice different job roles?</h3>
                        <p>
                            Yes. You can select different job roles while
                            setting up your interview. The platform can generate
                            questions according to the selected role.
                        </p>
                    </div>

                    <div className="feature-card">
                        <h3>Can freshers use the platform?</h3>
                        <p>
                            Yes. The platform is suitable for both freshers
                            and experienced professionals.
                        </p>
                    </div>

                    <div className="feature-card">
                        <h3>How are answers evaluated?</h3>
                        <p>
                            AI analyzes your answers and provides scores,
                            strengths, weaknesses, missing concepts and
                            improvement feedback.
                        </p>
                    </div>

                    <div className="feature-card">
                        <h3>Can I view previous interviews?</h3>
                        <p>
                            Yes. Your previous interview sessions can be
                            accessed through the interview history section
                            after login.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= CONTACT ================= */}
            <section id="contact" className="home-contact">
                <div className="section-heading">
                    <h2>Contact Us</h2>
                    <p>
                        Have a question, suggestion or feedback? We would love
                        to hear from you.
                    </p>
                </div>

                <div className="contact-content">
                    <div className="contact-info">
                        <h3>Get In Touch</h3>

                        <p>
                            Have a question about AI Interview Assist? Need help
                            with your interview preparation? Our support team
                            is here to help you.
                        </p>

                        <div className="contact-details">
                            <div className="contact-item">
                                <span className="contact-icon">📧</span>
                                <div>
                                    <strong>Email</strong>
                                    <p>support@aiinterviewassist.com</p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <span className="contact-icon">💬</span>
                                <div>
                                    <strong>Support</strong>
                                    <p>
                                        Get assistance with your account,
                                        interviews and results.
                                    </p>
                                </div>
                            </div>

                            <div className="contact-item">
                                <span className="contact-icon">⏰</span>
                                <div>
                                    <strong>Support Hours</strong>
                                    <p>
                                        Monday – Friday
                                        <br />
                                        9:00 AM – 6:00 PM
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="contact-note">
                            💡 We are committed to helping you prepare
                            confidently and perform better in your interviews.
                        </p>
                    </div>
                </div>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="home-footer">
                <div className="footer-brand">
                    <a href="#home" className="footer-logo" onClick={closeMenu}>
                        <strong>AI Interview Assist</strong>
                    </a>

                    <p>Smart interview preparation powered by AI.</p>
                    <p>Practice • Analyze • Improve • Succeed</p>
                </div>

                <div className="footer-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                    <a href="#contact">Contact Us</a>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </div>

                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} AI Interview Assist.
                        All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
