import api from "./api";

export const createInterview = async (interviewData) => {
    const response = await api.post(
        "/api/interview/setup",
        interviewData
    );

    return response.data;
};

export const generateQuestions = async (interviewId) => {
    const response = await api.post(
        `/api/interview/${interviewId}/generate-questions`
    );

    return response.data;
};

export const startInterview = async (interviewId) => {
    const response = await api.post(
        `/api/interview/${interviewId}/start`
    );

    return response.data;
};

export const resumeInterview = async (interviewId) => {

    const response = await api.get(
        `/api/interview/${interviewId}/resume`
    );

    return response.data;
};

export const getCurrentQuestion = async (interviewId) => {
    const response = await api.get(
        `/api/interview/${interviewId}/current-question`
    );

    return response.data;
};

export const submitAnswer = async (interviewId, answer) => {
    const response = await api.post(
        `/api/interview/${interviewId}/answer`,
        {
            answer
        }
    );

    return response.data;
};

export const evaluateInterview = async (interviewId) => {
    const response = await api.post(
        `/api/interview/${interviewId}/evaluate`
    );

    return response.data;
};

export const generateOverallResult = async (interviewId) => {
    const response = await api.post(
        `/api/interview/${interviewId}/overall-result`
    );

    return response.data;
};

export const getInterviewDashboard = async (interviewId) => {
    const response = await api.get(
        `/api/interview/${interviewId}/dashboard`
    );

    return response.data;
};

export const getInterviewHistory = async () => {
    const response = await api.get(
        "/api/interview/history"
    );

    return response.data;
};

export const deleteInterview = async (interviewId) => {

    const response = await api.delete(
        `/api/interview/${interviewId}`
    );

    return response.data;
};

export const getInterviewDetails = async (interviewId) => {
    const response = await api.get(
        `/api/interview/${interviewId}/details`
    );

    return response.data;
};
