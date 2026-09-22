import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfile } from "../services/authService";

function ProfileImprovement() {

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // ==========================================
    // LOAD PROFILE
    // ==========================================
    const loadProfile = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getProfile();

            if (data.success) {

                setProfile(data.user);

            } else {

                setError(
                    data.message ||
                    "Unable to load your profile."
                );
            }

        } catch (error) {

            console.error(
                "Profile Improvement Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your profile. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // LOAD PROFILE ON PAGE LOAD
    useEffect(() => {

        loadProfile();

    }, []);

    // ==========================================
    // PROFILE COMPLETION
    // ==========================================
    const calculateCompletion = () => {

        if (!profile) {
            return 0;
        }

        let completed = 0;

        if (profile.name) {
            completed++;
        }

        if (profile.email) {
            completed++;
        }

        if (profile.target_role) {
            completed++;
        }

        if (profile.experience_level) {
            completed++;
        }

        if (
            profile.skills &&
            profile.skills.length > 0
        ) {
            completed++;
        }

        return Math.round(
            (completed / 5) * 100
        );
    };

    const completion =
        calculateCompletion();

    // ==========================================
    // IMPROVEMENT SUGGESTIONS
    // ==========================================
    const suggestions = [];

    if (!profile?.target_role) {

        suggestions.push({

            icon: "🎯",

            title: "Add your target role",

            description:
                "Set the job role you are preparing for so interviews can be personalized."

        });
    }

    if (
        !profile?.skills ||
        profile.skills.length === 0
    ) {

        suggestions.push({

            icon: "🛠️",

            title: "Add your skills",

            description:
                "Add your technical and professional skills to get relevant interview questions."

        });
    }

    if (
        profile?.skills &&
        profile.skills.length > 0 &&
        profile.skills.length < 3
    ) {

        suggestions.push({

            icon: "📚",

            title: "Add more skills",

            description:
                "Adding more relevant skills will help generate a better interview profile."

        });
    }

    if (!profile?.experience_level) {

        suggestions.push({

            icon: "💼",

            title: "Set experience level",

            description:
                "Choose your experience level to receive appropriate interview questions."

        });
    }

    // ==========================================
    // LOADING STATE
    // ==========================================
    if (loading) {

        return (

            <div className="profile-improvement-loading">

                <div className="profile-improvement-loader">
                </div>

                <h2>
                    Loading Profile...
                </h2>

                <p>
                    Please wait while we analyze your profile.
                </p>

            </div>
        );
    }

    // ==========================================
    // ERROR STATE
    // ==========================================
    if (error && !profile) {

        return (

            <div className="profile-improvement-error-page">

                <div className="profile-improvement-error-icon">
                    ⚠️
                </div>

                <h2>
                    Unable to Load Profile
                </h2>

                <p>
                    {error}
                </p>

                <div className="profile-improvement-error-actions">

                    <button
                        className="profile-improvement-retry-button"
                        onClick={loadProfile}
                    >
                        Try Again
                    </button>

                    <Link
                        to="/dashboard"
                        className="profile-improvement-dashboard-button"
                    >
                        ← Back to Dashboard
                    </Link>

                </div>

            </div>
        );
    }

    return (

        <div className="profile-improvement-page">

            <div className="profile-improvement-container">

                {/* ==================================
                    HEADER
                ================================== */}
                <div className="improvement-header">

                    <div>

                        <p className="improvement-label">
                            Profile Analysis
                        </p>

                        <h1>
                            Improve Your Profile
                        </h1>

                        <p>
                            Complete your profile to get a
                            more personalized interview experience.
                        </p>

                    </div>

                    <Link to="/dashboard">
                        ← Dashboard
                    </Link>

                </div>

                {/* ==================================
                    INLINE ERROR
                ================================== */}
                {error && (

                    <div className="profile-improvement-inline-error">

                        <span>
                            ⚠️
                        </span>

                        <p>
                            {error}
                        </p>

                        <button
                            onClick={loadProfile}
                        >
                            Retry
                        </button>

                    </div>

                )}

                {/* ==================================
                    COMPLETION CARD
                ================================== */}
                <div className="completion-card">

                    <div className="completion-info">

                        <div>

                            <h2>
                                Profile Completion
                            </h2>

                            <p>

                                {completion === 100

                                    ? "Your profile is complete! 🎉"

                                    : "Complete the missing information below."

                                }

                            </p>

                        </div>

                        <div className="completion-percentage">

                            {completion}%

                        </div>

                    </div>

                    <div className="progress-bar">

                        <div
                            className="progress-fill"
                            style={{
                                width: `${completion}%`
                            }}
                        />

                    </div>

                </div>

                {/* ==================================
                    CURRENT PROFILE
                ================================== */}
                <div className="improvement-card">

                    <h2>
                        Your Current Profile
                    </h2>

                    <div className="current-profile-grid">

                        {/* NAME */}
                        <div className="profile-mini-item">

                            <span>
                                Name
                            </span>

                            <strong>
                                {profile?.name ||
                                    "Not set"}
                            </strong>

                        </div>

                        {/* TARGET ROLE */}
                        <div className="profile-mini-item">

                            <span>
                                Target Role
                            </span>

                            <strong>
                                {profile?.target_role ||
                                    "Not set"}
                            </strong>

                        </div>

                        {/* EXPERIENCE */}
                        <div className="profile-mini-item">

                            <span>
                                Experience
                            </span>

                            <strong>
                                {profile?.experience_level ||
                                    "Not set"}
                            </strong>

                        </div>

                        {/* SKILLS */}
                        <div className="profile-mini-item">

                            <span>
                                Skills
                            </span>

                            <strong>
                                {profile?.skills?.length || 0}
                            </strong>

                        </div>

                    </div>

                </div>

                {/* ==================================
                    SUGGESTIONS
                ================================== */}
                <div className="improvement-card">

                    <h2>
                        Improvement Suggestions
                    </h2>

                    {suggestions.length === 0 ? (

                        <div className="all-complete">

                            <div className="complete-icon">
                                ✓
                            </div>

                            <div>

                                <h3>
                                    Great job!
                                </h3>

                                <p>
                                    Your basic profile information
                                    is complete. You are ready to
                                    start practicing interviews.
                                </p>

                            </div>

                        </div>

                    ) : (

                        <div className="suggestion-list">

                            {suggestions.map(
                                (suggestion, index) => (

                                    <div
                                        className="suggestion-item"
                                        key={index}
                                    >

                                        <div className="suggestion-icon">

                                            {suggestion.icon}

                                        </div>

                                        <div>

                                            <h3>
                                                {suggestion.title}
                                            </h3>

                                            <p>
                                                {suggestion.description}
                                            </p>

                                        </div>

                                        <Link to="/profile">

                                            Improve →

                                        </Link>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default ProfileImprovement;
