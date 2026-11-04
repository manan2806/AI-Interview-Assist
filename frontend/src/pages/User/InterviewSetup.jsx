
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../../utils/auth";
import { getSettings } from "../../services/api";
import "../../context/User/InterviewSetup.css";

import {
    createInterview,
    generateQuestions,
    generateCodingQuestion
} from "../../services/interviewService";

function InterviewSetup() {
    const navigate = useNavigate();
    const user = getUser();

    // ==========================================
    // FORM STATES
    // ==========================================
    const [interviewMode, setInterviewMode] = useState("");

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
    const [programmingLanguage, setProgrammingLanguage] = useState("python");

    const [duration, setDuration] = useState("No Limit");
    const [customDuration, setCustomDuration] = useState("");
    const [customDurationApplied, setCustomDurationApplied] = useState(false);
    const [customDurationError, setCustomDurationError] = useState("");

    const [otherTechnicalRole, setOtherTechnicalRole] = useState("");

    // ==========================================
    // LOADING / ERROR STATES
    // ==========================================
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState("");
    const [error, setError] = useState("");

    // ==========================================
    // LOAD SAVED SETTINGS
    // ==========================================
    useEffect(() => {
        const loadSavedSettings = async () => {
            try {
                const response = await getSettings();

                if (response?.success && response?.settings) {
                    const savedSettings = response.settings;

                    if (savedSettings.interview_type) {
                        setInterviewType(savedSettings.interview_type);
                    }

                    if (savedSettings.difficulty) {
                        setDifficulty(savedSettings.difficulty);
                    }

                    if (savedSettings.number_of_questions) {
                        setQuestionCount(
                            Number(savedSettings.number_of_questions)
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
    // SELECT INTERVIEW MODE
    // ==========================================
    const handleModeChange = (mode) => {
        setInterviewMode(mode);
        setField("");
        setError("");
        setCustomDurationError("");

        setOtherTechnicalRole("");

        if (mode === "coding") {
            setTargetRole("");
        } else {
            setTargetRole(user?.target_role || "");
        }
    };

    // ==========================================
    // START INTERVIEW
    // ==========================================
    const handleStartInterview = async (e) => {
        e.preventDefault();

        setError("");

        // MODE VALIDATION
        if (!interviewMode) {
            setError("Please select an interview mode.");
            return;
        }

        // FIELD VALIDATION
        if (!field) {
            setError("Please select an interview field.");
            return;
        }

        // ==========================================
        // TARGET ROLE VALIDATION
        // ==========================================

        let actualTargetRole = targetRole.trim();

        if (interviewMode === "coding") {

            if (targetRole === "Other Technical Role") {

                if (!otherTechnicalRole.trim()) {
                    setError("Please enter your technical role.");
                    return;
                }

                actualTargetRole = otherTechnicalRole.trim();
            }

        } else {

            if (!actualTargetRole) {
                setError("Please enter your target role.");
                return;
            }
        }

        // QUESTION COUNT VALIDATION
        // Only for Normal Interview
        if (
            interviewMode === "normal" &&
            ![5, 10, 15, 20].includes(Number(questionCount))
        ) {
            setError("Please select a valid question count.");
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


        // ==========================================
        // CODING MODE
        // ==========================================
        if (interviewMode === "coding") {

            try {
                setLoading(true);

                setLoadingStep(
                    "Generating your AI coding question..."
                );

                // CODING INTERVIEW PAYLOAD
                const codingInterviewData = {
                    field: field,
                    target_role: actualTargetRole,
                    experience_level: experienceLevel,
                    language: programmingLanguage,
                    difficulty: difficulty,
                    duration:
                        duration === "Custom"
                            ? `${Number(customDuration)} Minutes`
                            : duration
                };

                console.log(
                    "CODING INTERVIEW SETUP:",
                    codingInterviewData
                );

                // CALL BACKEND API
                const codingData = await generateCodingQuestion(
                    codingInterviewData
                );

                if (!codingData?.success) {
                    setError(
                        codingData?.message ||
                        "Unable to generate coding question. Please try again."
                    );
                    return;
                }

                // GET CODING INTERVIEW ID
                const codingInterviewId =
                    codingData?.interview_id;

                if (!codingInterviewId) {
                    setError(
                        "Coding interview was created, but interview ID was not received."
                    );
                    return;
                }

                // VALIDATE GENERATED QUESTION
                if (!codingData?.question) {
                    setError(
                        "Coding question was not received from the server."
                    );
                    return;
                }

                // SAVE CODING INTERVIEW ID
                localStorage.setItem(
                    "coding_interview_id",
                    codingInterviewId
                );

                // SAVE CODING INTERVIEW SETUP
                const codingInterviewSetup = {
                    mode: "coding",
                    interview_id: codingInterviewId,

                    field: codingData.field,
                    target_role: codingData.target_role,
                    experience_level: codingData.experience_level,

                    language: codingData.language,
                    difficulty: codingData.difficulty,
                    duration: codingData.duration,

                    question: codingData.question
                };

                localStorage.setItem(
                    "coding_interview_setup",
                    JSON.stringify(codingInterviewSetup)
                );

                // SUCCESS
                setLoadingStep(
                    "Coding interview ready! Starting..."
                );

                navigate("/coding-interview/start");

            } catch (error) {

                console.error(
                    "Coding Interview Setup Error:",
                    error
                );

                const apiMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.error;

                setError(
                    apiMessage ||
                    error?.message ||
                    "Unable to prepare coding interview. Please try again."
                );

            } finally {
                setLoading(false);
                setLoadingStep("");
            }

            return;
        }

        // ==========================================
        // NORMAL INTERVIEW
        // ==========================================
        try {
            setLoading(true);

            setLoadingStep("Creating your interview...");

            const interviewData = {
                job_role: actualTargetRole,
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

            console.log(
                "INTERVIEW SETUP PAYLOAD:",
                interviewData
            );

            const createData = await createInterview(interviewData);

            if (!createData?.success) {
                setError(
                    createData?.message ||
                    "Unable to create interview. Please try again."
                );
                return;
            }

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
                mode: "normal",
                field,
                target_role: actualTargetRole,
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

            const questionData = await generateQuestions(interviewId);

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

            setTimeout(() => {
                navigate("/interview/start");
            }, 500);

        } catch (error) {

            console.error(
                "Interview Setup Error:",
                error
            );

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

    // ==========================================
    // JSX
    // ==========================================
    return (
        <div className="interview-setup-page">
            <div className="interview-setup-container">

                {/* HEADER */}
                <div className="interview-setup-header">
                    <div>
                        <p className="interview-setup-label">
                            Interview Preparation
                        </p>

                        <h1>Setup Your Interview</h1>

                        <p>
                            Customize your interview according
                            to your field, role and experience.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="result-back-btn"
                        onClick={() => navigate("/dashboard")}
                    >
                        Dashboard
                    </button>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="setup-error">
                        <strong>Something went wrong</strong>
                        <p>{error}</p>
                    </div>
                )}

                {/* LOADING MESSAGE */}
                {loading && (
                    <div className="setup-loading">
                        <div className="setup-loading-spinner">
                            <span></span>
                        </div>

                        <div>
                            <strong>Preparing Interview</strong>
                            <p>
                                {loadingStep || "Please wait..."}
                            </p>
                        </div>
                    </div>
                )}

                {/* FORM */}
                <form
                    className="interview-setup-card"
                    onSubmit={handleStartInterview}
                >

                    {/* ======================================
                        INTERVIEW MODE
                    ====================================== */}
                    <div className="setup-section">
                        <label>Select Interview Mode</label>

                        <p className="setup-help">
                            First, choose the type of interview you want to practice.
                        </p>

                        <div className="option-grid">
                            <button
                                type="button"
                                className={
                                    interviewMode === "normal"
                                        ? "option-button active"
                                        : "option-button"
                                }
                                onClick={() => handleModeChange("normal")}
                                disabled={loading}
                            >
                                💬 Normal Interview
                            </button>

                            <button
                                type="button"
                                className={
                                    interviewMode === "coding"
                                        ? "option-button active"
                                        : "option-button"
                                }
                                onClick={() => handleModeChange("coding")}
                                disabled={loading}
                            >
                                ⌨️ Live Coding Interview
                            </button>
                        </div>
                    </div>

                    {/* ======================================
                        SHOW FORM AFTER MODE SELECTION
                    ====================================== */}
                    {interviewMode !== "" && (
                        <>

                            {/* INTERVIEW FIELD */}
                            {/* INTERVIEW FIELD */}
                            <div className="setup-section">
                                <label>Interview Field</label>

                                <p className="setup-help">
                                    {interviewMode === "coding"
                                        ? "Select your technical interview field."
                                        : "Select the field for your interview."}
                                </p>

                                <select
                                    value={field}
                                    onChange={(e) => setField(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">Select Interview Field</option>

                                    {interviewMode === "coding" ? (
                                        <>
                                            <option value="Software Engineering">
                                                Software Engineering
                                            </option>

                                            <option value="Web Development">
                                                Web Development
                                            </option>

                                            <option value="Frontend Development">
                                                Frontend Development
                                            </option>

                                            <option value="Backend Development">
                                                Backend Development
                                            </option>

                                            <option value="Full Stack Development">
                                                Full Stack Development
                                            </option>

                                            <option value="Data Structures & Algorithms">
                                                Data Structures & Algorithms (DSA)
                                            </option>

                                            <option value="Data Science">
                                                Data Science
                                            </option>

                                            <option value="Artificial Intelligence & Machine Learning">
                                                Artificial Intelligence & Machine Learning
                                            </option>

                                            <option value="Database Management">
                                                Database Management (DBMS)
                                            </option>

                                            <option value="Cybersecurity">
                                                Cybersecurity
                                            </option>

                                            <option value="Cloud Computing">
                                                Cloud Computing
                                            </option>

                                            <option value="DevOps">
                                                DevOps
                                            </option>

                                            <option value="Mobile App Development">
                                                Mobile App Development
                                            </option>

                                            <option value="Other Technical">
                                                Other (Technical)
                                            </option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="Software Engineering">Software Engineering</option>
                                            <option value="Data Science">Data Science</option>
                                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                                            <option value="Cybersecurity">Cybersecurity</option>
                                            <option value="Cloud Computing">Cloud Computing</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                            <option value="Electrical Engineering">Electrical Engineering</option>
                                            <option value="Chemical Engineering">Chemical Engineering</option>
                                            <option value="Electronics & Communication">Electronics & Communication</option>
                                            <option value="Nursing">Nursing</option>
                                            <option value="Medical & Healthcare">Medical & Healthcare</option>
                                            <option value="Pharmacy">Pharmacy</option>
                                            <option value="Finance & Accounting">Finance & Accounting</option>
                                            <option value="Banking">Banking</option>
                                            <option value="Marketing & Sales">Marketing & Sales</option>
                                            <option value="Human Resources">Human Resources</option>
                                            <option value="Business & Management">Business & Management</option>
                                            <option value="Education & Teaching">Education & Teaching</option>
                                            <option value="Other">Other</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* TARGET ROLE */}
                            <div className="setup-section">
                                <label>Target Role</label>

                                <p className="setup-help">
                                    {interviewMode === "coding"
                                        ? "Select your technical job role."
                                        : "What position are you preparing for?"}
                                </p>

                                {interviewMode === "coding" ? (
                                    <select
                                        value={targetRole}
                                        onChange={(e) => {
                                            setTargetRole(e.target.value);
                                            if (e.target.value !== "Other Technical Role") {
                                                setOtherTechnicalRole("");
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="">Select Technical Role</option>

                                        <option value="Software Engineer">Software Engineer</option>
                                        <option value="Software Developer">Software Developer</option>
                                        <option value="Frontend Developer">Frontend Developer</option>
                                        <option value="Backend Developer">Backend Developer</option>
                                        <option value="Full Stack Developer">Full Stack Developer</option>
                                        <option value="Web Developer">Web Developer</option>
                                        <option value="Python Developer">Python Developer</option>
                                        <option value="Java Developer">Java Developer</option>
                                        <option value="JavaScript Developer">JavaScript Developer</option>
                                        <option value="C++ Developer">C++ Developer</option>
                                        <option value="Mobile App Developer">Mobile App Developer</option>
                                        <option value="Data Scientist">Data Scientist</option>
                                        <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                        <option value="AI Engineer">AI Engineer</option>
                                        <option value="DevOps Engineer">DevOps Engineer</option>
                                        <option value="Cloud Engineer">Cloud Engineer</option>
                                        <option value="Database Developer">Database Developer</option>
                                        <option value="Cybersecurity Engineer">Cybersecurity Engineer</option>
                                        <option value="Other Technical Role">Other Technical Role</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="e.g. Software Engineer"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        disabled={loading}
                                    />
                                )}
                            </div>

                            {/* OTHER TECHNICAL ROLE INPUT */}
                            {interviewMode === "coding" &&
                                targetRole === "Other Technical Role" && (
                                    <div className="setup-section">
                                        <label>Enter Your Technical Role</label>

                                        <p className="setup-help">
                                            Enter the technical role you want to prepare for.
                                        </p>

                                        <input
                                            type="text"
                                            placeholder="e.g. Blockchain Developer"
                                            value={otherTechnicalRole}
                                            onChange={(e) =>
                                                setOtherTechnicalRole(e.target.value)
                                            }
                                            disabled={loading}
                                        />
                                    </div>
                                )}

                            {/* EXPERIENCE LEVEL */}
                            <div className="setup-section">
                                <label>Experience Level</label>

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

                            {/* PROGRAMMING LANGUAGE - CODING ONLY */}
                            {interviewMode === "coding" && (
                                <div className="setup-section">
                                    <label>Programming Language</label>

                                    <p className="setup-help">
                                        Select the programming language you want to use.
                                    </p>

                                    <div className="option-grid">
                                        {[
                                            { value: "python", label: "Python" },
                                            { value: "java", label: "Java" },
                                            { value: "cpp", label: "C++" },
                                            { value: "javascript", label: "JavaScript" }
                                        ].map((language) => (
                                            <button
                                                type="button"
                                                key={language.value}
                                                disabled={loading}
                                                className={
                                                    programmingLanguage === language.value
                                                        ? "option-button active"
                                                        : "option-button"
                                                }
                                                onClick={() =>
                                                    setProgrammingLanguage(language.value)
                                                }
                                            >
                                                {language.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* INTERVIEW TYPE - NORMAL ONLY */}
                            {interviewMode === "normal" && (
                                <div className="setup-section">
                                    <label>Interview Type</label>

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
                            )}

                            {/* QUESTION COUNT - NORMAL INTERVIEW ONLY */}
                            {interviewMode === "normal" && (
                                <div className="setup-section">
                                    <label>Number of Questions</label>

                                    <p className="setup-help">
                                        Choose how many questions you want in this interview.
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
                                                onClick={() => setQuestionCount(count)}
                                            >
                                                {count} Questions
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DIFFICULTY - BOTH MODES */}
                            <div className="setup-section">
                                <label>Difficulty Level</label>

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

                            {/* DURATION - BOTH MODES */}
                            <div className="setup-section">
                                <label>Interview Duration</label>

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
                                                setCustomDurationError("");

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

                                {/* CUSTOM DURATION */}
                                {duration === "Custom" &&
                                    !customDurationApplied && (
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

                            {/* INTERVIEW SUMMARY */}
                            <div className="setup-summary">
                                <h2>Interview Summary</h2>

                                <div className="summary-grid">
                                    <div>
                                        <span>Interview Mode</span>
                                        <strong>
                                            {interviewMode === "coding"
                                                ? "Live Coding"
                                                : "Normal Interview"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Field</span>
                                        <strong>
                                            {field || "Not selected"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Role</span>
                                        <strong>
                                            {interviewMode === "coding" &&
                                                targetRole === "Other Technical Role"
                                                ? otherTechnicalRole || "Not set"
                                                : targetRole || "Not set"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Experience</span>
                                        <strong>{experienceLevel}</strong>
                                    </div>

                                    {interviewMode === "coding" ? (
                                        <div>
                                            <span>Programming Language</span>
                                            <strong>
                                                {programmingLanguage.toUpperCase()}
                                            </strong>
                                        </div>
                                    ) : (
                                        <div>
                                            <span>Interview Type</span>
                                            <strong>{interviewType}</strong>
                                        </div>
                                    )}

                                    {interviewMode === "normal" && (
                                        <div>
                                            <span>Questions</span>
                                            <strong>{questionCount}</strong>
                                        </div>
                                    )}

                                    <div>
                                        <span>Difficulty</span>
                                        <strong>{difficulty}</strong>
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
                                        : interviewMode === "coding"
                                            ? "Start Coding Interview →"
                                            : "Start Interview →"}
                                </button>
                            </div>

                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

export default InterviewSetup;
