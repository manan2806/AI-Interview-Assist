import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../../services/api";
import "../../context/User/CodingInterview.css";

// ==========================================
// STARTER CODE
// ==========================================
const STARTER_CODE = {
    python: `# Write your Python code here
print(10 + 20)
`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println(10 + 20);
    }
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << 10 + 20 << endl;
    return 0;
}`,
    javascript: `// Write your JavaScript code here
console.log(10 + 20);
`,
};

const LANGUAGE_LABELS = {
    python: "Python",
    java: "Java",
    cpp: "C++",
    javascript: "JavaScript",
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================
const getStarterCode = (starterCode, language) => {
    if (typeof starterCode === "string" && starterCode.trim()) {
        return starterCode;
    }

    if (starterCode && typeof starterCode === "object") {
        return (
            starterCode[language] ||
            starterCode.code ||
            STARTER_CODE[language] ||
            STARTER_CODE.python
        );
    }

    return STARTER_CODE[language] || STARTER_CODE.python;
};

const getTestStatus = (test) => {
    return String(test?.status || "").toLowerCase() === "passed";
};

const getExampleValue = (example, keys) => {
    if (!example || typeof example !== "object") {
        return "";
    }

    for (const key of keys) {
        if (example[key] !== undefined && example[key] !== null) {
            return example[key];
        }
    }

    return "";
};

// ==========================================
// COMPONENT
// ==========================================
function CodingInterview() {
    const navigate = useNavigate();

    // ==========================================
    // STATES
    // ==========================================
    const [language, setLanguage] = useState("python");
    const [difficulty, setDifficulty] = useState("Easy");
    const [field, setField] = useState("");
    const [targetRole, setTargetRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [duration, setDuration] = useState("No Limit");
    const [code, setCode] = useState(STARTER_CODE.python);
    const [stdin, setStdin] = useState("");
    const [question, setQuestion] = useState(null);
    const [interviewId, setInterviewId] = useState("");
    const [result, setResult] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [initializing, setInitializing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isBusy = initializing || loading || submitting;

    // ==========================================
    // LOAD CODING INTERVIEW SETUP
    // ==========================================
    useEffect(() => {
        try {
            const savedSetup = localStorage.getItem("coding_interview_setup");

            if (!savedSetup) {
                navigate("/interview/setup", { replace: true });
                return;
            }

            const setup = JSON.parse(savedSetup);

            if (!setup?.interview_id || !setup?.question) {
                navigate("/interview/setup", { replace: true });
                return;
            }

            const selectedLanguage = setup.language || "python";

            setLanguage(selectedLanguage);
            setDifficulty(setup.difficulty || "Easy");
            setField(setup.field || "");
            setTargetRole(setup.target_role || "");
            setExperienceLevel(setup.experience_level || "");
            setDuration(setup.duration || "No Limit");
            setQuestion(setup.question);
            setInterviewId(setup.interview_id);

            setCode(
                getStarterCode(
                    setup.question.starter_code,
                    selectedLanguage
                )
            );

            setStdin("");
            setResult(null);
            setSubmissionResult(null);
            setError("");
        } catch (err) {
            console.error("Load Coding Interview Setup Error:", err);

            localStorage.removeItem("coding_interview_setup");
            localStorage.removeItem("coding_interview_id");

            navigate("/interview/setup", { replace: true });
        } finally {
            setInitializing(false);
        }
    }, [navigate]);

    // ==========================================
    // RUN CODE
    // ==========================================
    const handleRunCode = async () => {
        if (isBusy) return;

        if (!question || !interviewId) {
            setError("Coding interview question is not available.");
            return;
        }

        if (!code.trim()) {
            setError("Please write some code before running.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);
            setSubmissionResult(null);

            const response = await api.post(
                "/api/coding-interview/run-code",
                {
                    code,
                    language,
                    stdin,
                }
            );

            if (response.data?.success) {
                setResult(response.data.result || null);
            } else {
                setError(
                    response.data?.message ||
                    "Code execution failed."
                );
            }
        } catch (err) {
            console.error("Run Code Error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to execute code. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // SUBMIT CODE
    // ==========================================
    const handleSubmitCode = async () => {
        if (isBusy) return;

        if (!question || !interviewId) {
            setError("Coding interview question is not available.");
            return;
        }

        if (!code.trim()) {
            setError("Please write your code before submitting.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setResult(null);
            setSubmissionResult(null);

            const response = await api.post(
                "/api/coding-interview/submit-code",
                {
                    interview_id: interviewId,
                    language,
                    code,
                }
            );

            if (response.data?.success) {
                const returnedResult =
                    response.data.result ||
                    response.data;

                setSubmissionResult(returnedResult);
            } else {
                setError(
                    response.data?.message ||
                    "Unable to submit code."
                );
            }
        } catch (err) {
            console.error("Submit Code Error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to submit code. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ==========================================
    // TEST RESULT HELPERS
    // ==========================================
    const testResults =
        submissionResult?.test_results ||
        submissionResult?.results ||
        [];

    const getPassedCount = () => {
        if (submissionResult?.passed_test_cases !== undefined) {
            return submissionResult.passed_test_cases;
        }

        if (submissionResult?.passed_count !== undefined) {
            return submissionResult.passed_count;
        }

        if (submissionResult?.passed !== undefined) {
            return submissionResult.passed;
        }

        return testResults.filter(getTestStatus).length;
    };

    const getFailedCount = () => {
        if (submissionResult?.failed_test_cases !== undefined) {
            return submissionResult.failed_test_cases;
        }

        if (submissionResult?.failed_count !== undefined) {
            return submissionResult.failed_count;
        }

        if (submissionResult?.failed !== undefined) {
            return submissionResult.failed;
        }

        return testResults.filter(
            (test) => !getTestStatus(test)
        ).length;
    };

    const getTotalCount = () => {
        if (submissionResult?.total_test_cases !== undefined) {
            return submissionResult.total_test_cases;
        }

        if (submissionResult?.total_count !== undefined) {
            return submissionResult.total_count;
        }

        if (submissionResult?.total !== undefined) {
            return submissionResult.total;
        }

        return testResults.length;
    };

    const getSubmissionStatus = () => {
        if (submissionResult?.status) {
            return submissionResult.status;
        }

        return getTotalCount() > 0 &&
            getPassedCount() === getTotalCount()
            ? "Accepted"
            : "Completed";
    };

    // ==========================================
    // BACK TO SETUP
    // ==========================================
    const handleBackToSetup = () => {
        navigate("/interview/setup");
    };

    // ==========================================
    // LOADING SCREEN
    // ==========================================
    if (initializing) {
        return (
            <div className="coding-interview-page">
                <div className="coding-console-empty">
                    <span className="coding-spinner"></span>
                    Loading your coding interview...
                </div>
            </div>
        );
    }

    // ==========================================
    // JSX
    // ==========================================
    return (
        <div className="coding-interview-page">
            {/* HEADER */}
            <div className="coding-header">
                <div>
                    <span className="coding-eyebrow">
                        AI INTERVIEW ASSIST
                    </span>
                    <h1>Live Coding Interview</h1>
                    <p>
                        Solve your AI-generated coding problem,
                        run your code and submit your solution.
                    </p>
                </div>
                <div className="coding-header-icon">
                    <span>⌨️</span>
                </div>
            </div>

            {/* INTERVIEW INFORMATION */}
            <div className="coding-question-toolbar">
                <div className="coding-interview-info">
                    <span>
                        <strong>Field:</strong> {field || "N/A"}
                    </span>
                    <span>
                        <strong>Role:</strong> {targetRole || "N/A"}
                    </span>
                    <span>
                        <strong>Experience:</strong>{" "}
                        {experienceLevel || "N/A"}
                    </span>
                    <span>
                        <strong>Language:</strong>{" "}
                        {LANGUAGE_LABELS[language] || language}
                    </span>
                    <span>
                        <strong>Difficulty:</strong> {difficulty}
                    </span>
                    <span>
                        <strong>Duration:</strong> {duration}
                    </span>
                </div>
                <button
                    type="button"
                    className="coding-generate-btn"
                    onClick={handleBackToSetup}
                    disabled={isBusy}
                >
                    ← Back to Setup
                </button>
            </div>

            {/* GENERATED QUESTION */}
            {question && (
                <div className="coding-question-card">
                    <div className="coding-question-heading">
                        <div>
                            <span className="coding-question-label">
                                AI GENERATED QUESTION
                            </span>
                            <h2>
                                {question.title || "Coding Problem"}
                            </h2>
                        </div>
                        <span
                            className={`coding-question-difficulty ${difficulty.toLowerCase()}`}
                        >
                            {difficulty}
                        </span>
                    </div>
                    <p className="coding-question-id">
                        Interview ID: {interviewId}
                    </p>
                    <div className="coding-question-description">
                        <h3>Problem Description</h3>
                        <p>
                            {question.description ||
                                "No problem description available."}
                        </p>
                    </div>
                    {Array.isArray(question.examples) &&
                        question.examples.length > 0 && (
                            <div className="coding-examples-section">
                                <h3>Examples</h3>
                                {question.examples.map(
                                    (example, index) => (
                                        <div
                                            className="coding-example-card"
                                            key={index}
                                        >
                                            <h4>
                                                Example {index + 1}
                                            </h4>
                                            <p>
                                                <strong>Input:</strong>
                                            </p>
                                            <pre>
                                                {getExampleValue(
                                                    example,
                                                    ["input", "stdin"]
                                                ) || "N/A"}
                                            </pre>
                                            <p>
                                                <strong>Output:</strong>
                                            </p>
                                            <pre>
                                                {getExampleValue(
                                                    example,
                                                    ["output", "expected_output"]
                                                ) || "N/A"}
                                            </pre>
                                            {example.explanation && (
                                                <>
                                                    <p>
                                                        <strong>
                                                            Explanation:
                                                        </strong>
                                                    </p>
                                                    <pre>
                                                        {example.explanation}
                                                    </pre>
                                                </>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    {question.constraints && (
                        <div className="coding-constraints-section">
                            <h3>Constraints</h3>
                            {Array.isArray(question.constraints) ? (
                                <ul>
                                    {question.constraints.map(
                                        (constraint, index) => (
                                            <li key={index}>
                                                {constraint}
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p>{question.constraints}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* GLOBAL ERROR MESSAGE */}
            {error && (
                <div className="coding-error">
                    <strong>Something went wrong</strong>
                    <p>{error}</p>
                </div>
            )}

            {/* EDITOR WORKSPACE */}
            <div className="coding-workspace">
                {/* LEFT SIDE - CODE EDITOR */}
                <div className="coding-editor-panel">
                    <div className="coding-toolbar">
                        <div className="coding-language-control">
                            <label>
                                Programming Language
                            </label>
                            <div className="coding-language-display">
                                {LANGUAGE_LABELS[language] || language}
                            </div>
                        </div>
                        <button
                            type="button"
                            className="coding-run-btn"
                            onClick={handleRunCode}
                            disabled={isBusy || !question}
                        >
                            {loading ? (
                                <>
                                    <span className="coding-spinner"></span>
                                    Running...
                                </>
                            ) : (
                                <>
                                    <span>▶</span>
                                    Run Code
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            className="coding-submit-btn"
                            onClick={handleSubmitCode}
                            disabled={
                                isBusy ||
                                !question ||
                                !interviewId ||
                                Boolean(submissionResult)
                            }
                        >
                            {submitting ? (
                                <>
                                    <span className="coding-spinner"></span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <span>✓</span>
                                    Submit Code
                                </>
                            )}
                        </button>
                    </div>

                    {/* MONACO EDITOR */}
                    <div className="coding-editor">
                        <Editor
                            height="650px"
                            language={language}
                            value={code}
                            onChange={(value) => {
                                setCode(value || "");
                                setSubmissionResult(null);
                                setResult(null);
                                setError("");
                            }}
                            theme="vs-dark"
                            options={{
                                minimap: {
                                    enabled: false,
                                },
                                fontSize: 14,
                                fontFamily: "Consolas, monospace",
                                wordWrap: "on",
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                tabSize: 4,
                                insertSpaces: true,
                                lineNumbers: "on",
                                renderLineHighlight: "all",
                                padding: {
                                    top: 16,
                                },
                                readOnly: isBusy,
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT SIDE - INPUT + OUTPUT */}
                <div className="coding-side-panel">
                    {/* CUSTOM INPUT */}
                    <div className="coding-input-section">
                        <div className="coding-section-heading">
                            <div>
                                <h3>Custom Input</h3>
                                <p>
                                    Enter your program input (stdin).
                                </p>
                            </div>
                        </div>
                        <textarea
                            value={stdin}
                            onChange={(event) =>
                                setStdin(event.target.value)
                            }
                            placeholder="Enter your input here..."
                            rows={6}
                            disabled={isBusy}
                        />
                    </div>

                    {/* OUTPUT CONSOLE */}
                    <div className="coding-output-section">
                        <div className="coding-output-heading">
                            <div>
                                <h3>Output Console</h3>
                                <p>
                                    Program execution result
                                </p>
                            </div>
                            {result && (
                                <span
                                    className={`coding-status ${String(result.status || "").toLowerCase() === "accepted"
                                        ? "accepted"
                                        : "failed"
                                        }`}
                                >
                                    {result.status || "Completed"}
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="coding-console-empty">
                                <span className="coding-spinner"></span>
                                Executing code...
                            </div>
                        ) : result ? (
                            <div className="coding-console-result">
                                {result.stdout && (
                                    <div className="coding-console-block">
                                        <h4>Output</h4>
                                        <pre>{result.stdout}</pre>
                                    </div>
                                )}
                                {result.compile_output && (
                                    <div className="coding-console-block error-text">
                                        <h4>Compilation Output</h4>
                                        <pre>{result.compile_output}</pre>
                                    </div>
                                )}
                                {result.stderr && (
                                    <div className="coding-console-block error-text">
                                        <h4>Error</h4>
                                        <pre>{result.stderr}</pre>
                                    </div>
                                )}
                                {result.message && (
                                    <div className="coding-console-block">
                                        <h4>Message</h4>
                                        <pre>{result.message}</pre>
                                    </div>
                                )}
                                {!result.stdout &&
                                    !result.compile_output &&
                                    !result.stderr &&
                                    !result.message && (
                                        <p className="coding-no-output">
                                            Program executed without output.
                                        </p>
                                    )}
                                <div className="coding-execution-info">
                                    <span>
                                        ⏱ {result.execution_time ?? "N/A"} sec
                                    </span>
                                    <span>
                                        Memory: {result.memory ?? "N/A"} KB
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="coding-console-empty">
                                Output will appear here.
                            </div>
                        )}
                    </div>

                    {/* SUBMISSION RESULT */}
                    {submissionResult && (
                        <div className="coding-submission-result">
                            <div className="coding-submission-heading">
                                <h3>Submission Result</h3>
                                <span
                                    className={`coding-status ${getSubmissionStatus() === "Accepted"
                                        ? "accepted"
                                        : "failed"
                                        }`}
                                >
                                    {getSubmissionStatus()}
                                </span>
                            </div>

                            {/* SCORE */}
                            <div className="coding-score-card">
                                <h2>
                                    {submissionResult.score ?? 0}%
                                </h2>
                                <p>Test Case Score</p>
                                <div className="coding-score-details">
                                    <span>
                                        Passed: {getPassedCount()}
                                    </span>
                                    <span>
                                        Failed: {getFailedCount()}
                                    </span>
                                    <span>
                                        Total: {getTotalCount()}
                                    </span>
                                </div>
                            </div>

                            {/* TEST CASE RESULTS */}
                            <h4 className="coding-test-results-title">
                                Test Case Results
                            </h4>
                            <div className="coding-test-results-list">
                                {testResults.length > 0 ? (
                                    testResults.map((test, index) => {
                                        const passed = getTestStatus(test);

                                        return (
                                            <div
                                                className="coding-test-result-item"
                                                key={index}
                                            >
                                                <div className="coding-test-result-heading">
                                                    <strong>
                                                        Test Case{" "}
                                                        {test.test_case || index + 1}
                                                    </strong>
                                                    <span
                                                        className={`coding-test-badge ${passed
                                                            ? "passed"
                                                            : "failed"
                                                            }`}
                                                    >
                                                        {test.status || "Failed"}
                                                    </span>
                                                </div>

                                                {/* HIDDEN TEST CASE */}
                                                {test.is_hidden ? (
                                                    <p className="coding-hidden-test">
                                                        🔒 Hidden test case
                                                        <br />
                                                        Test details are kept private.
                                                    </p>
                                                ) : (
                                                    <div className="coding-test-details">
                                                        <p>
                                                            <strong>Input:</strong>
                                                        </p>
                                                        <pre>
                                                            {test.input ?? "No input"}
                                                        </pre>
                                                        <p>
                                                            <strong>
                                                                Expected Output:
                                                            </strong>
                                                        </p>
                                                        <pre>
                                                            {test.expected_output ?? "N/A"}
                                                        </pre>
                                                        <p>
                                                            <strong>Your Output:</strong>
                                                        </p>
                                                        <pre>
                                                            {test.actual_output ?? "N/A"}
                                                        </pre>
                                                        {test.stderr && (
                                                            <>
                                                                <p>
                                                                    <strong>Error:</strong>
                                                                </p>
                                                                <pre>
                                                                    {test.stderr}
                                                                </pre>
                                                            </>
                                                        )}
                                                        {test.compile_output && (
                                                            <>
                                                                <p>
                                                                    <strong>
                                                                        Compilation Output:
                                                                    </strong>
                                                                </p>
                                                                <pre>
                                                                    {test.compile_output}
                                                                </pre>
                                                            </>
                                                        )}
                                                        {test.execution_status && (
                                                            <p>
                                                                <strong>
                                                                    Execution Status:
                                                                </strong>{" "}
                                                                {test.execution_status}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="coding-no-output">
                                        No test case results were returned.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER ACTION */}
            <div className="coding-footer">
                <button
                    type="button"
                    className="setup-cancel-button"
                    onClick={handleBackToSetup}
                    disabled={isBusy}
                >
                    Back to Interview Setup
                </button>
            </div>
        </div>
    );
}

export default CodingInterview;
