
import React, { useState } from "react";

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { forgotPassword } from "../../services/authService";

type AuthStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    VerifyOTP: { email: string };
};

type Props = NativeStackScreenProps<
    AuthStackParamList,
    "ForgotPassword"
>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        // EMAIL VALIDATION
        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            const cleanEmail = email.trim().toLowerCase();

            const response = await forgotPassword(cleanEmail);

            console.log("Forgot Password Response:", response);

            if (response?.success) {
                setSuccess(
                    response.message ||
                    "OTP sent successfully to your email."
                );

                // Navigate to OTP screen with email
                navigation.navigate("VerifyOTP", {
                    email: cleanEmail,
                });
            } else {
                setError(
                    response?.message ||
                    response?.data?.message ||
                    "Unable to send OTP. Please try again."
                );
            }
        } catch (err: any) {
            console.error("Forgot Password Error:", err);

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* HEADER */}
                    <View style={styles.topHeader}>
                        <Text style={styles.logo}>
                            <Text style={styles.logoAI}>AI </Text>
                            Interview Assist
                        </Text>

                        <Text style={styles.topSubtitle}>
                            Your journey to interview success
                        </Text>
                    </View>

                    {/* MAIN CARD */}
                    <View style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.lockIcon}>🔐</Text>
                        </View>

                        <Text style={styles.title}>
                            Forgot Password?
                        </Text>

                        <Text style={styles.description}>
                            Don't worry! Enter your registered email
                            address and we'll send you an OTP to
                            reset your password.
                        </Text>

                        {/* ERROR MESSAGE */}
                        {!!error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorIcon}>⚠️</Text>
                                <Text style={styles.errorText}>
                                    {error}
                                </Text>
                            </View>
                        )}

                        {/* SUCCESS MESSAGE */}
                        {!!success && (
                            <View style={styles.successBox}>
                                <Text style={styles.successIcon}>✓</Text>
                                <Text style={styles.successText}>
                                    {success}
                                </Text>
                            </View>
                        )}

                        {/* EMAIL INPUT */}
                        <Text style={styles.label}>
                            Email Address
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputIcon}>✉</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#94A3B8"
                                value={email}
                                onChangeText={(value) => {
                                    setEmail(value);
                                    setError("");
                                    setSuccess("");
                                }}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                editable={!loading}
                            />
                        </View>

                        {/* SEND OTP BUTTON */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                loading && styles.disabledButton,
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <View style={styles.loadingContent}>
                                    <ActivityIndicator
                                        color="#FFFFFF"
                                        size="small"
                                    />
                                    <Text style={styles.submitButtonText}>
                                        Sending OTP...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    Send OTP  →
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* BACK TO LOGIN */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.navigate("Login")}
                            disabled={loading}
                        >
                            <Text style={styles.backButtonText}>
                                ← Back to Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* FOOTER */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Secure • Simple • Smart Interview Preparation
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#EFF6FF",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 22,
        paddingVertical: 30,
    },

    // HEADER
    topHeader: {
        alignItems: "center",
        marginBottom: 30,
    },
    logo: {
        fontSize: 22,
        fontWeight: "900",
        color: "#312E81",
    },
    logoAI: {
        color: "#6366F1",
    },
    topSubtitle: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 7,
    },

    // CARD
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        padding: 23,
        borderWidth: 1,
        borderColor: "#DDD6FE",
        elevation: 4,
        shadowColor: "#6366F1",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: "#F3E8FF",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 20,
    },
    lockIcon: {
        fontSize: 34,
    },
    title: {
        color: "#312E81",
        fontSize: 25,
        fontWeight: "900",
        textAlign: "center",
    },
    description: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 21,
        textAlign: "center",
        marginTop: 12,
        marginBottom: 25,
    },

    // MESSAGES
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 17,
        gap: 9,
    },
    errorIcon: {
        fontSize: 15,
    },
    errorText: {
        flex: 1,
        color: "#B91C1C",
        fontSize: 12,
        lineHeight: 18,
    },
    successBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F0FDF4",
        borderColor: "#BBF7D0",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 17,
        gap: 9,
    },
    successIcon: {
        color: "#16A34A",
        fontWeight: "900",
        fontSize: 17,
    },
    successText: {
        flex: 1,
        color: "#15803D",
        fontSize: 12,
        lineHeight: 18,
    },

    // INPUT
    label: {
        color: "#334155",
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 9,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 11,
        paddingHorizontal: 14,
        height: 54,
    },
    inputIcon: {
        fontSize: 19,
        color: "#8B5CF6",
        marginRight: 11,
    },
    input: {
        flex: 1,
        height: "100%",
        color: "#1E293B",
        fontSize: 14,
    },

    // BUTTON
    submitButton: {
        backgroundColor: "#6366F1",
        minHeight: 53,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 22,
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    loadingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    // BACK
    backButton: {
        alignItems: "center",
        paddingVertical: 19,
    },
    backButtonText: {
        color: "#6D28D9",
        fontSize: 13,
        fontWeight: "800",
    },

    // FOOTER
    footer: {
        alignItems: "center",
        marginTop: 25,
    },
    footerText: {
        color: "#94A3B8",
        fontSize: 11,
        textAlign: "center",
    },
});

export default ForgotPasswordScreen;
