
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { resetPassword } from "../../services/authService";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;

const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
    const { email, resetToken } = route.params;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!email || !resetToken) {
            setError(
                "Reset session is missing or expired. Please start again."
            );
            return;
        }

        if (!newPassword.trim()) {
            setError("Please enter a new password.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!confirmPassword.trim()) {
            setError("Please confirm your password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await resetPassword(
                email,
                resetToken,
                newPassword
            );

            console.log("Reset Password Response:", response);

            if (response?.success) {
                setSuccess(
                    response?.message ||
                    "Password reset successfully!"
                );

                // Navigate to Login after successful reset.
                // Reset token is passed only through navigation params.
                setTimeout(() => {
                    navigation.reset({
                        index: 1,
                        routes: [
                            { name: "Home" },
                            { name: "Login" },
                        ],
                    });
                }, 1500);
            } else {
                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Unable to reset password."
                );
            }
        } catch (err: any) {
            console.error("Reset Password Error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Unable to reset password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.backText}>‹  Back to Login</Text>
                </TouchableOpacity>

                <View style={styles.brandSection}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>AI</Text>
                    </View>
                    <Text style={styles.appName}>AI Interview Assist</Text>
                    <Text style={styles.tagline}>
                        Secure your account with a new password.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Create a new password for your account.
                    </Text>

                    <View style={styles.emailBox}>
                        <Text style={styles.emailLabel}>ACCOUNT EMAIL</Text>
                        <Text style={styles.emailText}>{email}</Text>
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    {success ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>{success}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter new password"
                            placeholderTextColor="#94A3B8"
                            value={newPassword}
                            onChangeText={(value) => {
                                setNewPassword(value);
                                setError("");
                            }}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                            autoComplete="new-password"
                        />
                        <TouchableOpacity
                            onPress={() =>
                                setShowNewPassword(!showNewPassword)
                            }
                            disabled={loading}
                        >
                            <Text style={styles.eyeText}>
                                {showNewPassword ? "Hide" : "Show"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.passwordInfo}>
                        Password must be at least 6 characters.
                    </Text>

                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm new password"
                            placeholderTextColor="#94A3B8"
                            value={confirmPassword}
                            onChangeText={(value) => {
                                setConfirmPassword(value);
                                setError("");
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                            autoComplete="new-password"
                        />
                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={loading}
                        >
                            <Text style={styles.eyeText}>
                                {showConfirmPassword ? "Hide" : "Show"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.resetButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.resetButtonText}>
                                Reset Password
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.loginLinkText}>
                            ←  Back to Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F1F5F9",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 22,
        paddingVertical: 28,
    },
    backButton: {
        alignSelf: "flex-start",
        paddingVertical: 9,
        paddingHorizontal: 14,
        backgroundColor: "#E0E7FF",
        borderRadius: 9,
        marginBottom: 25,
    },
    backText: {
        color: "#1D4ED8",
        fontSize: 14,
        fontWeight: "700",
    },
    brandSection: {
        alignItems: "center",
        marginBottom: 26,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "900",
    },
    appName: {
        color: "#172554",
        fontSize: 24,
        fontWeight: "800",
    },
    tagline: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 7,
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 23,
        borderRadius: 20,
        elevation: 5,
        shadowColor: "#0F172A",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 5 },
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#172554",
    },
    subtitle: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 7,
        marginBottom: 17,
    },
    emailBox: {
        backgroundColor: "#EFF6FF",
        padding: 13,
        borderRadius: 10,
        marginBottom: 10,
    },
    emailLabel: {
        color: "#64748B",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 5,
    },
    emailText: {
        color: "#1E40AF",
        fontSize: 13,
        fontWeight: "700",
    },
    errorBox: {
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
        lineHeight: 19,
    },
    successBox: {
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
        borderWidth: 1,
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    successText: {
        color: "#15803D",
        fontSize: 13,
    },
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
        marginTop: 15,
    },
    passwordContainer: {
        height: 51,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 11,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    passwordInput: {
        flex: 1,
        color: "#172554",
        fontSize: 14,
    },
    eyeText: {
        color: "#2563EB",
        fontSize: 12,
        fontWeight: "700",
        padding: 5,
    },
    passwordInfo: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 8,
    },
    resetButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.6,
    },
    resetButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    loginLink: {
        alignItems: "center",
        marginTop: 22,
    },
    loginLinkText: {
        color: "#2563EB",
        fontSize: 13,
        fontWeight: "700",
    },
});

export default ResetPasswordScreen;
