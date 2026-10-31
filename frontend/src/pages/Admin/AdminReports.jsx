
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
    {
        id: "activity-logs",
        title: "Activity Logs Report",
        description: "Export user and admin activities, login history, actions, IP addresses, and timestamps.",
        icon: "📜",
        color: "blue",
    },
];

function AdminReports() {
    const navigate = useNavigate();

    // DATE FILTER STATES
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [datesChanged, setDatesChanged] = useState(false);

    // DOWNLOAD STATES
    const [loadingReport, setLoadingReport] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // REPORT FORMAT SELECTION
    const [selectedFormats, setSelectedFormats] = useState({
        users: "csv",
        interviews: "csv",
        "problem-reports": "csv",
        reviews: "csv",
        "activity-logs": "csv",
    });

    // ==========================================
    // DOWNLOAD REPORT
    // ==========================================

    const downloadReport = async (reportType) => {
        setMessage("");
        setError("");

        if (startDate && endDate && startDate > endDate) {
            setError(
                "The start date cannot be later than the end date."
            );
            return;
        }

        try {
            setLoadingReport(reportType);

            const selectedFormat = selectedFormats[reportType];

            const params = {
                format: selectedFormat,
            };

            if (startDate) {
                params.start_date = startDate;
            }

            if (endDate) {
                params.end_date = endDate;
            }

            const response = await api.get(
                `/api/admin/reports/${reportType}/export`,
                {
                    params,
                    responseType: "blob",
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type:
                        response.headers["content-type"] ||
                        "application/octet-stream",
                }
            );

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${reportType}-report.${selectedFormat}`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            const reportTitle = REPORTS.find(
                (report) => report.id === reportType
            )?.title;

            setMessage(
                `${reportTitle} (${selectedFormat.toUpperCase()}) download has started successfully.`
            );

        } catch (err) {
            let errorMessage = "Failed to download the report.";

            try {
                const data = err.response?.data;

                if (data instanceof Blob) {
                    const responseText = await data.text();

                    try {
                        const parsed = JSON.parse(responseText);
                        errorMessage =
                            parsed.message || errorMessage;
                    } catch {
                        errorMessage =
                            responseText || errorMessage;
                    }
                } else {
                    errorMessage =
                        data?.message || errorMessage;
                }
            } catch {
                // Keep default error message.
            }

            setError(errorMessage);

        } finally {
            setLoadingReport("");
        }
    };

    // ==========================================
    // CLEAR DATE FILTER
    // ==========================================

    const clearDates = () => {
        setStartDate("");
        setEndDate("");
        setDatesChanged(false);
        setMessage("");
        setError("");
    };

    // ==========================================
    // CHANGE REPORT FORMAT
    // ==========================================

    const handleFormatChange = (reportId, format) => {
        setSelectedFormats((prev) => ({
            ...prev,
            [reportId]: format,
        }));

        setMessage("");
        setError("");
    };

    return (
        <main className="admin-reports-page">

            {/* ==========================================
                HEADER
            ========================================== */}

            <header className="admin-reports-header">

                <div className="admin-reports-heading">

                    <span className="admin-reports-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>Reports Center</h1>

                    <p>
                        Download project reports in CSV, PDF,
                        Word or Excel format.
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

            {/* ==========================================
                DATE RANGE FILTER
            ========================================== */}

            <section className="admin-reports-filter">

                <div className="admin-reports-filter-title">

                    <div className="admin-reports-filter-icon">
                        📅
                    </div>

                    <div>
                        <h2>Date Range</h2>
                        <p>
                            Filter all reports by a specific date range.
                        </p>
                    </div>

                </div>

                <div className="admin-reports-filter-fields">

                    <label className="admin-reports-date-field">

                        <span>Start Date</span>

                        <input
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
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

            {/* ==========================================
                STATUS MESSAGES
            ========================================== */}

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

            {/* ==========================================
                AVAILABLE REPORTS
            ========================================== */}

            <section className="admin-reports-section">

                <div className="admin-reports-section-heading">

                    <div>
                        <h2>Available Reports</h2>

                        <p>
                            Select a report and choose your preferred
                            download format: CSV, PDF, Word or Excel.
                        </p>
                    </div>

                    <span className="admin-reports-count">
                        {REPORTS.length} Reports
                    </span>

                </div>

                {/* 2 COLUMN REPORT GRID */}

                <div className="admin-reports-grid">

                    {REPORTS.map((report) => (

                        <article
                            className={`admin-report-card ${report.color}`}
                            key={report.id}
                        >

                            {/* CARD TOP */}

                            <div className="admin-report-card-top">

                                <div className="admin-report-icon">
                                    {report.icon}
                                </div>

                                {/* FORMAT DROPDOWN */}

                                <div className="admin-report-format-wrapper">
                                    <label
                                        className="admin-report-format-label"
                                        htmlFor={`format-${report.id}`}
                                    >
                                        Export Format:
                                    </label>

                                    <select
                                        id={`format-${report.id}`}
                                        className="admin-report-format-select"
                                        value={selectedFormats[report.id]}
                                        onChange={(e) =>
                                            handleFormatChange(report.id, e.target.value)
                                        }
                                        aria-label={`Select ${report.title} download format`}
                                        disabled={Boolean(loadingReport)}
                                    >
                                        <option value="csv">CSV</option>
                                        <option value="pdf">PDF</option>
                                        <option value="docx">Word (.docx)</option>
                                        <option value="xlsx">Excel (.xlsx)</option>
                                    </select>
                                </div>

                            </div>

                            {/* CARD DETAILS */}

                            <h3>{report.title}</h3>

                            <p>{report.description}</p>

                            {/* DOWNLOAD BUTTON */}

                            <button
                                type="button"
                                className="admin-report-download-btn"
                                onClick={() =>
                                    downloadReport(report.id)
                                }
                                disabled={Boolean(loadingReport)}
                            >

                                {loadingReport === report.id
                                    ? "Downloading..."
                                    : `↓ Download ${selectedFormats[report.id].toUpperCase()}`}

                            </button>

                        </article>

                    ))}

                </div>

            </section>

            {/* ==========================================
                INFORMATION NOTE
            ========================================== */}

            <div className="admin-reports-note">

                <span aria-hidden="true">ℹ️</span>

                <p>
                    <strong>Note:</strong> CSV files can be opened
                    in Microsoft Excel. Date filtering depends on
                    the date field configured in the backend.
                </p>

            </div>

        </main>
    );
}

export default AdminReports;
