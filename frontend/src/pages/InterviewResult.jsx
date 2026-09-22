import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import api from "../services/api";

import {
    getInterviewDashboard
} from "../services/interviewService";


function InterviewResult() {

    const [searchParams] = useSearchParams();

    const id = searchParams.get("id");

    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================
    const [data, setData] = useState(null);

    const [loading, setLoading] = useState(true);

    const [downloading, setDownloading] = useState(false);

    const [error, setError] = useState("");

    // ==========================================
    // LOAD INTERVIEW RESULT
    // ==========================================
    useEffect(() => {

        const loadResult = async () => {

            try {

                setLoading(true);
                setError("");

                if (!id) {

                    setError(
                        "Interview ID is missing."
                    );

                    return;
                }

                console.log(
                    "Loading Interview Result:",
                    id
                );

                const dashboardResponse =
                    await getInterviewDashboard(id);

                console.log(
                    "Interview Dashboard:",
                    dashboardResponse
                );

                if (!dashboardResponse?.success) {

                    setError(
                        dashboardResponse?.message ||
                        dashboardResponse?.error ||
                        "Unable to load interview result."
                    );

                    return;
                }

                if (!dashboardResponse?.data) {

                    setError(
                        "Interview result data was not found."
                    );

                    return;
                }

                setData(
                    dashboardResponse.data
                );

            }

            catch (err) {

                console.error(
                    "Interview Result Error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    err.message ||
                    "Unable to load interview result. Please try again."
                );

            }

            finally {
                setLoading(false);
            }

        };

        loadResult();

    }, [id]);

    // ==========================================
    // DOWNLOAD PDF
    // ==========================================
    const handleDownloadPDF = async () => {

        try {

            if (!id) {

                setError(
                    "Interview ID is missing."
                );
                return;
            }
            setDownloading(true);

            setError("");

            const response =
                await api.get(
                    `/api/interview/${id}/download-report`,
                    {
                        responseType: "blob"
                    }
                );

            // ==========================================
            // CREATE PDF BLOB
            // ==========================================
            const blob =
                new Blob(
                    [response.data],
                    {
                        type: "application/pdf"
                    }
                );

            // ==========================================
            // CREATE DOWNLOAD URL
            // ==========================================
            const url =
                window.URL.createObjectURL(blob);

            // ==========================================
            // CREATE DOWNLOAD LINK
            // ==========================================
            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `interview_report_${id}.pdf`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            // ==========================================
            // CLEANUP
            // ==========================================
            window.URL.revokeObjectURL(url);
        }

        catch (err) {

            console.error(
                "PDF Download Error:",
                err
            );

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to download PDF report."
            );

        }

        finally {
            setDownloading(false);
        }

    };

    // ==========================================
    // HELPER
    // ==========================================
    const renderList = (value, emptyMessage) => {

        if (Array.isArray(value)) {

            if (value.length === 0) {

                return (
                    <p className="result-empty-text">
                        {emptyMessage}
                    </p>
                );

            }

            return (

                <ul className="analysis-list">

                    {value.map(
                        (item, index) => (

                            <li key={index}>
                                {item}
                            </li>

                        )
                    )}

                </ul>

            );

        }

        if (typeof value === "string" && value.trim()) {

            return (
                <p className="analysis-text">
                    {value}
                </p>
            );

        }

        return (
            <p className="result-empty-text">
                {emptyMessage}
            </p>
        );

    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {

        return (

            <div className="result-page">

                <div className="result-loading">

                    <div className="result-loading-spinner"></div>

                    <h2>
                        Loading Interview Result...
                    </h2>

                    <p>
                        Please wait while we prepare your performance report.
                    </p>

                </div>

            </div>

        );

    }

    // ==========================================
    // ERROR
    // ==========================================
    if (error && !data) {

        return (

            <div className="result-page">

                <div className="result-error">

                    <div className="result-error-icon">
                        !
                    </div>

                    <h2>
                        Unable to Load Result
                    </h2>

                    <p>
                        {error}
                    </p>

                    <div className="result-error-actions">

                        <button
                            className="result-back-btn"
                            onClick={() =>
                                navigate(
                                    "/interview-history"
                                )
                            }
                        >
                            Back to Interview History
                        </button>

                        <button
                            className="result-retry-btn"
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Try Again
                        </button>

                    </div>

                </div>

            </div>

        );

    }

    // ==========================================
    // DATA
    // ==========================================

    const interview =
        data?.interview || {};

    const performance =
        data?.overall_performance || {};

    const analysis =
        data?.ai_analysis || {};


    const questionPerformance =
        Array.isArray(
            data?.question_performance
        )
            ? data.question_performance
            : [];

    const overallScore =
        performance.overall_score ??
        performance.overallScore ??
        0;

    const averageScore =
        performance.average_score ??
        performance.averageScore ??
        0;

    const totalScore =
        performance.total_score ??
        performance.totalScore ??
        0;

    const maxScore =
        performance.max_score ??
        performance.maxScore ??
        0;

    const performanceLevel =
        performance.performance_level ??
        performance.performanceLevel ??
        "N/A";

    // ==========================================
    // PAGE
    // ==========================================
    return (

        <div className="result-page">

            {/* ======================================
                HEADER
            ====================================== */}
            <div className="result-header">

                <div>

                    <h1>
                        Interview Result
                    </h1>

                    <p>
                        Your AI-powered interview
                        performance report
                    </p>

                </div>

                <div className="result-header-actions">

                    {/* Interview History Button */}
                    <button
                        className="result-back-btn"
                        onClick={() =>
                            navigate("/interview/history")
                        }
                    >
                        Interview History
                    </button>

                    {/* Download PDF Button */}
                    <button
                        className="download-pdf-btn"
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >

                        {downloading
                            ? "Generating Download..."
                            : "📄 Download PDF Report"
                        }

                    </button>

                </div>

            </div>

            {/* ======================================
                INLINE ERROR
            ====================================== */}
            {error && (

                <div className="result-inline-error">

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() => setError("")}
                    >
                        ×
                    </button>

                </div>

            )}

            {/* ======================================
                INTERVIEW INFORMATION
            ====================================== */}
            <div className="result-card">

                <h2>
                    Interview Information
                </h2>

                <div className="result-info-grid">

                    <div className="result-info-item">

                        <span>
                            Job Role
                        </span>

                        <strong>
                            {interview.job_role || "N/A"}
                        </strong>

                    </div>

                    <div className="result-info-item">

                        <span>
                            Experience Level
                        </span>

                        <strong>
                            {interview.experience_level || "N/A"}
                        </strong>

                    </div>

                    <div className="result-info-item">

                        <span>
                            Interview Type
                        </span>

                        <strong>
                            {interview.interview_type || "N/A"}
                        </strong>

                    </div>

                    <div className="result-info-item">

                        <span>
                            Difficulty
                        </span>

                        <strong>
                            {interview.difficulty || "N/A"}
                        </strong>

                    </div>

                    <div className="result-info-item">

                        <span>
                            Total Questions
                        </span>

                        <strong>
                            {
                                interview.number_of_questions ||
                                questionPerformance.length ||
                                0
                            }
                        </strong>

                    </div>

                </div>

            </div>

            {/* ======================================
                OVERALL SCORE
            ====================================== */}
            <div className="result-card">

                <h2>
                    Overall Performance
                </h2>

                <div className="score-section">


                    <div className="score-circle">

                        <span className="score-number">
                            {overallScore}%
                        </span>

                        <span className="score-label">
                            Overall Score
                        </span>

                    </div>

                    <div className="score-details">


                        <div className="score-detail">

                            <span>
                                Average Score
                            </span>

                            <strong>
                                {averageScore}/10
                            </strong>

                        </div>

                        <div className="score-detail">

                            <span>
                                Total Score
                            </span>

                            <strong>
                                {totalScore}
                            </strong>

                        </div>

                        <div className="score-detail">

                            <span>
                                Maximum Score
                            </span>

                            <strong>
                                {maxScore}
                            </strong>

                        </div>

                        <div className="score-detail">

                            <span>
                                Performance
                            </span>

                            <strong>
                                {performanceLevel}
                            </strong>

                        </div>

                    </div>

                </div>

            </div>

            {/* ======================================
                AI ANALYSIS
            ====================================== */}
            <div className="result-card">

                <h2>
                    AI Analysis
                </h2>

                {/* SUMMARY */}
                <div className="analysis-section">

                    <h3>
                        Summary
                    </h3>

                    <p className="analysis-text">

                        {
                            analysis.summary ||
                            performance.summary ||
                            "No summary available."
                        }

                    </p>

                </div>

                {/* STRENGTHS */}
                <div className="analysis-section">

                    <h3>
                        Strengths
                    </h3>

                    {
                        renderList(
                            analysis.strengths,
                            "No strengths available."
                        )
                    }

                </div>

                {/* WEAKNESSES */}
                <div className="analysis-section">

                    <h3>
                        Weaknesses
                    </h3>

                    {
                        renderList(
                            analysis.weaknesses,
                            "No weaknesses available."
                        )
                    }

                </div>

                {/* RECOMMENDATIONS */}
                <div className="analysis-section">

                    <h3>
                        Recommendations
                    </h3>

                    {
                        renderList(
                            analysis.recommendations,
                            "No recommendations available."
                        )
                    }

                </div>

                {/* TECHNICAL SKILL */}
                <div className="analysis-section">

                    <h3>
                        Technical Skill Assessment
                    </h3>

                    <p className="analysis-text">

                        {
                            analysis.technical_skill_assessment ||
                            performance.technical_skill_assessment ||
                            "No technical skill assessment available."
                        }

                    </p>

                </div>

                {/* READINESS */}
                <div className="analysis-section">

                    <h3>
                        Readiness Assessment
                    </h3>

                    <p className="analysis-text">

                        {
                            analysis.readiness_assessment ||
                            performance.readiness_assessment ||
                            "No readiness assessment available."
                        }

                    </p>

                </div>

            </div>

            {/* ======================================
                QUESTION PERFORMANCE
            ====================================== */}
            <div className="result-card">

                <h2>
                    Question-wise Performance
                </h2>

                {
                    questionPerformance.length === 0

                        ?

                        <p className="result-empty-text">
                            No question performance available.
                        </p>

                        :

                        <div className="question-result-list">

                            {
                                questionPerformance.map(
                                    (question, index) => (

                                        <div
                                            className="question-result-item"
                                            key={
                                                question.question_number ||
                                                index
                                            }
                                        >

                                            {/* QUESTION HEADER */}
                                            <div className="question-result-header">

                                                <h3>

                                                    Question{" "}

                                                    {
                                                        question.question_number ||
                                                        index + 1
                                                    }

                                                </h3>

                                                <span className="question-score">

                                                    {
                                                        question.score ??
                                                        0
                                                    }

                                                    /10

                                                </span>

                                            </div>

                                            <div className="question-result-content">

                                                {/* QUESTION */}
                                                <div className="question-content-block">

                                                    <strong>
                                                        Question
                                                    </strong>

                                                    <p>
                                                        {
                                                            question.question ||
                                                            "N/A"
                                                        }
                                                    </p>

                                                </div>

                                                {/* ANSWER */}
                                                <div className="question-content-block">

                                                    <strong>
                                                        Your Answer
                                                    </strong>

                                                    <p>
                                                        {
                                                            question.answer ||
                                                            question.candidate_answer ||
                                                            "No answer"
                                                        }
                                                    </p>

                                                </div>

                                                {/* EVALUATION */}
                                                <div className="evaluation-grid">

                                                    <div>

                                                        <span>
                                                            Correctness
                                                        </span>

                                                        <strong>
                                                            {
                                                                question.correctness ||
                                                                "N/A"
                                                            }
                                                        </strong>

                                                    </div>

                                                    <div>

                                                        <span>
                                                            Relevance
                                                        </span>

                                                        <strong>
                                                            {
                                                                question.relevance ||
                                                                "N/A"
                                                            }
                                                        </strong>

                                                    </div>

                                                    <div>

                                                        <span>
                                                            Technical Accuracy
                                                        </span>

                                                        <strong>
                                                            {
                                                                question.technical_accuracy ||
                                                                "N/A"
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>

                                                {/* STRENGTHS */}
                                                {
                                                    Array.isArray(
                                                        question.strengths
                                                    ) &&
                                                    question.strengths.length > 0 && (

                                                        <div className="question-feedback">

                                                            <strong>
                                                                Strengths
                                                            </strong>

                                                            <ul>
                                                                {
                                                                    question.strengths.map(
                                                                        (
                                                                            strength,
                                                                            strengthIndex
                                                                        ) => (

                                                                            <li
                                                                                key={
                                                                                    strengthIndex
                                                                                }
                                                                            >
                                                                                {strength}
                                                                            </li>

                                                                        )
                                                                    )
                                                                }
                                                            </ul>

                                                        </div>

                                                    )
                                                }

                                                {/* WEAKNESSES */}
                                                {
                                                    Array.isArray(
                                                        question.weaknesses
                                                    ) &&
                                                    question.weaknesses.length > 0 && (

                                                        <div className="question-feedback">

                                                            <strong>
                                                                Areas to Improve
                                                            </strong>

                                                            <ul>
                                                                {
                                                                    question.weaknesses.map(
                                                                        (
                                                                            weakness,
                                                                            weaknessIndex
                                                                        ) => (

                                                                            <li
                                                                                key={
                                                                                    weaknessIndex
                                                                                }
                                                                            >
                                                                                {weakness}
                                                                            </li>

                                                                        )
                                                                    )
                                                                }
                                                            </ul>

                                                        </div>

                                                    )
                                                }

                                                {/* FEEDBACK */}
                                                {
                                                    question.feedback && (

                                                        <div className="question-feedback">

                                                            <strong>
                                                                Feedback
                                                            </strong>

                                                            <p>
                                                                {
                                                                    question.feedback
                                                                }
                                                            </p>

                                                        </div>

                                                    )
                                                }

                                            </div>

                                        </div>

                                    )
                                )
                            }

                        </div>
                }

            </div>

            {/* ======================================
                BOTTOM ACTIONS
            ====================================== */}
            <div className="result-actions">

                <button
                    className="download-pdf-btn"
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                >

                    {
                        downloading
                            ? "Downloading..."
                            : "📄 Download PDF Report"
                    }

                </button>

                <button
                    className="result-back-btn"
                    onClick={() => navigate("/interview/history")}
                >
                    Interview History
                </button>

            </div>

        </div>

    );

}

export default InterviewResult;
