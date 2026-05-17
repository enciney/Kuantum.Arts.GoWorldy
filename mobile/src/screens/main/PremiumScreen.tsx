import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { loadPackages } from "./premiumHandlers";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { formatTimeRemaining } from "../../utils/timeUtils";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceTL: number;
}

interface PremiumPackage {
  id: string;
  name: string;
  days: number;
  priceTL: number;
}

export function PremiumScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [credits, setCredits] = useState<number | null>(null);
  const [premiumStatus, setPremiumStatus] = useState<{ isPremium: boolean; premiumUntil?: string }>({ isPremium: false });
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  const refreshUserStatus = useCallback(() => {
    if (!token) return;
    api.users.me(token).then((u) => {
      setCredits(u.credits);
      setPremiumStatus({ isPremium: u.isPremium, premiumUntil: u.premiumUntil });
    }).catch(() => {});
  }, [token]);

  // Ödeme ekranından geri dönünce kredi/premium durumunu yenile
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
        setCreditPackages(data.credits ?? []);
        setPremiumPackages(data.premium ?? []);
      })
      .catch(() => setPackagesError("Paket bilgileri yüklenemedi. Lütfen tekrar deneyin."))
      .finally(() => setPackagesLoading(false));
  }, []);

  const openPayment = (
    productId: string,
    productName: string,
    price: number,
    description: string,
    isPremium: boolean
  ) => {
    navigation.navigate("Payment", { productId, productName, price, description, isPremium });
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

      {/* Kredi Bakiyesi */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <FontAwesome5 name="coins" size={24} color={Colors.warning} />
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.balanceLabel}>Mevcut Bakiyem</Text>
            <Text style={styles.balanceValue}>
              {credits === null ? "—" : `${credits} Kredi`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.balanceBtn}
            onPress={() => {
              const pkg = creditPackages[0];
              if (pkg) {
                openPayment(pkg.id, pkg.name, pkg.priceTL, `${pkg.credits} kredi yüklenir`, false);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.balanceBtnText}>Yükle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {packagesLoading ? (
        <View style={styles.packagesLoader}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* Premium Paketleri */}
          {premiumPackages.map((pkg, index) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.premiumCard}
              onPress={() =>
                openPayment(
                  pkg.id,
                  pkg.name,
                  pkg.priceTL,
                  `${pkg.days} gün Premium üyelik`,
                  true
                )
              }
              activeOpacity={0.85}
            >
              {index === 0 && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>EN AVANTAJLI</Text>
                </View>
              )}
              <View style={styles.premiumHeader}>
                <MaterialCommunityIcons name="crown" size={32} color={Colors.surface} />
                <View style={{ marginLeft: Spacing.sm }}>
                  <Text style={styles.premiumName}>{pkg.name}</Text>
                  <Text style={styles.premiumPrice}>{pkg.priceTL} TL / {pkg.days} gün</Text>
                </View>
              </View>
              <View style={styles.premiumFeatures}>
                <Feature text="Sınırsız konu açma" />
                <Feature text="Reklamsız deneyim" />
                <Feature text="Tüm yorumlara erişim" />
                <Feature text="Öncelikli destek" />
              </View>
              <View style={styles.premiumCta}>
                <Text style={styles.premiumCtaText}>Şimdi Premium Ol</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.premium} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Kredi Paketleri */}
          <Text style={styles.sectionTitle}>Tek Kullanımlık Krediler</Text>
          {creditPackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.actionCard}
              onPress={() =>
                openPayment(pkg.id, pkg.name, pkg.priceTL, `${pkg.credits} kredi yüklenir`, false)
              }
              activeOpacity={0.8}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{pkg.name}</Text>
                <Text style={styles.actionDesc}>{pkg.credits} kredi</Text>
              </View>
              <View style={styles.actionPriceBox}>
                <Text style={styles.actionPrice}>{pkg.priceTL} TL</Text>
              </View>
            </TouchableOpacity>
          ))}
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
  title: { ...Typography.h1, color: Colors.textPrimary },
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
  premiumCard: {
    backgroundColor: Colors.premium,
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: Spacing.lg,
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
  premiumPrice: { ...Typography.label, color: Colors.premiumLight, marginTop: 2 },
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
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
