
import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

function SplashScreen({ onComplete }) {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState(
        "Initializing AI Interview Assist..."
    );

    useEffect(() => {
        const duration = 5000;
        const startTime = Date.now();

        const messages = [
            "Initializing AI Interview Assist...",
            "Preparing Your Interview Experience...",
            "Loading Smart AI Features...",
            "Setting Up Your Workspace...",
            "Almost Ready..."
        ];

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const percentage = Math.min(
                (elapsed / duration) * 100,
                100
            );

            setProgress(percentage);

            const messageIndex = Math.min(
                Math.floor((elapsed / duration) * messages.length),
                messages.length - 1
            );

            setLoadingText(messages[messageIndex]);

            if (elapsed >= duration) {
                clearInterval(interval);
                setProgress(100);
                onComplete();
            }
        }, 30);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="splash-container">

            {/* Background Effects */}
            <div className="splash-bg-circle splash-circle-one" />
            <div className="splash-bg-circle splash-circle-two" />
            <div className="splash-bg-circle splash-circle-three" />

            <div className="splash-content">

                {/* Logo Section */}
                <div className="splash-logo-wrapper">

                    <div className="splash-logo-glow" />

                    <img
                        src="/ai-interview-assist-logo.png"
                        alt="AI Interview Assist"
                        className="splash-logo"
                    />

                </div>

                {/* Brand Name */}
                <div className="splash-brand">
                    <h1>
                        AI Interview <span>Assist</span>
                    </h1>

                    <p className="splash-brand-subtitle">
                        YOUR SMARTER PATH TO INTERVIEW SUCCESS
                    </p>
                </div>

                {/* Loading Section */}
                <div className="splash-loading">

                    <div className="splash-loading-status">
                        <span className="splash-status-dot" />
                        <span>AI SYSTEM INITIALIZING</span>
                    </div>

                    <h2>
                        {loadingText}
                    </h2>

                    <p className="splash-subtitle">
                        AI Powered Interview Preparation
                    </p>

                    {/* Progress Bar */}
                    <div className="splash-progress-background">

                        <div
                            className="splash-progress-fill"
                            style={{
                                width: `${progress}%`
                            }}
                        >
                            <span className="splash-progress-shine" />
                        </div>

                    </div>

                    {/* Progress Information */}
                    <div className="splash-progress-info">

                        <span>
                            Getting Everything Ready...
                        </span>

                        <strong>
                            {Math.floor(progress)}%
                        </strong>

                    </div>

                </div>

                {/* Features */}
                <div className="splash-features">

                    <div className="splash-feature">
                        <span>✦</span>
                        AI Powered
                    </div>

                    <div className="splash-feature-divider" />

                    <div className="splash-feature">
                        <span>◈</span>
                        Smart Practice
                    </div>

                    <div className="splash-feature-divider" />

                    <div className="splash-feature">
                        <span>✓</span>
                        Better Results
                    </div>

                </div>

                {/* Footer */}
                <div className="splash-footer">
                    <p>
                        Trust <span>•</span> Practise <span>•</span> Success
                    </p>

                    <small>
                        POWERED BY ARTIFICIAL INTELLIGENCE
                    </small>
                </div>

            </div>

        </div>
    );
}

export default SplashScreen;
