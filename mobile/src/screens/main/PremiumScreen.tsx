import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { loadPackages } from "./premiumHandlers";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { formatTimeRemaining } from "../../utils/timeUtils";

interface PremiumPackage {
  id: string;
  name: string;
  description?: string;
  days: number;
  priceTL: number;
  features?: string[];
  isSubscription?: boolean;
  subscriptionDiscountPercent?: number;
}

export function PremiumScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [premiumStatus, setPremiumStatus] = useState<{ isPremium: boolean; premiumUntil?: string }>({ isPremium: false });
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  // Abonelik (auto-renew) toggle — açıkken subscription paketlerde indirim uygulanır
  const [autoRenew, setAutoRenew] = useState(false);

  const refreshUserStatus = useCallback(() => {
    if (!token) return;
    api.users.me(token).then((u) => {
      setPremiumStatus({ isPremium: u.isPremium, premiumUntil: u.premiumUntil });
    }).catch(() => {});
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      refreshUserStatus();
    }, [refreshUserStatus])
  );

  useEffect(() => {
    setPackagesLoading(true);
    setPackagesError(null);
    loadPackages()
      .then((data) => {
        setPremiumPackages(data.premium ?? []);
      })
      .catch(() => setPackagesError("Paket bilgileri yüklenemedi. Lütfen tekrar deneyin."))
      .finally(() => setPackagesLoading(false));
  }, []);

  const subscriptionPackages = useMemo(
    () => premiumPackages.filter((p) => p.isSubscription),
    [premiumPackages]
  );
  const oneTimePackages = useMemo(
    () => premiumPackages.filter((p) => !p.isSubscription),
    [premiumPackages]
  );

  const openPayment = (
    pkg: PremiumPackage,
    applyAutoRenew: boolean
  ) => {
    const discount = applyAutoRenew && pkg.isSubscription ? (pkg.subscriptionDiscountPercent ?? 0) : 0;
    const finalPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
    navigation.navigate("Payment", {
      productId: pkg.id,
      productName: pkg.name,
      price: finalPrice,
      originalPrice: pkg.priceTL,
      discountPct: discount,
      autoRenew: applyAutoRenew && !!pkg.isSubscription,
      features: pkg.features ?? [],
      description: pkg.description ?? `${pkg.days} gün süreyle aktif`,
    });
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Premium</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {packagesError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.errorBannerText}>{packagesError}</Text>
        </View>
      )}

      {/* Aktif Premium Kartı */}
      {premiumStatus.isPremium && (
        <View style={styles.activePremiumCard}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.surface} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.activePremiumTitle}>Aktif Premium Üye</Text>
            {premiumStatus.premiumUntil && (
              <Text style={styles.activePremiumSub}>
                {formatTimeRemaining(premiumStatus.premiumUntil)}
              </Text>
            )}
          </View>
        </View>
      )}

      {packagesLoading ? (
        <View style={styles.packagesLoader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* Abonelik Bundle'ları */}
          {subscriptionPackages.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Abonelik Paketleri</Text>
                {subscriptionPackages[0]?.subscriptionDiscountPercent ? (
                  <Text style={styles.sectionHint}>
                    Otomatik yenile = %{subscriptionPackages[0].subscriptionDiscountPercent} indirim
                  </Text>
                ) : null}
              </View>

              {/* AutoRenew toggle — bildirim toggle'ı stilinde */}
              <View style={styles.toggleCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Otomatik yenile (abonelik)</Text>
                  <Text style={styles.toggleDesc}>
                    Açıkken aşağıdaki abonelik paketleri %{subscriptionPackages[0]?.subscriptionDiscountPercent ?? 0} indirimli görünür ve süre sonunda otomatik yenilenir.
                  </Text>
                </View>
                <Switch
                  value={autoRenew}
                  onValueChange={setAutoRenew}
                  trackColor={{ false: Colors.border, true: Colors.premium }}
                  thumbColor={Colors.surface}
                  accessibilityLabel="Otomatik yenile"
                />
              </View>

              {subscriptionPackages.map((pkg, index) => {
                const discount = autoRenew ? (pkg.subscriptionDiscountPercent ?? 0) : 0;
                const finalPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
                return (
                  <TouchableOpacity
                    key={pkg.id}
                    style={styles.premiumCard}
                    onPress={() => openPayment(pkg, autoRenew)}
                    activeOpacity={0.85}
                  >
                    {index === subscriptionPackages.length - 1 && subscriptionPackages.length > 1 && (
                      <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>EN AVANTAJLI</Text>
                      </View>
                    )}
                    <View style={styles.premiumHeader}>
                      <MaterialCommunityIcons name="crown" size={32} color={Colors.surface} />
                      <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                        <Text style={styles.premiumName}>{pkg.name}</Text>
                        <View style={styles.priceRow}>
                          {discount > 0 && (
                            <Text style={styles.priceOld}>{pkg.priceTL} TL</Text>
                          )}
                          <Text style={styles.premiumPrice}>{finalPrice} TL / {pkg.days} gün</Text>
                        </View>
                        {discount > 0 && (
                          <Text style={styles.discountChip}>%{discount} indirim uygulandı</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.premiumFeatures}>
                      {(pkg.features ?? []).map((f) => (
                        <Feature key={f} text={f} />
                      ))}
                    </View>
                    <View style={styles.premiumCta}>
                      <Text style={styles.premiumCtaText}>
                        {autoRenew ? "Aboneliği Başlat" : "Bir Sefer Satın Al"}
                      </Text>
                      <Ionicons name="arrow-forward" size={18} color={Colors.premium} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Tek seferlik özellik paketleri */}
          {oneTimePackages.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Tek Seferlik Paketler</Text>
              {oneTimePackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.oneTimeCard}
                  onPress={() => openPayment(pkg, false)}
                  activeOpacity={0.85}
                >
                  <View style={styles.oneTimeIcon}>
                    <Ionicons name="cube-outline" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.oneTimeName}>{pkg.name}</Text>
                    <Text style={styles.oneTimeDesc} numberOfLines={2}>
                      {pkg.description ?? (pkg.features ?? []).join(" • ")}
                    </Text>
                  </View>
                  <View style={styles.oneTimePriceBox}>
                    <Text style={styles.oneTimePrice}>{pkg.priceTL} TL</Text>
                    <Text style={styles.oneTimeDuration}>{pkg.days} gün</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

        </>
      )}

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
        <Text style={styles.footerText}>Güvenli ödeme</Text>
      </View>
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={18} color={Colors.surface} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, paddingTop: 56, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dangerLight,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: Colors.danger, lineHeight: 18 },
  activePremiumCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  activePremiumTitle: { ...Typography.label, fontWeight: "700", color: Colors.surface },
  activePremiumSub: { ...Typography.small, color: Colors.surface, marginTop: 2, lineHeight: 17 },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceLabel: { ...Typography.caption, color: Colors.textSecondary },
  balanceValue: { fontSize: 22, fontWeight: "bold", color: Colors.textPrimary, marginTop: 2 },
  balanceBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget,
    justifyContent: "center",
  },
  balanceBtnText: { ...Typography.caption, color: Colors.surface, fontWeight: "600" },
  packagesLoader: { paddingVertical: Spacing.lg, alignItems: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sectionHint: {
    ...Typography.small,
    color: Colors.premium,
    fontWeight: "600",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  toggleTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  toggleDesc: { ...Typography.small, color: Colors.textSecondary, marginTop: 4, lineHeight: 17 },
  premiumCard: {
    backgroundColor: Colors.premium,
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: Spacing.md,
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  premiumBadgeText: { color: Colors.surface, fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  premiumHeader: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  premiumName: { ...Typography.h2, fontWeight: "bold", color: Colors.surface },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2, flexWrap: "wrap" },
  priceOld: {
    ...Typography.small,
    color: Colors.premiumLight,
    textDecorationLine: "line-through",
  },
  premiumPrice: { ...Typography.label, color: Colors.premiumLight },
  discountChip: {
    fontSize: 11,
    color: Colors.warning,
    backgroundColor: "rgba(251,191,36,0.18)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
    fontWeight: "600",
  },
  premiumFeatures: { gap: Spacing.sm, marginBottom: Spacing.md },
  featureRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  featureText: { color: Colors.surface, ...Typography.label },
  premiumCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: Radius.md,
    gap: 6,
  },
  premiumCtaText: { color: Colors.premium, fontSize: 15, fontWeight: "bold" },
  oneTimeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  oneTimeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  oneTimeName: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  oneTimeDesc: { ...Typography.small, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  oneTimePriceBox: { alignItems: "flex-end" },
  oneTimePrice: { fontSize: 15, fontWeight: "bold", color: Colors.primary },
  oneTimeDuration: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: MinTapTarget,
    height: MinTapTarget,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary },
  actionDesc: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  actionPriceBox: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  actionPrice: { ...Typography.caption, fontWeight: "bold", color: Colors.textPrimary },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  footerText: { ...Typography.small, color: Colors.textSecondary },
});
