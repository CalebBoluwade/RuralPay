/**
 * SessionExpiryModal
 * Displayed when user's session expires (JWT token becomes invalid)
 * Blocks all interaction and forces user to log in again
 */

import React, { useEffect } from "react";
import {
    ActivityIndicator,
    BackHandler,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

interface SessionExpiryModalProps {
  visible: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SessionExpiryModal({
  visible,
  onConfirm,
  isLoading = false,
}: Readonly<SessionExpiryModalProps>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
    modalContent: {
      backgroundColor: isDark ? "#1a1a1a" : "#ffffff",
      borderRadius: 16,
      padding: 24,
      width: "85%",
      maxWidth: 320,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    icon: {
      fontSize: 32,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#f8fafc" : "#020617",
      marginBottom: 8,
      textAlign: "center",
    },
    message: {
      fontSize: 14,
      color: isDark ? "#cbd5e1" : "#475569",
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 20,
    },
    button: {
      backgroundColor: "#dc2626",
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      width: "100%",
      alignItems: "center",
      opacity: isLoading ? 0.6 : 1,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
    },
  });

  // Block Android back button from closing modal
  useEffect(() => {
    if (!visible) return;

    const unsubscribe = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Return true to prevent default back button behavior
        return true;
      },
    );

    return () => unsubscribe.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      onRequestClose={() => {
        // Prevent dismissal on Android back button
        // Modal can only be dismissed via onConfirm button
      }}
    >
      <View style={styles.container}>
        <Pressable
          style={styles.overlay}
          disabled={true}
          onPress={() => {
            // Block touches outside modal
          }}
        />

        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⏱️</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Session Expired</Text>

          {/* Message */}
          <Text style={styles.message}>
            Your session has expired. Please log in again to continue.
          </Text>

          {/* Button */}
          <Pressable
            style={styles.button}
            onPress={onConfirm}
            disabled={isLoading}
            android_ripple={{ color: "rgba(255, 255, 255, 0.3)" }}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Log In Again</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
