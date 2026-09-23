import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    startInterview,
    resumeInterview,
    submitAnswer,
    evaluateInterview,
    generateOverallResult
} from "../services/interviewService";

function InterviewStart() {
    const navigate = useNavigate();

    // ==========================================
    // INTERVIEW STATES
    // ==========================================
    const [interviewId, setInterviewId] = useState(null);
    const [setup, setSetup] = useState(null);
    const [question, setQuestion] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answer, setAnswer] = useState("");

    // ==========================================
    // LOADING STATES
    // ==========================================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingStep, setLoadingStep] = useState(
        "Preparing your interview..."
    );

    // ==========================================
    // ERROR STATE
    // ==========================================
    const [error, setError] = useState("");

    // ==========================================
    // INITIALIZE / RESUME INTERVIEW
    // ==========================================
    useEffect(() => {
        const initializeInterview = async () => {
            try {
                setLoading(true);
                setError("");
                setLoadingStep("Loading your interview...");

                const savedInterviewId = localStorage.getItem("interview_id");
                const savedSetup = localStorage.getItem("interview_setup");

                if (!savedInterviewId) {
                    setError(
                        "Interview ID not found. Please setup the interview again."
                    );
                    return;
                }

                setInterviewId(savedInterviewId);

                if (savedSetup) {
                    try {
                        const parsedSetup = JSON.parse(savedSetup);
                        setSetup(parsedSetup);
                    } catch (parseError) {
                        console.error("Setup Parse Error:", parseError);
                        setSetup(null);
                    }
                }

                setLoadingStep("Checking your interview progress...");

                const resumeData = await resumeInterview(savedInterviewId);

                console.log("====================================");
                console.log("RESUME INTERVIEW");
                console.log("Resume Response:", resumeData);
                console.log("====================================");

                if (!resumeData?.success) {
                    setError(
                        resumeData?.message ||
                        "Unable to resume interview. Please try again."
                    );
                    return;
                }

                // ==========================================
                // EVALUATION PENDING
                // ==========================================
                if (
                    data.status ===
                    "evaluation_pending"
                ) {

                    try {

                        setLoadingStep(
                            "Evaluating your complete interview..."
                        );

                        // EVALUATE ALL ANSWERS
                        const evaluationResult =
                            await evaluateInterview(
                                savedInterviewId
                            );

                        if (
                            !evaluationResult?.success
                        ) {

                            setError(
                                evaluationResult?.message
                                ||
                                "Unable to evaluate your interview."
                            );

                            return;
                        }

                        // GENERATE OVERALL RESULT
                        setLoadingStep(
                            "Preparing your interview result..."
                        );

                        const overallResult =
                            await generateOverallResult(
                                savedInterviewId
                            );

                        if (
                            !overallResult?.success
                        ) {

                            setError(
                                overallResult?.message
                                ||
                                "Unable to generate your interview result."
                            );

                            return;
                        }

                        // CLEANUP
                        localStorage.removeItem(
                            "interview_id"
                        );

                        localStorage.removeItem(
                            "interview_setup"
                        );

                        // GO TO RESULT
                        navigate(
                            `/interview/result?id=${savedInterviewId}`
                        );

                        return;

                    } catch (error) {

                        console.error(
                            "Resume Evaluation Error:",
                            error
                        );

                        const apiMessage =
                            error?.response?.data?.message
                            ||
                            error?.response?.data?.error;

                        setError(
                            apiMessage
                            ||
                            "Unable to continue interview evaluation."
                        );

                        return;
                    }
                }

                if (resumeData.status === "completed") {
                    console.log("Interview already completed.");

                    localStorage.removeItem("interview_id");
                    localStorage.removeItem("interview_setup");

                    navigate(
                        `/interview/result?id=${savedInterviewId}`,
                        { replace: true }
                    );

                    return;
                }

                if (
                    resumeData.status === "ready" ||
                    resumeData.status === "created"
                ) {
                    console.log("Interview has not started yet.");

                    setLoadingStep(
                        "Getting your first interview question..."
                    );

                    const startData = await startInterview(savedInterviewId);

                    console.log("Start Response:", startData);

                    if (!startData?.success) {
                        setError(
                            startData?.message ||
                            "Unable to start interview. Please try again."
                        );
                        return;
                    }

                    if (!startData?.question) {
                        setError(
                            "Interview started, but no question was received."
                        );
                        return;
                    }

                    setQuestion(startData.question);
                    setCurrentQuestion(
                        startData.current_question || 1
                    );
                    setTotalQuestions(
                        startData.total_questions || 0
                    );
                    setAnswer("");

                    return;
                }

                if (resumeData.status === "in_progress") {
                    console.log("Interview resumed successfully.");

                    if (!resumeData?.question) {
                        setError(
                            "Interview progress was found, but the current question was not received."
                        );
                        return;
                    }

                    setQuestion(resumeData.question);
                    setCurrentQuestion(
                        resumeData.current_question || 1
                    );
                    setTotalQuestions(
                        resumeData.total_questions || 0
                    );
                    setAnswer("");

                    return;
                }

                setError(
                    "Invalid interview status. Please try again."
                );
            } catch (error) {
                console.error(
                    "Initialize Interview Error:",
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
                        "Unable to start or resume interview. Please try again."
                    );
                }
            } finally {
                setLoading(false);
                setLoadingStep("");
            }
        };

        initializeInterview();
    }, [navigate]);

    // ==========================================
    // SUBMIT ANSWER , SAVE → NEXT QUESTION , FINAL → EVALUATE ALL → OVERALL RESULT
    // ==========================================

    const handleSubmitAnswer = async () => {

        if (!answer.trim()) {

            setError(
                "Please enter your answer before continuing."
            );

            return;
        }

        if (!interviewId) {

            setError(
                "Interview session not found. "
                + "Please setup the interview again."
            );

            return;
        }

        try {

            setSubmitting(true);
            setError("");

            // SAVE ANSWER
            const data = await submitAnswer(
                interviewId,
                answer.trim()
            );

            if (!data?.success) {

                setError(
                    data?.message
                    ||
                    "Unable to save answer. Please try again."
                );

                return;
            }

            // FINAL QUESTION
            if (
                data.status ===
                "evaluation_pending"
            ) {

                setAnswer("");

                setLoadingStep(
                    "Evaluating your complete interview..."
                );

                // STEP 1 EVALUATE ALL ANSWERS , ONE GEMINI REQUEST
                const evaluationResult =
                    await evaluateInterview(
                        interviewId
                    );

                if (
                    !evaluationResult?.success
                ) {

                    setError(
                        evaluationResult?.message
                        ||
                        "Unable to evaluate your interview."
                    );

                    return;
                }

                // STEP 2 GENERATE OVERALL RESULT , ONE GEMINI REQUEST
                setLoadingStep(
                    "Preparing your interview result..."
                );

                const overallResult =
                    await generateOverallResult(
                        interviewId
                    );

                if (
                    !overallResult?.success
                ) {

                    setError(
                        overallResult?.message
                        ||
                        "Unable to generate overall result."
                    );

                    return;
                }

                // SUCCESS
                localStorage.removeItem(
                    "interview_id"
                );

                localStorage.removeItem(
                    "interview_setup"
                );

                navigate(
                    `/interview/result?id=${interviewId}`
                );

                return;
            }

            // NORMAL QUESTION
            if (data.next_question) {

                setQuestion(
                    data.next_question
                );

                setCurrentQuestion(
                    data.next_question_number
                    ||
                    currentQuestion + 1
                );

                setTotalQuestions(
                    data.total_questions
                    ||
                    totalQuestions
                );

                setAnswer("");

                return;
            }

            // UNEXPECTED RESPONSE
            setError(
                "The next interview question "
                + "was not received. Please try again."
            );

        } catch (error) {

            console.error(
                "Submit Answer Error:",
                error
            );

            const apiMessage =
                error?.response?.data?.message
                ||
                error?.response?.data?.error;

            if (apiMessage) {

                setError(apiMessage);

            } else if (error?.message) {

                setError(error.message);

            } else {

                setError(
                    "Unable to submit answer. "
                    + "Please try again."
                );
            }

        } finally {

            setSubmitting(false);
            setLoadingStep("");
        }
    };

    // ==========================================
    // PROGRESS
    // ==========================================
    const progress =
        totalQuestions > 0
            ? (currentQuestion / totalQuestions) * 100
            : 0;

    // ==========================================
    // INITIAL LOADING
    // ==========================================
    if (loading) {
        return (
            <div className="interview-start-page">
                <div className="interview-loading">
                    <div className="loading-spinner">
                        <span></span>
                    </div>

                    <h2>
                        Preparing Your Interview...
                    </h2>

                    <p>
                        {loadingStep ||
                            "Please wait while we start your interview."}
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // INITIAL ERROR
    // ==========================================
    if (error && !question) {
        return (
            <div className="interview-start-page">
                <div className="interview-error-card">
                    <div className="error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Start Interview
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/interview/setup")
                        }
                        className="setup-start-button"
                    >
                        Back to Setup
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // MAIN INTERVIEW
    // ==========================================
    return (
        <div className="interview-start-page">
            <div className="interview-start-container">

                {/* HEADER */}
                <div className="interview-start-header">
                    <div>
                        <p className="interview-start-label">
                            Live Interview
                        </p>

                        <h1>
                            {setup?.target_role ||
                                setup?.job_role ||
                                "Interview"}
                        </h1>

                        <p>
                            {setup?.field ||
                                "Professional Interview"}
                            {" • "}
                            {setup?.interview_type ||
                                "Mixed"}
                        </p>
                    </div>

                    <div className="interview-meta">
                        <span>
                            {setup?.difficulty ||
                                "Medium"}
                        </span>

                        <span>
                            {setup?.experience_level ||
                                "Fresher"}
                        </span>
                    </div>
                </div>

                {/* PROGRESS */}
                <div className="interview-progress-section">
                    <div className="interview-progress-info">
                        <span>
                            Question{" "}
                            {currentQuestion} of{" "}
                            {totalQuestions}
                        </span>

                        <span>
                            {Math.round(progress)}%
                        </span>
                    </div>

                    <div className="interview-progress-bar">
                        <div
                            className="interview-progress-fill"
                            style={{
                                width: `${progress}%`
                            }}
                        />
                    </div>
                </div>

                {/* ERROR */}
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

                {/* QUESTION CARD */}
                <div className="question-card">
                    <div className="question-number">
                        Question{" "}
                        {question?.question_number ||
                            currentQuestion}
                    </div>

                    <h2>
                        {question?.question}
                    </h2>

                    <p className="question-help">
                        Take your time and provide a clear,
                        detailed answer.
                    </p>

                    {/* ANSWER */}
                    <div className="answer-section">
                        <label>
                            Your Answer
                        </label>

                        <textarea
                            value={answer}
                            onChange={(e) =>
                                setAnswer(e.target.value)
                            }
                            placeholder="Type your answer here..."
                            rows="9"
                            disabled={submitting}
                        />

                        <div className="answer-footer">
                            <span>
                                {answer.length} characters
                            </span>

                            <span>
                                Recommended: 50+ words
                            </span>
                        </div>
                    </div>

                    {/* SUBMIT / NEXT BUTTON */}
                    <div className="question-actions">
                        <div />

                        <button
                            type="button"
                            className="next-question-button"
                            onClick={
                                handleSubmitAnswer
                            }
                            disabled={
                                !answer.trim() ||
                                submitting
                            }
                        >
                            {submitting
                                ? currentQuestion ===
                                    totalQuestions
                                    ? "Generating Result..."
                                    : "Submitting..."
                                : currentQuestion ===
                                    totalQuestions
                                    ? "Finish Interview"
                                    : "Submit & Next →"}
                        </button>
                    </div>
                </div>

                {/* INTERVIEW INFO */}
                <div className="interview-info-card">
                    <div>
                        <span>
                            Field
                        </span>

                        <strong>
                            {setup?.field ||
                                "Not specified"}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Type
                        </span>

                        <strong>
                            {setup?.interview_type ||
                                "Mixed"}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Difficulty
                        </span>

                        <strong>
                            {setup?.difficulty ||
                                "Medium"}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Total Questions
                        </span>

                        <strong>
                            {totalQuestions}
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InterviewStart;