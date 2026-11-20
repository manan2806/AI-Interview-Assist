
import api from "./api";

// GET INTERVIEW HISTORY
export const getInterviewHistory = async () => {
    const response = await api.get("/api/interview/history");
    return response.data;
};

// CREATE INTERVIEW
export const createInterview = async (interviewData: any) => {
    const response = await api.post(
        "/api/interview/setup",
        interviewData
    );
    return response.data;
};

// GENERATE QUESTIONS
export const generateQuestions = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/generate-questions`
    );
    return response.data;
};

// START INTERVIEW
export const startInterview = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/start`
    );
    return response.data;
};

// RESUME INTERVIEW
export const resumeInterview = async (interviewId: string) => {
    const response = await api.get(
        `/api/interview/${interviewId}/resume`
    );
    return response.data;
};

// GET CURRENT QUESTION
export const getCurrentQuestion = async (interviewId: string) => {
    const response = await api.get(
        `/api/interview/${interviewId}/current-question`
    );
    return response.data;
};

// SUBMIT ANSWER
export const submitAnswer = async (
    interviewId: string,
    answer: string
) => {
    const response = await api.post(
        `/api/interview/${interviewId}/answer`,
        { answer }
    );
    return response.data;
};

// SUBMIT TIMEOUT
export const submitTimeout = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/timeout`
    );
    return response.data;
};

// EVALUATE INTERVIEW
export const evaluateInterview = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/evaluate`
    );
    return response.data;
};

// GENERATE OVERALL RESULT
export const generateOverallResult = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/overall-result`
    );
    return response.data;
};

// GET INTERVIEW DASHBOARD
export const getInterviewDashboard = async (interviewId: string) => {
    const response = await api.get(
        `/api/interview/${interviewId}/dashboard`
    );
    return response.data;
};

// DELETE INTERVIEW
export const deleteInterview = async (interviewId: string) => {
    const response = await api.delete(
        `/api/interview/${interviewId}`
    );
    return response.data;
};

// GET INTERVIEW DETAILS
export const getInterviewDetails = async (interviewId: string) => {
    const response = await api.get(
        `/api/interview/${interviewId}/details`
    );
    return response.data;
};

// RETAKE INTERVIEW
export const retakeInterview = async (interviewId: string) => {
    const response = await api.post(
        `/api/interview/${interviewId}/retake`
    );
    return response.data;
};

// GET SPECIFIC QUESTION
export const getInterviewQuestion = async (
    interviewId: string,
    questionNumber: number
) => {
    const response = await api.get(
        `/api/interview/${interviewId}/question/${questionNumber}`
    );
    return response.data;
};

// UPDATE PREVIOUS ANSWER
export const updateInterviewAnswer = async (
    interviewId: string,
    questionNumber: number,
    answer: string
) => {
    const response = await api.put(
        `/api/interview/${interviewId}/answer/${questionNumber}`,
        { answer }
    );
    return response.data;
};

// SUBMIT PROBLEM REPORT
export const submitProblemReport = async (
    problemType: string,
    subject: string,
    description: string
) => {
    const response = await api.post(
        "/api/support/problem-report",
        {
            problem_type: problemType,
            subject,
            description
        }
    );

    return response.data;
};
