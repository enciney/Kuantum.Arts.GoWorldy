import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../theme";

export interface ActionMenuOption {
  id: string;
  text: string;
  style?: "destructive" | "cancel";
}

interface Props {
  visible: boolean;
  title?: string;
  options: ActionMenuOption[];
  onSelect: (id: string) => void;
  onClose: () => void;
  testID?: string;
}

export function ActionMenuModal({
  visible,
  title,
  options,
  onSelect,
  onClose,
  testID,
}: Props) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        testID={testID ? `${testID}-backdrop` : "action-menu-backdrop"}
        accessibilityLabel="Menüyü kapat"
      >
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="menu"
        >
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {options.map((opt) => {
            const isDestructive = opt.style === "destructive";
            const isCancel = opt.style === "cancel";
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  if (isCancel) {
                    onClose();
                  } else {
                    onSelect(opt.id);
                    onClose();
                  }
                }}
                style={({ pressed }) => [
                  styles.option,
                  isCancel && styles.optionCancel,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityRole="menuitem"
                accessibilityLabel={opt.text}
                testID={testID ? `${testID}-option-${opt.id}` : `action-menu-option-${opt.id}`}
              >
                <Text
                  style={[
                    styles.optionText,
                    isDestructive && styles.optionTextDestructive,
                    isCancel && styles.optionTextCancel,
                  ]}
                >
                  {opt.text}
                </Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  option: {
    minHeight: MinTapTarget,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
  },
  optionCancel: {
    marginTop: Spacing.xs,
    backgroundColor: Colors.background,
  },
  optionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
  },
  optionTextDestructive: {
    color: Colors.danger,
    fontWeight: "600",
  },
  optionTextCancel: {
    color: Colors.textSecondary,
    fontWeight: "600",
    textAlign: "center",
  },
});
