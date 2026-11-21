
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import * as Clipboard from "expo-clipboard";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

interface AdminUser {
    user_id?: string;
    name?: string;
    email?: string;
    role?: string;
}

const AdminUsersScreen = ({ navigation }: any) => {
    const { colors, theme } = useTheme();
    const isDark = theme === "Dark";

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // FETCH USERS
    // ==========================================
    const fetchUsers = useCallback(async () => {
        setError("");

        try {
            const response = await api.get("/api/admin/users");

            if (response.data?.success) {
                setUsers(
                    Array.isArray(response.data.users)
                        ? response.data.users
                        : []
                );
            } else {
                setError(
                    response.data?.message || "Unable to load users."
                );
            }
        } catch (err: any) {
            console.error("Admin users error:", err);

            if (err.response?.status === 401) {
                setError("Session expired. Please log in again.");
            } else if (err.response?.status === 403) {
                setError("Admin access denied.");
            } else if (err.response?.status === 404) {
                setError("Users API route not found.");
            } else {
                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Unable to load users. Please try again."
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ==========================================
    // SEARCH FILTER
    // ==========================================
    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((user) => (
            String(user.name || "").toLowerCase().includes(query) ||
            String(user.email || "").toLowerCase().includes(query) ||
            String(user.role || "").toLowerCase().includes(query) ||
            String(user.user_id || "").toLowerCase().includes(query)
        ));
    }, [users, search]);

    // ==========================================
    // REFRESH
    // ==========================================
    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    // ==========================================
    // COPY USER ID
    // ==========================================
    const copyUserId = async (userId: string) => {
        try {
            await Clipboard.setStringAsync(userId);
            Alert.alert("Copied", "User ID copied successfully.");
        } catch (err) {
            Alert.alert("Error", "Unable to copy User ID.");
        }
    };

    // ==========================================
    // LOADING
    // ==========================================
    if (loading) {
        return (
            <View
                style={[
                    styles.loader,
                    { backgroundColor: colors.background },
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />
                <Text style={[styles.loadingText, { color: colors.muted }]}>
                    Loading users...
                </Text>
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colors.background },
            ]}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* HEADER */}

                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.headerInfo}>
                        <Text style={styles.eyebrow}>
                            ADMINISTRATION
                        </Text>

                        <Text style={[styles.title, { color: colors.text }]}>
                            User Management
                        </Text>

                        <Text style={[styles.subtitle, { color: colors.muted }]}>
                            View and manage registered platform accounts.
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.backButton,
                                {
                                    backgroundColor: colors.header,
                                    borderColor: colors.border,
                                },
                            ]}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.backButtonText, { color: colors.primary }]}>
                                ← Dashboard
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>


                {/* TOTAL USERS */}
                <View
                    style={[
                        styles.summaryCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.summaryIcon}>
                        <Text style={styles.summaryEmoji}>👥</Text>
                    </View>

                    <View style={styles.summaryInfo}>
                        <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                            Total Users
                        </Text>

                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {users.length}
                        </Text>
                    </View>

                    <View style={styles.summaryAccent} />
                </View>

                {/* SEARCH */}
                <View
                    style={[
                        styles.searchCard,
                        {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View style={styles.searchInputWrapper}>
                        <Text style={styles.searchIcon}>🔍</Text>

                        <TextInput
                            style={[
                                styles.searchInput,
                                { color: colors.text },
                            ]}
                            placeholder="Search name, email, role or ID..."
                            placeholderTextColor={colors.muted}
                            value={search}
                            onChangeText={setSearch}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {search.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSearch("")}
                            >
                                <Text style={[styles.clearSearch, { color: colors.muted }]}>
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.refreshButton,
                            { backgroundColor: isDark ? "#303B60" : "#EEF2FF" },
                        ]}
                        onPress={fetchUsers}
                        disabled={refreshing}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.refreshButtonText}>
                            {refreshing ? "Loading..." : "↻ Refresh"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ERROR */}
                {error ? (
                    <View
                        style={[
                            styles.errorCard,
                            {
                                backgroundColor: isDark ? "#3B252D" : "#FEF2F2",
                                borderColor: isDark ? "#75404D" : "#FECACA",
                            },
                        ]}
                    >
                        <Text style={styles.errorText}>
                            ⚠️ {error}
                        </Text>

                        <TouchableOpacity
                            onPress={fetchUsers}
                            style={styles.retryButton}
                        >
                            <Text style={styles.retryText}>
                                Try Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {/* REGISTERED USERS */}
                <View style={styles.sectionHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Registered Accounts
                        </Text>

                        <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                            {filteredUsers.length} results found
                        </Text>
                    </View>

                    <View style={styles.resultBadge}>
                        <Text style={styles.resultBadgeText}>
                            {filteredUsers.length}
                        </Text>
                    </View>
                </View>

                {/* EMPTY STATE */}
                {!error && filteredUsers.length === 0 ? (
                    <View
                        style={[
                            styles.emptyCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <Text style={styles.emptyIcon}>
                            {search ? "🔍" : "👥"}
                        </Text>

                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            {search
                                ? "No Users Found"
                                : "No Registered Users"}
                        </Text>

                        <Text style={[styles.emptyDescription, { color: colors.muted }]}>
                            {search
                                ? "No users match your search."
                                : "There are no registered accounts yet."}
                        </Text>
                    </View>
                ) : null}

                {/* USER CARDS */}
                {!error && filteredUsers.map((user, index) => (
                    <View
                        key={user.user_id || user.email || String(index)}
                        style={[
                            styles.userCard,
                            {
                                backgroundColor: colors.card,
                                borderColor: colors.border,
                            },
                        ]}
                    >
                        <View style={styles.userCardHeader}>
                            <View style={styles.userIdentity}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>
                                        {(user.name || "U")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </Text>
                                </View>

                                <View style={styles.userNameContainer}>
                                    <Text
                                        style={[styles.userName, { color: colors.text }]}
                                        numberOfLines={1}
                                    >
                                        {user.name || "Unnamed User"}
                                    </Text>

                                    <Text
                                        style={[styles.userEmail, { color: colors.muted }]}
                                        numberOfLines={2}
                                    >
                                        {user.email || "Email not available"}
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={[
                                    styles.roleBadge,
                                    {
                                        backgroundColor: isDark ? "#303B60" : "#EEF2FF",
                                    },
                                ]}
                            >
                                <Text style={styles.roleText}>
                                    {user.role || "user"}
                                </Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.userDivider,
                                { backgroundColor: colors.border },
                            ]}
                        />

                        <View style={styles.userIdRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.userIdLabel, { color: colors.muted }]}>
                                    USER ID
                                </Text>

                                <Text style={[styles.userIdValue, { color: colors.text }]}>
                                    {user.user_id || "—"}
                                </Text>
                            </View>

                            {user.user_id ? (
                                <TouchableOpacity
                                    style={[
                                        styles.copyButton,
                                        { backgroundColor: isDark ? "#263A35" : "#DCFCE7" },
                                    ]}
                                    onPress={() => copyUserId(user.user_id!)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.copyButtonText}>
                                        📋 Copy
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingTop: 25,
        paddingBottom: 35,
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 13,
    },
    header: {
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 18,
    },

    headerInfo: {
        width: "100%",
    },
    eyebrow: {
        color: "#8B5CF6",
        fontSize: 10,
        fontWeight: "bold",
        letterSpacing: 1.5,
        marginBottom: 7,
    },
    title: {
        fontSize: 23,
        fontWeight: "bold",
    },
    subtitle: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    backButton: {
        alignSelf: "stretch",
        marginTop: 16,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
    },
    summaryCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
        overflow: "hidden",
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 13,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 13,
    },
    summaryEmoji: {
        fontSize: 23,
    },
    summaryInfo: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: "600",
    },
    summaryValue: {
        fontSize: 25,
        fontWeight: "bold",
        marginTop: 3,
    },
    summaryAccent: {
        width: 5,
        height: 42,
        borderRadius: 5,
        backgroundColor: "#6257D9",
    },
    searchCard: {
        borderWidth: 1,
        borderRadius: 13,
        padding: 11,
        marginBottom: 23,
    },
    searchInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 43,
        paddingHorizontal: 9,
    },
    searchIcon: {
        fontSize: 17,
        marginRight: 9,
    },
    searchInput: {
        flex: 1,
        fontSize: 12,
        paddingVertical: 8,
    },
    clearSearch: {
        fontSize: 16,
        paddingHorizontal: 5,
    },
    refreshButton: {
        minHeight: 38,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    refreshButtonText: {
        color: "#4F46E5",
        fontSize: 12,
        fontWeight: "bold",
    },
    errorCard: {
        borderWidth: 1,
        borderRadius: 11,
        padding: 14,
        marginBottom: 18,
    },
    errorText: {
        color: "#DC2626",
        fontSize: 12,
        lineHeight: 18,
    },
    retryButton: {
        marginTop: 10,
        alignSelf: "flex-start",
    },
    retryText: {
        color: "#6257D9",
        fontSize: 12,
        fontWeight: "bold",
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 13,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
    },
    sectionSubtitle: {
        fontSize: 11,
        marginTop: 4,
    },
    resultBadge: {
        minWidth: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: "#6257D9",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
    },
    resultBadgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    emptyCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 25,
        alignItems: "center",
        marginBottom: 18,
    },
    emptyIcon: {
        fontSize: 36,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "bold",
    },
    emptyDescription: {
        fontSize: 12,
        textAlign: "center",
        marginTop: 7,
        lineHeight: 18,
    },
    userCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    userCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    userIdentity: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
    },
    avatar: {
        width: 43,
        height: 43,
        borderRadius: 13,
        backgroundColor: "#DBEAFE",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    avatarText: {
        color: "#2563EB",
        fontSize: 19,
        fontWeight: "bold",
    },
    userNameContainer: {
        flex: 1,
    },
    userName: {
        fontSize: 13,
        fontWeight: "bold",
    },
    userEmail: {
        fontSize: 10,
        marginTop: 4,
    },
    roleBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        borderRadius: 8,
    },
    roleText: {
        color: "#8B5CF6",
        fontSize: 10,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    userDivider: {
        height: 1,
        marginVertical: 13,
    },
    userIdRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    userIdLabel: {
        fontSize: 9,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    userIdValue: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 4,
    },
    copyButton: {
        paddingHorizontal: 11,
        paddingVertical: 8,
        borderRadius: 8,
    },
    copyButtonText: {
        color: "#15803D",
        fontSize: 11,
        fontWeight: "bold",
    },
    footer: {
        borderTopWidth: 1,
        paddingTop: 23,
        paddingBottom: 10,
        alignItems: "center",
        marginTop: 15,
    },
    footerLogo: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: "#6257D9",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    footerLogoText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    footerTitle: {
        fontSize: 15,
        fontWeight: "bold",
    },
    footerSubtitle: {
        fontSize: 11,
        marginTop: 5,
    },
    footerDivider: {
        height: 1,
        width: "85%",
        backgroundColor: "#CBD5E1",
        marginVertical: 16,
    },
    footerCopyright: {
        fontSize: 10,
        textAlign: "center",
        lineHeight: 18,
    },
    footerPanel: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#DCFCE7",
        paddingVertical: 7,
        paddingHorizontal: 13,
        borderRadius: 20,
        marginTop: 14,
    },
    footerDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#16A34A",
        marginRight: 7,
    },
    footerPanelText: {
        color: "#15803D",
        fontSize: 11,
        fontWeight: "700",
    },
});

export default AdminUsersScreen;
