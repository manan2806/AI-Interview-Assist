import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    startInterview,
    submitAnswer,
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

    // LOADING STATES
    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);

    const [loadingStep, setLoadingStep] = useState(
        "Preparing your interview..."
    );

    // ERROR STATE
    const [error, setError] = useState("");

    // INITIALIZE INTERVIEW
    useEffect(() => {

        const initializeInterview = async () => {

            try {

                setLoading(true);

                setError("");

                setLoadingStep(
                    "Loading your interview..."
                );

                // ==========================================
                // GET SAVED INTERVIEW ID
                // ==========================================
                const savedInterviewId =
                    localStorage.getItem("interview_id");


                const savedSetup =
                    localStorage.getItem("interview_setup");

                // ==========================================
                // INTERVIEW ID VALIDATION
                // ==========================================
                if (!savedInterviewId) {

                    setError(
                        "Interview ID not found. Please setup the interview again."
                    );

                    return;
                }

                setInterviewId(savedInterviewId);

                // ==========================================
                // LOAD SAVED SETUP
                // ==========================================
                if (savedSetup) {

                    try {

                        const parsedSetup =
                            JSON.parse(savedSetup);

                        setSetup(parsedSetup);

                    } catch (parseError) {

                        console.error(
                            "Setup Parse Error:",
                            parseError
                        );

                        // Do not stop interview only because
                        // frontend setup data is invalid.

                        setSetup(null);
                    }

                }

                // ==========================================
                // START INTERVIEW
                // ==========================================
                setLoadingStep(
                    "Getting your first interview question..."
                );

                const data =
                    await startInterview(
                        savedInterviewId
                    );

                // API SUCCESS VALIDATION
                if (!data?.success) {

                    setError(
                        data?.message ||
                        "Unable to start interview. Please try again."
                    );

                    return;
                }

                // QUESTION VALIDATION
                if (!data?.question) {

                    setError(
                        "Interview started, but no question was received."
                    );

                    return;
                }

                // SET QUESTION DATA
                setQuestion(
                    data.question
                );


                setCurrentQuestion(
                    data.current_question || 1
                );


                setTotalQuestions(
                    data.total_questions || 0
                );


            } catch (error) {

                console.error(
                    "Start Interview Error:",
                    error
                );

                // API ERROR MESSAGE
                const apiMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.error;

                if (apiMessage) {

                    setError(apiMessage);

                } else if (error?.message) {

                    setError(error.message);

                } else {

                    setError(
                        "Unable to start interview. Please try again."
                    );

                }

            } finally {

                setLoading(false);

                setLoadingStep("");

            }

        };

        initializeInterview();

    }, []);

    // ==========================================
    // SUBMIT ANSWER
    // ==========================================

    const handleSubmitAnswer = async () => {

        // VALIDATION
        if (!answer.trim()) {

            setError(
                "Please enter your answer before continuing."
            );

            return;
        }

        if (!interviewId) {

            setError(
                "Interview session not found. Please setup the interview again."
            );

            return;
        }

        try {

            setSubmitting(true);

            setError("");

            // SUBMIT ANSWER
            const data =
                await submitAnswer(
                    interviewId,
                    answer.trim()
                );

            console.log(
                "========== SUBMIT ANSWER =========="
            );

            console.log(
                "Response:",
                data
            );

            console.log(
                "Status:",
                data?.status
            );

            console.log(
                "Interview ID:",
                interviewId
            );

            console.log(
                "===================================="
            );

            // API ERROR
            if (!data?.success) {

                setError(
                    data?.message ||
                    "Unable to submit answer. Please try again."
                );

                return;
            }

            // ==========================================
            // INTERVIEW COMPLETED
            // ==========================================
            if (data.status === "completed") {

                setAnswer("");
                try {

                    // GENERATE OVERALL RESULT
                    setSubmitting(true);

                    const overallResult =
                        await generateOverallResult(
                            interviewId
                        );

                    console.log(
                        "Overall Result:",
                        overallResult
                    );

                    // OVERALL RESULT ERROR
                    if (!overallResult?.success) {

                        setError(
                            overallResult?.message ||
                            "Unable to generate overall result. Please try again."
                        );

                        return;
                    }

                    // GO TO RESULT PAGE
                    navigate(
                        `/interview/result?id=${interviewId}`
                    );

                    return;

                } catch (error) {

                    console.error(
                        "Overall Result Error:",
                        error
                    );

                    console.log(
                        "Overall Result Backend Error:",
                        error?.response?.data
                    );

                    const apiMessage =
                        error?.response?.data?.message ||
                        error?.response?.data?.error;

                    setError(
                        apiMessage ||
                        "Unable to generate interview result. Please try again."
                    );

                    return;

                }

            }

            // NEXT QUESTION
            if (data.next_question) {

                setQuestion(
                    data.next_question
                );

                setCurrentQuestion(
                    data.next_question_number ||
                    currentQuestion + 1
                );

                setTotalQuestions(
                    data.total_questions ||
                    totalQuestions
                );

                setAnswer("");

            } else {
                // Backend did not return completed or next question.
                setError(
                    "The next interview question was not received. Please try again."
                );

            }

        } catch (error) {

            console.error(
                "Submit Answer Error:",
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
                    "Unable to submit answer. Please try again."
                );

            }

        } finally {

            setSubmitting(false);

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
                            navigate(
                                "/interview/setup"
                            )
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

                            {currentQuestion}

                            {" "}of{" "}

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
                                width:
                                    `${progress}%`
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
                                setAnswer(
                                    e.target.value
                                )
                            }
                            placeholder="Type your answer here..."
                            rows="9"
                            disabled={submitting}
                        />

                        <div className="answer-footer">

                            <span>

                                {answer.length}
                                {" "}characters

                            </span>

                            <span>

                                Recommended:
                                {" "}50+ words

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

                                ? currentQuestion === totalQuestions
                                    ? "Generating Result..."
                                    : "Submitting..."

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
