
// import React, { useEffect, useState } from "react";
// import {
//   StatusBar,
//   View,
//   Image,
//   StyleSheet,
//   Text,
//   ActivityIndicator,
// } from "react-native";

// import { NavigationContainer } from "@react-navigation/native";
// import { SafeAreaProvider } from "react-native-safe-area-context";

// import { AuthProvider } from "./src/context/AuthContext";
// import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import RootNavigator from "./src/navigation/RootNavigator";

// function AppContent() {
//   const { theme } = useTheme();
//   const [showSplash, setShowSplash] = useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setShowSplash(false);
//     }, 5000);

//     return () => clearTimeout(timer);
//   }, []);

//   if (showSplash) {
//     return (
//       <View style={styles.splashContainer}>
//         <StatusBar barStyle="dark-content" />

//         <Image
//           source={require("./assets/ai-interview-assist-logo.png")}
//           style={styles.logo}
//           resizeMode="contain"
//         />

//         <View style={styles.loadingContainer}>
//           <ActivityIndicator
//             size="small"
//             color="#7C3AED"
//           />

//           <Text style={styles.loadingText}>
//             Preparing Your Interview Experience...
//           </Text>

//           <Text style={styles.loadingSubText}>
//             AI Powered Interview Preparation
//           </Text>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <StatusBar
//         barStyle={theme === "Dark" ? "light-content" : "dark-content"}
//       />
//       <RootNavigator />
//     </NavigationContainer>
//   );
// }

// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <AuthProvider>
//         <ThemeProvider>
//           <AppContent />
//         </ThemeProvider>
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   splashContainer: {
//     flex: 1,
//     backgroundColor: "#FFFFFF",
//     alignItems: "center",
//     paddingTop: 100,
//   },

//   logo: {
//     width: "95%",
//     height: 280,
//   },

//   loadingContainer: {
//     alignItems: "center",
//     marginTop: 180,
//   },

//   loadingText: {
//     fontSize: 13,
//     fontWeight: "700",
//     color: "#4F46E5",
//     letterSpacing: 0.3,
//     marginTop: 12,
//   },

//   loadingSubText: {
//     fontSize: 11,
//     color: "#64748B",
//     marginTop: 7,
//   },
// });

import React, { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  View,
  Image,
  StyleSheet,
  Text,
  Animated,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

function AppContent() {
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  const progress = useRef(new Animated.Value(0)).current;

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

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="dark-content" />

        {/* App Logo */}
        <Image
          source={require("./assets/ai-interview-assist-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Loading Section */}
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

  badge: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7C3AED",
    letterSpacing: 0.8,
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

  footer: {
    position: "absolute",
    bottom: 45,
    alignItems: "center",
    paddingHorizontal: 15,
  },

  footerMessage: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  footerTagline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#7C3AED",
    marginTop: 25,
    letterSpacing: 0.6,
  },

});
