
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from "react-native";

import { useAuth } from "../context/AuthContext";

import AuthNavigator from "./AuthNavigator";
import UserNavigator from "./UserNavigator";
import AdminNavigator from "./AdminNavigator";

const RootNavigator = () => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <AuthNavigator />;
    }

    // console.log("Logged In User:", user);
    // console.log("User Role:", user?.role);

    if (user?.role?.trim().toLowerCase() === "admin") {
        console.log("Opening Admin Dashboard");
        return <AdminNavigator />;
    }

    // console.log("Opening User Dashboard");
    return <UserNavigator />;
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
    },
});

export default RootNavigator;
