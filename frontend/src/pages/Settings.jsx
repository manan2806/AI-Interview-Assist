import { useState } from "react";
import { Link } from "react-router-dom";

function Settings() {
    const [activeSection, setActiveSection] = useState("account");

    return (
        <div className="settings-page">
            <div className="settings-container">
                {/* HEADER */}
                <div className="settings-header">
                    <div>
                        <p className="settings-label">
                            Preferences
                        </p>
                        <h1>Settings</h1>
                        <p>
                            Manage your account and interview preferences.
                        </p>
                    </div>
                </div>

                {/* SETTINGS CONTENT */}
                <div className="settings-layout">
                    {/* SIDEBAR */}
                    <div className="settings-sidebar">
                        <button
                            className={
                                activeSection === "account"
                                    ? "settings-menu active"
                                    : "settings-menu"
                            }
                            onClick={() =>
                                setActiveSection("account")
                            }
                        >
                            👤 Account
                        </button>
                        <button
                            className={
                                activeSection === "interview"
                                    ? "settings-menu active"
                                    : "settings-menu"
                            }
                            onClick={() =>
                                setActiveSection("interview")
                            }
                        >
                            🎯 Interview Preferences
                        </button>
                        <button
                            className={
                                activeSection === "appearance"
                                    ? "settings-menu active"
                                    : "settings-menu"
                            }
                            onClick={() =>
                                setActiveSection("appearance")
                            }
                        >
                            🎨 Appearance
                        </button>
                        <button
                            className={
                                activeSection === "security"
                                    ? "settings-menu active"
                                    : "settings-menu"
                            }
                            onClick={() =>
                                setActiveSection("security")
                            }
                        >
                            🔒 Security
                        </button>
                    </div>

                    {/* CONTENT */}
                    <div className="settings-content">
                        {activeSection === "account" && (
                            <div className="settings-card">
                                <div className="settings-section-header">
                                    <div>
                                        <h2>Account Settings</h2>
                                        <p>
                                            Manage your personal account information.
                                        </p>
                                    </div>
                                </div>

                                {/* PROFILE INFORMATION */}
                                <div className="settings-option">
                                    <div className="settings-option-icon">
                                        👤
                                    </div>

                                    <div className="settings-option-info">
                                        <h3>Profile Information</h3>

                                        <p>
                                            Update your name, skills, target role and
                                            other profile details.
                                        </p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        className="settings-option-button"
                                    >
                                        View Profile
                                    </Link>
                                </div>

                                {/* CHANGE PASSWORD */}
                                <div className="settings-option">
                                    <div className="settings-option-icon">
                                        🔑
                                    </div>

                                    <div className="settings-option-info">
                                        <h3>Change Password</h3>

                                        <p>
                                            Change your account password to keep your
                                            account secure.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="settings-option-button"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeSection === "interview" && (
                            <div className="settings-card">

                                <div className="settings-section-header">
                                    <div>
                                        <h2>Interview Preferences</h2>
                                        <p>
                                            Customize your default interview experience.
                                        </p>
                                    </div>
                                </div>

                                {/* DEFAULT INTERVIEW TYPE */}
                                <div className="settings-field">
                                    <label>
                                        Default Interview Type
                                    </label>
                                    <select defaultValue="Technical">
                                        <option value="Technical">
                                            Technical
                                        </option>
                                        <option value="HR">
                                            HR
                                        </option>
                                        <option value="Mixed">
                                            Mixed
                                        </option>
                                    </select>

                                    <small>
                                        Choose the interview type you usually prefer.
                                    </small>

                                </div>

                                {/* DEFAULT DIFFICULTY */}
                                <div className="settings-field">
                                    <label>
                                        Default Difficulty
                                    </label>
                                    <select defaultValue="Medium">
                                        <option value="Easy">
                                            Easy
                                        </option>
                                        <option value="Medium">
                                            Medium
                                        </option>
                                        <option value="Hard">
                                            Hard
                                        </option>
                                    </select>

                                    <small>
                                        Set the difficulty level used for new interviews.
                                    </small>

                                </div>

                                {/* DEFAULT QUESTIONS */}
                                <div className="settings-field">
                                    <label>
                                        Default Number of Questions
                                    </label>
                                    <select defaultValue="10">
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="15">15</option>
                                        <option value="20">20</option>
                                    </select>

                                    <small>
                                        Choose how many questions a new interview should contain.
                                    </small>

                                </div>
                            </div>
                        )}

                        {activeSection === "appearance" && (
                            <div className="settings-card">
                                <div className="settings-section-header">
                                    <div>
                                        <h2>Appearance</h2>
                                        <p>
                                            Customize how Interview Assist looks.
                                        </p>
                                    </div>
                                </div>

                                {/* THEME */}
                                <div className="settings-field">
                                    <label>
                                        Theme
                                    </label>
                                    <select defaultValue="Light">
                                        <option value="Light">
                                            Light
                                        </option>
                                        <option value="Dark">
                                            Dark
                                        </option>
                                        <option value="System">
                                            System Default
                                        </option>
                                    </select>

                                    <small>
                                        Choose the appearance of your Interview Assist dashboard.
                                    </small>

                                </div>
                            </div>
                        )}

                        {activeSection === "security" && (
                            <div className="settings-card">
                                <div className="settings-section-header">
                                    <div>
                                        <h2>Security</h2>
                                        <p>
                                            Manage your account security and access.
                                        </p>
                                    </div>
                                </div>

                                {/* DELETE ACCOUNT */}
                                <div className="settings-option settings-danger-option">
                                    <div className="settings-option-icon">
                                        ⚠️
                                    </div>
                                    <div className="settings-option-info">
                                        <h3>
                                            Delete Account
                                        </h3>
                                        <p>
                                            Permanently delete your account and associated
                                            interview data.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="settings-danger-button"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;

