import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../../context/AuthContext";
import { useNotificationCount } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { HomeStackParamList } from "../../navigation/AppNavigator";
import { Colors, Typography, Spacing, Radius } from "../../theme";

type HomeNav = NativeStackNavigationProp<HomeStackParamList, "HomeMain">;

interface Activity {
  type: "comment" | "guide";
  id: string;
  title: string;
  preview: string;
  targetId: string | null;
  createdAt: string;
}

interface PremiumPackage {
  id: string;
  name: string;
  days: number;
  priceTL: number;
}

export function HomeScreen() {
  const { user, token } = useAuth();
  const navigation = useNavigation<HomeNav>();
  const { unreadCount } = useNotificationCount();
  const [homeStats, setHomeStats] = useState({
    countryId: null as string | null,
    countryName: "",
    completedSteps: 0,
    totalSteps: 0,
    completionPct: 0,
    countriesWithProgress: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  // PRM-PKG-003: paket fiyatları API'dan
  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [guideStats, acts, packages] = await Promise.all([
        api.guide.getHomeStats(token).catch(() => ({
          countryId: null,
          countryName: "",
          completedSteps: 0,
          totalSteps: 0,
          completionPct: 0,
          countriesWithProgress: 0,
        })),
        api.users.myActivity(token).catch(() => [] as Activity[]),
        api.payment.getPackages().catch(() => ({ credits: [], premium: [] as PremiumPackage[] })),
      ]);
      setHomeStats(guideStats);
      setActivities(acts as Activity[]);
      setPremiumPackages(packages.premium ?? []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const completionPct = homeStats.completionPct;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Merhaba, {user?.displayName?.split(" ")[0]}! 👋</Text>
          <Text style={styles.subtitle}>Göç yolculuğuna devam edelim</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("Notifications")}
          style={styles.iconBtn}
          activeOpacity={0.6}
        >
          <View>
            <Ionicons name="notifications-outline" size={24} color={Colors.neutral} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : String(unreadCount)}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon={<MaterialCommunityIcons name="progress-check" size={24} color={Colors.secondary} />}
          value={`%${completionPct}`}
          label="İlerleme"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
        <StatCard
          icon={<FontAwesome5 name="globe-americas" size={20} color={Colors.primary} />}
          value={homeStats.countriesWithProgress.toString()}
          label="Ülke"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
        <StatCard
          icon={<Ionicons name="checkmark-done" size={24} color={Colors.warning} />}
          value={homeStats.completedSteps.toString()}
          label="Tamamlanan"
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
      </View>

      {/* Continue Guide Card */}
      <TouchableOpacity
        style={styles.guideCard}
        activeOpacity={0.85}
        onPress={() => navigation.getParent()?.navigate("Guide")}
      >
        <View style={styles.guideCardHeader}>
          <MaterialCommunityIcons name="map-marker-path" size={28} color={Colors.surface} />
          <Text style={styles.guideCardTitle}>Rehberime Devam Et</Text>
        </View>
        <Text style={styles.guideCardText}>
          {homeStats.countryName ? `${homeStats.countryName} — ` : ""}
          {homeStats.completedSteps} / {homeStats.totalSteps} adım tamamlandı
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPct}%` }]} />
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
      <View style={styles.actionRow}>
        <ActionCard
          icon={<Ionicons name="chatbubbles" size={28} color={Colors.primary} />}
          label="Forum"
          color={Colors.primaryLight}
          onPress={() => navigation.getParent()?.navigate("Forum")}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="bookmark-multiple" size={28} color={Colors.secondary} />}
          label="Rehberim"
          color={Colors.secondaryLight}
          onPress={() => navigation.getParent()?.navigate("Guide")}
        />
        <ActionCard
          icon={<Ionicons name="notifications" size={28} color={Colors.warning} />}
          label="Bildirimler"
          color={Colors.warningLight}
          onPress={() => navigation.navigate("Notifications")}
        />
        <ActionCard
          icon={<MaterialCommunityIcons name="crown" size={28} color={Colors.premium} />}
          label="Premium"
          color={Colors.premiumLight}
          onPress={() => navigation.navigate("Premium")}
        />
      </View>

      {/* Activity Feed */}
      <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : activities.length === 0 ? (
        <TouchableOpacity
          style={styles.activityCard}
          onPress={() => navigation.getParent()?.navigate("Forum")}
          activeOpacity={0.7}
        >
          <Ionicons name="information-circle-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.activityEmptyTitle}>Henüz aktivite yok</Text>
          <Text style={styles.activityEmptyText}>
            Forum'da bir konuya yorum yap veya bir rehber adımını tamamla.
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activityList}>
          {activities.slice(0, 5).map((act) => (
            <TouchableOpacity
              key={act.id + act.createdAt}
              style={styles.activityRow}
              activeOpacity={0.75}
              onPress={() => {
                if (act.type === "comment" && act.targetId) {
                  navigation.getParent()?.navigate("Forum", {
                    openTopicId: act.targetId,
                    openTopicTitle: act.title,
                  });
                } else {
                  navigation.getParent()?.navigate("Guide");
                }
              }}
            >
              <View style={[styles.activityIconBadge, { backgroundColor: act.type === "comment" ? Colors.primaryLight : Colors.secondaryLight }]}>
                <Ionicons
                  name={act.type === "comment" ? "chatbubble" : "checkmark-circle"}
                  size={16}
                  color={act.type === "comment" ? Colors.primary : Colors.secondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityRowTitle} numberOfLines={1}>{act.title}</Text>
                <Text style={styles.activityRowPreview} numberOfLines={1}>
                  {act.preview.length > 60 ? act.preview.slice(0, 60) + "…" : act.preview}
                </Text>
              </View>
              <Text style={styles.activityRowDate}>{formatRelativeTime(act.createdAt)}</Text>
            </TouchableOpacity>
          ))}
          {activities.length > 5 && (
            <TouchableOpacity
              style={styles.activitySeeAll}
              onPress={() => navigation.getParent()?.navigate("Forum")}
              activeOpacity={0.7}
            >
              <Text style={styles.activitySeeAllText}>Tümünü Gör →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* PRM-PKG-002 / PRM-PKG-003: Premium banner — aktif plan varsa kalan süre, yoksa en uygun paketin fiyatı */}
      <PremiumBanner
        user={user}
        packages={premiumPackages}
        onPress={() => navigation.navigate("Premium")}
      />
    </ScrollView>
  );
}

function PremiumBanner({
  user,
  packages,
  onPress,
}: {
  user: { isPremium?: boolean; premiumUntil?: string | null | undefined } | null;
  packages: PremiumPackage[];
  onPress: () => void;
}) {
  const now = Date.now();
  const isActive =
    !!user?.isPremium &&
    (!user?.premiumUntil || new Date(user.premiumUntil).getTime() > now);

  if (isActive) {
    const remainingMs = user?.premiumUntil
      ? Math.max(0, new Date(user.premiumUntil).getTime() - now)
      : null;
    const remainingDays = remainingMs != null ? Math.ceil(remainingMs / 86_400_000) : null;
    const text = remainingDays != null
      ? `Aboneliğin aktif — ${remainingDays} gün kaldı`
      : "Premium üyeliğin aktif";
    return (
      <TouchableOpacity style={styles.premiumBanner} onPress={onPress} activeOpacity={0.85}>
        <MaterialCommunityIcons name="crown" size={32} color={Colors.surface} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.premiumTitle}>Premium Aktif 💎</Text>
          <Text style={styles.premiumText}>{text}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.surface} />
      </TouchableOpacity>
    );
  }

  const cheapest = packages.length > 0
    ? packages.reduce((a, b) => (a.priceTL <= b.priceTL ? a : b))
    : null;
  const priceLabel = cheapest
    ? `${cheapest.name} ${cheapest.priceTL} TL'den başlayan fiyatlarla`
    : "Sınırsız konu, reklamsız deneyim";

  return (
    <TouchableOpacity style={styles.premiumBanner} onPress={onPress} activeOpacity={0.85}>
      <MaterialCommunityIcons name="crown" size={32} color={Colors.surface} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.premiumTitle}>Premium'a Geç</Text>
        <Text style={styles.premiumText}>{priceLabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={Colors.surface} />
    </TouchableOpacity>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function StatCard({
  icon,
  value,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress} activeOpacity={0.7}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ActionCard({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.lg },
  greeting: { fontSize: 22, fontWeight: "bold", color: Colors.textPrimary },
  subtitle: { ...Typography.label, color: Colors.textSecondary, marginTop: 2 },
  iconBtn: { padding: Spacing.sm },
  creditsChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
    marginRight: 4,
  },
  creditsText: { fontSize: 13, fontWeight: "600", color: "#92400E" },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger ?? "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700", lineHeight: 11 },
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { fontSize: 18, fontWeight: "bold", color: Colors.textPrimary, marginTop: 6 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  guideCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: 20,
    marginBottom: Spacing.lg,
  },
  guideCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  guideCardTitle: { fontSize: 18, fontWeight: "bold", color: Colors.surface },
  guideCardText: { fontSize: 13, color: "#DBEAFE", marginBottom: 12 },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: Colors.surface, borderRadius: Radius.full },
  sectionTitle: {
    ...Typography.body,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 4,
  },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  actionCard: {
    width: "48%",
    borderRadius: Radius.lg,
    padding: 18,
    alignItems: "center",
    gap: Spacing.sm,
  },
  actionLabel: { ...Typography.label, fontWeight: "600", color: Colors.textPrimary },
  activityCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  activityEmptyTitle: { fontSize: 15, fontWeight: "600", color: Colors.textPrimary, marginTop: 8 },
  activityEmptyText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  activityList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  activityRowTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  activityRowPreview: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  activityRowDate: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  activitySeeAll: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  activitySeeAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "500",
  },
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.premium,
    borderRadius: Radius.lg,
    padding: 18,
  },
  premiumTitle: { fontSize: 16, fontWeight: "bold", color: Colors.surface },
  premiumText: { fontSize: 13, color: "#EDE9FE", marginTop: 2 },
});
