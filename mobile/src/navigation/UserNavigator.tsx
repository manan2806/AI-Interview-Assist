
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import UserDashboardScreen from "../screens/User/UserDashboardScreen";

export type UserStackParamList = {
    UserDashboard: undefined;
};

const Stack = createNativeStackNavigator<UserStackParamList>();

const UserNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="UserDashboard"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="UserDashboard"
                component={UserDashboardScreen}
            />
        </Stack.Navigator>
    );
};

export default UserNavigator;
