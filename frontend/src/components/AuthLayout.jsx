function AuthLayout({ children }) {
    return (
        <div className="auth-page">

            <div className="auth-left">
                <div className="brand">
                    <div className="brand-icon">AI</div>

                    <h1>AI Interview Assist</h1>

                    <p>
                        Prepare smarter. Practice better.
                        Crack your next interview with confidence.
                    </p>
                </div>

                <div className="feature-list">
                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>AI-Powered Interviews</strong>
                            <p>Practice realistic interview questions.</p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>Personalized Feedback</strong>
                            <p>Understand your strengths and weaknesses.</p>
                        </div>
                    </div>

                    <div className="feature">
                        <span>✓</span>
                        <div>
                            <strong>Track Your Progress</strong>
                            <p>Improve your performance interview by interview.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right">
                {children}
            </div>

        </div>
    );
}

export default AuthLayout;