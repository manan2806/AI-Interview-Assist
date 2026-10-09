import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitProblemReport } from "../services/interviewService";
import "../context/Support.css"

function Support() {
    const [showProblemForm, setShowProblemForm] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [problemType, setProblemType] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();

    // OPEN PROBLEM FORM
    const openProblemForm = () => {
        setError("");
        setSuccess("");
        setShowProblemForm(true);
    };

    // CLOSE PROBLEM FORM
    const closeProblemForm = () => {
        if (loading) {
            return;
        }

        setShowProblemForm(false);
        setProblemType("");
        setSubject("");
        setDescription("");
        setError("");
        setSuccess("");
    };

    // SUBMIT PROBLEM REPORT
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // VALIDATION
        if (!problemType) {
            setError("Please select a problem type.");
            return;
        }

        if (!subject.trim()) {
            setError("Please enter a subject.");
            return;
        }

        if (!description.trim()) {
            setError("Please describe your problem.");
            return;
        }

        try {
            setLoading(true);

            const response = await submitProblemReport(
                problemType,
                subject.trim(),
                description.trim()
            );

            if (response.success) {
                setSuccess(
                    response.message ||
                    "Problem report submitted successfully."
                );

                setProblemType("");
                setSubject("");
                setDescription("");

                setTimeout(() => {
                    setShowProblemForm(false);
                    setSuccess("");
                }, 3000);
            } else {
                setError(
                    response.message ||
                    "Unable to submit problem report."
                );
            }
        } catch (err) {
            console.error("Problem Report Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to submit problem report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="support-page">
            {/* HEADER */}
            <div className="support-header">
                <div>
                    <p className="support-label">HELP & SUPPORT</p>

                    <h1>How can we help you?</h1>

                    <p>
                        Find help, report a problem, or contact us
                        if you need assistance with your interview.
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

            {/* SUPPORT OPTIONS */}
            <div className="support-container">
                {/* REPORT PROBLEM */}
                <div className="support-card">
                    <div className="support-card-icon problem-icon">
                        🐛
                    </div>

                    <div className="support-card-content">
                        <h2>Report a Problem</h2>

                        <p>
                            Something is not working correctly?
                            Let us know what happened and we will
                            look into it.
                        </p>

                        <button
                            type="button"
                            className="support-button"
                            onClick={openProblemForm}
                        >
                            Report a Problem
                        </button>
                    </div>
                </div>

                {/* FAQ */}
                <div className="support-card">
                    <div className="support-card-icon faq-icon">
                        ❓
                    </div>

                    <div className="support-card-content">
                        <h2>Frequently Asked Questions</h2>

                        <p>
                            Find answers to common questions about
                            interviews, results, profile and more.
                        </p>

                        <button
                            type="button"
                            className="support-button secondary"
                            onClick={() => setShowFAQModal(true)}
                        >
                            View FAQs
                        </button>
                    </div>
                </div>

                {/* CONTACT SUPPORT */}
                <div className="support-card">
                    <div className="support-card-icon contact-icon">
                        ✉️
                    </div>

                    <div className="support-card-content">
                        <h2>Contact Support</h2>

                        <p>
                            Need additional help? Contact our support
                            team and we will assist you.
                        </p>

                        <button
                            type="button"
                            className="support-button secondary"
                            onClick={() => setShowContactModal(true)}
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>

            {/* REPORT PROBLEM MODAL */}
            {showProblemForm && (
                <div
                    className="support-modal-overlay"
                    onClick={closeProblemForm}
                >
                    <div
                        className="support-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* MODAL HEADER */}
                        <div className="support-modal-header">
                            <div>
                                <span className="support-label">
                                    SUPPORT
                                </span>

                                <h2>Report a Problem</h2>

                                <p>Tell us what went wrong.</p>
                            </div>

                            <button
                                type="button"
                                className="support-close-button"
                                onClick={closeProblemForm}
                                disabled={loading}
                            >
                                ×
                            </button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={handleSubmit}>
                            {/* PROBLEM TYPE */}
                            <div className="support-form-group">
                                <label>Problem Type</label>

                                <select
                                    value={problemType}
                                    onChange={(e) =>
                                        setProblemType(e.target.value)
                                    }
                                    disabled={loading}
                                >
                                    <option value="" disabled>
                                        Select problem type
                                    </option>

                                    <option value="Interview Issue">
                                        Interview Issue
                                    </option>

                                    <option value="Login / Account Issue">
                                        Login / Account Issue
                                    </option>

                                    <option value="Result / Evaluation Issue">
                                        Result / Evaluation Issue
                                    </option>

                                    <option value="Profile Issue">
                                        Profile Issue
                                    </option>

                                    <option value="Technical Issue">
                                        Technical Issue
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>

                            {/* SUBJECT */}
                            <div className="support-form-group">
                                <label>Subject</label>

                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) =>
                                        setSubject(e.target.value)
                                    }
                                    placeholder="Enter a short description"
                                    disabled={loading}
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="support-form-group">
                                <label>Describe your problem</label>

                                <textarea
                                    rows="5"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Please explain what happened..."
                                    disabled={loading}
                                />
                            </div>

                            {/* ERROR */}
                            {error && (
                                <div className="support-error">
                                    {error}
                                </div>
                            )}

                            {/* SUCCESS */}
                            {success && (
                                <div className="support-success">
                                    {success}
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="support-form-actions">
                                <button
                                    type="button"
                                    className="support-cancel-button"
                                    onClick={closeProblemForm}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="support-submit-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? "Sending..."
                                        : "Send Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FAQ MODAL */}
            {showFAQModal && (
                <div
                    className="support-modal-overlay"
                    onClick={() => setShowFAQModal(false)}
                >
                    <div
                        className="support-modal support-info-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="support-modal-header">
                            <div>
                                <span className="support-label">
                                    HELP CENTER
                                </span>

                                <h2>Frequently Asked Questions</h2>

                                <p>
                                    Find answers to common questions.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="support-close-button"
                                onClick={() => setShowFAQModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {/* FAQ LIST */}
                        <div className="faq-list">

                            <div className="faq-item">
                                <h3>
                                    How do I start an interview?
                                </h3>

                                <p>
                                    Go to your Dashboard and click
                                    <strong> Start New Interview</strong>.
                                    Complete the interview setup and start
                                    answering the questions.
                                </p>
                            </div>

                            <div className="faq-item">
                                <h3>
                                    Can I resume an unfinished interview?
                                </h3>

                                <p>
                                    Yes. If your interview is still in progress,
                                    you can resume it and continue from your
                                    previous question.
                                </p>
                            </div>

                            <div className="faq-item">
                                <h3>
                                    How is my interview evaluated?
                                </h3>

                                <p>
                                    Your answers are evaluated using AI. The
                                    result includes your score, strengths,
                                    weaknesses and recommendations.
                                </p>
                            </div>

                            <div className="faq-item">
                                <h3>
                                    Where can I see my previous interviews?
                                </h3>

                                <p>
                                    You can view your previous interviews from
                                    the Interview History section of your
                                    Dashboard.
                                </p>
                            </div>

                            <div className="faq-item">
                                <h3>
                                    Can I download my interview report?
                                </h3>

                                <p>
                                    Yes. After completing an interview, you can
                                    download the available interview report from
                                    the interview result page.
                                </p>
                            </div>

                            <div className="faq-item">
                                <h3>
                                    What if I face a technical problem?
                                </h3>

                                <p>
                                    Use the <strong>Report a Problem </strong>
                                    option on this Support page and describe
                                    the issue you are experiencing.
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* CONTACT SUPPORT MODAL */}
            {showContactModal && (
                <div
                    className="support-modal-overlay"
                    onClick={() => setShowContactModal(false)}
                >
                    <div
                        className="support-modal support-contact-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="support-modal-header">
                            <div>
                                <span className="support-label">
                                    CONTACT SUPPORT
                                </span>

                                <h2>Need More Help?</h2>

                                <p>
                                    We're here to help you.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="support-close-button"
                                onClick={() => setShowContactModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        {/* CONTACT CONTENT */}
                        <div className="contact-support-content">

                            <div className="contact-support-icon">
                                ✉️
                            </div>

                            <h3>
                                Contact Our Support Team
                            </h3>

                            <p>
                                If you need additional assistance with your
                                interview, account or technical issues, you
                                can contact our support team.
                            </p>

                            <div className="contact-support-info">

                                <div className="contact-info-item">
                                    <span className="contact-info-icon">
                                        📧
                                    </span>
                                    <div>
                                        <small>
                                            Email Support
                                        </small>
                                        <strong>
                                            support@aiinterviewassist.com
                                        </strong>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <span className="contact-info-icon">
                                        🛠️
                                    </span>
                                    <div>
                                        <small>
                                            Support For
                                        </small>
                                        <strong>
                                            Account, Interview & Technical Issues
                                        </strong>
                                    </div>
                                </div>

                                <div className="contact-info-item">
                                    <span className="contact-info-icon">
                                        ⏱️
                                    </span>
                                    <div>
                                        <small>
                                            Response Time
                                        </small>
                                        <strong>
                                            Usually within 24 hours
                                        </strong>
                                    </div>
                                </div>

                            </div>
                            <button
                                type="button"
                                className="support-button secondary contact-faq-button"
                                onClick={() => {
                                    setShowContactModal(false);
                                    setShowFAQModal(true);
                                }}
                            >
                                View FAQs
                            </button>

                            <button
                                type="button"
                                className="support-submit-button contact-report-button"
                                onClick={() => {
                                    setShowContactModal(false);
                                    openProblemForm();
                                }}
                            >
                                Report a Problem
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Support;
