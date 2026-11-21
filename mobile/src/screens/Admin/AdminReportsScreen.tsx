
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

const REPORTS = [
    {
        id: "users",
        title: "Users Report",
        description: "Export registered users and their profile details.",
        icon: "👥",
        color: "#8B5CF6",
    },
    {
        id: "interviews",
        title: "Interviews Report",
        description: "Export interview status, job role, score, and duration.",
        icon: "📊",
        color: "#3B82F6",
    },
    {
        id: "problem-reports",
        title: "Problem Reports",
        description: "Export reported problems and their current status.",
        icon: "🛠️",
        color: "#F59E0B",
    },
    {
        id: "reviews",
        title: "Reviews Report",
        description: "Export user ratings, comments, and review status.",
        icon: "⭐",
        color: "#10B981",
    },
    {
        id: "activity-logs",
        title: "Activity Logs Report",
        description: "Export user and admin activities, login history, actions, IP addresses, and timestamps.",
        icon: "📜",
        color: "#3B82F6",
    },
];

const FORMATS = [
    { label: "CSV", value: "csv" },
    { label: "PDF", value: "pdf" },
    { label: "Word (.docx)", value: "docx" },
    { label: "Excel (.xlsx)", value: "xlsx" },
];

type ReportId =
    | "users"
    | "interviews"
    | "problem-reports"
    | "reviews"
    | "activity-logs";

type Format = "csv" | "pdf" | "docx" | "xlsx";

const AdminReportsScreen = ({ navigation }: any) => {
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [datesChanged, setDatesChanged] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [startDateValue, setStartDateValue] = useState<Date | null>(null);
    const [endDateValue, setEndDateValue] = useState<Date | null>(null);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };
    const [selectedFormats, setSelectedFormats] = useState<
        Record<ReportId, Format>
    >({
        users: "csv",
        interviews: "csv",
        "problem-reports": "csv",
        reviews: "csv",
        "activity-logs": "csv",
    });

    const [loadingReport, setLoadingReport] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleFormatChange = (reportId: ReportId, format: Format) => {
        setSelectedFormats((previous) => ({
            ...previous,
            [reportId]: format,
        }));

        setMessage("");
        setError("");
    };

    const clearDates = () => {
        setStartDate("");
        setEndDate("");
        setStartDateValue(null);
        setEndDateValue(null);
        setDatesChanged(false);
        setMessage("");
        setError("");
    };

    const validateDate = (value: string) => {
        if (!value) return true;

        return /^\d{4}-\d{2}-\d{2}$/.test(value);
    };

    const getErrorMessage = (err: any) => {
        const data = err?.response?.data;

        if (typeof data === "string") {
            return data;
        }

        if (data?.message) {
            return data.message;
        }

        return err?.message || "Failed to download the report.";
    };

    const convertArrayBufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        let binary = "";

        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, i + chunkSize);
            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    };

    const downloadReport = async (reportType: ReportId) => {
        setMessage("");
        setError("");

        if (!validateDate(startDate) || !validateDate(endDate)) {
            setError("Please enter dates in YYYY-MM-DD format.");
            return;
        }

        if (startDate && endDate && startDate > endDate) {
            setError("The start date cannot be later than the end date.");
            return;
        }

        try {
            setLoadingReport(reportType);

            const selectedFormat = selectedFormats[reportType];

            const params: Record<string, string> = {
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
                    responseType: "arraybuffer",
                }
            );

            const base64Data = convertArrayBufferToBase64(
                response.data as ArrayBuffer
            );

            const fileName = `${reportType}-report.${selectedFormat}`;

            const mimeTypes: Record<Format, string> = {
                csv: "text/csv",
                pdf: "application/pdf",
                docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            };

            if (!FileSystem.cacheDirectory) {
                throw new Error("Device storage is not available.");
            }

            const fileUri = FileSystem.cacheDirectory + fileName;

            await FileSystem.writeAsStringAsync(
                fileUri,
                base64Data,
                {
                    encoding: FileSystem.EncodingType.Base64,
                }
            );

            const canShare = await Sharing.isAvailableAsync();

            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: mimeTypes[selectedFormat],
                    dialogTitle: `Share ${fileName}`,
                    UTI:
                        selectedFormat === "pdf"
                            ? "com.adobe.pdf"
                            : undefined,
                });
            } else {
                Alert.alert(
                    "Report Saved",
                    `Report saved at:\n${fileUri}`
                );
            }

            const reportTitle = REPORTS.find(
                (report) => report.id === reportType
            )?.title;

            setMessage(
                `${reportTitle} (${selectedFormat.toUpperCase()}) is ready to share.`
            );

        } catch (err: any) {
            setError(getErrorMessage(err));
        } finally {
            setLoadingReport("");
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        content: {
            padding: 16,
            paddingTop: 30,
            paddingBottom: 35,
        },
        header: {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            padding: 18,
            marginBottom: 18,
        },
        eyebrow: {
            color: colors.primary,
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.3,
        },
        title: {
            fontSize: 25,
            fontWeight: "800",
            color: colors.text,
            marginTop: 7,
        },
        subtitle: {
            fontSize: 13,
            color: colors.muted,
            lineHeight: 20,
            marginTop: 7,
        },
        backButton: {
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
        },
        backButtonText: {
            fontSize: 14,
            fontWeight: "700",
            textAlign: "center",
        },
        section: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 18,
        },
        sectionTitle: {
            color: colors.text,
            fontSize: 17,
            fontWeight: "800",
        },
        sectionSubtitle: {
            color: colors.muted,
            fontSize: 12,
            lineHeight: 18,
            marginTop: 5,
            marginBottom: 16,
        },
        fieldLabel: {
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            marginBottom: 7,
        },
        input: {
            backgroundColor: colors.input,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: colors.text,
            fontSize: 14,
            marginBottom: 14,
        },
        clearButton: {
            alignSelf: "flex-start",
            paddingVertical: 9,
            paddingHorizontal: 13,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 9,
        },
        clearText: {
            color: colors.text,
            fontSize: 12,
            fontWeight: "700",
        },
        message: {
            padding: 13,
            borderRadius: 10,
            marginBottom: 14,
            backgroundColor: isDark ? "#064E3B" : "#DCFCE7",
        },
        messageText: {
            color: isDark ? "#A7F3D0" : "#166534",
            fontSize: 13,
            fontWeight: "600",
        },
        errorBox: {
            padding: 13,
            borderRadius: 10,
            marginBottom: 14,
            backgroundColor: isDark ? "#451A1A" : "#FEE2E2",
        },
        errorText: {
            color: isDark ? "#FCA5A5" : "#991B1B",
            fontSize: 13,
            fontWeight: "600",
        },
        reportHeading: {
            color: colors.text,
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 5,
        },
        reportSubtitle: {
            color: colors.muted,
            fontSize: 12,
            lineHeight: 19,
            marginBottom: 15,
        },
        count: {
            color: colors.primary,
            fontSize: 12,
            fontWeight: "800",
            marginBottom: 14,
        },
        reportCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 14,
        },
        cardTop: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 13,
        },
        reportIcon: {
            width: 48,
            height: 48,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
        },
        iconText: {
            fontSize: 25,
        },
        formatLabel: {
            color: colors.muted,
            fontSize: 11,
            fontWeight: "700",
            marginBottom: 4,
        },
        pickerContainer: {
            width: 145,
            height: 45,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.input,
            overflow: "hidden",
            justifyContent: "center",
        },
        picker: {
            width: "100%",
            height: 50,
            color: colors.text,
        },
        reportTitle: {
            fontSize: 17,
            fontWeight: "800",
            color: colors.text,
            marginBottom: 7,
        },
        reportDescription: {
            fontSize: 12,
            lineHeight: 19,
            color: colors.muted,
            marginBottom: 16,
        },
        downloadButton: {
            backgroundColor: colors.primary,
            borderRadius: 10,
            paddingVertical: 13,
            alignItems: "center",
            justifyContent: "center",
        },
        downloadButtonDisabled: {
            opacity: 0.55,
        },
        downloadText: {
            color: "#FFFFFF",
            fontWeight: "800",
            fontSize: 13,
        },
        note: {
            padding: 14,
            borderRadius: 12,
            backgroundColor: colors.header,
            borderWidth: 1,
            borderColor: colors.border,
        },
        noteText: {
            color: colors.text,
            fontSize: 12,
            lineHeight: 19,
        },
    });

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.eyebrow}>ADMINISTRATION</Text>

                    <Text style={styles.title}>Reports Center</Text>

                    <Text style={styles.subtitle}>
                        Download project reports in CSV, PDF, Word or Excel format.
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.backButton,
                            { backgroundColor: colors.header },
                        ]}
                        onPress={() => navigation.navigate("AdminDashboard")}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.backButtonText,
                                { color: colors.primary },
                            ]}
                        >
                            ← Dashboard
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* DATE FILTER */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 Date Range</Text>

                    <Text style={styles.sectionSubtitle}>
                        Select a start date and end date using the calendar.
                    </Text>

                    {/* START DATE */}

                    <Text style={styles.fieldLabel}>Start Date</Text>

                    <TouchableOpacity
                        style={[
                            styles.input,
                            {
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 14,
                            },
                        ]}
                        onPress={() => setShowStartPicker(true)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={{
                                color: startDate ? colors.text : colors.muted,
                                fontSize: 14,
                            }}
                        >
                            {startDate || "Select Start Date"}
                        </Text>

                        <Text style={{ fontSize: 18 }}>📅</Text>
                    </TouchableOpacity>

                    {showStartPicker && (
                        <DateTimePicker
                            value={startDateValue || endDateValue || new Date()}
                            mode="date"
                            display="default"
                            maximumDate={endDateValue || undefined}
                            onChange={(event, selectedDate) => {
                                setShowStartPicker(false);

                                if (event.type === "set" && selectedDate) {
                                    setStartDateValue(selectedDate);
                                    setStartDate(formatDate(selectedDate));
                                    setDatesChanged(true);
                                    setMessage("");
                                    setError("");
                                }
                            }}
                        />
                    )}

                    {/* END DATE */}

                    <Text style={styles.fieldLabel}>End Date</Text>

                    <TouchableOpacity
                        style={[
                            styles.input,
                            {
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 14,
                            },
                        ]}
                        onPress={() => setShowEndPicker(true)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={{
                                color: endDate ? colors.text : colors.muted,
                                fontSize: 14,
                            }}
                        >
                            {endDate || "Select End Date"}
                        </Text>

                        <Text style={{ fontSize: 18 }}>📅</Text>
                    </TouchableOpacity>

                    {showEndPicker && (
                        <DateTimePicker
                            value={endDateValue || startDateValue || new Date()}
                            mode="date"
                            display="default"
                            minimumDate={startDateValue || undefined}
                            onChange={(event, selectedDate) => {
                                setShowEndPicker(false);

                                if (event.type === "set" && selectedDate) {
                                    setEndDateValue(selectedDate);
                                    setEndDate(formatDate(selectedDate));
                                    setDatesChanged(true);
                                    setMessage("");
                                    setError("");
                                }
                            }}
                        />
                    )}

                    {/* CLEAR DATES */}
                    {(startDate || endDate) && (
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearDates}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.clearText}>
                                ✕ Clear Dates
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* STATUS MESSAGES */}

                {message !== "" && (
                    <View style={styles.message}>
                        <Text style={styles.messageText}>
                            ✓ {message}
                        </Text>
                    </View>
                )}

                {error !== "" && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            ! {error}
                        </Text>
                    </View>
                )}

                {/* REPORTS */}

                <Text style={styles.reportHeading}>
                    Available Reports
                </Text>

                <Text style={styles.reportSubtitle}>
                    Select a report and choose your preferred download format.
                </Text>

                <Text style={styles.count}>
                    {REPORTS.length} Reports
                </Text>

                {REPORTS.map((report) => {
                    const reportId = report.id as ReportId;
                    const selectedFormat = selectedFormats[reportId];
                    const isLoading = loadingReport === report.id;
                    const isDisabled = Boolean(loadingReport);

                    return (
                        <View
                            key={report.id}
                            style={styles.reportCard}
                        >
                            <View style={styles.cardTop}>
                                <View
                                    style={[
                                        styles.reportIcon,
                                        {
                                            backgroundColor: report.color + "20",
                                        },
                                    ]}
                                >
                                    <Text style={styles.iconText}>
                                        {report.icon}
                                    </Text>
                                </View>

                                <View>
                                    <Text style={styles.formatLabel}>
                                        Export Format
                                    </Text>

                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={selectedFormat}
                                            onValueChange={(value) =>
                                                handleFormatChange(
                                                    reportId,
                                                    value as Format
                                                )
                                            }
                                            mode="dropdown"
                                            enabled={!isDisabled}
                                            dropdownIconColor={colors.text}
                                            style={styles.picker}
                                        >
                                            {FORMATS.map((format) => (
                                                <Picker.Item
                                                    key={format.value}
                                                    label={format.label}
                                                    value={format.value}
                                                    color={isDark ? "#FFFFFF" : "#1E293B"}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <Text style={styles.reportTitle}>
                                {report.title}
                            </Text>

                            <Text style={styles.reportDescription}>
                                {report.description}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.downloadButton,
                                    isDisabled && styles.downloadButtonDisabled,
                                ]}
                                disabled={isDisabled}
                                onPress={() => downloadReport(reportId)}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.downloadText}>
                                        ↓ Download {selectedFormat.toUpperCase()}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* INFORMATION NOTE */}

                <View style={styles.note}>
                    <Text style={styles.noteText}>
                        ℹ️ Note: CSV files can be opened in Microsoft Excel.
                        Date filtering depends on the date field configured
                        in the backend. Downloaded reports can be shared
                        or saved using your device's sharing options.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default AdminReportsScreen;
