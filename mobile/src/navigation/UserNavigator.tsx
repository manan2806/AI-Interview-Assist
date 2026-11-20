import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import UserDashboardScreen from "../screens/User/UserDashboardScreen";
import ProfileScreen from "../screens/User/ProfileScreen";
import ProfileImprovementScreen from "../screens/User/ProfileImprovementScreen";
import InterviewSetupScreen from "../screens/User/InterviewSetupScreen";
import InterviewSessionScreen from "../screens/User/InterviewSessionScreen";
import InterviewHistoryScreen from "../screens/User/InterviewHistoryScreen";
import InterviewResultScreen from "../screens/User/InterviewResultScreen";
import InterviewDetailsScreen from "../screens/User/InterviewDetailsScreen";
import PerformanceChartScreen from "../screens/User/PerformanceChartScreen";
import ReviewsScreen from "../screens/User/ReviewsScreen";
import AnnouncementsScreen from "../screens/User/AnnouncementsScreen";
import SupportScreen from "../screens/User/SupportScreen";
import SettingsScreen from "../screens/User/SettingsScreen";

export type UserStackParamList = {
    UserDashboard: undefined;
    Profile: undefined;
    ProfileImprovement: undefined;
    InterviewSetup: undefined;

    InterviewSession: {
        interviewId: string;
        setup: {
            field: string;
            target_role: string;
            job_role: string;
            experience_level: string;
            interview_type: string;
            difficulty: string;
            number_of_questions: number;
            duration: string;
            custom_duration: number | null;
        };
    };

    InterviewHistory: undefined;

    InterviewResult: {
        interviewId: string;
        from?: "dashboard" | "history";
    };

    InterviewDetails: {
        interviewId: string;
    };

    PerformanceChart: undefined;
    Reviews: undefined;
    Announcements: undefined;
    Support: undefined;
    Settings: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();

const UserNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="UserDashboard"
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name="UserDashboard"
                component={UserDashboardScreen}
            />

            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
            />

            <Stack.Screen
                name="ProfileImprovement"
                component={ProfileImprovementScreen}
            />

            <Stack.Screen
                name="InterviewSetup"
                component={InterviewSetupScreen}
            />

            <Stack.Screen
                name="InterviewSession"
                component={InterviewSessionScreen}
            />

            <Stack.Screen
                name="InterviewHistory"
                component={InterviewHistoryScreen}
            />

            <Stack.Screen
                name="InterviewResult"
                component={InterviewResultScreen}
            />

            <Stack.Screen
                name="InterviewDetails"
                component={InterviewDetailsScreen}
            />

            <Stack.Screen
                name="PerformanceChart"
                component={PerformanceChartScreen}
                options={{
                    title: "Performance Analytics",
                }}
            />

            <Stack.Screen
                name="Reviews"
                component={ReviewsScreen}
            />

            <Stack.Screen
                name="Announcements"
                component={AnnouncementsScreen}
            />

            <Stack.Screen
                name="Support"
                component={SupportScreen}
            />

            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
            />
        </Stack.Navigator>
    );
};

export default UserNavigator;