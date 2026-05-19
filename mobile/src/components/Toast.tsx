import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius } from "../theme";

export type ToastVariant = "success" | "info" | "error";

interface Props {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: () => void;
  testID?: string;
}

const VARIANT_STYLE: Record<ToastVariant, { bg: string; border: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; text: string }> = {
  success: { bg: "#ECFDF5", border: "#A7F3D0", icon: "checkmark-circle", iconColor: "#10B981", text: "#065F46" },
  info: { bg: "#EFF6FF", border: "#BFDBFE", icon: "information-circle", iconColor: "#2563EB", text: "#1E3A8A" },
  error: { bg: "#FEE2E2", border: "#FCA5A5", icon: "alert-circle", iconColor: "#DC2626", text: "#7F1D1D" },
};

export function Toast({
  visible,
  message,
  variant = "success",
  duration = 3000,
  onClose,
  testID,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        onCloseRef.current();
      });
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, opacity]);

  if (!visible) return null;

  const v = VARIANT_STYLE[variant];

  return (
    <Animated.View
      style={[styles.wrap, { opacity, backgroundColor: v.bg, borderColor: v.border }]}
      pointerEvents="box-none"
      testID={testID ?? "toast"}
    >
      <View style={styles.row}>
        <Ionicons name={v.icon} size={22} color={v.iconColor} />
        <Text style={[styles.message, { color: v.text }]} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          testID={testID ? `${testID}-close` : "toast-close"}
          accessibilityLabel="Bildirimi kapat"
        >
          <Ionicons name="close" size={20} color={v.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 56,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    zIndex: 9999,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  message: {
    ...Typography.body,
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
  },
});
