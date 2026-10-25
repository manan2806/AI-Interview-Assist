import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import "../../context/Admin/AdminReports.css";

const REPORTS = [
    {
        id: "users",
        title: "Users Report",
        description: "Export registered users and their profile details.",
        icon: "👥",
        color: "purple",
    },
    {
        id: "interviews",
        title: "Interviews Report",
        description: "Export interview status, job role, score, and duration.",
        icon: "📊",
        color: "blue",
    },
    {
        id: "problem-reports",
        title: "Problem Reports",
        description: "Export reported problems and their current status.",
        icon: "🛠️",
        color: "orange",
    },
    {
        id: "reviews",
        title: "Reviews Report",
        description: "Export user ratings, comments, and review status.",
        icon: "⭐",
        color: "green",
    },
];

function AdminReports() {
    const navigate = useNavigate();

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loadingReport, setLoadingReport] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [datesChanged, setDatesChanged] = useState(false);

    const downloadReport = async (reportType) => {
        setMessage("");
        setError("");

        if (startDate && endDate && startDate > endDate) {
            setError("The start date cannot be later than the end date.");
            return;
        }

        try {
            setLoadingReport(reportType);

            const params = { format: "csv" };

            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await api.get(
                `/api/admin/reports/${reportType}/export`,
                {
                    params,
                    responseType: "blob",
                }
            );

            const blob = new Blob(
                [response.data],
                { type: "text/csv;charset=utf-8;" }
            );

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${reportType}-report.csv`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            const reportTitle = REPORTS.find(
                (report) => report.id === reportType
            )?.title;

            setMessage(`${reportTitle} download has started successfully.`);
        } catch (err) {
            let errorMessage = "Failed to download the report.";

            try {
                const data = err.response?.data;

                if (data instanceof Blob) {
                    const text = await data.text();

                    try {
                        const parsed = JSON.parse(text);
                        errorMessage = parsed.message || errorMessage;
                    } catch {
                        errorMessage = text || errorMessage;
                    }
                } else {
                    errorMessage = data?.message || errorMessage;
                }
            } catch {
                // Keep the default error message.
            }

            setError(errorMessage);
        } finally {
            setLoadingReport("");
        }
    };

    const clearDates = () => {
        setStartDate("");
        setEndDate("");
        setDatesChanged(false);
        setMessage("");
        setError("");
    };

    return (
        <main className="admin-reports-page">
            {/* HEADER */}
            <header className="admin-reports-header">
                <div className="admin-reports-heading">
                    <span className="admin-reports-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Reports Center</h1>

                    <p>
                        Export your project reports in CSV format.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-reports-back-btn"
                    onClick={() => navigate("/admin-dashboard")}
                >
                    ← Dashboard
                </button>
            </header>

            {/* DATE RANGE FILTER */}
            <section className="admin-reports-filter">
                <div className="admin-reports-filter-title">
                    <div className="admin-reports-filter-icon">
                        📅
                    </div>

                    <div>
                        <h2>Date Range</h2>
                        <p>Filter reports by a specific date range.</p>
                    </div>
                </div>

                <div className="admin-reports-filter-fields">
                    <label className="admin-reports-date-field">
                        <span>Start Date</span>

                        <input
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onInput={() => setDatesChanged(true)}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setDatesChanged(true);
                                setMessage("");
                                setError("");
                            }}
                        />
                    </label>

                    <label className="admin-reports-date-field">
                        <span>End Date</span>

                        <input
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onInput={() => setDatesChanged(true)}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setDatesChanged(true);
                                setMessage("");
                                setError("");
                            }}
                        />
                    </label>

                    {datesChanged && (
                        <button
                            type="button"
                            className="admin-reports-clear-btn"
                            onClick={clearDates}
                        >
                            <span aria-hidden="true">✕</span>
                            Clear Dates
                        </button>
                    )}
                </div>
            </section>

            {/* STATUS MESSAGES */}
            {message && (
                <div
                    className="admin-reports-message success"
                    role="status"
                >
                    <span>✓</span>
                    {message}
                </div>
            )}

            {error && (
                <div
                    className="admin-reports-message error"
                    role="alert"
                >
                    <span>!</span>
                    {error}
                </div>
            )}

            {/* REPORT CARDS */}
            <section className="admin-reports-section">
                <div className="admin-reports-section-heading">
                    <div>
                        <h2>Available Reports</h2>
                        <p>Select a report to download.</p>
                    </div>

                    <span className="admin-reports-count">
                        {REPORTS.length} Reports
                    </span>
                </div>

                <div className="admin-reports-grid">
                    {REPORTS.map((report) => (
                        <article
                            className={`admin-report-card ${report.color}`}
                            key={report.id}
                        >
                            <div className="admin-report-card-top">
                                <div className="admin-report-icon">
                                    {report.icon}
                                </div>

                                <span className="admin-report-format">
                                    CSV
                                </span>
                            </div>

                            <h3>{report.title}</h3>

                            <p>{report.description}</p>

                            <button
                                type="button"
                                className="admin-report-download-btn"
                                onClick={() => downloadReport(report.id)}
                                disabled={Boolean(loadingReport)}
                            >
                                {loadingReport === report.id
                                    ? "Downloading..."
                                    : "↓ Download CSV"}
                            </button>
                        </article>
                    ))}
                </div>
            </section>

            {/* INFORMATION NOTE */}
            <div className="admin-reports-note">
                <span aria-hidden="true">ℹ️</span>
                <p>
                    <strong>Note:</strong> CSV files can be opened in
                    Microsoft Excel. Date filtering depends on the date
                    field configured in the backend.
                </p>
            </div>
        </main>
    );
}

export default AdminReports;
