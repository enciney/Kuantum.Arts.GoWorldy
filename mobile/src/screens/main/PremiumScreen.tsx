import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

const CREDIT_ITEMS = [
  {
    productType: "credits_50",
    icon: "create" as const,
    title: "Konu Aç",
    description: "Forum'da yeni konu açma hakkı",
    price: "50 TL",
    family: "ionicons" as const,
  },
  {
    productType: "credits_50",
    icon: "comment-multiple" as const,
    title: "Yorum Erişimi",
    description: "1 hafta sınırsız yorum okuma",
    price: "50 TL",
    family: "mc" as const,
  },
  {
    productType: "credits_50",
    icon: "bullhorn" as const,
    title: "Reklam Yayınla",
    description: "Forum'da reklam yayınlama",
    price: "50 TL",
    family: "fa5" as const,
  },
];

export function PremiumScreen() {
  const { token } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.users.me(token).then((u) => setCredits(u.credits)).catch(() => {});
  }, [token]);

  const handlePurchase = async (productType: string, label: string) => {
    if (!token) return;
    Alert.alert(
      "Satın Al",
      `${label} için ödeme sayfasına yönlendirileceksiniz.`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Devam",
          onPress: async () => {
            setPurchasing(productType);
            try {
              const { url } = await api.payment.checkout(
                {
                  productType,
                  successUrl: "goworldy://payment/success",
                  cancelUrl: "goworldy://payment/cancel",
                },
                token
              );
              await Linking.openURL(url);
            } catch (e: unknown) {
              Alert.alert(
                "Ödeme Başlatılamadı",
                e instanceof Error ? e.message : "Stripe yapılandırması eksik olabilir."
              );
            } finally {
              setPurchasing(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Premium</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <FontAwesome5 name="coins" size={24} color={Colors.warning} />
          <View style={{ flex: 1, marginLeft: Spacing.md - 4 }}>
            <Text style={styles.balanceLabel}>Mevcut Bakiyem</Text>
            <Text style={styles.balanceValue}>
              {credits === null ? "—" : `${credits} Kredi`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.balanceBtn}
            onPress={() => handlePurchase("credits_100", "100 Kredi")}
          >
            <Text style={styles.balanceBtnText}>Yükle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Card (Best Value) */}
      <TouchableOpacity
        style={styles.premiumCard}
        onPress={() => handlePurchase("premium_monthly", "Aylık Premium")}
        disabled={purchasing === "premium_monthly"}
      >
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>EN AVANTAJLI</Text>
        </View>
        <View style={styles.premiumHeader}>
          <MaterialCommunityIcons name="crown" size={32} color="#fff" />
          <View style={{ marginLeft: Spacing.md - 4 }}>
            <Text style={styles.premiumTitle}>Aylık Premium</Text>
            <Text style={styles.premiumPrice}>250 TL / ay</Text>
          </View>
        </View>
        <View style={styles.premiumFeatures}>
          <Feature text="Sınırsız konu açma" />
          <Feature text="Reklamsız deneyim" />
          <Feature text="Tüm yorumlara erişim" />
          <Feature text="Öncelikli destek" />
        </View>
        <View style={styles.premiumCta}>
          {purchasing === "premium_monthly" ? (
            <ActivityIndicator color={Colors.premium} />
          ) : (
            <>
              <Text style={styles.premiumCtaText}>Şimdi Premium Ol</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.premium} />
            </>
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Tek Kullanımlık Krediler</Text>

      {CREDIT_ITEMS.map((a) => (
        <TouchableOpacity
          key={a.title}
          style={styles.actionCard}
          onPress={() => handlePurchase(a.productType, a.title)}
          disabled={purchasing === a.productType}
        >
          <View style={styles.actionIcon}>
            {a.family === "ionicons" && (
              <Ionicons name={a.icon} size={24} color={Colors.primary} />
            )}
            {a.family === "mc" && (
              <MaterialCommunityIcons name={a.icon} size={24} color={Colors.primary} />
            )}
            {a.family === "fa5" && (
              <FontAwesome5 name={a.icon} size={20} color={Colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{a.title}</Text>
            <Text style={styles.actionDesc}>{a.description}</Text>
          </View>
          <View style={styles.actionPriceBox}>
            {purchasing === a.productType ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.actionPrice}>{a.price}</Text>
            )}
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
        <Text style={styles.footerText}>Güvenli ödeme — Stripe ile</Text>
      </View>
    </ScrollView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={18} color="#fff" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: Spacing.md,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  balanceBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    minHeight: MinTapTarget - 8,
    justifyContent: "center",
  },
  balanceBtnText: {
    ...Typography.caption,
    color: "#fff",
    fontWeight: "600",
  },
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
  premiumBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  premiumTitle: {
    ...Typography.h2,
    fontWeight: "bold",
    color: "#fff",
  },
  premiumPrice: {
    ...Typography.label,
    color: Colors.premiumLight,
    marginTop: 2,
  },
  premiumFeatures: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  featureText: {
    color: "#fff",
    ...Typography.label,
  },
  premiumCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  premiumCtaText: {
    color: Colors.premium,
    fontSize: 15,
    fontWeight: "bold",
  },
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
    borderRadius: 14,
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
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  actionDesc: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionPriceBox: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  actionPrice: {
    ...Typography.caption,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  footerText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
});
