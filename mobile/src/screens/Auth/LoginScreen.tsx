
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../context/AuthContext";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("");
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
    const [captchaInput, setCaptchaInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lockSeconds, setLockSeconds] = useState(0);

    useEffect(() => {
        const restoreLock = async () => {
            const stored = await SecureStore.getItemAsync("loginLockedUntil");

            if (stored) {
                const remaining = Math.max(
                    0,
                    Math.ceil((Number(stored) - Date.now()) / 1000)
                );
                setLockSeconds(remaining);

                if (remaining === 0) {
                    await SecureStore.deleteItemAsync("loginLockedUntil");
                }
            }
        };

        restoreLock();
    }, []);

    useEffect(() => {
        if (lockSeconds <= 0) return;

        const timer = setTimeout(() => {
            setLockSeconds((previous) => Math.max(0, previous - 1));
        }, 1000);

        return () => clearTimeout(timer);
    }, [lockSeconds]);

    useEffect(() => {
        if (lockSeconds === 0) {
            SecureStore.deleteItemAsync("loginLockedUntil");
            setError("");
        }
    }, [lockSeconds]);

    const refreshCaptcha = () => {
        setCaptchaCode(generateCaptcha());
        setCaptchaInput("");
    };

    const handleLoginLockout = async (
        status?: number,
        message?: string
    ) => {
        if (
            status !== 429 ||
            !/too many failed attempts/i.test(message || "")
        ) {
            return false;
        }

        const match = (message || "").match(/(\d+)\s*seconds?/i);
        const seconds = match ? Number(match[1]) : 60;

        await SecureStore.setItemAsync(
            "loginLockedUntil",
            String(Date.now() + seconds * 1000)
        );

        setLockSeconds(seconds);
        setError(`Login temporarily blocked. Try again in ${seconds} seconds.`);
        return true;
    };

    const handleLogin = async () => {
        setError("");

        if (lockSeconds > 0) {
            setError(`Please try again in ${lockSeconds} seconds.`);
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        if (!captchaInput.trim()) {
            setError("Please enter the CAPTCHA code.");
            return;
        }

        if (captchaInput.trim().toUpperCase() !== captchaCode) {
            setError("Incorrect CAPTCHA. Please try again.");
            refreshCaptcha();
            return;
        }

        try {
            setLoading(true);

            const data = await login({
                email: email.trim(),
                password,
            });

            if (data.success && data.token && data.user) {
                await SecureStore.deleteItemAsync("loginLockedUntil");

                if (
                    data.user.role === "admin" ||
                    data.user.role === "user"
                ) {
                    Alert.alert(
                        "Login Successful",
                        `Welcome, ${data.user.name}!`
                    );
                } else {
                    await SecureStore.deleteItemAsync("access_token");
                    setError("Unable to verify account role. Please contact support.");
                }
            } else {
                setError(data.message || "Invalid email or password.");
                refreshCaptcha();
            }
        } catch (err: any) {
            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                (err.response?.status === 401
                    ? "Invalid email or password."
                    : err.code === "ERR_NETWORK"
                        ? "Unable to connect to server. Please try again."
                        : "Unable to login. Please try again.");

            const isLocked = await handleLoginLockout(
                err.response?.status,
                message
            );

            if (!isLocked) {
                setError(message);
                refreshCaptcha();
            }
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
                <View style={styles.brandSection}>
                    <View style={styles.brandRow}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>AI</Text>
                        </View>

                        <View style={styles.brandText}>
                            <Text style={styles.appName}>Interview Assist</Text>

                            <Text style={styles.tagline}>
                                Your journey to interview success starts here.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate("Home")}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backText}>
                            ← Back to Home
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>
                        Sign in to continue your interview preparation.
                    </Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading && lockSeconds === 0}
                    />

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            placeholderTextColor="#94A3B8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            editable={!loading && lockSeconds === 0}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}
                        >
                            <Text style={styles.eyeIcon}>
                                {showPassword ? "Hide" : "Show"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Security Verification</Text>

                    <View style={styles.captchaRow}>
                        <View style={styles.captchaPanel}>
                            <Text style={styles.captchaText}>
                                {captchaCode.split("").join("  ")}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.refreshButton}
                            onPress={refreshCaptcha}
                            disabled={loading || lockSeconds > 0}
                        >
                            <Text style={styles.refreshText}>↻</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Enter the 6-character code"
                        placeholderTextColor="#94A3B8"
                        value={captchaInput}
                        onChangeText={(value) =>
                            setCaptchaInput(value.toUpperCase().slice(0, 6))
                        }
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={6}
                        editable={!loading && lockSeconds === 0}
                    />

                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={() => navigation.navigate("ForgotPassword")}
                    >
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (loading || lockSeconds > 0) && styles.disabledButton,
                        ]}
                        onPress={handleLogin}
                        disabled={loading || lockSeconds > 0}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.loginButtonText}>
                                {lockSeconds > 0
                                    ? `Try Again in ${lockSeconds}s`
                                    : "Sign In"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Don't have an account?{" "}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Register")}
                        >
                            <Text style={styles.linkText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
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
        width: "100%",
        alignSelf: "center",
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: "#E0E7FF",
        borderRadius: 8,
        marginTop: 18,
    },
    backText: {
        color: "#1D4ED8",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "center",
        alignSelf: "center",
    },
    brandSection: {
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 22,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        width: "100%",
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        width: "100%",
    },
    logo: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 0,
        marginLeft: 0,
        flexShrink: 0,
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
    brandText: {
        flex: 1,
        alignItems: "flex-start",
    },
    tagline: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 3,
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
    label: {
        fontSize: 13,
        fontWeight: "700",
        color: "#334155",
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        height: 51,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 11,
        paddingHorizontal: 14,
        color: "#172554",
        fontSize: 14,
        backgroundColor: "#FFFFFF",
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
    eyeIcon: {
        color: "#2563EB",
        fontSize: 12,
        fontWeight: "700",
        padding: 5,
    },
    captchaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    captchaPanel: {
        flex: 1,
        height: 53,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#BFDBFE",
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    captchaText: {
        color: "#1E3A8A",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 2,
    },
    refreshButton: {
        width: 48,
        height: 48,
        backgroundColor: "#DBEAFE",
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    refreshText: {
        color: "#2563EB",
        fontSize: 29,
        fontWeight: "700",
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginTop: 15,
        marginBottom: 20,
    },
    forgotText: {
        color: "#2563EB",
        fontSize: 13,
        fontWeight: "700",
    },
    loginButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        elevation: 2,
    },
    disabledButton: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginTop: 23,
    },
    footerText: {
        color: "#64748B",
        fontSize: 13,
    },
    linkText: {
        color: "#2563EB",
        fontWeight: "800",
        fontSize: 13,
    },
    bottomText: {
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 23,
    },
});

export default LoginScreen;
