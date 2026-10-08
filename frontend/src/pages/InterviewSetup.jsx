import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { getSettings } from "../services/api";

import {
    createInterview,
    generateQuestions
} from "../services/interviewService";

function InterviewSetup() {
    const navigate = useNavigate();
    const user = getUser();

    // ==========================================
    // FORM STATES
    // ==========================================
    const [field, setField] = useState("");
    const [targetRole, setTargetRole] = useState(
        user?.target_role || ""
    );
    const [experienceLevel, setExperienceLevel] = useState(
        user?.experience_level || "Fresher"
    );
    const [interviewType, setInterviewType] = useState("Mixed");
    const [difficulty, setDifficulty] = useState("Medium");
    const [questionCount, setQuestionCount] = useState(10);
    const [duration, setDuration] = useState("No Limit");
    const [customDuration, setCustomDuration] = useState("");
    const [customDurationApplied, setCustomDurationApplied] = useState(false);
    const [customDurationError, setCustomDurationError] = useState("");

    // ==========================================
    // LOADING / ERROR STATES
    // ==========================================
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const loadSavedSettings = async () => {
            try {
                const response = await getSettings();
                if (response?.success && response?.settings) {
                    const savedSettings = response.settings;
                    if (savedSettings.interview_type) {
                        setInterviewType(
                            savedSettings.interview_type
                        );
                    }
                    if (savedSettings.difficulty) {
                        setDifficulty(
                            savedSettings.difficulty
                        );
                    }

                    if (savedSettings.number_of_questions) {
                        setQuestionCount(
                            Number(
                                savedSettings.number_of_questions
                            )
                        );
                    }
                }
            } catch (error) {
                console.error(
                    "Load Saved Interview Settings Error:",
                    error
                );
            }
        };
        loadSavedSettings();
    }, []);

    // ==========================================
    // START INTERVIEW
    // ==========================================
    const handleStartInterview = async (e) => {
        e.preventDefault();

        setError("");

        // VALIDATION
        if (!field) {
            setError("Please select an interview field.");
            return;
        }

        if (!targetRole.trim()) {
            setError("Please enter your target role.");
            return;
        }

        // CUSTOM DURATION VALIDATION
        if (duration === "Custom") {
            const minutes = Number(customDuration);

            if (!customDuration || Number.isNaN(minutes)) {
                setError("Please enter a custom duration.");
                return;
            }

            if (minutes < 3 || minutes > 60) {
                setError(
                    "Custom duration must be between 3 and 60 minutes."
                );
                return;
            }
        }

        try {
            setLoading(true);

            // CREATE INTERVIEW
            setLoadingStep("Creating your interview...");

            const interviewData = {
                job_role: targetRole.trim(),
                experience_level: experienceLevel,
                interview_type: interviewType,
                difficulty: difficulty,
                number_of_questions: Number(questionCount),
                duration: duration,
                custom_duration:
                    duration === "Custom"
                        ? Number(customDuration)
                        : null
            };

            console.log("INTERVIEW SETUP PAYLOAD:", interviewData);
            const createData = await createInterview(
                interviewData
            );

            // CREATE INTERVIEW ERROR
            if (!createData?.success) {
                setError(
                    createData?.message ||
                    "Unable to create interview. Please try again."
                );
                return;
            }

            // GET INTERVIEW ID
            const interviewId = createData?.interview_id;

            if (!interviewId) {
                setError(
                    "Interview was created, but interview ID was not received."
                );
                return;
            }

            // SAVE INTERVIEW ID
            localStorage.setItem(
                "interview_id",
                interviewId
            );

            // SAVE FRONTEND SETUP
            const interviewSetup = {
                field,
                target_role: targetRole.trim(),
                experience_level: experienceLevel,
                interview_type: interviewType,
                difficulty,
                question_count: Number(questionCount),
                duration,
                custom_duration:
                    duration === "Custom"
                        ? Number(customDuration)
                        : null,
                interview_id: interviewId
            };

            localStorage.setItem(
                "interview_setup",
                JSON.stringify(interviewSetup)
            );

            // GENERATE AI QUESTIONS
            setLoadingStep(
                "Generating AI interview questions..."
            );

            const questionData = await generateQuestions(
                interviewId
            );

            // QUESTION GENERATION ERROR
            if (!questionData?.success) {
                setError(
                    questionData?.message ||
                    "Unable to generate interview questions. Please try again."
                );
                return;
            }

            // SUCCESS
            setLoadingStep(
                "Interview ready! Starting..."
            );

            // Small delay so user can see success message
            setTimeout(() => {
                navigate("/interview/start");
            }, 500);

        } catch (error) {
            console.error(
                "Interview Setup Error:",
                error
            );

            // HANDLE API ERROR
            const apiMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error;

            if (apiMessage) {
                setError(apiMessage);
            } else if (error?.message) {
                setError(error.message);
            } else {
                setError(
                    "Unable to prepare interview. Please try again."
                );
            }

        } finally {
            setLoading(false);
            setLoadingStep("");
        }
    };

    return (
        <div className="interview-setup-page">
            <div className="interview-setup-container">
                {/* HEADER */}
                <div className="interview-setup-header">
                    <div>
                        <p className="interview-setup-label">
                            Interview Preparation
                        </p>

                        <h1>
                            Setup Your Interview
                        </h1>

                        <p>
                            Customize your interview according
                            to your field, role and experience.
                        </p>
                    </div>

                    <button
                        className="result-back-btn"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        Dashboard
                    </button>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="setup-error">
                        <strong>
                            Something went wrong
                        </strong>

                        <p>
                            {error}
                        </p>
                    </div>
                )}

                {/* LOADING MESSAGE */}
                {loading && (
                    <div className="setup-loading">
                        <div className="setup-loading-spinner">
                            <span></span>
                        </div>

                        <div>
                            <strong>
                                Preparing Interview
                            </strong>

                            <p>
                                {loadingStep ||
                                    "Please wait..."}
                            </p>
                        </div>
                    </div>
                )}

                {/* FORM */}
                <form
                    className="interview-setup-card"
                    onSubmit={handleStartInterview}
                >
                    {/* FIELD */}
                    <div className="setup-section">
                        <label>
                            Interview Field
                        </label>

                        <p className="setup-help">
                            Select the field in which you want
                            to practice your interview.
                        </p>

                        <select
                            value={field}
                            onChange={(e) =>
                                setField(e.target.value)
                            }
                            disabled={loading}
                        >
                            <option value="">
                                Select Interview Field
                            </option>

                            <option value="Software Engineering">
                                Software Engineering
                            </option>

                            <option value="Data Science">
                                Data Science
                            </option>

                            <option value="Artificial Intelligence">
                                Artificial Intelligence
                            </option>

                            <option value="Cybersecurity">
                                Cybersecurity
                            </option>

                            <option value="Cloud Computing">
                                Cloud Computing
                            </option>

                            <option value="Information Technology">
                                Information Technology
                            </option>

                            <option value="Mechanical Engineering">
                                Mechanical Engineering
                            </option>

                            <option value="Civil Engineering">
                                Civil Engineering
                            </option>

                            <option value="Electrical Engineering">
                                Electrical Engineering
                            </option>

                            <option value="Chemical Engineering">
                                Chemical Engineering
                            </option>

                            <option value="Electronics & Communication">
                                Electronics & Communication
                            </option>

                            <option value="Nursing">
                                Nursing
                            </option>

                            <option value="Medical & Healthcare">
                                Medical & Healthcare
                            </option>

                            <option value="Pharmacy">
                                Pharmacy
                            </option>

                            <option value="Finance & Accounting">
                                Finance & Accounting
                            </option>

                            <option value="Banking">
                                Banking
                            </option>

                            <option value="Marketing & Sales">
                                Marketing & Sales
                            </option>

                            <option value="Human Resources">
                                Human Resources
                            </option>

                            <option value="Business & Management">
                                Business & Management
                            </option>

                            <option value="Education & Teaching">
                                Education & Teaching
                            </option>

                            <option value="Other">
                                Other
                            </option>
                        </select>
                    </div>

                    {/* TARGET ROLE */}
                    <div className="setup-section">
                        <label>
                            Target Role
                        </label>

                        <p className="setup-help">
                            What position are you preparing for?
                        </p>

                        <input
                            type="text"
                            placeholder="e.g. Software Engineer"
                            value={targetRole}
                            onChange={(e) =>
                                setTargetRole(e.target.value)
                            }
                            disabled={loading}
                        />
                    </div>

                    {/* EXPERIENCE */}
                    <div className="setup-section">
                        <label>
                            Experience Level
                        </label>

                        <div className="option-grid">
                            {[
                                "Fresher",
                                "Junior",
                                "Mid Level",
                                "Senior"
                            ].map((level) => (
                                <button
                                    type="button"
                                    key={level}
                                    disabled={loading}
                                    className={
                                        experienceLevel === level
                                            ? "option-button active"
                                            : "option-button"
                                    }
                                    onClick={() =>
                                        setExperienceLevel(level)
                                    }
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* INTERVIEW TYPE */}
                    <div className="setup-section">
                        <label>
                            Interview Type
                        </label>

                        <p className="setup-help">
                            Choose the type of questions you want.
                        </p>

                        <div className="option-grid">
                            {[
                                "Technical",
                                "HR",
                                "Mixed"
                            ].map((type) => (
                                <button
                                    type="button"
                                    key={type}
                                    disabled={loading}
                                    className={
                                        interviewType === type
                                            ? "option-button active"
                                            : "option-button"
                                    }
                                    onClick={() =>
                                        setInterviewType(type)
                                    }
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DIFFICULTY */}
                    <div className="setup-section">
                        <label>
                            Difficulty Level
                        </label>

                        <div className="option-grid">
                            {[
                                "Easy",
                                "Medium",
                                "Hard"
                            ].map((level) => (
                                <button
                                    type="button"
                                    key={level}
                                    disabled={loading}
                                    className={
                                        difficulty === level
                                            ? "option-button active"
                                            : "option-button"
                                    }
                                    onClick={() =>
                                        setDifficulty(level)
                                    }
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* QUESTION COUNT */}
                    <div className="setup-section">
                        <label>
                            Number of Questions
                        </label>

                        <p className="setup-help">
                            Choose how many questions you want
                            in this interview.
                        </p>

                        <div className="option-grid">
                            {[5, 10, 15, 20].map((count) => (
                                <button
                                    type="button"
                                    key={count}
                                    disabled={loading}
                                    className={
                                        questionCount === count
                                            ? "option-button active"
                                            : "option-button"
                                    }
                                    onClick={() =>
                                        setQuestionCount(count)
                                    }
                                >
                                    {count} Questions
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* INTERVIEW DURATION */}
                    <div className="setup-section">
                        <label>
                            Interview Duration
                        </label>

                        <p className="setup-help">
                            Choose how much time you want for this interview.
                        </p>

                        <div className="option-grid">
                            {[
                                "No Limit",
                                "10 Minutes",
                                "20 Minutes",
                                "30 Minutes",
                                "Custom"
                            ].map((time) => (
                                <button
                                    type="button"
                                    key={time}
                                    disabled={loading}
                                    className={
                                        duration === time
                                            ? "option-button active"
                                            : "option-button"
                                    }
                                    onClick={() => {
                                        setDuration(time);

                                        if (time === "Custom") {
                                            setCustomDurationApplied(false);
                                        } else {
                                            setCustomDuration("");
                                            setCustomDurationApplied(false);
                                        }
                                    }}
                                >
                                    {time === "Custom" && customDuration
                                        ? `${customDuration} Minutes`
                                        : time}
                                </button>
                            ))}
                        </div>

                        {duration === "Custom" && !customDurationApplied && (
                            <div className="custom-duration-wrapper">
                                <label htmlFor="customDuration">
                                    Custom Duration
                                </label>

                                <div className="custom-duration-input">
                                    <input
                                        id="customDuration"
                                        type="number"
                                        min="3"
                                        max="60"
                                        value={customDuration}
                                        onChange={(e) => {
                                            setCustomDuration(e.target.value);
                                            setCustomDurationError("");
                                        }}
                                        placeholder="Enter minutes"
                                        disabled={loading}
                                    />

                                    <span>Minutes</span>
                                </div>

                                <small>
                                    Enter a duration between 3 and 60 minutes.
                                </small>

                                {customDurationError && (
                                    <p className="custom-duration-error">
                                        {customDurationError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="apply-duration-button"
                                    disabled={loading}
                                    onClick={() => {
                                        const minutes = Number(customDuration);

                                        if (!customDuration) {
                                            setCustomDurationError(
                                                "Please enter a duration."
                                            );
                                            return;
                                        }

                                        if (Number.isNaN(minutes)) {
                                            setCustomDurationError(
                                                "Please enter a valid number."
                                            );
                                            return;
                                        }

                                        if (minutes < 3) {
                                            setCustomDurationError(
                                                "Minimum duration is 3 minutes."
                                            );
                                            return;
                                        }

                                        if (minutes > 60) {
                                            setCustomDurationError(
                                                "Maximum duration is 60 minutes."
                                            );
                                            return;
                                        }

                                        setCustomDurationError("");
                                        setError("");
                                        setCustomDurationApplied(true);
                                    }}
                                >
                                    Apply Duration
                                </button>
                            </div>
                        )}
                    </div>

                    {/* SUMMARY */}
                    <div className="setup-summary">
                        <h2>
                            Interview Summary
                        </h2>

                        <div className="summary-grid">
                            <div>
                                <span>Field</span>

                                <strong>
                                    {field || "Not selected"}
                                </strong>
                            </div>

                            <div>
                                <span>Role</span>

                                <strong>
                                    {targetRole || "Not set"}
                                </strong>
                            </div>

                            <div>
                                <span>Experience</span>

                                <strong>
                                    {experienceLevel}
                                </strong>
                            </div>

                            <div>
                                <span>Type</span>

                                <strong>
                                    {interviewType}
                                </strong>
                            </div>

                            <div>
                                <span>Difficulty</span>

                                <strong>
                                    {difficulty}
                                </strong>
                            </div>

                            <div>
                                <span>Questions</span>

                                <strong>
                                    {questionCount}
                                </strong>
                            </div>

                            <div>
                                <span>Duration</span>

                                <strong>
                                    {duration === "Custom"
                                        ? `${customDuration || "Custom"} Minutes`
                                        : duration}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="setup-actions">
                        <Link
                            to="/dashboard"
                            className="setup-cancel-button"
                            onClick={(e) => {
                                if (loading) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            className="setup-start-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Preparing Interview..."
                                : "Start Interview →"
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default InterviewSetup;
