
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

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const generateCaptcha = () => {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const numbers = "23456789";

    const randomChar = (chars: string) =>
        chars[Math.floor(Math.random() * chars.length)];

    const characters = [
        randomChar(letters),
        randomChar(letters),
        randomChar(numbers),
        randomChar(numbers),
        randomChar(letters),
        randomChar(numbers),
    ];

    for (let i = characters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [characters[i], characters[j]] = [
            characters[j],
            characters[i],
        ];
    }

    return characters.join("");
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
            const stored = await SecureStore.getItemAsync(
                "loginLockedUntil"
            );

            if (stored) {
                const remaining = Math.max(
                    0,
                    Math.ceil((Number(stored) - Date.now()) / 1000)
                );

                setLockSeconds(remaining);

                if (remaining === 0) {
                    await SecureStore.deleteItemAsync(
                        "loginLockedUntil"
                    );
                }
            }
        };

        restoreLock();
    }, []);

    useEffect(() => {
        if (lockSeconds <= 0) return;

        const timer = setTimeout(async () => {
            setLockSeconds((previous) => {
                const next = Math.max(0, previous - 1);
                return next;
            });
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
        setError(
            `Login temporarily blocked. Try again in ${seconds} seconds.`
        );

        return true;
    };

    const handleLogin = async () => {
        setError("");

        if (lockSeconds > 0) {
            setError(
                `Login temporarily blocked. Try again in ${lockSeconds} seconds.`
            );
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

                if (data.user.role === "admin") {
                    Alert.alert(
                        "Login Successful",
                        `Welcome, ${data.user.name}! Admin login successful.`
                    );
                } else if (data.user.role === "user") {
                    Alert.alert(
                        "Login Successful",
                        `Welcome, ${data.user.name}!`
                    );
                } else {
                    await SecureStore.deleteItemAsync("access_token");
                    setError(
                        "Unable to verify account role. Please contact support."
                    );
                }
            } else {
                const message =
                    data.message || "Invalid email or password.";

                setError(message);
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

    const captchaColors = [
        "#DC2626",
        "#2563EB",
        "#059669",
        "#9333EA",
        "#D97706",
        "#0891B2",
    ];

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>AI</Text>
                    </View>

                    <Text style={styles.appName}>
                        AI Interview Assist
                    </Text>

                    <Text style={styles.tagline}>
                        Prepare smarter and perform better with AI-powered interview practice.
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Welcome Back</Text>
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
                        placeholderTextColor="#999"
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
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            editable={!loading && lockSeconds === 0}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowPassword(!showPassword)
                            }
                            disabled={loading}
                        >
                            <Text style={styles.showPassword}>
                                {showPassword ? "🙈" : "👁️"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>
                        Security Verification
                    </Text>

                    <View style={styles.captchaRow}>
                        <View style={styles.captchaPanel}>
                            {captchaCode.split("").map((character, index) => (
                                <Text
                                    key={`${captchaCode}-${index}`}
                                    style={[
                                        styles.captchaCharacter,
                                        {
                                            color: captchaColors[index],
                                            transform: [
                                                {
                                                    rotate: `${(index % 2 === 0 ? -1 : 1) * (index + 2)}deg`,
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    {character}
                                </Text>
                            ))}
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
                        placeholder="Enter CAPTCHA code"
                        placeholderTextColor="#999"
                        value={captchaInput}
                        onChangeText={(value) =>
                            setCaptchaInput(
                                value.toUpperCase().slice(0, 6)
                            )
                        }
                        autoCapitalize="characters"
                        autoCorrect={false}
                        maxLength={6}
                        editable={!loading && lockSeconds === 0}
                    />

                    <Text style={styles.helperText}>
                        Enter the 6-character code shown above.
                    </Text>

                    <TouchableOpacity
                        style={styles.forgotButton}
                        onPress={() =>
                            Alert.alert(
                                "Coming Soon",
                                "Forgot Password screen will be connected in a later step."
                            )
                        }
                    >
                        <Text style={styles.forgotText}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.loginButton,
                            (loading || lockSeconds > 0) &&
                            styles.disabledButton,
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
                            <Text style={styles.linkText}>
                                Create Account
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.bottomText}>
                    Practice. Improve. Succeed.
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F6FC",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 22,
    },
    header: {
        alignItems: "center",
        marginBottom: 25,
    },
    logo: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "bold",
    },
    appName: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#172554",
    },
    tagline: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 7,
        textAlign: "center",
    },
    card: {
        backgroundColor: "#FFFFFF",
        padding: 22,
        borderRadius: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#172554",
    },
    subtitle: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 7,
        marginBottom: 20,
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
        padding: 12,
        borderRadius: 9,
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
        paddingHorizontal: 14,
        color: "#172554",
        fontSize: 14,
    },
    passwordContainer: {
        height: 52,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
    },
    passwordInput: {
        flex: 1,
        color: "#172554",
        fontSize: 14,
    },
    showPassword: {
        fontSize: 18,
    },
    captchaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
    },
    captchaPanel: {
        flex: 1,
        height: 58,
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "#C7D2FE",
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
    },
    captchaCharacter: {
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 1,
    },
    refreshButton: {
        width: 48,
        height: 48,
        backgroundColor: "#E0E7FF",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    refreshText: {
        color: "#2563EB",
        fontSize: 30,
        fontWeight: "bold",
    },
    helperText: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 7,
    },
    forgotButton: {
        alignSelf: "flex-end",
        marginTop: 15,
        marginBottom: 18,
    },
    forgotText: {
        color: "#2563EB",
        fontSize: 13,
        fontWeight: "600",
    },
    loginButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    disabledButton: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },
    footerText: {
        color: "#64748B",
        fontSize: 13,
    },
    linkText: {
        color: "#2563EB",
        fontWeight: "bold",
        fontSize: 13,
    },
    bottomText: {
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 24,
    },
});

export default LoginScreen;
