import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../theme";
import { formatPremiumUntil } from "../utils/timeUtils";
import { api } from "../services/api";

interface PremiumStatusModalProps {
  visible: boolean;
  onClose: () => void;
  isPremium: boolean;
  premiumUntil?: string;
  autoRenew?: boolean;
  token: string;
  onCancelled: () => void;
  onBuyPress: () => void;
}

const SUBSCRIPTION_FEATURES = [
  "Sınırsız konu açma",
  "Sınırsız yorum yazma",
  "Haftada 20 DM hakkı",
];

export function PremiumStatusModal({
  visible,
  onClose,
  isPremium,
  premiumUntil,
  autoRenew,
  token,
  onCancelled,
  onBuyPress,
}: PremiumStatusModalProps) {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isActive =
    isPremium &&
    !!premiumUntil &&
    new Date(premiumUntil) > new Date();

  const handleCancelConfirm = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await api.payment.cancelSubscription(token);
      setConfirmVisible(false);
      setCancelling(false);
      // Önce modal'ı kapat, sonra parent'ı güncelle (real-time)
      onClose();
      onCancelled();
    } catch (e: unknown) {
      setCancelling(false);
      setCancelError(e instanceof Error ? e.message : "İptal işlemi başarısız oldu.");
    }
  };

  const handleClose = () => {
    setConfirmVisible(false);
    setCancelError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* İkon + Başlık */}
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="crown"
                size={48}
                color={isActive ? Colors.premium : Colors.textMuted}
              />
            </View>
            <Text style={styles.title}>
              {isActive ? "Premium Üyeliğiniz Aktif" : "Premium Üye Değilsiniz"}
            </Text>

            {isActive && premiumUntil ? (
              <>
                {/* Tarih bandı */}
                <View style={styles.dateBand}>
                  <Ionicons name="time-outline" size={16} color={Colors.surface} />
                  <Text style={styles.dateBandText}>
                    {formatPremiumUntil(premiumUntil)}
                  </Text>
                </View>

                {/* Auto-renew durumu */}
                <View style={styles.infoRow}>
                  <Ionicons
                    name={autoRenew ? "repeat" : "repeat-outline"}
                    size={16}
                    color={autoRenew ? Colors.secondary : Colors.textMuted}
                  />
                  <Text style={[styles.infoText, { color: autoRenew ? Colors.secondary : Colors.textMuted }]}>
                    {autoRenew ? "Otomatik yenileme açık" : "Otomatik yenileme kapalı"}
                  </Text>
                </View>

                {/* Dahil özellikler */}
                <Text style={styles.featuresTitle}>Paketinizde Dahil Özellikler</Text>
                <View style={styles.featureList}>
                  {SUBSCRIPTION_FEATURES.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={18} color={Colors.secondary} />
                      <Text style={styles.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                {/* ── İptal onay bloğu ── */}
                {confirmVisible ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmTitle}>Aboneliği iptal etmek istediğinizden emin misiniz?</Text>
                    <Text style={styles.confirmDesc}>
                      İptal edildiğinde premium erişiminiz hemen sona erecek.
                    </Text>
                    {cancelError && (
                      <Text style={styles.errorText}>{cancelError}</Text>
                    )}
                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => { setConfirmVisible(false); setCancelError(null); }}
                        disabled={cancelling}
                      >
                        <Text style={styles.backBtnText}>Vazgeç</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmCancelBtn, cancelling && { opacity: 0.6 }]}
                        onPress={handleCancelConfirm}
                        disabled={cancelling}
                        activeOpacity={0.8}
                      >
                        {cancelling ? (
                          <ActivityIndicator size="small" color={Colors.surface} />
                        ) : (
                          <Text style={styles.confirmCancelBtnText}>Evet, İptal Et</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setConfirmVisible(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={Colors.danger} />
                    <Text style={styles.cancelBtnText}>Aboneliği İptal Et</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.subtitleText}>
                  Premium üyelikle sınırsız konu açabilir, yorum yapabilir ve daha fazlasına erişebilirsiniz.
                </Text>
                <View style={styles.featureList}>
                  {SUBSCRIPTION_FEATURES.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle-outline" size={18} color={Colors.textSecondary} />
                      <Text style={[styles.featureText, { color: Colors.textSecondary }]}>{f}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => { handleClose(); onBuyPress(); }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="crown" size={18} color={Colors.surface} />
                  <Text style={styles.buyBtnText}>Premium'a Geç</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  closeBtn: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
  },
  iconBox: {
    alignItems: "center",
    marginBottom: Spacing.sm,
    marginTop: 4,
  },
  title: {
    ...Typography.h2,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  dateBand: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  dateBandText: {
    ...Typography.label,
    color: Colors.surface,
    fontWeight: "600",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.small,
    fontWeight: "500",
  },
  featuresTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  featureList: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    ...Typography.label,
    color: Colors.textPrimary,
    flex: 1,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: 12,
    gap: 6,
    minHeight: MinTapTarget,
  },
  cancelBtnText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  confirmBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.danger,
  },
  confirmDesc: {
    ...Typography.small,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    ...Typography.small,
    color: Colors.danger,
    fontWeight: "600",
  },
  confirmActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Colors.danger,
    alignItems: "center",
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.surface,
  },
  subtitleText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  buyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.premium,
    borderRadius: Radius.md,
    paddingVertical: 14,
    gap: 8,
    minHeight: MinTapTarget,
  },
  buyBtnText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
});
