import { Link } from "react-router-dom";
import { useState } from "react";

function Home() {

    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };


    return (

        <div className="home-page">

            {/* ========================= NAVBAR ========================= */}
            <nav className="home-navbar">
                <div className="home-logo">
                    <span>AI</span> Interview Assist
                </div>

                <div className="home-nav-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                    <a href="#how-it-works">How It Works</a>
                    <a href="#contact">Contact Us</a>

                    <Link to="/login">Login</Link>

                    <Link to="/register" className="home-register-btn">
                        Register
                    </Link>
                </div>
            </nav>

            {/* =========================
                HERO SECTION
            ========================= */}
            <section
                id="home"
                className="home-hero"
            >

                <div className="hero-content">

                    <div className="hero-text">

                        <h1>

                            Prepare Smarter.

                            <br />

                            <span>
                                Interview Better.
                            </span>

                        </h1>

                        <p>

                            AI Interview Assist is an intelligent
                            interview preparation platform that helps
                            students and professionals practice
                            job interviews using AI-generated questions,
                            answer evaluation and personalized feedback.

                        </p>

                        <div className="hero-buttons">

                            <Link
                                to="/register"
                                className="primary-home-btn"
                            >
                                Get Started
                            </Link>

                            <a
                                href="#about"
                                className="secondary-home-btn"
                            >
                                Explore Platform
                            </a>

                        </div>

                    </div>

                    <div className="hero-card">

                        <div className="ai-circle">
                            AI
                        </div>

                        <h3>
                            AI-Powered Interview Practice
                        </h3>

                        <p>
                            Practice. Analyze. Improve. Succeed.
                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                INTRODUCTION
            ========================= */}
            <section id="about" className="home-about">

                <div className="section-heading">

                    <h2>
                        Your Personal Interview Preparation Assistant
                    </h2>

                    <p>

                        Preparing for an interview can be stressful.
                        AI Interview Assist provides a structured
                        environment where you can practice interviews,
                        evaluate your answers and understand the areas
                        that need improvement.

                    </p>

                </div>

                <div className="feature-container">

                    <div className="feature-card">

                        <div className="feature-icon">
                            🎯
                        </div>

                        <h3>
                            Targeted Preparation
                        </h3>

                        <p>

                            Practice questions based on your selected
                            job role, experience level, interview type
                            and difficulty.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            🧠
                        </div>

                        <h3>
                            AI Intelligence
                        </h3>

                        <p>

                            Artificial intelligence helps generate
                            relevant questions and analyze your
                            interview answers.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            📈
                        </div>

                        <h3>
                            Continuous Improvement
                        </h3>

                        <p>

                            Track your performance and identify
                            strengths, weaknesses and areas where
                            you need more preparation.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                FEATURES
            ========================= */}
            <section
                id="features"
                className="home-about"
            >

                <div className="section-heading">

                    <h2>
                        Powerful Features
                    </h2>

                    <p>

                        Everything you need to make your interview
                        preparation more effective and organized.

                    </p>

                </div>

                <div className="feature-container">

                    <div className="feature-card">

                        <div className="feature-icon">
                            🤖
                        </div>

                        <h3>
                            AI Generated Questions
                        </h3>

                        <p>

                            Generate interview questions according
                            to your job role, experience level,
                            interview type and selected difficulty.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            📝
                        </div>

                        <h3>
                            Interactive Interviews
                        </h3>

                        <p>

                            Answer questions one by one and
                            experience a structured interview
                            practice session.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            📊
                        </div>

                        <h3>
                            Answer Evaluation
                        </h3>

                        <p>

                            Get AI-based analysis of your answers
                            including correctness, relevance,
                            technical accuracy and score.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            💪
                        </div>

                        <h3>
                            Strengths & Weaknesses
                        </h3>

                        <p>

                            Understand what you are doing well and
                            which areas require more preparation.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            💡
                        </div>

                        <h3>
                            Personalized Feedback
                        </h3>

                        <p>

                            Receive AI-generated recommendations
                            designed to help you improve your
                            interview performance.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            📚
                        </div>

                        <h3>
                            Interview History
                        </h3>

                        <p>

                            Keep track of previous interviews,
                            results and performance so you can
                            monitor your progress.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                HOW IT WORKS
            ========================= */}
            <section
                id="how-it-works"
                className="home-contact"
            >

                <div className="section-heading">

                    <h2>
                        How AI Interview Assist Works
                    </h2>

                    <p>

                        Start preparing for your next interview
                        in just a few simple steps.

                    </p>

                </div>

                <div className="feature-container">

                    <div className="feature-card">

                        <div className="feature-icon">
                            1
                        </div>

                        <h3>
                            Create Your Account
                        </h3>

                        <p>

                            Register on the platform and create
                            your personal interview preparation
                            profile.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            2
                        </div>

                        <h3>
                            Setup Interview
                        </h3>

                        <p>

                            Select your job role, experience level,
                            interview type, difficulty and number
                            of questions.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            3
                        </div>

                        <h3>
                            Answer Questions
                        </h3>

                        <p>

                            Start your interview and answer the
                            AI-generated questions one by one.

                        </p>

                    </div>

                    <div className="feature-card">

                        <div className="feature-icon">
                            4
                        </div>

                        <h3>
                            Get Your Results
                        </h3>

                        <p>

                            Receive your performance analysis,
                            scores, strengths, weaknesses and
                            improvement recommendations.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                INTERVIEW TYPES
            ========================= */}
            <section className="home-about">

                <div className="section-heading">

                    <h2>
                        Prepare for Different Types of Interviews
                    </h2>

                    <p>

                        AI Interview Assist can help you prepare
                        for interviews across different careers
                        and professional fields.

                    </p>

                </div>
                <div className="feature-container">

                    <div className="feature-card">

                        <div className="feature-icon">
                            💻
                        </div>

                        <h3>
                            IT & Software
                        </h3>

                        <p>

                            Prepare for software development,
                            web development, database, networking,
                            cybersecurity and other technical roles.

                        </p>

                    </div>
                    <div className="feature-card">

                        <div className="feature-icon">
                            🏥
                        </div>

                        <h3>
                            Healthcare
                        </h3>

                        <p>

                            Practice interviews for nursing,
                            healthcare, medical support and
                            other healthcare-related positions.

                        </p>

                    </div>
                    <div className="feature-card">

                        <div className="feature-icon">
                            ⚙️
                        </div>

                        <h3>
                            Engineering
                        </h3>

                        <p>

                            Prepare for mechanical, civil,
                            chemical, electrical and other
                            engineering roles.

                        </p>

                    </div>
                    <div className="feature-card">

                        <div className="feature-icon">
                            💼
                        </div>

                        <h3>
                            Business & Management
                        </h3>

                        <p>

                            Practice HR, management, finance,
                            marketing, business administration
                            and related interviews.

                        </p>

                    </div>
                    <div className="feature-card">

                        <div className="feature-icon">
                            🎓
                        </div>

                        <h3>
                            Freshers
                        </h3>

                        <p>

                            Build confidence and prepare for
                            your first job interview with
                            structured practice.

                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            🚀
                        </div>

                        <h3>
                            Experienced Professionals
                        </h3>

                        <p>

                            Improve your interview performance
                            and prepare for challenging
                            professional opportunities.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                BENEFITS
            ========================= */}
            <section className="home-contact">

                <div className="section-heading">

                    <h2>
                        Why Choose AI Interview Assist?
                    </h2>

                    <p>

                        Designed to make interview preparation
                        simple, practical and personalized.

                    </p>

                </div>


                <div className="feature-container">

                    <div className="feature-card">

                        <div className="feature-icon">
                            ⚡
                        </div>

                        <h3>
                            Easy to Use
                        </h3>

                        <p>

                            Simple and user-friendly interface
                            designed for quick and comfortable
                            interview practice.

                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            🎯
                        </div>

                        <h3>
                            Personalized
                        </h3>

                        <p>

                            Questions and feedback are tailored
                            according to your selected interview
                            requirements.

                        </p>

                    </div>


                    <div className="feature-card">

                        <div className="feature-icon">
                            📊
                        </div>

                        <h3>
                            Data-Driven Results
                        </h3>

                        <p>

                            Understand your performance using
                            scores, evaluation and detailed
                            interview analysis.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                FAQ
            ========================= */}
            <section className="home-about">

                <div className="section-heading">

                    <h2>
                        Frequently Asked Questions
                    </h2>

                    <p>
                        Some common questions about the platform.
                    </p>

                </div>


                <div className="feature-container">

                    <div className="feature-card">

                        <h3>
                            Can I practice different job roles?
                        </h3>

                        <p>

                            Yes. You can select different job
                            roles while setting up your interview.
                            The platform can generate questions
                            according to the selected role.

                        </p>

                    </div>


                    <div className="feature-card">

                        <h3>
                            Can freshers use the platform?
                        </h3>

                        <p>

                            Yes. The platform is suitable for
                            both freshers and experienced
                            professionals.

                        </p>

                    </div>


                    <div className="feature-card">

                        <h3>
                            How are answers evaluated?
                        </h3>

                        <p>

                            AI analyzes your answers and provides
                            scores, strengths, weaknesses,
                            missing concepts and improvement
                            feedback.

                        </p>

                    </div>


                    <div className="feature-card">

                        <h3>
                            Can I view previous interviews?
                        </h3>

                        <p>

                            Yes. Your previous interview sessions
                            can be accessed through the interview
                            history section after login.

                        </p>

                    </div>

                </div>

            </section>

            {/* =========================
                CONTACT
            ========================= */}
            <section
                id="contact"
                className="home-contact"
            >

                <div className="section-heading">

                    <h2>
                        Contact Us
                    </h2>

                    <p>

                        Have a question, suggestion or feedback?
                        We would love to hear from you.

                    </p>

                </div>

                <div className="contact-content">

                    <div className="contact-info">

                        <h3>
                            Get In Touch
                        </h3>

                        <p>
                            Have a question about AI Interview Assist?
                            Need help with your interview preparation?
                            Our support team is here to help you.
                        </p>

                        <div className="contact-details">

                            <div className="contact-item">

                                <span className="contact-icon">
                                    📧
                                </span>

                                <div>
                                    <strong>Email</strong>

                                    <p>
                                        support@aiinterviewassist.com
                                    </p>
                                </div>

                            </div>


                            <div className="contact-item">

                                <span className="contact-icon">
                                    💬
                                </span>

                                <div>
                                    <strong>Support</strong>

                                    <p>
                                        Get assistance with your account,
                                        interviews and results.
                                    </p>
                                </div>

                            </div>


                            <div className="contact-item">

                                <span className="contact-icon">
                                    ⏰
                                </span>

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

            {/* =========================
                FOOTER
            ========================= */}
            <footer className="home-footer">

                <div>

                    <strong>
                        AI Interview Assist
                    </strong>

                    <p>
                        Smart interview preparation powered by AI.
                    </p>

                    <p>
                        Practice • Analyze • Improve • Succeed
                    </p>

                </div>


                <div className="footer-links">

                    <a href="#home">
                        Home
                    </a>

                    <a href="#about">
                        About
                    </a>

                    <a href="#features">
                        Features
                    </a>

                    <a href="#how-it-works">
                        How It Works
                    </a>

                    <a href="#contact">
                        Contact Us
                    </a>

                    <Link to="/login">
                        Login
                    </Link>

                    <Link to="/register">
                        Register
                    </Link>

                </div>

            </footer>

        </div>
    );
}

export default Home;
