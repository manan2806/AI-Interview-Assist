
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
import { registerUser } from "../../services/authService";

type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

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

                setName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setAdminSecret("");
                setRole("user");

                Alert.alert(
                    "Registration Successful",
                    data.message || "Your account has been created.",
                    [
                        {
                            text: "Go to Login",
                            onPress: () => navigation.navigate("Login"),
                        },
                    ]
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
                    <Text style={styles.title}>Create Account</Text>

                    <Text style={styles.subtitle}>
                        Start your AI-powered interview preparation.
                    </Text>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
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
                        placeholderTextColor="#999"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        editable={!loading}
                    />

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
                        editable={!loading}
                    />

                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Create a password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            editable={!loading}
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

                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm your password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            editable={!loading}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            disabled={loading}
                        >
                            <Text style={styles.showPassword}>
                                {showConfirmPassword ? "🙈" : "👁️"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Account Type</Text>

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

                            <Text
                                style={[
                                    styles.roleText,
                                    role === "user" && styles.roleTextSelected,
                                ]}
                            >
                                User
                            </Text>
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

                            <Text
                                style={[
                                    styles.roleText,
                                    role === "admin" && styles.roleTextSelected,
                                ]}
                            >
                                Admin
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {role === "admin" && (
                        <>
                            <Text style={styles.label}>
                                Admin Registration Secret
                            </Text>

                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Enter admin secret key"
                                    placeholderTextColor="#999"
                                    value={adminSecret}
                                    onChangeText={setAdminSecret}
                                    secureTextEntry={!showAdminSecret}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                />

                                <TouchableOpacity
                                    onPress={() =>
                                        setShowAdminSecret(!showAdminSecret)
                                    }
                                    disabled={loading}
                                >
                                    <Text style={styles.showPassword}>
                                        {showAdminSecret ? "🙈" : "👁️"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.helperText}>
                                Authorized administrators only.
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
                        >
                            <Text style={styles.linkText}>Sign In</Text>
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
        marginBottom: 18,
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
    successBox: {
        backgroundColor: "#DCFCE7",
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
    roleContainer: {
        flexDirection: "row",
        gap: 12,
    },
    roleOption: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: "#DCE3EF",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        gap: 10,
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
    },
    roleTextSelected: {
        color: "#4338CA",
        fontWeight: "bold",
    },
    helperText: {
        color: "#64748B",
        fontSize: 11,
        marginTop: 7,
    },
    registerButton: {
        height: 52,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
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
