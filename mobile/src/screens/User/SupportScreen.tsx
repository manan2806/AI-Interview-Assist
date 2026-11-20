
import React, { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const problemTypes = [
    "Interview Issue",
    "Login / Account Issue",
    "Result / Evaluation Issue",
    "Profile Issue",
    "Technical Issue",
    "Other",
];

const faqs = [
    {
        question: "How do I start an interview?",
        answer: "Go to your Dashboard and click Start New Interview. Complete the interview setup and start answering the questions.",
    },
    {
        question: "Can I resume an unfinished interview?",
        answer: "Yes. If your interview is still in progress, you can resume it and continue from your previous question.",
    },
    {
        question: "How is my interview evaluated?",
        answer: "Your answers are evaluated using AI. The result includes your score, strengths, weaknesses and recommendations.",
    },
    {
        question: "Where can I see my previous interviews?",
        answer: "You can view your previous interviews from the Interview History section of your Dashboard.",
    },
    {
        question: "Can I download my interview report?",
        answer: "Yes. After completing an interview, you can download the available interview report from the interview result page.",
    },
    {
        question: "What if I face a technical problem?",
        answer: "Use the Report a Problem option on this Support page and describe the issue you are experiencing.",
    },
];

const SupportScreen = ({ navigation }: any) => {
    const { colors } = useTheme();

    const [showProblemForm, setShowProblemForm] = useState(false);
    const [showFAQModal, setShowFAQModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);

    const [problemType, setProblemType] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const openProblemForm = () => {
        setError("");
        setSuccess("");
        setShowContactModal(false);
        setShowProblemForm(true);
    };

    const closeProblemForm = () => {
        if (loading) return;

        setShowProblemForm(false);
        setShowTypeDropdown(false);
        setProblemType("");
        setSubject("");
        setDescription("");
        setError("");
        setSuccess("");
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

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

            const response = await api.post("/api/support/report", {
                problem_type: problemType,
                subject: subject.trim(),
                description: description.trim(),
            });

            if (response.data?.success === false) {
                setError(
                    response.data?.message ||
                    "Unable to submit problem report."
                );
                return;
            }

            setSuccess(
                response.data?.message ||
                "Problem report submitted successfully."
            );

            setProblemType("");
            setSubject("");
            setDescription("");

            setTimeout(() => {
                setShowProblemForm(false);
                setSuccess("");
            }, 2500);
        } catch (err: any) {
            console.error(
                "Problem Report Error:",
                err?.response?.data || err?.message
            );

            setError(
                err?.response?.data?.message ||
                "Unable to submit problem report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerLabel}>
                        HELP & SUPPORT
                    </Text>

                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        How can we help you?
                    </Text>

                    <Text style={[styles.headerDescription, { color: colors.muted }]}>
                        Find help, report a problem, or contact us
                        if you need assistance with your interview.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.backButton,
                        {
                            backgroundColor: colors.header,
                            borderColor: colors.border,
                        },
                    ]}
                    onPress={() => navigation.navigate("UserDashboard")}
                >
                    <Text style={[styles.backButtonText, { color: colors.primary }]}>
                        ← Dashboard
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SUPPORT OPTIONS */}
            <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardIcon, { backgroundColor: "#FFF1E8" }]}>
                    <Text style={styles.cardEmoji}>🐛</Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Report a Problem
                </Text>

                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                    Something is not working correctly? Let us know
                    what happened and we will look into it.
                </Text>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={openProblemForm}
                >
                    <Text style={styles.buttonText}>
                        Report a Problem
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardIcon, { backgroundColor: "#EEF2FF" }]}>
                    <Text style={styles.cardEmoji}>❓</Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Frequently Asked Questions
                </Text>

                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                    Find answers to common questions about interviews,
                    results, profile and more.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.secondaryButton,
                        { backgroundColor: colors.header, borderColor: colors.border },
                    ]}
                    onPress={() => setShowFAQModal(true)}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                        View FAQs
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cardIcon, { backgroundColor: "#ECFDF5" }]}>
                    <Text style={styles.cardEmoji}>✉️</Text>
                </View>

                <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Contact Support
                </Text>

                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                    Need additional help? Contact our support team
                    and we will assist you.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.secondaryButton,
                        { backgroundColor: colors.header, borderColor: colors.border },
                    ]}
                    onPress={() => setShowContactModal(true)}
                >
                    <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                        Contact Support
                    </Text>
                </TouchableOpacity>
            </View>

            {/* REPORT PROBLEM MODAL */}
            <Modal
                visible={showProblemForm}
                transparent
                animationType="slide"
                onRequestClose={closeProblemForm}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.modalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.headerLabel}>
                                        SUPPORT
                                    </Text>

                                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                                        Report a Problem
                                    </Text>

                                    <Text style={[styles.cardDescription, { color: colors.muted }]}>
                                        Tell us what went wrong.
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    onPress={closeProblemForm}
                                    disabled={loading}
                                >
                                    <Text style={[styles.closeButton, { color: colors.muted }]}>×</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Problem Type
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.dropdownButton,
                                    { backgroundColor: colors.input, borderColor: colors.border },
                                ]}
                                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                                disabled={loading}
                            >
                                <Text style={[
                                    styles.dropdownText,
                                    { color: problemType ? colors.text : colors.muted },
                                ]}>
                                    {problemType || "Select problem type"}
                                </Text>

                                <Text style={[styles.dropdownArrow, { color: colors.muted }]}>
                                    {showTypeDropdown ? "▲" : "▼"}
                                </Text>
                            </TouchableOpacity>

                            {showTypeDropdown && (
                                <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    {problemTypes.map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                                            onPress={() => {
                                                setProblemType(type);
                                                setShowTypeDropdown(false);
                                            }}
                                        >
                                            <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Subject
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
                                ]}
                                value={subject}
                                onChangeText={setSubject}
                                placeholder="Enter a short description"
                                placeholderTextColor={colors.muted}
                                editable={!loading}
                            />

                            <Text style={[styles.inputLabel, { color: colors.text }]}>
                                Describe your problem
                            </Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.textArea,
                                    { backgroundColor: colors.input, borderColor: colors.border, color: colors.text },
                                ]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Please explain what happened..."
                                placeholderTextColor={colors.muted}
                                multiline
                                textAlignVertical="top"
                                numberOfLines={5}
                                editable={!loading}
                            />

                            {!!error && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            {!!success && (
                                <View style={styles.successBox}>
                                    <Text style={styles.successText}>{success}</Text>
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.cancelButton,
                                        { backgroundColor: colors.header, borderColor: colors.border },
                                    ]}
                                    onPress={closeProblemForm}
                                    disabled={loading}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        styles.submitButton,
                                        loading && { opacity: 0.7 },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Send Report</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* FAQ MODAL */}
            <Modal
                visible={showFAQModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFAQModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerLabel}>HELP CENTER</Text>

                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Frequently Asked Questions
                                </Text>

                                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                                    Find answers to common questions.
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => setShowFAQModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.muted }]}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {faqs.map((faq, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.faqItem,
                                        { backgroundColor: colors.input, borderColor: colors.border },
                                    ]}
                                >
                                    <Text style={[styles.faqQuestion, { color: colors.primary }]}>
                                        {faq.question}
                                    </Text>

                                    <Text style={[styles.faqAnswer, { color: colors.muted }]}>
                                        {faq.answer}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* CONTACT SUPPORT MODAL */}
            <Modal
                visible={showContactModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowContactModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.headerLabel}>CONTACT SUPPORT</Text>

                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    Need More Help?
                                </Text>

                                <Text style={[styles.cardDescription, { color: colors.muted }]}>
                                    We're here to help you.
                                </Text>
                            </View>

                            <TouchableOpacity onPress={() => setShowContactModal(false)}>
                                <Text style={[styles.closeButton, { color: colors.muted }]}>×</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.contactIcon}>
                            <Text style={{ fontSize: 38 }}>✉️</Text>
                        </View>

                        <Text style={[styles.contactTitle, { color: colors.text }]}>
                            Contact Our Support Team
                        </Text>

                        <Text style={[styles.cardDescription, { color: colors.muted }]}>
                            If you need additional assistance with your
                            interview, account or technical issues, you
                            can contact our support team.
                        </Text>

                        <View style={[styles.contactInfo, { backgroundColor: colors.input, borderColor: colors.border }]}>
                            <Text style={[styles.contactInfoText, { color: colors.text }]}>
                                📧 Email Support{"\n"}
                                support@aiinterviewassist.com
                            </Text>

                            <Text style={[styles.contactInfoText, { color: colors.text }]}>
                                🛠️ Support For{"\n"}
                                Account, Interview & Technical Issues
                            </Text>

                            <Text style={[styles.contactInfoText, { color: colors.text }]}>
                                ⏱️ Response Time{"\n"}
                                Usually within 24 hours
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.secondaryButton,
                                { backgroundColor: colors.header, borderColor: colors.border },
                            ]}
                            onPress={() => {
                                setShowContactModal(false);
                                setShowFAQModal(true);
                            }}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                                View FAQs
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={openProblemForm}
                        >
                            <Text style={styles.buttonText}>
                                Report a Problem
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 18,
        paddingTop: 33,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 22,
    },
    headerLabel: {
        color: "#6366F1",
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 1,
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "900",
    },
    headerDescription: {
        fontSize: 13,
        lineHeight: 21,
        marginTop: 8,
        marginBottom: 15,
    },
    backButton: {
        alignSelf: "flex-start",
        paddingHorizontal: 120,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    backButtonText: {
        fontWeight: "800",
        fontSize: 13,
    },
    supportCard: {
        borderRadius: 17,
        padding: 19,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#64748B",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 5,
    },
    cardIcon: {
        width: 52,
        height: 52,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 14,
    },
    cardEmoji: {
        fontSize: 26,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 8,
    },
    cardDescription: {
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: "#4F46E5",
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
    secondaryButton: {
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 11,
        alignItems: "center",
        marginBottom: 10,
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontSize: 13,
        fontWeight: "800",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.65)",
        justifyContent: "center",
        padding: 15,
    },
    modalContainer: {
        borderRadius: 20,
        padding: 20,
        maxHeight: "90%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "900",
        marginBottom: 5,
    },
    closeButton: {
        fontSize: 32,
        fontWeight: "400",
        marginLeft: 10,
        lineHeight: 34,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 8,
        marginTop: 13,
    },
    input: {
        borderWidth: 1,
        borderRadius: 11,
        paddingHorizontal: 13,
        paddingVertical: 12,
        fontSize: 14,
    },
    textArea: {
        minHeight: 115,
    },
    dropdownButton: {
        borderWidth: 1,
        borderRadius: 11,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    dropdownText: {
        fontSize: 14,
    },
    dropdownArrow: {
        fontSize: 12,
    },
    dropdownList: {
        borderWidth: 1,
        borderRadius: 11,
        marginTop: 5,
        overflow: "hidden",
    },
    dropdownItem: {
        padding: 13,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 13,
    },
    errorBox: {
        backgroundColor: "#FEF2F2",
        borderRadius: 9,
        padding: 11,
        marginTop: 13,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "600",
    },
    successBox: {
        backgroundColor: "#ECFDF5",
        borderRadius: 9,
        padding: 11,
        marginTop: 13,
    },
    successText: {
        color: "#059669",
        fontSize: 12,
        fontWeight: "600",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20,
        marginBottom: 10,
    },
    cancelButton: {
        flex: 1,
        padding: 13,
        borderRadius: 11,
        alignItems: "center",
        borderWidth: 1,
    },
    cancelButtonText: {
        fontWeight: "800",
    },
    submitButton: {
        flex: 1,
    },
    faqItem: {
        borderRadius: 12,
        padding: 14,
        marginBottom: 11,
        borderWidth: 1,
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 7,
    },
    faqAnswer: {
        fontSize: 13,
        lineHeight: 20,
    },
    contactIcon: {
        alignSelf: "center",
        width: 70,
        height: 70,
        backgroundColor: "#EEF2FF",
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    contactTitle: {
        fontSize: 17,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 9,
    },
    contactInfo: {
        padding: 13,
        borderRadius: 12,
        marginVertical: 12,
        borderWidth: 1,
    },
    contactInfoText: {
        fontSize: 12,
        lineHeight: 20,
        marginVertical: 7,
        fontWeight: "600",
    },
});

export default SupportScreen;
