import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getProfile,
    updateProfile
} from "../services/authService";

function Profile() {

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editing, setEditing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [experienceLevel, setExperienceLevel] =
        useState("Fresher");

    const [skills, setSkills] = useState("");

    // ==========================================
    // GET PROFILE
    // ==========================================
    const loadProfile = async () => {

        try {

            setLoading(true);
            setError("");
            setSuccess("");

            const data = await getProfile();

            if (data.success) {

                const user = data.user;

                setProfile(user);

                setName(user.name || "");
                setEmail(user.email || "");

                setTargetRole(
                    user.target_role || ""
                );

                setExperienceLevel(
                    user.experience_level ||
                    "Fresher"
                );

                setSkills(
                    user.skills?.join(", ") || ""
                );

            } else {

                setError(
                    data.message ||
                    "Unable to load profile."
                );
            }

        } catch (error) {

            console.error(
                "Profile Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load profile. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // LOAD PROFILE
    useEffect(() => {

        loadProfile();

    }, []);

    // ==========================================
    // UPDATE PROFILE
    // ==========================================
    const handleUpdate = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        try {

            setSaving(true);

            const skillsArray = skills
                .split(",")
                .map(skill => skill.trim())
                .filter(skill => skill !== "");

            const data = await updateProfile({

                name,

                target_role:
                    targetRole,

                experience_level:
                    experienceLevel,

                skills:
                    skillsArray

            });

            if (data.success) {

                setSuccess(
                    data.message ||
                    "Profile updated successfully."
                );

                setEditing(false);

                await loadProfile();

                // UPDATE LOCAL STORAGE USER
                if (data.user) {

                    localStorage.setItem(
                        "user",
                        JSON.stringify(data.user)
                    );
                }

            } else {

                setError(
                    data.message ||
                    "Unable to update profile."
                );
            }

        } catch (error) {

            console.error(
                "Update Profile Error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to update profile."
            );

        } finally {

            setSaving(false);
        }
    };

    // LOADING STATE
    if (loading) {

        return (

            <div className="profile-loading">

                <div className="profile-loader">
                    ⟳
                </div>

                <h2>
                    Loading Profile...
                </h2>

                <p>
                    Please wait while we load your profile.
                </p>

            </div>
        );
    }

    // ERROR STATE
    if (error && !profile) {

        return (

            <div className="profile-error-page">

                <div className="profile-error-icon">
                    ⚠️
                </div>

                <h2>
                    Unable to Load Profile
                </h2>

                <p>
                    {error}
                </p>

                <button
                    className="profile-retry-button"
                    onClick={loadProfile}
                >
                    Try Again
                </button>

                <Link
                    to="/dashboard"
                    className="profile-dashboard-button"
                >
                    ← Back to Dashboard
                </Link>

            </div>
        );
    }

    // ==========================================
    // PROFILE PAGE
    // ==========================================
    return (

        <div className="profile-page">

            <div className="profile-container">


                {/* HEADER */}
                <div className="profile-header">

                    <div>

                        <p className="profile-label">
                            Account
                        </p>

                        <h1>
                            My Profile
                        </h1>

                        <p>
                            Manage your personal and
                            professional information.
                        </p>

                    </div>

                    <Link to="/dashboard">
                        ← Dashboard
                    </Link>

                </div>

                {/* MESSAGES */}
                {error && (

                    <div className="profile-error">
                        {error}
                    </div>

                )}

                {success && (

                    <div className="profile-success">
                        {success}
                    </div>

                )}

                {/* PROFILE CARD */}
                <div className="profile-card">

                    {!editing ? (

                        <>
                            {/* PROFILE AVATAR */}
                            <div className="profile-avatar">

                                {profile?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "U"}

                            </div>

                            {/* PROFILE INFORMATION */}
                            <div className="profile-info">

                                {/* FULL NAME */}
                                <div className="profile-row">

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>
                                        {profile?.name ||
                                            "Not set"}
                                    </strong>

                                </div>

                                {/* EMAIL */}
                                <div className="profile-row">

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {profile?.email ||
                                            "Not set"}
                                    </strong>

                                </div>

                                {/* TARGET ROLE */}
                                <div className="profile-row">

                                    <span>
                                        Target Role
                                    </span>

                                    <strong>
                                        {profile?.target_role ||
                                            "Not set"}
                                    </strong>

                                </div>

                                {/* EXPERIENCE */}
                                <div className="profile-row">

                                    <span>
                                        Experience Level
                                    </span>

                                    <strong>
                                        {profile?.experience_level ||
                                            "Fresher"}
                                    </strong>

                                </div>

                                {/* SKILLS */}
                                <div className="profile-row">

                                    <span>
                                        Skills
                                    </span>

                                    <div className="skills-list">

                                        {profile?.skills?.length > 0

                                            ? profile.skills.map(
                                                (skill, index) => (

                                                    <span
                                                        key={index}
                                                        className="skill-tag"
                                                    >
                                                        {skill}
                                                    </span>

                                                )
                                            )

                                            : "No skills added"
                                        }

                                    </div>

                                </div>

                            </div>

                            {/* EDIT BUTTON */}
                            <button
                                className="edit-profile-button"
                                onClick={() => {

                                    setError("");
                                    setSuccess("");
                                    setEditing(true);

                                }}
                            >
                                Edit Profile
                            </button>

                        </>

                    ) : (

                        /* ==================================
                           EDIT FORM
                        ================================== */
                        <form
                            className="profile-form"
                            onSubmit={handleUpdate}
                        >

                            <h2>
                                Edit Profile
                            </h2>

                            {/* FULL NAME */}
                            <div className="profile-form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    required
                                />

                            </div>

                            {/* EMAIL */}
                            <div className="profile-form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                />

                                <small>
                                    Email cannot be changed.
                                </small>

                            </div>

                            {/* TARGET ROLE */}
                            <div className="profile-form-group">

                                <label>
                                    Target Role
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. Software Engineer"
                                    value={targetRole}
                                    onChange={(e) =>
                                        setTargetRole(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>

                            {/* EXPERIENCE LEVEL */}
                            <div className="profile-form-group">

                                <label>
                                    Experience Level
                                </label>

                                <select
                                    value={experienceLevel}
                                    onChange={(e) =>
                                        setExperienceLevel(
                                            e.target.value
                                        )
                                    }
                                >

                                    <option value="Fresher">
                                        Fresher
                                    </option>

                                    <option value="Junior">
                                        Junior
                                    </option>

                                    <option value="Mid Level">
                                        Mid Level
                                    </option>

                                    <option value="Senior">
                                        Senior
                                    </option>

                                </select>

                            </div>

                            {/* SKILLS */}
                            <div className="profile-form-group">

                                <label>
                                    Skills
                                </label>

                                <input
                                    type="text"
                                    placeholder="Python, React, MongoDB"
                                    value={skills}
                                    onChange={(e) =>
                                        setSkills(
                                            e.target.value
                                        )
                                    }
                                />

                                <small>
                                    Separate skills with commas.
                                </small>

                            </div>

                            {/* FORM ACTIONS */}
                            <div className="profile-actions">

                                <button
                                    type="submit"
                                    className="save-profile-button"
                                    disabled={saving}
                                >

                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}

                                </button>

                                <button
                                    type="button"
                                    className="cancel-profile-button"
                                    onClick={() => {

                                        setError("");
                                        setSuccess("");
                                        setEditing(false);

                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    )}

                </div>

            </div>

        </div>
    );
}

export default Profile;
