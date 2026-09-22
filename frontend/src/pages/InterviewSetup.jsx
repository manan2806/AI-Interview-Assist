import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";

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

    // ==========================================
    // LOADING / ERROR STATES
    // ==========================================
    const [loading, setLoading] = useState(false);

    const [loadingStep, setLoadingStep] = useState("");

    const [error, setError] = useState("");

    // ==========================================
    // START INTERVIEW
    // ==========================================
    const handleStartInterview = async (e) => {

        e.preventDefault();

        // Clear previous error
        setError("");

        // ==========================================
        // VALIDATION
        // ==========================================
        if (!field) {
            setError("Please select an interview field.");
            return;
        }

        if (!targetRole.trim()) {
            setError("Please enter your target role.");
            return;
        }

        try {

            setLoading(true);

            // ==========================================
            // CREATE INTERVIEW
            // ==========================================
            setLoadingStep("Creating your interview...");

            const interviewData = {

                job_role: targetRole.trim(),

                experience_level: experienceLevel,

                interview_type: interviewType,

                difficulty: difficulty,

                number_of_questions: Number(questionCount)

            };

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

                interview_id: interviewId

            };

            localStorage.setItem(
                "interview_setup",
                JSON.stringify(interviewSetup)
            );

            // ==========================================
            // GENERATE AI QUESTIONS
            // ==========================================
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

            // ==========================================
            // SUCCESS
            // ==========================================
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

                    <Link to="/dashboard">
                        ← Dashboard
                    </Link>

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

                            <option value="Nursing">
                                Nursing
                            </option>

                            <option value="Chemical Engineering">
                                Chemical Engineering
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

                            <option value="Data Science">
                                Data Science
                            </option>

                            <option value="Artificial Intelligence">
                                Artificial Intelligence
                            </option>

                            <option value="Marketing">
                                Marketing
                            </option>

                            <option value="Finance">
                                Finance
                            </option>

                            <option value="Human Resources">
                                Human Resources
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
