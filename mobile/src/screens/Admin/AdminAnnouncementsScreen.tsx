
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

interface Announcement {
    id: string | number;
    announcement_code?: string;
    title?: string;
    message?: string;
    type?: string;
    status?: string;
    publish_at?: string | null;
    created_at?: string;
}

interface AnnouncementForm {
    title: string;
    message: string;
    type: string;
    status: string;
    publish_at: string;
}

const EMPTY_FORM: AnnouncementForm = {
    title: "",
    message: "",
    type: "general",
    status: "draft",
    publish_at: "",
};

const TYPES = [
    { value: "general", label: "General" },
    { value: "feature", label: "New Feature" },
    { value: "maintenance", label: "Maintenance" },
    { value: "important", label: "Important" },
];

const STATUSES = [
    { value: "draft", label: "Save as draft" },
    { value: "published", label: "Publish now" },
    { value: "scheduled", label: "Schedule for later" },
];

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalDateTime = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return (
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`
    );
};

const formatDate = (value?: string | null) => {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getPickerDate = (value: string) => {
    if (!value) return new Date();

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const AdminAnnouncementsScreen = () => {
    const navigation = useNavigation<any>();
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState<AnnouncementForm>(EMPTY_FORM);

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [datePickerValue, setDatePickerValue] = useState(new Date());

    const loadAnnouncements = useCallback(async (refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/api/admin/announcements");

            setAnnouncements(response.data.announcements || []);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to load announcements. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    const updateField = (key: keyof AnnouncementForm, value: string) => {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormOpen(false);
        setShowDatePicker(false);
        setShowTimePicker(false);
    };

    const openCreateForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setError("");
        setNotice("");
        setFormOpen(true);
    };

    const startEditing = (item: Announcement) => {
        setEditingId(item.id);

        setForm({
            title: item.title || "",
            message: item.message || "",
            type: item.type || "general",
            status: item.status || "draft",
            publish_at: toLocalDateTime(item.publish_at),
        });

        setError("");
        setNotice("");
        setFormOpen(true);
    };

    const openDatePicker = () => {
        setDatePickerValue(getPickerDate(form.publish_at));
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);

        if (event.type !== "set" || !selectedDate) return;

        setDatePickerValue(selectedDate);

        const current = form.publish_at
            ? getPickerDate(form.publish_at)
            : new Date();

        const updated = new Date(selectedDate);
        updated.setHours(current.getHours(), current.getMinutes(), 0, 0);

        setForm((previous) => ({
            ...previous,
            publish_at: toLocalDateTime(updated.toISOString()),
        }));
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);

        if (event.type !== "set" || !selectedTime) return;

        const current = form.publish_at
            ? getPickerDate(form.publish_at)
            : new Date();

        current.setHours(
            selectedTime.getHours(),
            selectedTime.getMinutes(),
            0,
            0
        );

        setForm((previous) => ({
            ...previous,
            publish_at: toLocalDateTime(current.toISOString()),
        }));
    };

    const handleSubmit = async () => {
        const title = form.title.trim();
        const message = form.message.trim();

        if (!title || !message) {
            setError("Please enter both announcement title and message.");
            return;
        }

        if (title.length > 150) {
            setError("Announcement title cannot exceed 150 characters.");
            return;
        }

        if (message.length > 5000) {
            setError("Message cannot exceed 5000 characters.");
            return;
        }

        if (form.status === "scheduled") {
            if (!form.publish_at) {
                setError("Please select a publishing date and time.");
                return;
            }

            const scheduledDate = new Date(form.publish_at);

            if (
                Number.isNaN(scheduledDate.getTime()) ||
                scheduledDate.getTime() <= Date.now()
            ) {
                setError("Please select a future date and time.");
                return;
            }
        }

        setSaving(true);
        setNotice("");
        setError("");

        const payload = {
            title,
            message,
            type: form.type,
            status: form.status,
            publish_at: form.publish_at
                ? new Date(form.publish_at).toISOString()
                : null,
        };

        try {
            if (editingId !== null) {
                await api.put(
                    `/api/admin/announcements/${editingId}`,
                    payload
                );

                setNotice("Announcement updated successfully.");
            } else {
                await api.post("/api/admin/announcements", payload);

                setNotice("Announcement created successfully.");
            }

            resetForm();
            await loadAnnouncements();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Unable to save announcement. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (item: Announcement) => {
        Alert.alert(
            "Delete Announcement",
            `Delete "${item.title}"? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setNotice("");
                        setError("");

                        try {
                            await api.delete(
                                `/api/admin/announcements/${item.id}`
                            );

                            if (editingId === item.id) {
                                resetForm();
                            }

                            setNotice("Announcement deleted successfully.");
                            await loadAnnouncements(true);
                        } catch (err: any) {
                            setError(
                                err.response?.data?.message ||
                                "Unable to delete announcement."
                            );
                        }
                    },
                },
            ]
        );
    };

    const filteredAnnouncements = useMemo(() => {
        const query = search.trim().toLowerCase();

        return announcements.filter((item) => {
            const matchesSearch =
                !query ||
                (item.title || "").toLowerCase().includes(query) ||
                (item.message || "").toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "all" || item.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [announcements, search, statusFilter]);

    const publishedCount = announcements.filter(
        (item) => item.status === "published"
    ).length;

    const scheduledCount = announcements.filter(
        (item) => item.status === "scheduled"
    ).length;

    const draftCount = announcements.filter(
        (item) => item.status === "draft"
    ).length;

    const getTypeLabel = (type?: string) => {
        return TYPES.find((item) => item.value === type)?.label || type || "General";
    };

    const getTypeColor = (type?: string) => {
        switch (type) {
            case "feature":
                return "#2563EB";
            case "maintenance":
                return "#D97706";
            case "important":
                return "#DC2626";
            default:
                return "#7C3AED";
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "published":
                return "#16A34A";
            case "scheduled":
                return "#2563EB";
            case "draft":
                return "#D97706";
            default:
                return colors.muted;
        }
    };

    const renderPicker = (
        label: string,
        value: string,
        options: { label: string; value: string }[],
        onChange: (value: string) => void
    ) => (
        <View style={styles.formGroup}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {label}
            </Text>

            <View
                style={[
                    styles.pickerContainer,
                    {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                    },
                ]}
            >
                <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    dropdownIconColor={colors.text}
                    style={{ color: colors.text }}
                >
                    {options.map((option) => (
                        <Picker.Item
                            key={option.value}
                            label={option.label}
                            value={option.value}
                        />
                    ))}
                </Picker>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadAnnouncements(true)}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.content}>
                    {/* Header */}
                    <View
                        style={[
                            styles.headerCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={[styles.eyebrow, { color: colors.primary }]}>
                            COMMUNICATION CENTER
                        </Text>

                        <Text style={[styles.title, { color: colors.text }]}>
                            Announcements & Notifications
                        </Text>

                        <Text style={[styles.subtitle, { color: colors.muted }]}>
                            Keep users informed about updates, new features and maintenance.
                        </Text>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={[
                                    styles.headerActionButton,
                                    {
                                        backgroundColor: colors.header,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => loadAnnouncements(true)}
                                disabled={loading || refreshing}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.headerActionText, { color: colors.primary }]}>
                                    ↻ {loading || refreshing ? "Refreshing..." : "Refresh"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.headerActionButton,
                                    { backgroundColor: colors.header },
                                ]}
                                onPress={() => navigation.navigate("AdminDashboard")}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.headerActionText, { color: colors.primary }]}>
                                    ← Dashboard
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Notices */}
                    {!!notice && (
                        <View style={styles.successNotice}>
                            <Text style={styles.noticeText}>{notice}</Text>
                            <TouchableOpacity onPress={() => setNotice("")}>
                                <Text style={styles.noticeClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!!error && !formOpen && (
                        <View style={styles.errorNotice}>
                            <Text style={styles.noticeText}>{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <Text style={styles.noticeClose}>×</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Statistics */}
                    <View style={styles.statsGrid}>
                        <View
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <View style={[styles.statIcon, { backgroundColor: "#7C3AED20" }]}>
                                <Text style={styles.statEmoji}>📢</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: colors.muted }]}>
                                Total announcements
                            </Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {announcements.length}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <View style={[styles.statIcon, { backgroundColor: "#16A34A20" }]}>
                                <Text style={styles.statEmoji}>✓</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: colors.muted }]}>
                                Published
                            </Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {publishedCount}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <View style={[styles.statIcon, { backgroundColor: "#2563EB20" }]}>
                                <Text style={styles.statEmoji}>◷</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: colors.muted }]}>
                                Scheduled
                            </Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {scheduledCount}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.statCard,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                        >
                            <View style={[styles.statIcon, { backgroundColor: "#D9770620" }]}>
                                <Text style={styles.statEmoji}>✎</Text>
                            </View>
                            <Text style={[styles.statLabel, { color: colors.muted }]}>
                                Drafts
                            </Text>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {draftCount}
                            </Text>
                        </View>
                    </View>

                    {/* Manage Announcements */}
                    <View
                        style={[
                            styles.listContainer,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Manage Announcements
                        </Text>

                        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                            {loading
                                ? "Loading announcements..."
                                : `${filteredAnnouncements.length} of ${announcements.length} announcements`}
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                { backgroundColor: colors.primary },
                            ]}
                            onPress={openCreateForm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.createButtonText}>
                                + Create Announcement
                            </Text>
                        </TouchableOpacity>

                        {/* Search */}
                        <View
                            style={[
                                styles.searchContainer,
                                {
                                    backgroundColor: colors.input,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={styles.searchIcon}>🔍</Text>

                            <TextInput
                                value={search}
                                onChangeText={setSearch}
                                placeholder="Search title or message..."
                                placeholderTextColor={colors.muted}
                                style={[styles.searchInput, { color: colors.text }]}
                                autoCapitalize="none"
                            />

                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch("")}>
                                    <Text style={{ color: colors.muted, fontSize: 20 }}>
                                        ×
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {renderPicker(
                            "Filter by Status",
                            statusFilter,
                            [
                                { label: "All statuses", value: "all" },
                                { label: "Published", value: "published" },
                                { label: "Scheduled", value: "scheduled" },
                                { label: "Drafts", value: "draft" },
                            ],
                            setStatusFilter
                        )}
                    </View>

                    {/* ANNOUNCEMENT LIST - OUTSIDE CONTAINER */}

                    <View style={{ marginTop: 14 }}>
                        {loading ? (
                            <View
                                style={[
                                    styles.emptyContainer,
                                    {
                                        backgroundColor: colors.card,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        borderRadius: 14,
                                    },
                                ]}
                            >
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                    Loading announcements...
                                </Text>
                            </View>
                        ) : filteredAnnouncements.length === 0 ? (
                            <View
                                style={[
                                    styles.emptyContainer,
                                    {
                                        backgroundColor: colors.card,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        borderRadius: 14,
                                    },
                                ]}
                            >
                                <Text style={styles.emptyEmoji}>📭</Text>
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                                    No announcements found
                                </Text>
                                <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                                    Create an announcement or change your search filters.
                                </Text>
                            </View>
                        ) : (
                            filteredAnnouncements.map((item) => (
                                <View
                                    key={String(item.id)}
                                    style={[
                                        styles.announcementCard,
                                        {
                                            backgroundColor: colors.card,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                >
                                    <View style={styles.announcementTop}>
                                        <Text
                                            style={[
                                                styles.announcementCode,
                                                { color: colors.primary },
                                            ]}
                                        >
                                            {item.announcement_code || "Announcement"}
                                        </Text>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: `${getStatusColor(item.status)}18` },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.badgeText,
                                                    { color: getStatusColor(item.status) },
                                                ]}
                                            >
                                                {item.status || "Unknown"}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.announcementTitle, { color: colors.text }]}>
                                        {item.title || "Untitled announcement"}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.announcementMessage,
                                            { color: colors.muted },
                                        ]}
                                        numberOfLines={4}
                                    >
                                        {item.message || ""}
                                    </Text>

                                    <View style={styles.metadataRow}>
                                        <View
                                            style={[
                                                styles.typeBadge,
                                                { backgroundColor: `${getTypeColor(item.type)}18` },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.badgeText,
                                                    { color: getTypeColor(item.type) },
                                                ]}
                                            >
                                                {getTypeLabel(item.type)}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={[styles.publishDate, { color: colors.muted }]}>
                                        Publish date: {formatDate(item.publish_at)}
                                    </Text>

                                    <View style={styles.actionRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.editButton,
                                                { backgroundColor: colors.header },
                                            ]}
                                            onPress={() => startEditing(item)}
                                        >
                                            <Text style={{ color: colors.primary, fontWeight: "700" }}>
                                                Edit
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => handleDelete(item)}
                                        >
                                            <Text style={styles.deleteButtonText}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Create / Edit Modal */}
            <Modal
                visible={formOpen}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    if (!saving) resetForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: colors.card },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>
                                    COMMUNICATION CENTER
                                </Text>

                                <Text style={[styles.modalTitle, { color: colors.text }]}>
                                    {editingId !== null
                                        ? "Edit Announcement"
                                        : "Create Announcement"}
                                </Text>

                                <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                                    Publish an update or schedule a notification for users.
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={resetForm}
                                disabled={saving}
                                style={styles.closeButton}
                            >
                                <Text style={{ color: colors.muted, fontSize: 27 }}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {!!error && (
                                <View style={styles.errorNotice}>
                                    <Text style={styles.noticeText}>{error}</Text>
                                </View>
                            )}

                            <View style={styles.formGroup}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                                    Announcement Title
                                </Text>

                                <TextInput
                                    value={form.title}
                                    onChangeText={(value) => updateField("title", value)}
                                    maxLength={150}
                                    placeholder="e.g. New AI Interview Feature"
                                    placeholderTextColor={colors.muted}
                                    style={[
                                        styles.textInput,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        },
                                    ]}
                                />
                                <Text style={[styles.counter, { color: colors.muted }]}>
                                    {form.title.length}/150 characters
                                </Text>
                            </View>

                            {renderPicker(
                                "Announcement Type",
                                form.type,
                                TYPES,
                                (value) => updateField("type", value)
                            )}

                            <View style={styles.formGroup}>
                                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                                    Message
                                </Text>

                                <TextInput
                                    value={form.message}
                                    onChangeText={(value) => updateField("message", value)}
                                    multiline
                                    textAlignVertical="top"
                                    maxLength={5000}
                                    numberOfLines={5}
                                    placeholder="Write the announcement for your users..."
                                    placeholderTextColor={colors.muted}
                                    style={[
                                        styles.textInput,
                                        styles.messageInput,
                                        {
                                            backgroundColor: colors.input,
                                            borderColor: colors.border,
                                            color: colors.text,
                                        },
                                    ]}
                                />

                                <Text style={[styles.counter, { color: colors.muted }]}>
                                    {form.message.length}/5000 characters
                                </Text>
                            </View>

                            {renderPicker(
                                "Publishing Status",
                                form.status,
                                STATUSES,
                                (value) => updateField("status", value)
                            )}

                            {form.status === "scheduled" && (
                                <View style={styles.formGroup}>
                                    <Text style={[styles.fieldLabel, { color: colors.text }]}>
                                        Publish Date and Time
                                    </Text>

                                    <View style={styles.dateTimeRow}>
                                        <TouchableOpacity
                                            style={[
                                                styles.dateTimeButton,
                                                {
                                                    backgroundColor: colors.input,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            onPress={openDatePicker}
                                        >
                                            <Text style={{ color: colors.text }}>
                                                📅 {form.publish_at
                                                    ? form.publish_at.split("T")[0]
                                                    : "Select Date"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[
                                                styles.dateTimeButton,
                                                {
                                                    backgroundColor: colors.input,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            onPress={() => {
                                                setDatePickerValue(getPickerDate(form.publish_at));
                                                setShowTimePicker(true);
                                            }}
                                        >
                                            <Text style={{ color: colors.text }}>
                                                🕒 {form.publish_at
                                                    ? form.publish_at.split("T")[1]
                                                    : "Select Time"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={datePickerValue}
                                            mode="date"
                                            display="default"
                                            minimumDate={new Date()}
                                            onChange={handleDateChange}
                                        />
                                    )}

                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={getPickerDate(form.publish_at)}
                                            mode="time"
                                            display="default"
                                            onChange={handleTimeChange}
                                        />
                                    )}
                                </View>
                            )}

                            <View
                                style={[
                                    styles.audienceCard,
                                    { backgroundColor: colors.header },
                                ]}
                            >
                                <Text style={[styles.audienceText, { color: colors.text }]}>
                                    <Text style={{ fontWeight: "800" }}>Audience: </Text>
                                    All logged-in users
                                </Text>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[
                                        styles.cancelButton,
                                        { borderColor: colors.border },
                                    ]}
                                    onPress={resetForm}
                                    disabled={saving}
                                >
                                    <Text style={[styles.cancelText, { color: colors.text }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.saveButton,
                                        { backgroundColor: colors.primary },
                                        saving && { opacity: 0.65 },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>
                                            {editingId !== null
                                                ? "Save Changes"
                                                : form.status === "published"
                                                    ? "Publish Announcement"
                                                    : form.status === "scheduled"
                                                        ? "Schedule Announcement"
                                                        : "Save Draft"}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AdminAnnouncementsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 18,
        paddingTop: 30,
        paddingBottom: 40,
    },
    headerCard: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 18,
    },
    eyebrow: {
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.4,
        marginBottom: 7,
    },
    title: {
        fontSize: 23,
        fontWeight: "800",
        marginBottom: 7,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
    },
    headerActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },

    headerActionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    headerActionText: {
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
    },
    successNotice: {
        backgroundColor: "#DCFCE7",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    errorNotice: {
        backgroundColor: "#FEE2E2",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
    },
    noticeText: {
        color: "#991B1B",
        fontSize: 12,
        fontWeight: "600",
        flex: 1,
    },
    noticeClose: {
        color: "#991B1B",
        fontSize: 21,
        fontWeight: "700",
        marginLeft: 10,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 18,
    },
    statCard: {
        width: "48%",
        flexGrow: 1,
        flexBasis: "45%",
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        minHeight: 125,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    statEmoji: {
        fontSize: 18,
    },
    statLabel: {
        fontSize: 11,
        marginBottom: 5,
    },
    statValue: {
        fontSize: 23,
        fontWeight: "800",
    },
    listContainer: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 5,
        marginBottom: 14,
    },
    createButton: {
        borderRadius: 10,
        paddingVertical: 13,
        alignItems: "center",
        marginBottom: 15,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },
    searchContainer: {
        minHeight: 48,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 9,
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 10,
    },
    formGroup: {
        marginBottom: 15,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 7,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 9,
        overflow: "hidden",
    },
    announcementCard: {
        borderWidth: 1,
        borderRadius: 13,
        padding: 14,
        marginTop: 13,
    },
    announcementTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 10,
    },
    announcementCode: {
        fontSize: 11,
        fontWeight: "800",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "800",
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 7,
    },
    announcementMessage: {
        fontSize: 12,
        lineHeight: 19,
    },
    metadataRow: {
        flexDirection: "row",
        marginTop: 12,
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    publishDate: {
        fontSize: 11,
        marginTop: 11,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    editButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 11,
        borderRadius: 9,
    },
    deleteButton: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 11,
        borderRadius: 9,
        backgroundColor: "#FEE2E2",
    },
    deleteButtonText: {
        color: "#DC2626",
        fontSize: 12,
        fontWeight: "800",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 35,
    },
    emptyEmoji: {
        fontSize: 36,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 12,
        textAlign: "center",
        lineHeight: 19,
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.60)",
        justifyContent: "center",
        padding: 12,
    },
    modalCard: {
        maxHeight: "92%",
        borderRadius: 18,
        padding: 18,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 20,
    },
    modalEyebrow: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    modalTitle: {
        fontSize: 21,
        fontWeight: "800",
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 12,
        lineHeight: 18,
    },
    closeButton: {
        paddingHorizontal: 5,
        paddingTop: 0,
    },
    textInput: {
        minHeight: 47,
        borderWidth: 1,
        borderRadius: 9,
        paddingHorizontal: 12,
        fontSize: 13,
    },
    messageInput: {
        minHeight: 120,
        paddingTop: 12,
    },
    counter: {
        fontSize: 10,
        textAlign: "right",
        marginTop: 5,
    },
    dateTimeRow: {
        flexDirection: "row",
        gap: 9,
    },
    dateTimeButton: {
        flex: 1,
        minHeight: 46,
        borderWidth: 1,
        borderRadius: 9,
        paddingHorizontal: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    audienceCard: {
        padding: 13,
        borderRadius: 9,
        marginBottom: 17,
    },
    audienceText: {
        fontSize: 12,
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 9,
        paddingVertical: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelText: {
        fontSize: 12,
        fontWeight: "700",
    },
    saveButton: {
        flex: 1.5,
        borderRadius: 9,
        paddingVertical: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        textAlign: "center",
    },
});
