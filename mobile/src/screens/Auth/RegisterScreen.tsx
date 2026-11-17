
import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import { registerUser } from "../../services/authService";

type AuthStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
};

type Props = NativeStackScreenProps<
    AuthStackParamList,
    "Register"
>;

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [role, setRole] = useState<"user" | "admin">("user");
    const [adminSecret, setAdminSecret] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAdminSecret, setShowAdminSecret] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async () => {
        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!password) {
            setError("Please enter a password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (!confirmPassword) {
            setError("Please confirm your password.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (role === "admin" && !adminSecret.trim()) {
            setError("Please enter the admin registration secret.");
            return;
        }

        try {
            setLoading(true);

            const registrationData = {
                name: name.trim(),
                email: email.trim(),
                password,
                role,
                ...(role === "admin"
                    ? { admin_secret: adminSecret }
                    : {}),
            };

            const data = await registerUser(registrationData);

            if (data.success) {
                setSuccess(
                    data.message || "Account created successfully."
                );

                Alert.alert(
                    "Registration Successful",
                    data.message || "Your account has been created successfully.",
                    [
                        {
                            text: "Go to Login",
                            onPress: () => {
                                setName("");
                                setEmail("");
                                setPassword("");
                                setConfirmPassword("");
                                setAdminSecret("");
                                setRole("user");
                                navigation.navigate("Login");
                            },
                        },
                    ],
                    { cancelable: false }
                );
            } else {
                setError(
                    data.message || "Unable to create account."
                );
            }
        } catch (err: any) {
            console.error("Register Error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to create account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = (selectedRole: "user" | "admin") => {
        setRole(selectedRole);
        setError("");
        setSuccess("");

        if (selectedRole === "user") {
            setAdminSecret("");
        }
    };

    const renderPasswordField = (
        label: string,
        placeholder: string,
        value: string,
        onChangeText: (value: string) => void,
        visible: boolean,
        toggleVisibility: () => void
    ) => (
        <>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.passwordContainer}>
                <TextInput
                    style={styles.passwordInput}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                />

                <TouchableOpacity
                    onPress={toggleVisibility}
                    disabled={loading}
                    style={styles.visibilityButton}
                >
                    <Text style={styles.visibilityText}>
                        {visible ? "Hide" : "Show"}
                    </Text>
                </TouchableOpacity>
            </View>
        </>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
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
                        onPress={() => navigation.navigate("Home")}
                        disabled={loading}
                    >
                        <Text style={styles.backText}>
                            ←  Back to Home
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.logo}>
                            <Text style={styles.logoText}>AI</Text>
                        </View>

                        <Text style={styles.appName}>
                            AI Interview Assist
                        </Text>

                        <Text style={styles.tagline}>
                            Your journey towards interview success starts here.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>
                            Create Account
                        </Text>

                        <Text style={styles.subtitle}>
                            Join us and start preparing for your next interview.
                        </Text>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>
                                    {error}
                                </Text>
                            </View>
                        ) : null}

                        {success ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>
                                    {success}
                                </Text>
                            </View>
                        ) : null}

                        <Text style={styles.label}>Full Name</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94A3B8"
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        <Text style={styles.label}>Email Address</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email address"
                            placeholderTextColor="#94A3B8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                        />

                        {renderPasswordField(
                            "Password",
                            "Create a password",
                            password,
                            setPassword,
                            showPassword,
                            () => setShowPassword(!showPassword)
                        )}

                        {renderPasswordField(
                            "Confirm Password",
                            "Re-enter your password",
                            confirmPassword,
                            setConfirmPassword,
                            showConfirmPassword,
                            () => setShowConfirmPassword(!showConfirmPassword)
                        )}

                        <Text style={styles.label}>
                            Account Type
                        </Text>

                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    role === "user" && styles.roleSelected,
                                ]}
                                onPress={() => toggleRole("user")}
                                disabled={loading}
                            >
                                <View style={styles.radioOuter}>
                                    {role === "user" && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>

                                <View>
                                    <Text
                                        style={[
                                            styles.roleText,
                                            role === "user" && styles.roleTextSelected,
                                        ]}
                                    >
                                        User
                                    </Text>
                                    <Text style={styles.roleDescription}>
                                        Practice interviews
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    role === "admin" && styles.roleSelected,
                                ]}
                                onPress={() => toggleRole("admin")}
                                disabled={loading}
                            >
                                <View style={styles.radioOuter}>
                                    {role === "admin" && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>

                                <View>
                                    <Text
                                        style={[
                                            styles.roleText,
                                            role === "admin" && styles.roleTextSelected,
                                        ]}
                                    >
                                        Admin
                                    </Text>
                                    <Text style={styles.roleDescription}>
                                        Manage platform
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {role === "admin" && (
                            <>
                                {renderPasswordField(
                                    "Admin Registration Secret",
                                    "Enter admin secret key",
                                    adminSecret,
                                    setAdminSecret,
                                    showAdminSecret,
                                    () => setShowAdminSecret(!showAdminSecret)
                                )}

                                <Text style={styles.helperText}>
                                    Only authorized administrators can register.
                                </Text>
                            </>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.registerButton,
                                loading && styles.disabledButton,
                            ]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerButtonText}>
                                    {role === "admin"
                                        ? "Create Admin Account"
                                        : "Create Account"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Already have an account?{" "}
                            </Text>

                            <TouchableOpacity
                                onPress={() => navigation.navigate("Login")}
                                disabled={loading}
                            >
                                <Text style={styles.linkText}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.bottomText}>
                        Practice. Improve. Succeed.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F3F6FC",
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 22,
        paddingBottom: 35,
    },
    backButton: {
        alignSelf: "flex-start",
        paddingVertical: 9,
        paddingHorizontal: 14,
        backgroundColor: "#E0E7FF",
        borderRadius: 9,
        marginBottom: 22,
    },
    backText: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "600",
    },
    header: {
        alignItems: "center",
        marginBottom: 25,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 19,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    logoText: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "bold",
    },
    appName: {
        fontSize: 23,
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
        fontSize: 25,
        fontWeight: "bold",
        color: "#172554",
    },
    subtitle: {
        color: "#64748B",
        fontSize: 13,
        marginTop: 7,
        marginBottom: 18,
        lineHeight: 19,
    },
    errorBox: {
        backgroundColor: "#FEE2E2",
        borderWidth: 1,
        borderColor: "#FECACA",
        padding: 12,
        borderRadius: 9,
        marginBottom: 12,
    },
    errorText: {
        color: "#B91C1C",
        fontSize: 13,
    },
    successBox: {
        backgroundColor: "#DCFCE7",
        borderWidth: 1,
        borderColor: "#BBF7D0",
        padding: 12,
        borderRadius: 9,
        marginBottom: 12,
    },
    successText: {
        color: "#166534",
        fontSize: 13,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
        paddingHorizontal: 14,
        color: "#172554",
        fontSize: 14,
        backgroundColor: "#FFFFFF",
    },
    passwordContainer: {
        height: 52,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
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
    visibilityButton: {
        paddingVertical: 8,
        paddingLeft: 10,
    },
    visibilityText: {
        color: "#2563EB",
        fontSize: 12,
        fontWeight: "700",
    },
    roleContainer: {
        flexDirection: "row",
        gap: 10,
    },
    roleOption: {
        flex: 1,
        minHeight: 68,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 11,
        gap: 9,
    },
    roleSelected: {
        borderColor: "#6366F1",
        backgroundColor: "#EEF2FF",
    },
    radioOuter: {
        width: 19,
        height: 19,
        borderWidth: 2,
        borderColor: "#94A3B8",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    radioInner: {
        width: 9,
        height: 9,
        backgroundColor: "#6366F1",
        borderRadius: 5,
    },
    roleText: {
        color: "#475569",
        fontSize: 14,
        fontWeight: "600",
    },
    roleTextSelected: {
        color: "#4338CA",
    },
    roleDescription: {
        color: "#64748B",
        fontSize: 10,
        marginTop: 3,
    },
    helperText: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 8,
    },
    registerButton: {
        height: 53,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 27,
    },
    disabledButton: {
        opacity: 0.6,
    },
    registerButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
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

export default RegisterScreen;
