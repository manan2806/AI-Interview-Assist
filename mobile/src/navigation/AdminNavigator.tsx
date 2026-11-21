import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";
import AdminUsersScreen from "../screens/Admin/AdminUsersScreen";
import AdminSettingsScreen from "../screens/Admin/AdminSettingsScreen";
import AdminReviewsScreen from "../screens/Admin/AdminReviewsScreen";
import AdminReportsScreen from "../screens/Admin/AdminReportsScreen";
import AdminProfileScreen from "../screens/Admin/AdminProfileScreen";
import AdminProblemReportsScreen from "../screens/Admin/AdminProblemReportsScreen";
import AdminInterviewScreen from "../screens/Admin/AdminInterviewScreen";
import AdminAnnouncementsScreen from "../screens/Admin/AdminAnnouncementsScreen";
import AdminActivityLogsScreen from "../screens/Admin/AdminActivityLogsScreen";

export type AdminStackParamList = {
    AdminDashboard: undefined;
    AdminUsers: undefined;
    AdminSettings: undefined;
    AdminReviews: undefined;
    AdminReports: undefined;
    AdminProfile: undefined;
    AdminProblemReports: undefined;
    AdminInterview: undefined;
    AdminAnnouncements: undefined;
    AdminActivityLogs: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="AdminDashboard"
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
            />

            <Stack.Screen
                name="AdminUsers"
                component={AdminUsersScreen}
            />

            <Stack.Screen
                name="AdminSettings"
                component={AdminSettingsScreen}
            />

            <Stack.Screen
                name="AdminReviews"
                component={AdminReviewsScreen}
            />

            <Stack.Screen
                name="AdminReports"
                component={AdminReportsScreen}
            />

            <Stack.Screen
                name="AdminProfile"
                component={AdminProfileScreen}
            />

            <Stack.Screen
                name="AdminProblemReports"
                component={AdminProblemReportsScreen}
            />

            <Stack.Screen
                name="AdminInterview"
                component={AdminInterviewScreen}
            />

            <Stack.Screen
                name="AdminAnnouncements"
                component={AdminAnnouncementsScreen}
            />

            <Stack.Screen
                name="AdminActivityLogs"
                component={AdminActivityLogsScreen}
            />
        </Stack.Navigator>
    );
};

export default AdminNavigator;
