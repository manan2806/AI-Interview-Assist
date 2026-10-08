import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
    startInterview,
    resumeInterview,
    generateQuestions,
    submitAnswer,
    submitTimeout,
    evaluateInterview,
    generateOverallResult,
    getInterviewQuestion,
    updateInterviewAnswer
} from "../services/interviewService";

function InterviewStart() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ==========================================
    // INTERVIEW STATES
    // ==========================================
    const [interviewId, setInterviewId] = useState(null);
    const [setup, setSetup] = useState(null);
    const [question, setQuestion] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [answer, setAnswer] = useState("");
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [updatingAnswer, setUpdatingAnswer] = useState(false);
    const [returnQuestion, setReturnQuestion] = useState(null);
    const [remainingTime, setRemainingTime] = useState(null);
    const [interviewDeadline, setInterviewDeadline] = useState(null);
    const [timeExpired, setTimeExpired] = useState(false);

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

                const urlInterviewId = searchParams.get("id");
                const savedInterviewId = urlInterviewId || localStorage.getItem("interview_id");
                const savedSetup = localStorage.getItem("interview_setup");

                if (!savedInterviewId) {
                    setError("Interview ID not found. Please setup the interview again.");
                    return;
                }

                setInterviewId(savedInterviewId);

                if (savedSetup) {
                    try {
                        const parsedSetup = JSON.parse(savedSetup);
                        setSetup(parsedSetup);

                        // INTERVIEW DURATION / TIMER
                        if (parsedSetup?.duration !== "No Limit") {
                            let durationMinutes = null;

                            // CUSTOM DURATION
                            if (parsedSetup?.duration === "Custom") {
                                const customMinutes = Number(
                                    parsedSetup?.custom_duration
                                );

                                if (
                                    Number.isFinite(customMinutes) &&
                                    customMinutes >= 3 &&
                                    customMinutes <= 60
                                ) {
                                    durationMinutes = customMinutes;
                                }
                            }

                            // NORMAL DURATION (10 , 20 , 30 min)
                            else {
                                const parsedMinutes = parseInt(
                                    String(parsedSetup?.duration || ""),
                                    10
                                );

                                if (
                                    Number.isFinite(parsedMinutes) &&
                                    parsedMinutes > 0
                                ) {
                                    durationMinutes = parsedMinutes;
                                }
                            }

                            // CREATE / RESTORE INTERVIEW DEADLINE
                            if (durationMinutes !== null) {
                                const deadlineKey =
                                    `interview_deadline_${savedInterviewId}`;

                                let savedDeadline =
                                    localStorage.getItem(deadlineKey);

                                // Create deadline only once
                                if (!savedDeadline) {
                                    const deadline =
                                        Date.now() +
                                        durationMinutes * 60 * 1000;

                                    savedDeadline = String(deadline);

                                    localStorage.setItem(
                                        deadlineKey,
                                        savedDeadline
                                    );
                                }

                                const deadlineTime =
                                    Number(savedDeadline);

                                // VALID DEADLINE
                                if (
                                    Number.isFinite(deadlineTime) &&
                                    deadlineTime > 0
                                ) {
                                    setInterviewDeadline(deadlineTime);

                                    const remainingSeconds =
                                        Math.max(
                                            0,
                                            Math.floor(
                                                (deadlineTime - Date.now()) /
                                                1000
                                            )
                                        );

                                    setRemainingTime(remainingSeconds);
                                } else {
                                    setInterviewDeadline(null);
                                    setRemainingTime(null);
                                }
                            } else {
                                // Invalid duration
                                setInterviewDeadline(null);
                                setRemainingTime(null);
                            }
                        } else {
                            // NO LIMIT
                            setInterviewDeadline(null);
                            setRemainingTime(null);
                        }
                    } catch (parseError) {
                        console.error(
                            "Setup Parse Error:",
                            parseError
                        );

                        setSetup(null);
                        setInterviewDeadline(null);
                        setRemainingTime(null);
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
                    resumeData.status ===
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

                    localStorage.removeItem(
                        `interview_deadline_${interviewId}`
                    );

                    navigate(
                        `/interview/result?id=${interviewId}`,
                        { replace: true }
                    );
                    return;
                }

                if (resumeData.status === "ready" || resumeData.status === "created") {
                    console.log("Interview has not started yet.");

                    // GENERATE QUESTIONS FOR NEW / RETAKE INTERVIEW
                    if (resumeData.status === "created") {
                        setLoadingStep("Generating your interview questions...");

                        const questionData = await generateQuestions(savedInterviewId);
                        console.log("Generate Questions Response:", questionData);

                        if (!questionData?.success) {
                            setError(questionData?.message || "Unable to generate interview questions.");
                            return;
                        }
                    }

                    // START INTERVIEW
                    setLoadingStep("Getting your first interview question...");
                    const startData = await startInterview(savedInterviewId);
                    console.log("Start Response:", startData);

                    if (!startData?.success) {
                        setError(startData?.message || "Unable to start interview. Please try again.");
                        return;
                    }

                    if (!startData?.question) {
                        setError("Interview started, but no question was received.");
                        return;
                    }

                    setQuestion(startData.question);
                    setCurrentQuestion(startData.current_question || 1);
                    setTotalQuestions(startData.total_questions || 0);
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
    // INTERVIEW COUNTDOWN TIMER
    // ==========================================
    useEffect(() => {

        if (interviewDeadline === null) { return; }
        let timeoutHandled = false;

        const timer = setInterval(async () => {
            const remainingSeconds = Math.max(0, Math.floor((interviewDeadline - Date.now()) / 1000));

            setRemainingTime(remainingSeconds);

            // TIME EXPIRED
            if (remainingSeconds <= 0 && !timeoutHandled) {
                timeoutHandled = true;
                clearInterval(timer);

                // STOP TIMER
                setInterviewDeadline(null);
                setRemainingTime(0);

                // MARK INTERVIEW AS TIME EXPIRED
                setTimeExpired(true);

                // HIDE CURRENT QUESTION
                setQuestion(null);

                try {
                    setSubmitting(true);
                    setLoadingStep("Time is up. Submitting your interview...");

                    const timeoutResponse = await submitTimeout(interviewId);

                    if (timeoutResponse?.status === "evaluation_pending") {
                        setLoadingStep("Evaluating your interview...");
                        await evaluateInterview(interviewId);
                        setLoadingStep("Generating your overall result...");
                        await generateOverallResult(interviewId);

                        localStorage.removeItem("interview_id");
                        localStorage.removeItem("interview_setup");

                        navigate(`/interview/result?id=${interviewId}`, { replace: true });
                    }

                } catch (error) {

                    console.error("Interview Timeout Error:", error);
                    setError(
                        error?.response?.data?.message ||
                        "Unable to complete the interview."
                    );

                    setSubmitting(false);
                }
            }
        }, 1000);
        return () => { clearInterval(timer); };

    }, [interviewDeadline, interviewId, navigate]);

    // ==========================================
    // FORMAT INTERVIEW TIMER
    // ==========================================
    const formatTime = (seconds) => {
        if (seconds === null) {
            return "No Limit";
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    // ==========================================
    // LOAD PREVIOUS QUESTION FOR EDITING
    // ==========================================

    const handlePreviousQuestion = async () => {

        if (!interviewId) {
            setError("Interview session not found.");
            return;
        }

        if (currentQuestion <= 1) {
            return;
        }

        try {
            setUpdatingAnswer(true);
            setError("");

            // Remember where user originally started editing
            if (editingQuestion === null) {
                setReturnQuestion(currentQuestion);
            }

            const previousQuestionNumber = currentQuestion - 1;

            const data = await getInterviewQuestion(interviewId, previousQuestionNumber);

            if (!data?.success) {
                setError(data?.message || "Unable to load previous question.");
                return;
            }

            // Load previous question
            setQuestion(data.question);
            setCurrentQuestion(data.question_number);

            // Load existing answer
            setAnswer(data.existing_answer || "");

            // Mark this question as editable
            setEditingQuestion(data.question_number);

        } catch (error) {

            console.error("Previous Question Error:", error);
            const apiMessage = error?.response?.data?.message || error?.response?.data?.error;
            setError(apiMessage || "Unable to load previous question.");

        } finally {
            setUpdatingAnswer(false);
        }
    };

    // ==========================================
    // UPDATE PREVIOUS ANSWER
    // ==========================================
    const handleUpdateAnswer = async () => {

        if (!answer.trim()) {
            setError("Please enter your answer before continuing.");
            return;
        }

        if (!interviewId || !editingQuestion) {
            setError("Unable to update this answer.");
            return;
        }

        try {
            setUpdatingAnswer(true);
            setError("");

            const data =
                await updateInterviewAnswer(
                    interviewId,
                    editingQuestion,
                    answer.trim()
                );

            if (!data?.success) {

                setError(data?.message || "Unable to update answer.");
                return;
            }

            // Return to the question that
            // user was editing from.
            const returnQuestionNumber = returnQuestion || editingQuestion + 1;

            if (returnQuestionNumber <= totalQuestions) {

                const nextData = await getInterviewQuestion(interviewId, returnQuestionNumber);

                if (nextData?.success) {
                    setQuestion(nextData.question);
                    setCurrentQuestion(nextData.question_number);
                    setAnswer(nextData.existing_answer || "");
                }
            }

            setEditingQuestion(null);
            setReturnQuestion(null);

        } catch (error) {

            console.error("Update Answer Error:", error);
            const apiMessage = error?.response?.data?.message || error?.response?.data?.error;
            setError(apiMessage || "Unable to update answer.");

        } finally {
            setUpdatingAnswer(false);
        }
    };

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
    // TIME EXPIRED
    // ==========================================
    if (timeExpired) {
        return (
            <div className="interview-start-page">
                <div className="interview-loading">

                    <div className="loading-spinner">
                        <span></span>
                    </div>

                    <h2>
                        Time is Up
                    </h2>

                    <p>
                        {loadingStep || "Your interview is being submitted..."}
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

                        <div className="interview-timer">
                            <span>⏱️</span>

                            <strong>
                                {remainingTime === null
                                    ? "No Limit"
                                    : formatTime(remainingTime)}
                            </strong>
                        </div>
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

                        <div className="previous-question-wrapper">
                            {currentQuestion > 1 && (
                                <button
                                    type="button"
                                    className="previous-question-button"
                                    onClick={
                                        handlePreviousQuestion
                                    }
                                    disabled={
                                        submitting ||
                                        updatingAnswer
                                    }
                                >
                                    ← Previous Question
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            className="next-question-button"
                            onClick={
                                editingQuestion
                                    ? handleUpdateAnswer
                                    : handleSubmitAnswer
                            }
                            disabled={
                                !answer.trim() ||
                                submitting ||
                                updatingAnswer
                            }
                        >
                            {updatingAnswer
                                ? "Updating..."
                                : submitting
                                    ? currentQuestion ===
                                        totalQuestions
                                        ? "Generating Result..."
                                        : "Submitting..."

                                    : editingQuestion
                                        ? "Update & Next →"

                                        : currentQuestion ===
                                            totalQuestions
                                            ? "Finish Interview"
                                            : "Submit & Next →"
                            }

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