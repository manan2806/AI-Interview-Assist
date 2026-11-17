
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/Auth/HomeScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";
import VerifyOTPScreen from "../screens/Auth/VerifyOTPScreen";
import ResetPasswordScreen from "../screens/Auth/ResetPasswordScreen";

export type AuthStackParamList = {
    Home: undefined;
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    VerifyOTP: { email: string };
    ResetPassword: { email: string, resetToken: string; };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
