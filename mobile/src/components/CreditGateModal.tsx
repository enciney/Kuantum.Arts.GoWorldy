import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../theme";

interface Props {
  visible: boolean;
  actionLabel: string;
  cost: number;
  userCredits: number;
  deducting: boolean;
  onDeduct: () => void;
  onBuy: () => void;
  onClose: () => void;
}

export function CreditGateModal({
  visible,
  actionLabel,
  cost,
  userCredits,
  deducting,
  onDeduct,
  onBuy,
  onClose,
}: Props) {
  const canAfford = userCredits >= cost;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Coin icon */}
        <View style={styles.iconBox}>
          <FontAwesome5 name="coins" size={28} color={Colors.warning} />
        </View>

        {/* Title + subtitle */}
        <Text style={styles.title}>Bu işlem kredi gerektirir</Text>
        <Text style={styles.subtitle}>
          <Text style={styles.actionHighlight}>{actionLabel}</Text>
          {" için "}
          <Text style={styles.costHighlight}>{cost} kredi</Text>
          {" harcanacak."}
        </Text>

        {/* Balance row */}
        <View style={styles.balanceRow}>
          <Ionicons name="wallet-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.balanceLabel}>Mevcut bakiyen:</Text>
          <Text
            style={[
              styles.balanceAmount,
              !canAfford && styles.balanceInsufficient,
            ]}
          >
            {userCredits} kredi
          </Text>
        </View>

        {/* Insufficient credit warning */}
        {!canAfford && (
          <View style={styles.insufficientNote}>
            <Ionicons name="information-circle" size={14} color={Colors.warning} />
            <Text style={styles.insufficientText}>
              Bu işlem için yeterli kredin yok.
            </Text>
          </View>
        )}

        {/* Primary CTA — only shown when user can afford */}
        {canAfford && (
          <TouchableOpacity
            style={[styles.btnPrimary, deducting && styles.btnDisabled]}
            onPress={onDeduct}
            disabled={deducting}
            activeOpacity={0.8}
          >
            {deducting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome5 name="coins" size={15} color="#fff" />
                <Text style={styles.btnPrimaryText}>
                  Bakiyeden Düş ({cost} kredi)
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Secondary CTA — always shown */}
        <TouchableOpacity
          style={[styles.btnSecondary, canAfford && styles.btnSecondaryOutlined]}
          onPress={onBuy}
          activeOpacity={0.8}
        >
          <Ionicons
            name="star"
            size={15}
            color={canAfford ? Colors.primary : "#fff"}
          />
          <Text
            style={[
              styles.btnSecondaryText,
              canAfford && styles.btnSecondaryTextOutlined,
            ]}
          >
            {canAfford ? "Daha Fazla Kredi Al" : "Premium'a Geç / Kredi Satın Al"}
          </Text>
        </TouchableOpacity>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
          <Text style={styles.cancelText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: "center",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.warningLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  actionHighlight: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  costHighlight: {
    color: Colors.warning,
    fontWeight: "700",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    alignSelf: "stretch",
  },
  balanceLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    flex: 1,
  },
  balanceAmount: {
    ...Typography.label,
    color: Colors.secondary,
    fontWeight: "700",
  },
  balanceInsufficient: {
    color: Colors.danger,
  },
  insufficientNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    alignSelf: "stretch",
  },
  insufficientText: {
    ...Typography.caption,
    color: Colors.warning,
    flex: 1,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    alignSelf: "stretch",
    marginBottom: Spacing.sm,
    minHeight: MinTapTarget,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimaryText: {
    color: "#fff",
    ...Typography.label,
    fontWeight: "700",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.premium,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    alignSelf: "stretch",
    marginBottom: Spacing.sm,
    minHeight: MinTapTarget,
  },
  btnSecondaryOutlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    color: "#fff",
    ...Typography.label,
    fontWeight: "600",
  },
  btnSecondaryTextOutlined: {
    color: Colors.primary,
  },
  cancelLink: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  cancelText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
