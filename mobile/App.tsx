
import React, { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  View,
  Image,
  StyleSheet,
  Text,
  Animated,
  Pressable,
} from "react-native";

import * as Application from "expo-application";
import * as Network from "expo-network";
import Constants from "expo-constants";

import {
  fetchLatestUpdate,
  isUpdateAvailable,
} from "./src/services/updateService";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
  const { theme } = useTheme();

  const [showSplash, setShowSplash] = useState(true);
  const [networkAvailable, setNetworkAvailable] = useState<boolean | null>(null);
  const [checkingNetwork, setCheckingNetwork] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;

  // Check Internet Connection
  const checkInternetConnection = async () => {
    try {
      setCheckingNetwork(true);

      const networkState = await Network.getNetworkStateAsync();

      const connected =
        networkState.isConnected === true &&
        networkState.isInternetReachable !== false;

      setNetworkAvailable(connected);
    } catch (error) {
      console.log("Internet Check Error:", error);
      setNetworkAvailable(false);
    } finally {
      setCheckingNetwork(false);
    }
  };

  // Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    Animated.timing(progress, {
      toValue: 100,
      duration: 5000,
      useNativeDriver: false,
    }).start();

    return () => {
      clearTimeout(timer);
      progress.stopAnimation();
    };
  }, [progress]);

  // Initial Internet Check + Live Connection Monitoring
  useEffect(() => {
    checkInternetConnection();

    const subscription = Network.addNetworkStateListener((state) => {
      const connected =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setNetworkAvailable(connected);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check App Updates
  useEffect(() => {
    if (showSplash || networkAvailable !== true) return;

    let isActive = true;

    const checkForUpdates = async () => {
      try {
        const currentVersion = Constants.expoConfig?.version ?? "1.0.0";

        const currentVersionCode = Number(
          Constants.expoConfig?.android?.versionCode ?? 1
        );

        console.log("Current App Version:", currentVersion);
        console.log("Current Version Code:", currentVersionCode);

        const latestUpdate = await fetchLatestUpdate();

        console.log("Latest App Version:", latestUpdate.version);
        console.log("Latest Version Code:", latestUpdate.versionCode);

        if (
          isUpdateAvailable(
            currentVersionCode,
            latestUpdate.versionCode
          )
        ) {
          if (isActive) {
            console.log("New Update Available:", latestUpdate);
          }
        } else {
          console.log("App is already up to date.");
        }
      } catch (error) {
        console.log("Unable to check for app updates:", error);
      }
    };

    checkForUpdates();

    return () => {
      isActive = false;
    };
  }, [showSplash, networkAvailable]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // Splash Screen
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" />

        <Image
          source={require("./assets/ai-interview-assist-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Preparing Your Interview Experience...
          </Text>

          <Text style={styles.loadingSubText}>
            AI Powered Interview Preparation
          </Text>

          <View style={styles.progressBackground}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>

          <Text style={styles.progressLabel}>
            Getting Everything Ready...
          </Text>

          <Text style={styles.footerTagline}>
            Trust  •  Practise  •  Success
          </Text>
        </View>
      </View>
    );
  }

  // Checking Internet
  if (networkAvailable === null) {
    return (
      <View style={styles.connectionContainer}>
        <StatusBar barStyle="dark-content" />

        <Text style={styles.connectionTitle}>
          Checking Internet Connection...
        </Text>

        <Text style={styles.connectionMessage}>
          Please wait while we check your connection.
        </Text>
      </View>
    );
  }

  // Internet Not Available
  if (!networkAvailable) {
    return (
      <View style={styles.connectionContainer}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.connectionIcon}>
          <Text style={styles.wifiIcon}>!</Text>
        </View>

        <Text style={styles.connectionTitle}>
          Please Connect to Internet
        </Text>

        <Text style={styles.connectionMessage}>
          Please turn on your internet connection to use AI Interview Assist.
        </Text>

        <Pressable
          style={[
            styles.retryButton,
            checkingNetwork && styles.retryButtonDisabled,
          ]}
          onPress={checkInternetConnection}
          disabled={checkingNetwork}
        >
          <Text style={styles.retryButtonText}>
            {checkingNetwork ? "Checking..." : "Retry"}
          </Text>
        </Pressable>
      </View>
    );
  }

  // Main Application
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={theme === "Dark" ? "light-content" : "dark-content"}
      />
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 75,
  },

  logo: {
    width: "95%",
    height: 280,
  },

  loadingContainer: {
    width: "82%",
    alignItems: "center",
    marginTop: 180,
  },

  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4F46E5",
    textAlign: "center",
  },

  loadingSubText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 8,
  },

  progressBackground: {
    width: "100%",
    height: 6,
    backgroundColor: "#EDE9FE",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 22,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#7C3AED",
    borderRadius: 10,
  },

  progressLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 10,
    fontWeight: "500",
  },

  footerTagline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7C3AED",
    marginTop: 25,
    letterSpacing: 0.6,
  },

  connectionContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  connectionIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  wifiIcon: {
    fontSize: 48,
    fontWeight: "800",
    color: "#DC2626",
  },

  connectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
  },

  connectionMessage: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 12,
  },

  retryButton: {
    backgroundColor: "#6D5CE8",
    paddingHorizontal: 45,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 28,
  },

  retryButtonDisabled: {
    opacity: 0.6,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
