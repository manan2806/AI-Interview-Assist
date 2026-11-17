
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
import { verifyOTP } from "../../services/authService";

type Props = NativeStackScreenProps<AuthStackParamList, "VerifyOTP">;

const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
    const email = route.params?.email || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleOTPChange = (value: string) => {
        const cleanedValue = value.replace(/\D/g, "").slice(0, 6);
        setOtp(cleanedValue);
        setError("");
        setSuccess("");
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Email is missing. Please request a new OTP.");
            return;
        }

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await verifyOTP(email.trim(), otp);

            if (response?.success) {
                const resetToken = response?.reset_token;

                if (!resetToken) {
                    setError(
                        "OTP verified, but reset token was not received."
                    );
                    return;
                }

                setSuccess(
                    response?.message || "OTP verified successfully!"
                );

                navigation.navigate("ResetPassword", {
                    email: email.trim(),
                    resetToken,
                });
            } else {
                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Invalid OTP. Please try again."
                );
            }
        } catch (err: any) {
            console.error("OTP Verification Error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "OTP verification failed. Please try again."
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
                        <Text style={styles.logoText}>✓</Text>
                    </View>
                    <Text style={styles.appName}>AI Interview Assist</Text>
                    <Text style={styles.tagline}>
                        Secure account verification
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>

                    <Text style={styles.title}>Verify your email</Text>

                    <Text style={styles.subtitle}>
                        We've sent a verification code to:
                    </Text>

                    <View style={styles.emailBox}>
                        <Text style={styles.emailIcon}>✉</Text>
                        <Text style={styles.emailText}>{email || "Email unavailable"}</Text>
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

                    <Text style={styles.label}>Enter verification code</Text>

                    <TextInput
                        style={styles.otpInput}
                        placeholder="000000"
                        placeholderTextColor="#94A3B8"
                        value={otp}
                        onChangeText={handleOTPChange}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!loading && !!email.trim()}
                        autoComplete="one-time-code"
                        textContentType="oneTimeCode"
                        autoFocus
                    />

                    <View style={styles.inputFooter}>
                        <Text style={styles.hint}>
                            Enter the 6-digit code from your email.
                        </Text>
                        <Text style={styles.counter}>{otp.length}/6</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.verifyButton,
                            (loading || otp.length !== 6 || !email.trim()) &&
                            styles.disabledButton,
                        ]}
                        onPress={handleSubmit}
                        disabled={loading || otp.length !== 6 || !email.trim()}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>
                                Verify & Continue  →
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>Need another code?</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>
                            Didn't receive the OTP?{" "}
                        </Text>
                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("ForgotPassword")
                            }
                        >
                            <Text style={styles.linkText}>Request a new one</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.loginLink}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.loginLinkText}>
                            ←  Back to Login
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.securityNote}>
                        ✓  Your verification code is private and secure.
                    </Text>
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
        fontSize: 30,
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
    eyebrow: {
        color: "#6366F1",
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1.5,
        marginBottom: 9,
    },
    title: {
        fontSize: 25,
        fontWeight: "800",
        color: "#172554",
    },
    subtitle: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 10,
    },
    emailBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFF6FF",
        padding: 13,
        borderRadius: 10,
        marginTop: 12,
        marginBottom: 12,
    },
    emailIcon: {
        fontSize: 17,
        marginRight: 9,
        color: "#2563EB",
    },
    emailText: {
        flex: 1,
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
        marginTop: 15,
        marginBottom: 9,
    },
    otpInput: {
        height: 58,
        borderWidth: 1,
        borderColor: "#C7D2FE",
        borderRadius: 12,
        backgroundColor: "#F8FAFF",
        paddingHorizontal: 15,
        color: "#172554",
        fontSize: 25,
        fontWeight: "800",
        letterSpacing: 9,
        textAlign: "center",
    },
    inputFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 9,
    },
    hint: {
        color: "#64748B",
        fontSize: 11,
        flex: 1,
    },
    counter: {
        color: "#64748B",
        fontSize: 11,
        fontWeight: "700",
    },
    verifyButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 24,
    },
    disabledButton: {
        opacity: 0.55,
    },
    verifyButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 23,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E2E8F0",
    },
    dividerText: {
        color: "#94A3B8",
        fontSize: 11,
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    resendText: {
        color: "#64748B",
        fontSize: 12,
    },
    linkText: {
        color: "#2563EB",
        fontSize: 12,
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
    securityNote: {
        textAlign: "center",
        color: "#64748B",
        fontSize: 11,
        marginTop: 23,
    },
});

export default VerifyOTPScreen;
