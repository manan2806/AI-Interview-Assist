import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import {
    createInterview,
    generateQuestions,
} from "../../services/interviewService";
import { useAuth } from "../../context/AuthContext";

const interviewFields = [
    "Software Engineering",
    "Data Science",
    "Artificial Intelligence",
    "Cybersecurity",
    "Cloud Computing",
    "Information Technology",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering",
    "Chemical Engineering",
    "Electronics & Communication",
    "Nursing",
    "Medical & Healthcare",
    "Pharmacy",
    "Finance & Accounting",
    "Banking",
    "Marketing & Sales",
    "Human Resources",
    "Business & Management",
    "Education & Teaching",
    "Other",
];

const experienceOptions = [
    "Fresher",
    "Junior",
    "Mid Level",
    "Senior",
];

const interviewTypes = [
    "Technical",
    "HR",
    "Mixed",
];

const difficultyOptions = [
    "Easy",
    "Medium",
    "Hard",
];

const questionOptions = [5, 10, 15, 20];

const durationOptions = [
    "No Limit",
    "10 Minutes",
    "20 Minutes",
    "30 Minutes",
    "Custom",
];

const InterviewSetupScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const styles = createStyles(colors, isDark);

    const [field, setField] = useState("");
    const [fieldDropdownOpen, setFieldDropdownOpen] = useState(false);
    const [targetRole, setTargetRole] = useState(
        user?.target_role || ""
    );

    const [experienceLevel, setExperienceLevel] = useState(
        user?.experience_level || "Fresher"
    );

    const [interviewType, setInterviewType] = useState("Mixed");
    const [difficulty, setDifficulty] = useState("Medium");
    const [questionCount, setQuestionCount] = useState(10);

    const [duration, setDuration] = useState("No Limit");
    const [customDuration, setCustomDuration] = useState("");
    const [customDurationApplied, setCustomDurationApplied] =
        useState(false);

    const [loadingSettings, setLoadingSettings] = useState(true);
    const [startingInterview, setStartingInterview] = useState(false);

    // LOAD SAVED INTERVIEW SETTINGS
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get("/api/settings");

                const settings =
                    response.data?.settings || response.data;

                if (settings?.interview_type) {
                    setInterviewType(settings.interview_type);
                }

                if (settings?.difficulty) {
                    setDifficulty(settings.difficulty);
                }

                if (settings?.number_of_questions) {
                    setQuestionCount(
                        Number(settings.number_of_questions)
                    );
                }
            } catch (error: any) {
                console.error(
                    "Settings loading error:",
                    error?.response?.data || error?.message
                );
            } finally {
                setLoadingSettings(false);
            }
        };

        loadSettings();
    }, []);

    // SELECT OPTION
    const OptionButton = ({
        label,
        selected,
        onPress,
    }: {
        label: string;
        selected: boolean;
        onPress: () => void;
    }) => (
        <TouchableOpacity
            style={[
                styles.optionButton,
                selected && styles.optionButtonSelected,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text
                style={[
                    styles.optionText,
                    selected && styles.optionTextSelected,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );

    // START INTERVIEW
    const handleStartInterview = async () => {
        if (!field.trim()) {
            Alert.alert(
                "Required Field",
                "Please select your interview field."
            );
            return;
        }

        if (!targetRole.trim()) {
            Alert.alert(
                "Required Field",
                "Please enter your target job role."
            );
            return;
        }

        if (duration === "Custom") {
            const minutes = Number(customDuration);

            if (
                !customDuration.trim() ||
                !Number.isInteger(minutes) ||
                minutes < 3 ||
                minutes > 60
            ) {
                Alert.alert(
                    "Invalid Duration",
                    "Custom duration must be between 3 and 60 minutes."
                );
                return;
            }

            if (!customDurationApplied) {
                Alert.alert(
                    "Apply Duration",
                    "Please apply your custom duration before starting."
                );
                return;
            }
        }

        try {
            setStartingInterview(true);

            const interviewData = {
                job_role: targetRole.trim(),
                experience_level: experienceLevel,
                interview_type: interviewType,
                difficulty: difficulty,
                number_of_questions: Number(questionCount),
                duration: duration,
                custom_duration:
                    duration === "Custom"
                        ? Number(customDuration)
                        : null,
            };

            // CREATE INTERVIEW
            const created = await createInterview(interviewData);

            const interviewId =
                created?.interview_id ||
                created?.interview?.interview_id ||
                created?.data?.interview_id;

            if (!interviewId) {
                throw new Error(
                    created?.message ||
                    "Interview ID was not returned by the server."
                );
            }

            // GENERATE INTERVIEW QUESTIONS
            // GENERATE INTERVIEW QUESTIONS
            const questionResponse = await generateQuestions(interviewId);

            if (!questionResponse?.success) {
                throw new Error(
                    questionResponse?.message ||
                    "Unable to generate interview questions."
                );
            }

            // NAVIGATE TO INTERVIEW SESSION
            navigation.navigate("InterviewSession", {
                interviewId: interviewId,
                setup: {
                    field: field,
                    target_role: targetRole.trim(),
                    job_role: targetRole.trim(),
                    experience_level: experienceLevel,
                    interview_type: interviewType,
                    difficulty: difficulty,
                    number_of_questions: Number(questionCount),
                    duration: duration,
                    custom_duration:
                        duration === "Custom"
                            ? Number(customDuration)
                            : null,
                },
            });
        } catch (error: any) {
            console.error(
                "Interview setup error:",
                error?.response?.data || error?.message
            );

            Alert.alert(
                "Interview Setup Failed",
                error?.response?.data?.message ||
                error?.message ||
                "Unable to create your interview. Please try again."
            );
        } finally {
            setStartingInterview(false);
        }
    };

    if (loadingSettings) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator
                    size="large"
                    color="#4F46E5"
                />

                <Text style={styles.loaderText}>
                    Loading interview preferences...
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* HEADER */}
            {/* HEADER CONTAINER */}
            <View style={styles.header}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>
                        Interview Setup
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Customize your AI mock interview
                    </Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.backButtonText}>
                            ← DashBoard
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* INTRO CARD */}
            <View style={styles.introCard}>
                <View style={styles.introIconContainer}>
                    <Text style={styles.introIcon}>🎯</Text>
                </View>

                <Text style={styles.introTitle}>
                    Prepare for Your Next Interview
                </Text>

                <Text style={styles.introDescription}>
                    Choose your preferences and let AI generate
                    interview questions based on your career goals.
                </Text>
            </View>

            {/* INTERVIEW FIELD */}
            {/* INTERVIEW FIELD DROPDOWN */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Interview Field
                    <Text style={styles.required}> *</Text>
                </Text>

                <Text style={styles.sectionDescription}>
                    Select the field you want to practice.
                </Text>

                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setFieldDropdownOpen(true)}
                    activeOpacity={0.8}
                >
                    <Text
                        style={[
                            styles.dropdownText,
                            !field && styles.dropdownPlaceholder,
                        ]}
                    >
                        {field || "Select Interview Field"}
                    </Text>

                    <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
            </View>

            {/* FIELD DROPDOWN MODAL */}
            <Modal
                visible={fieldDropdownOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setFieldDropdownOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dropdownModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                Select Interview Field
                            </Text>

                            <TouchableOpacity
                                onPress={() => setFieldDropdownOpen(false)}
                            >
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.dropdownList}
                            showsVerticalScrollIndicator={false}
                        >
                            {interviewFields.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.dropdownOption,
                                        field === item &&
                                        styles.dropdownOptionSelected,
                                    ]}
                                    onPress={() => {
                                        setField(item);
                                        setFieldDropdownOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownOptionText,
                                            field === item &&
                                            styles.dropdownOptionTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>

                                    {field === item && (
                                        <Text style={styles.dropdownCheck}>
                                            ✓
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* TARGET ROLE */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Target Job Role
                    <Text style={styles.required}> *</Text>
                </Text>

                <Text style={styles.sectionDescription}>
                    Enter the position you are preparing for.
                </Text>

                <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Python Developer"
                    placeholderTextColor="#94A3B8"
                    value={targetRole}
                    onChangeText={setTargetRole}
                    autoCapitalize="words"
                />
            </View>

            {/* EXPERIENCE LEVEL */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Experience Level
                </Text>

                <View style={styles.optionsContainer}>
                    {experienceOptions.map((item) => (
                        <OptionButton
                            key={item}
                            label={item}
                            selected={experienceLevel === item}
                            onPress={() => setExperienceLevel(item)}
                        />
                    ))}
                </View>
            </View>

            {/* INTERVIEW TYPE */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Interview Type
                </Text>

                <Text style={styles.sectionDescription}>
                    Choose the type of interview you want.
                </Text>

                <View style={styles.optionsContainer}>
                    {interviewTypes.map((item) => (
                        <OptionButton
                            key={item}
                            label={item}
                            selected={interviewType === item}
                            onPress={() => setInterviewType(item)}
                        />
                    ))}
                </View>
            </View>

            {/* DIFFICULTY */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Difficulty Level
                </Text>

                <View style={styles.optionsContainer}>
                    {difficultyOptions.map((item) => (
                        <OptionButton
                            key={item}
                            label={item}
                            selected={difficulty === item}
                            onPress={() => setDifficulty(item)}
                        />
                    ))}
                </View>
            </View>

            {/* QUESTION COUNT */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Number of Questions
                </Text>

                <Text style={styles.sectionDescription}>
                    Select how many questions you want to answer.
                </Text>

                <View style={styles.optionsContainer}>
                    {questionOptions.map((item) => (
                        <OptionButton
                            key={item}
                            label={`${item} Questions`}
                            selected={questionCount === item}
                            onPress={() => setQuestionCount(item)}
                        />
                    ))}
                </View>
            </View>

            {/* DURATION */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>
                    Interview Duration
                </Text>

                <View style={styles.optionsContainer}>
                    {durationOptions.map((item) => (
                        <OptionButton
                            key={item}
                            label={item}
                            selected={duration === item}
                            onPress={() => {
                                setDuration(item);
                                setCustomDurationApplied(false);
                            }}
                        />
                    ))}
                </View>

                {duration === "Custom" && (
                    <View style={styles.customDurationContainer}>
                        <Text style={styles.customDurationLabel}>
                            Custom Duration (3–60 minutes)
                        </Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter minutes"
                            placeholderTextColor="#94A3B8"
                            value={customDuration}
                            onChangeText={(value) => {
                                setCustomDuration(value);
                                setCustomDurationApplied(false);
                            }}
                            keyboardType="number-pad"
                            maxLength={2}
                        />

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => {
                                const minutes = Number(customDuration);

                                if (
                                    !customDuration.trim() ||
                                    !Number.isInteger(minutes) ||
                                    minutes < 3 ||
                                    minutes > 60
                                ) {
                                    Alert.alert(
                                        "Invalid Duration",
                                        "Enter a duration between 3 and 60 minutes."
                                    );
                                    return;
                                }

                                setCustomDurationApplied(true);

                                Alert.alert(
                                    "Duration Applied",
                                    `${minutes} minutes has been applied.`
                                );
                            }}
                        >
                            <Text style={styles.applyButtonText}>
                                Apply Duration
                            </Text>
                        </TouchableOpacity>

                        {customDurationApplied && (
                            <Text style={styles.appliedText}>
                                ✓ {customDuration} minutes applied
                            </Text>
                        )}
                    </View>
                )}
            </View>

            {/* INTERVIEW SUMMARY */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>
                    📋 Interview Summary
                </Text>

                <SummaryRow
                    label="Field"
                    value={field || "Not selected"}
                    styles={styles}
                />

                <SummaryRow
                    label="Target Role"
                    value={targetRole || "Not entered"}
                    styles={styles}
                />

                <SummaryRow
                    label="Experience"
                    value={experienceLevel}
                    styles={styles}
                />

                <SummaryRow
                    label="Interview Type"
                    value={interviewType}
                    styles={styles}
                />

                <SummaryRow
                    label="Difficulty"
                    value={difficulty}
                    styles={styles}
                />

                <SummaryRow
                    label="Questions"
                    value={`${questionCount}`}
                    styles={styles}
                />

                <SummaryRow
                    label="Duration"
                    value={
                        duration === "Custom"
                            ? customDurationApplied
                                ? `${customDuration} Minutes`
                                : "Custom (Not Applied)"
                            : duration
                    }
                    styles={styles}
                />
            </View>

            {/* ACTION BUTTONS */}
            <TouchableOpacity
                style={[
                    styles.startButton,
                    startingInterview && styles.disabledButton,
                ]}
                onPress={handleStartInterview}
                disabled={startingInterview}
                activeOpacity={0.85}
            >
                {startingInterview ? (
                    <>
                        <ActivityIndicator color="#FFFFFF" />

                        <Text style={styles.startButtonText}>
                            Creating Interview...
                        </Text>
                    </>
                ) : (
                    <Text style={styles.startButtonText}>
                        🚀 Start Interview
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate("UserDashboard")}
                disabled={startingInterview}
            >
                <Text style={styles.cancelButtonText}>
                    Cancel
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

// SUMMARY ROW
const SummaryRow = ({
    label,
    value,
    styles,
}: {
    label: string;
    value: string;
    styles: any;
}) => (
    <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>
            {label}
        </Text>

        <Text style={styles.summaryValue}>
            {value}
        </Text>
    </View>
);

const createStyles = (colors: any, isDark: boolean) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        content: {
            padding: 18,
            paddingTop: 35,
            paddingBottom: 45,
        },

        loader: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
        },

        loaderText: {
            color: colors.muted,
            marginTop: 12,
            fontSize: 13,
        },

        header: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 20,
            padding: 18,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
            elevation: 2,
        },

        backButton: {
            alignSelf: "flex-start",
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            marginTop: 10,
            paddingHorizontal: 100,
            paddingVertical: 9,
            borderRadius: 10,
            marginBottom: 2,
        },
        backButtonText: {
            color: isDark ? "#D6C5FF" : "#554BD7",
            fontSize: 13,
            fontWeight: "800",
        },

        headerTextContainer: {
            width: "100%",
        },

        headerTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 24,
            fontWeight: "900",
        },

        headerSubtitle: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            marginTop: 6,
        },

        introCard: {
            backgroundColor: isDark ? colors.card : "#FFFFFF",
            borderRadius: 18,
            padding: 20,
            marginBottom: 18,
            alignItems: "center",
            borderWidth: 1,
            borderColor: isDark ? colors.border : "#E8E7FF",
            elevation: 2,
        },
        introIconContainer: {
            width: 58,
            height: 58,
            borderRadius: 16,
            backgroundColor: isDark ? "#30264F" : "#EAE8FF",
            borderWidth: 1,
            borderColor: isDark ? "#59458A" : "#D5CEFF",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
        },

        introIcon: {
            fontSize: 27,
        },

        introTitle: {
            color: isDark ? colors.text : "#252943",
            fontSize: 19,
            fontWeight: "900",
            textAlign: "center",
            marginBottom: 9,
        },

        introDescription: {
            color: isDark ? colors.muted : "#777C90",
            fontSize: 13,
            lineHeight: 21,
            textAlign: "center",
        },
        sectionCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 15,
            borderWidth: 1,
            borderColor: colors.border,
        },

        sectionTitle: {
            fontSize: 15,
            fontWeight: "800",
            color: colors.text,
        },

        required: {
            color: "#EF4444",
        },

        sectionDescription: {
            color: colors.muted,
            fontSize: 11,
            marginTop: 6,
            marginBottom: 13,
        },

        // FIELD DROPDOWN
        dropdownButton: {
            minHeight: 52,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.input,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 12,
        },

        dropdownText: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "600",
            flex: 1,
        },

        dropdownPlaceholder: {
            color: colors.muted,
            fontWeight: "400",
        },

        dropdownArrow: {
            fontSize: 13,
            color: colors.primary,
            fontWeight: "800",
            textAlign: "center",
            textAlignVertical: "center",
            marginLeft: 10,
        },

        // DROPDOWN MODAL
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            justifyContent: "center",
            padding: 22,
        },

        dropdownModal: {
            backgroundColor: colors.card,
            borderRadius: 18,
            maxHeight: "75%",
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },

        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },

        modalTitle: {
            fontSize: 17,
            fontWeight: "800",
            color: colors.text,
            flex: 1,
        },

        modalClose: {
            fontSize: 19,
            color: colors.muted,
            padding: 5,
        },

        dropdownList: {
            marginTop: 8,
        },

        dropdownOption: {
            minHeight: 48,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },

        dropdownOptionSelected: {
            backgroundColor: isDark ? "#302D55" : "#EEF2FF",
            borderRadius: 9,
        },

        dropdownOptionText: {
            fontSize: 13,
            color: colors.text,
            fontWeight: "500",
            flex: 1,
        },

        dropdownOptionTextSelected: {
            color: isDark ? "#A5B4FC" : "#4338CA",
            fontWeight: "800",
        },

        dropdownCheck: {
            color: isDark ? "#A5B4FC" : "#4F46E5",
            fontSize: 18,
            fontWeight: "900",
            marginLeft: 8,
        },

        // OPTION BUTTONS
        optionsContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 9,
            marginTop: 13,
        },

        optionButton: {
            paddingHorizontal: 13,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: isDark ? "#263449" : "#F8FAFC",
            borderWidth: 1,
            borderColor: colors.border,
        },

        optionButtonSelected: {
            backgroundColor: isDark ? "#302D55" : "#EEF2FF",
            borderColor: colors.primary,
        },

        optionText: {
            color: colors.text,
            fontSize: 12,
            fontWeight: "600",
        },

        optionTextSelected: {
            color: isDark ? "#A5B4FC" : "#4338CA",
            fontWeight: "800",
        },

        // INPUT
        textInput: {
            minHeight: 49,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            color: colors.text,
            fontSize: 14,
            backgroundColor: colors.input,
            marginTop: 12,
        },

        // CUSTOM DURATION
        customDurationContainer: {
            marginTop: 18,
        },

        customDurationLabel: {
            fontSize: 12,
            fontWeight: "700",
            color: colors.text,
        },

        applyButton: {
            backgroundColor: isDark ? "#302D55" : "#EEF2FF",
            padding: 12,
            borderRadius: 10,
            alignItems: "center",
            marginTop: 11,
            borderWidth: 1,
            borderColor: isDark ? "#4F46A5" : "#C7D2FE",
        },

        applyButtonText: {
            color: isDark ? "#A5B4FC" : "#4338CA",
            fontWeight: "800",
            fontSize: 13,
        },

        appliedText: {
            color: isDark ? "#34D399" : "#059669",
            fontWeight: "700",
            fontSize: 12,
            marginTop: 10,
        },

        // SUMMARY
        summaryCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 17,
            marginTop: 5,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
        },

        summaryTitle: {
            fontSize: 16,
            fontWeight: "900",
            color: colors.text,
            marginBottom: 14,
        },

        summaryRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 12,
        },

        summaryLabel: {
            color: colors.muted,
            fontSize: 12,
            flex: 1,
        },

        summaryValue: {
            color: colors.text,
            fontSize: 12,
            fontWeight: "700",
            flex: 1,
            textAlign: "right",
        },

        // ACTION BUTTONS
        startButton: {
            minHeight: 53,
            borderRadius: 13,
            backgroundColor: colors.primary,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            elevation: 3,
        },

        startButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "900",
        },

        disabledButton: {
            opacity: 0.65,
        },

        cancelButton: {
            minHeight: 48,
            borderRadius: 13,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 11,
        },

        cancelButtonText: {
            color: colors.text,
            fontSize: 14,
            fontWeight: "700",
        },
    });

export default InterviewSetupScreen;