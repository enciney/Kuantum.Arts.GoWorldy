import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

export type PaymentScreenParams = {
  productId: string;
  productName: string;
  price: number;
  description: string;
  isPremium: boolean;
};

type PaymentRouteProps = RouteProp<{ Payment: PaymentScreenParams }, "Payment">;

const PREMIUM_FEATURES = [
  "Sınırsız konu açma",
  "Reklamsız deneyim",
  "Tüm yorumlara erişim",
  "Öncelikli destek",
];

export function PaymentScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<PaymentRouteProps>();
  const { productId, productName, price, description, isPremium } = route.params;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedCredits, setUpdatedCredits] = useState<number | null>(null);

  const handlePay = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.payment.process(productId, token);
      setUpdatedCredits(result.credits);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ödeme tamamlanamadı.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={Colors.secondary} />
        </View>
        <Text style={styles.successTitle}>Ödeme Başarılı!</Text>
        <Text style={styles.successDesc}>
          {isPremium
            ? `${productName} aktif edildi.`
            : `${updatedCredits} krediniz yüklendi.`}
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.doneBtnText}>Tamam</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ödeme</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Product Card */}
      <View style={[styles.productCard, isPremium && styles.productCardPremium]}>
        <View style={styles.productIconBox}>
          {isPremium ? (
            <MaterialCommunityIcons name="crown" size={40} color={Colors.surface} />
          ) : (
            <FontAwesome5 name="coins" size={36} color={Colors.warning} />
          )}
        </View>
        <Text style={[styles.productName, isPremium && styles.productNamePremium]}>
          {productName}
        </Text>
        <Text style={[styles.productDesc, isPremium && styles.productDescPremium]}>
          {description}
        </Text>
        {isPremium && (
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.surface} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Price Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{productName}</Text>
          <Text style={styles.summaryValue}>{price} TL</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalValue}>{price} TL</Text>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payBtn, loading && styles.payBtnDisabled]}
        onPress={handlePay}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={Colors.surface} />
        ) : (
          <>
            <Ionicons name="card-outline" size={20} color={Colors.surface} />
            <Text style={styles.payBtnText}>Öde — {price} TL</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.secureNote}>
        <Ionicons name="shield-checkmark" size={14} color={Colors.textMuted} />
        <Text style={styles.secureText}>Güvenli simüle ödeme</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingTop: 56, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  headerTitle: { ...Typography.h2, color: Colors.textPrimary },
  closeBtn: { padding: 4 },

  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productCardPremium: {
    backgroundColor: Colors.premium,
    borderColor: Colors.premium,
  },
  productIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  productName: {
    ...Typography.h2,
    fontWeight: "bold",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  productNamePremium: { color: Colors.surface },
  productDesc: {
    ...Typography.label,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  productDescPremium: { color: "#EDE9FE" },
  featureList: { marginTop: Spacing.md, alignSelf: "stretch", gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { ...Typography.label, color: Colors.surface },

  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.body, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalLabel: { ...Typography.body, fontWeight: "700", color: Colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: "bold", color: Colors.primary },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger, lineHeight: 18 },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    gap: 8,
    minHeight: MinTapTarget,
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontSize: 17, fontWeight: "700", color: Colors.surface },

  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  secureText: { ...Typography.small, color: Colors.textMuted },

  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  successIcon: { marginBottom: Spacing.lg },
  successTitle: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 8 },
  successDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl ?? 32,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: Radius.md,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: Colors.surface },
});
