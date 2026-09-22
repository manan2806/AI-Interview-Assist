import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

import { getInterviewDetails } from "../services/interviewService";

function InterviewDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ==========================================
    // LOAD DETAILS
    // ==========================================
    useEffect(() => {

        if (!id) {

            setError("Interview ID is missing.");
            setLoading(false);

            return;
        }

        loadDetails();

    }, [id]);


    const loadDetails = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getInterviewDetails(id);

            console.log(
                "Interview Details:",
                data
            );

            if (!data?.success) {

                setDetails(null);

                setError(
                    data?.message ||
                    "Unable to load interview details."
                );

                return;
            }

            setDetails(data);

        } catch (err) {

            console.error(
                "Interview Details Error:",
                err
            );

            setDetails(null);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to load interview details. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================
    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        try {

            const formattedDate = new Date(date);

            if (Number.isNaN(formattedDate.getTime())) {
                return "-";
            }

            return formattedDate.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        } catch {

            return "-";

        }
    };

    // ==========================================
    // RENDER LIST
    // ==========================================
    const renderList = (items) => {

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return null;
        }

        return (
            <ul>

                {items.map((item, index) => (

                    <li key={index}>
                        {item}
                    </li>

                ))}

            </ul>
        );
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {

        return (

            <div className="details-page">

                <div className="details-container">

                    <div className="details-loading-card">

                        <div className="details-loading-spinner">
                            <span>📄</span>
                        </div>

                        <h2>
                            Loading Interview Details...
                        </h2>

                        <p>
                            Please wait while we fetch the
                            complete interview report.
                        </p>

                    </div>

                </div>

            </div>
        );
    }

    // ==========================================
    // ERROR
    // ==========================================
    if (error) {

        return (

            <div className="details-page">

                <div className="details-container">

                    <div className="details-error-card">

                        <div className="details-error-icon">
                            ⚠️
                        </div>

                        <h2>
                            Unable to Load Details
                        </h2>

                        <p>
                            {error}
                        </p>

                        <div className="details-error-actions">

                            <button
                                type="button"
                                className="details-retry-button"
                                onClick={loadDetails}
                            >
                                Try Again
                            </button>

                            <Link
                                to="/interview/history"
                                className="details-history-button"
                            >
                                Interview History
                            </Link>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ==========================================
    // EMPTY DATA SAFETY
    // ==========================================
    if (!details) {

        return (

            <div className="details-page">

                <div className="details-container">

                    <div className="details-error-card">

                        <div className="details-error-icon">
                            📄
                        </div>

                        <h2>
                            Interview Details Not Found
                        </h2>

                        <p>
                            We could not find details for this
                            interview.
                        </p>

                        <div className="details-error-actions">

                            <Link
                                to="/interview/history"
                                className="details-history-button"
                            >
                                Back to History
                            </Link>

                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ==========================================
    // DATA
    // ==========================================
    const interview =
        details.interview || {};

    const questionDetails =
        Array.isArray(details.question_details)
            ? details.question_details
            : [];

    // ==========================================
    // MAIN UI
    // ==========================================
    return (

        <div className="details-page">

            <div className="details-container">

                {/* ======================================
                    HEADER
                ====================================== */}
                <div className="details-header">

                    <div>

                        <p className="details-label">
                            Interview Report
                        </p>

                        <h1>
                            Interview Details
                        </h1>

                        <p>
                            Complete information about
                            your interview attempt.
                        </p>

                    </div>

                    <div className="details-header-actions">

                        {interview.status ===
                            "completed" && (

                                <button
                                    type="button"
                                    className="details-result-button"
                                    onClick={() =>
                                        navigate(
                                            `/interview/result?id=${id}`
                                        )
                                    }
                                >
                                    View Result
                                </button>

                            )}

                        <Link
                            to="/interview/history"
                            className="details-back-link"
                        >
                            ← History
                        </Link>

                    </div>

                </div>

                {/* ======================================
                    INTERVIEW INFORMATION
                ====================================== */}
                <div className="details-info-card">

                    <div className="details-card-heading">

                        <div className="details-card-icon">
                            🎯
                        </div>

                        <div>

                            <p>
                                Interview Information
                            </p>

                            <h2>
                                {interview.job_role ||
                                    "Interview"}
                            </h2>

                        </div>

                    </div>

                    <div className="details-info-grid">

                        <div className="details-info-item">

                            <span>
                                Job Role
                            </span>

                            <strong>
                                {interview.job_role ||
                                    "-"}
                            </strong>

                        </div>

                        <div className="details-info-item">

                            <span>
                                Experience Level
                            </span>

                            <strong>
                                {interview.experience_level ||
                                    "-"}
                            </strong>

                        </div>

                        <div className="details-info-item">

                            <span>
                                Interview Type
                            </span>

                            <strong>
                                {interview.interview_type ||
                                    "-"}
                            </strong>

                        </div>

                        <div className="details-info-item">

                            <span>
                                Difficulty
                            </span>

                            <strong>
                                {interview.difficulty ||
                                    "-"}
                            </strong>

                        </div>

                        <div className="details-info-item">

                            <span>
                                Total Questions
                            </span>

                            <strong>
                                {interview.number_of_questions ||
                                    questionDetails.length ||
                                    0}
                            </strong>

                        </div>

                        <div className="details-info-item">

                            <span>
                                Status
                            </span>

                            <strong className="details-status">

                                {interview.status ||
                                    "-"}

                            </strong>

                        </div>

                    </div>

                </div>

                {/* ======================================
                    DATE INFORMATION
                ====================================== */}
                <div className="details-dates-grid">

                    <div className="details-date-card">

                        <span>
                            Created At
                        </span>

                        <strong>
                            {formatDate(
                                interview.created_at
                            )}
                        </strong>

                    </div>

                    <div className="details-date-card">

                        <span>
                            Started At
                        </span>

                        <strong>
                            {formatDate(
                                interview.started_at
                            )}
                        </strong>

                    </div>

                    <div className="details-date-card">

                        <span>
                            Completed At
                        </span>

                        <strong>
                            {formatDate(
                                interview.completed_at
                            )}
                        </strong>

                    </div>

                </div>

                {/* ======================================
                    QUESTIONS
                ====================================== */}
                <div className="details-question-section">

                    <div className="details-section-heading">

                        <p>
                            Interview Questions
                        </p>

                        <h2>
                            Question-wise Details
                        </h2>

                    </div>

                    {questionDetails.length === 0 ? (

                        <div className="details-empty">

                            No question details available.

                        </div>

                    ) : (

                        <div className="details-question-list">

                            {questionDetails.map(
                                (item, index) => (

                                    <div
                                        className="details-question-card"
                                        key={
                                            item.question_number ||
                                            index
                                        }
                                    >

                                        {/* QUESTION HEADER */}
                                        <div className="details-question-header">

                                            <div>

                                                <span className="details-question-number">

                                                    Question{" "}

                                                    {item.question_number ||
                                                        index + 1}

                                                </span>


                                                <h3>

                                                    {item.question ||
                                                        "Question not available"}

                                                </h3>

                                            </div>

                                            <div className="details-question-score">

                                                <strong>

                                                    {item.score ?? 0}

                                                </strong>

                                                <span>
                                                    / 10
                                                </span>

                                            </div>

                                        </div>

                                        {/* ANSWER */}
                                        <div className="details-answer-box">

                                            <h4>
                                                Your Answer
                                            </h4>

                                            <p>

                                                {item.answer ||
                                                    "No answer provided."}

                                            </p>

                                        </div>

                                        {/* EVALUATION */}
                                        <div className="details-evaluation-grid">


                                            <div className="details-evaluation-item">

                                                <span>
                                                    Correctness
                                                </span>

                                                <strong>
                                                    {item.correctness ||
                                                        "-"}
                                                </strong>

                                            </div>


                                            <div className="details-evaluation-item">

                                                <span>
                                                    Relevance
                                                </span>

                                                <strong>
                                                    {item.relevance ||
                                                        "-"}
                                                </strong>

                                            </div>

                                            <div className="details-evaluation-item">

                                                <span>
                                                    Technical Accuracy
                                                </span>

                                                <strong>
                                                    {item.technical_accuracy ||
                                                        "-"}
                                                </strong>

                                            </div>

                                        </div>

                                        {/* STRENGTHS */}
                                        {Array.isArray(
                                            item.strengths
                                        ) &&
                                            item.strengths.length > 0 && (

                                                <div className="details-feedback strengths">

                                                    <h4>
                                                        💪 Strengths
                                                    </h4>

                                                    {renderList(
                                                        item.strengths
                                                    )}

                                                </div>

                                            )}

                                        {/* WEAKNESSES */}
                                        {Array.isArray(
                                            item.weaknesses
                                        ) &&
                                            item.weaknesses.length > 0 && (

                                                <div className="details-feedback weaknesses">

                                                    <h4>
                                                        ⚠️ Weaknesses
                                                    </h4>

                                                    {renderList(
                                                        item.weaknesses
                                                    )}

                                                </div>

                                            )}

                                        {/* MISSING CONCEPTS */}
                                        {Array.isArray(
                                            item.missing_concepts
                                        ) &&
                                            item.missing_concepts.length > 0 && (

                                                <div className="details-feedback missing-concepts">

                                                    <h4>
                                                        📚 Missing Concepts
                                                    </h4>

                                                    {renderList(
                                                        item.missing_concepts
                                                    )}

                                                </div>

                                            )}

                                        {/* AI FEEDBACK */}
                                        {item.feedback && (

                                            <div className="details-feedback ai-feedback">

                                                <h4>
                                                    🤖 AI Feedback
                                                </h4>

                                                <p>
                                                    {item.feedback}
                                                </p>

                                            </div>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

                {/* ======================================
                    BOTTOM ACTIONS
                ====================================== */}
                <div className="details-bottom-actions">

                    <Link
                        to="/interview/history"
                        className="details-history-button"
                    >
                        ← Back to History
                    </Link>


                    {interview.status ===
                        "completed" && (

                            <button
                                type="button"
                                className="details-result-button"
                                onClick={() =>
                                    navigate(
                                        `/interview/result?id=${id}`
                                    )
                                }
                            >
                                View Interview Result →
                            </button>

                        )}

                </div>


            </div>

        </div>
    );
}

export default InterviewDetails;
