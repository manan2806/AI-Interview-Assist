
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminDashboardScreen from "../screens/Admin/AdminDashboardScreen";

export type AdminStackParamList = {
    AdminDashboard: undefined;
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
        </Stack.Navigator>
    );
};

export default AdminNavigator;
