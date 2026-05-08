import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";

const ACTIONS = [
  {
    icon: "create" as const,
    title: "Konu Aç",
    description: "Forum'da yeni konu açma hakkı",
    price: "50 TL",
    family: "ionicons" as const,
  },
  {
    icon: "comment-multiple" as const,
    title: "Yorum Erişimi",
    description: "1 hafta sınırsız yorum okuma",
    price: "50 TL",
    family: "mc" as const,
  },
  {
    icon: "bullhorn" as const,
    title: "Reklam Yayınla",
    description: "Forum'da reklam yayınlama",
    price: "50 TL",
    family: "fa5" as const,
  },
];

export function PremiumScreen() {
  const handlePurchase = (item: string) => {
    Alert.alert(
      "Satın Al",
      `${item} satın alma akışı yakında — Stripe Checkout entegrasyonu hazırlanıyor.`,
      [{ text: "Tamam" }]
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
          <FontAwesome5 name="coins" size={24} color="#F59E0B" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.balanceLabel}>Mevcut Bakiyem</Text>
            <Text style={styles.balanceValue}>0 Kredi</Text>
          </View>
          <TouchableOpacity style={styles.balanceBtn}>
            <Text style={styles.balanceBtnText}>Yükle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Card (Best Value) */}
      <TouchableOpacity
        style={styles.premiumCard}
        onPress={() => handlePurchase("Aylık Premium")}
      >
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>EN AVANTAJLI</Text>
        </View>
        <View style={styles.premiumHeader}>
          <MaterialCommunityIcons name="crown" size={32} color="#fff" />
          <View style={{ marginLeft: 12 }}>
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
          <Text style={styles.premiumCtaText}>Şimdi Premium Ol</Text>
          <Ionicons name="arrow-forward" size={18} color="#8B5CF6" />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Tek Kullanımlık Krediler</Text>

      {ACTIONS.map((a) => (
        <TouchableOpacity
          key={a.title}
          style={styles.actionCard}
          onPress={() => handlePurchase(a.title)}
        >
          <View style={styles.actionIcon}>
            {a.family === "ionicons" && <Ionicons name={a.icon} size={24} color="#2563EB" />}
            {a.family === "mc" && (
              <MaterialCommunityIcons name={a.icon} size={24} color="#2563EB" />
            )}
            {a.family === "fa5" && <FontAwesome5 name={a.icon} size={20} color="#2563EB" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{a.title}</Text>
            <Text style={styles.actionDesc}>{a.description}</Text>
          </View>
          <View style={styles.actionPriceBox}>
            <Text style={styles.actionPrice}>{a.price}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceLabel: { fontSize: 13, color: "#6B7280" },
  balanceValue: { fontSize: 22, fontWeight: "bold", color: "#111827", marginTop: 2 },
  balanceBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  balanceBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  premiumCard: {
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  premiumBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  premiumHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  premiumTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  premiumPrice: { fontSize: 14, color: "#EDE9FE", marginTop: 2 },
  premiumFeatures: { gap: 8, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { color: "#fff", fontSize: 14 },
  premiumCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  premiumCtaText: { color: "#8B5CF6", fontSize: 15, fontWeight: "bold" },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: "#111827", marginBottom: 12 },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  actionDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  actionPriceBox: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionPrice: { fontSize: 13, fontWeight: "bold", color: "#111827" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  footerText: { fontSize: 12, color: "#6B7280" },
});
