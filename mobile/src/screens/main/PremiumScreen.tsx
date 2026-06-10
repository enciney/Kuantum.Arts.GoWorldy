import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/AppNavigator";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { loadPackages } from "./premiumHandlers";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";
import { formatPremiumUntil } from "../../utils/timeUtils";
import { PremiumStatusModal } from "../../components/PremiumStatusModal";
import { Toast } from "../../components/Toast";

// Android'de LayoutAnimation aktifleştir
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

function formatDateTR(date: Date): string {
  const months = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Şu anki plana ait paketi bul
function findCurrentPlan(packages: PremiumPackage[], planId?: string): PremiumPackage | undefined {
  if (!planId) return undefined;
  return packages.find((p) => p.id === planId);
}

export function PremiumScreen() {
  const { token, refreshUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [premiumStatus, setPremiumStatus] = useState<{
    isPremium: boolean;
    premiumUntil?: string;
    premiumPlanId?: string;
    autoRenew?: boolean;
  }>({ isPremium: false });

  const [premiumPackages, setPremiumPackages] = useState<PremiumPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [plansExpanded, setPlansExpanded] = useState(false);

  const [bannerMsg, setBannerMsg] = useState("");
  const [bannerVisible, setBannerVisible] = useState(false);

  // Upgrade / plan-change confirm (Alert.alert modal içinde Android'de çalışmaz)
  const [upgradeConfirm, setUpgradeConfirm] = useState<{
    visible: boolean;
    pkg: PremiumPackage | null;
    applyAutoRenew: boolean;
    currentExpiry: string;
    newExpiry: string;
    mode: "upgrade" | "subscribe"; // upgrade = plan değiştir, subscribe = aynı plan aboneliğe geç
  }>({ visible: false, pkg: null, applyAutoRenew: false, currentExpiry: "", newExpiry: "", mode: "upgrade" });

  const showBanner = (msg: string) => {
    setBannerMsg(msg);
    setBannerVisible(true);
  };

  const refreshUserStatus = useCallback(() => {
    if (!token) return;
    api.users.me(token).then((u) => {
      setPremiumStatus({
        isPremium: u.isPremium,
        premiumUntil: u.premiumUntil,
        premiumPlanId: u.premiumPlanId,
        autoRenew: u.autoRenew,
      });
    }).catch(() => {});
  }, [token]);

  useFocusEffect(useCallback(() => { refreshUserStatus(); }, [refreshUserStatus]));

  useEffect(() => {
    setPackagesLoading(true);
    setPackagesError(null);
    loadPackages()
      .then((data) => setPremiumPackages(data.premium ?? []))
      .catch(() => setPackagesError("Paket bilgileri yüklenemedi. Lütfen tekrar deneyin."))
      .finally(() => setPackagesLoading(false));
  }, []);

  // Aktif ve süresi geçmemiş premium
  const isActivelyPremium = useMemo(
    () => premiumStatus.isPremium && !!premiumStatus.premiumUntil && new Date(premiumStatus.premiumUntil) > new Date(),
    [premiumStatus]
  );

  // Abonelik (autoRenew) var mı?
  const isSubscriber = isActivelyPremium && premiumStatus.autoRenew === true;

  const subscriptionPackages = useMemo(() => premiumPackages.filter((p) => p.isSubscription), [premiumPackages]);
  const oneTimePackages = useMemo(() => premiumPackages.filter((p) => !p.isSubscription), [premiumPackages]);
  const currentPlan = useMemo(() => findCurrentPlan(premiumPackages, premiumStatus.premiumPlanId), [premiumPackages, premiumStatus.premiumPlanId]);

  // Ödeme ekranına git
  const navigateToPayment = (pkg: PremiumPackage, applyAutoRenew: boolean) => {
    const discount = applyAutoRenew && pkg.isSubscription ? (pkg.subscriptionDiscountPercent ?? 0) : 0;
    const finalPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
    navigation.push("Payment", {
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

  const openPayment = (pkg: PremiumPackage, applyAutoRenew: boolean) => {
    if (pkg.isSubscription && isActivelyPremium && premiumStatus.premiumPlanId) {
      const isSamePlan = premiumStatus.premiumPlanId === pkg.id;

      // Aynı plan + zaten abone → engelle
      if (isSamePlan && premiumStatus.autoRenew) {
        showBanner(`Zaten ${pkg.name} aboneliğiniz aktif. Herhangi bir işlem gerekmez.`);
        return;
      }

      // Aynı plan + abone değil → aboneliğe geç (indirimli) confirm
      if (isSamePlan && !premiumStatus.autoRenew) {
        const discount = pkg.subscriptionDiscountPercent ?? 0;
        const discountedPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
        const currentExpiry = premiumStatus.premiumUntil ? formatDateTR(new Date(premiumStatus.premiumUntil)) : "";
        // Aboneliğe geçince mevcut süre korunur, sonraki dönemden itibaren otomatik çekim
        setUpgradeConfirm({
          visible: true,
          pkg: { ...pkg, priceTL: discountedPrice }, // confirm'de indirimli fiyat göster
          applyAutoRenew: true,
          currentExpiry,
          newExpiry: currentExpiry, // aynı süre devam eder
          mode: "subscribe",
        });
        return;
      }

      // Farklı plan → override confirm
      const newExpiry = new Date(Date.now() + pkg.days * 86_400_000);
      const currentExpiry = premiumStatus.premiumUntil ? formatDateTR(new Date(premiumStatus.premiumUntil)) : "";
      setUpgradeConfirm({
        visible: true,
        pkg,
        applyAutoRenew,
        currentExpiry,
        newExpiry: formatDateTR(newExpiry),
        mode: "upgrade",
      });
      return;
    }

    navigateToPayment(pkg, applyAutoRenew);
  };

  const handleUpgradeConfirm = () => {
    const { pkg, applyAutoRenew, mode } = upgradeConfirm;
    setUpgradeConfirm((s) => ({ ...s, visible: false }));
    if (!pkg) return;
    if (mode === "subscribe") {
      // Aynı plan, sadece autoRenew=true ile gönder — fiyatı orijinalden hesapla
      const originalPkg = premiumPackages.find((p) => p.id === pkg.id) ?? pkg;
      navigateToPayment(originalPkg, true);
    } else {
      navigateToPayment(pkg, applyAutoRenew);
    }
  };

  const togglePlans = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlansExpanded((v) => !v);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.rootContainer}>
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

        {/* ── STATE 1 & 2: Aktif premium kullanıcı hero ── */}
        {isActivelyPremium ? (
          <>
            {/* Hero Kart */}
            <View style={styles.premiumHero}>
              <View style={styles.heroIconRing}>
                <MaterialCommunityIcons name="crown" size={36} color={Colors.premium} />
              </View>
              <Text style={styles.heroTitle}>Premium Üyesiniz</Text>
              {premiumStatus.premiumUntil && (
                <Text style={styles.heroSubtitle}>{formatPremiumUntil(premiumStatus.premiumUntil)}</Text>
              )}
              {currentPlan && (
                <View style={styles.heroPlanBadge}>
                  <Text style={styles.heroPlanBadgeText}>{currentPlan.name}</Text>
                </View>
              )}
              {isSubscriber && (
                <View style={styles.heroSubscriberRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.secondary} />
                  <Text style={styles.heroSubscriberText}>Otomatik yenileme aktif</Text>
                </View>
              )}
            </View>

            {/* Aboneliği Yönet butonu */}
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={() => setStatusModalVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="settings-outline" size={18} color={Colors.primary} />
              <Text style={styles.manageBtnText}>Aboneliği Yönet</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>

            {/* ── STATE 2: Abone değil → "Abone Ol" önerisi ── */}
            {!isSubscriber && !packagesLoading && (
              <>
                <View style={styles.subscribeSectionCard}>
                  <View style={styles.subscribeIconRow}>
                    <Ionicons name="refresh-circle" size={24} color={Colors.premium} />
                    <Text style={styles.subscribeSectionTitle}>Aboneliğe Geçin, İndirim Kazanın</Text>
                  </View>
                  <Text style={styles.subscribeSectionDesc}>
                    Otomatik yenilemeyi açarak mevcut planınızda{currentPlan?.subscriptionDiscountPercent ? ` %${currentPlan.subscriptionDiscountPercent}` : ""} indirim kazanın. Bir sonraki dönemden itibaren otomatik çekim yapılır, istediğiniz zaman iptal edebilirsiniz.
                  </Text>
                  {/* Mevcut planla eşleşen abonelik paketi varsa öne çıkar */}
                  {subscriptionPackages
                    .filter((pkg) => !currentPlan || pkg.id === currentPlan.id)
                    .map((pkg) => {
                      const discount = pkg.subscriptionDiscountPercent ?? 0;
                      const discountedPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
                      return (
                        <TouchableOpacity
                          key={pkg.id}
                          style={styles.subscribeHighlightBtn}
                          onPress={() => openPayment(pkg, true)}
                          activeOpacity={0.85}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.subscribeHighlightName}>{pkg.name}</Text>
                            <View style={styles.subscribeHighlightPriceRow}>
                              {discount > 0 && (
                                <Text style={styles.subscribeHighlightOld}>{pkg.priceTL} TL</Text>
                              )}
                              <Text style={styles.subscribeHighlightPrice}>
                                {discountedPrice} TL / {pkg.days} gün
                              </Text>
                            </View>
                            {discount > 0 && (
                              <Text style={styles.subscribeHighlightDiscount}>%{discount} indirimli</Text>
                            )}
                          </View>
                          <View style={styles.subscribeHighlightArrow}>
                            <Text style={styles.subscribeHighlightArrowText}>Abone Ol</Text>
                            <Ionicons name="arrow-forward" size={16} color={Colors.surface} />
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  }
                </View>
              </>
            )}

            {/* "Planları Görüntüle" — diğer paketleri göster/gizle */}
            {!packagesLoading && (subscriptionPackages.length > 0 || oneTimePackages.length > 0) && (
              <>
                <TouchableOpacity style={styles.expandPlansBtn} onPress={togglePlans} activeOpacity={0.7}>
                  <Text style={styles.expandPlansBtnText}>
                    {plansExpanded ? "Planları Gizle" : "Tüm Planları Görüntüle"}
                  </Text>
                  <Ionicons
                    name={plansExpanded ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.primary}
                  />
                </TouchableOpacity>

                {plansExpanded && (
                  <PackageList
                    subscriptionPackages={subscriptionPackages}
                    oneTimePackages={oneTimePackages}
                    autoRenew={autoRenew}
                    setAutoRenew={setAutoRenew}
                    openPayment={openPayment}
                  />
                )}
              </>
            )}
          </>
        ) : (
          /* ── STATE 3: Premium değil → tam paket listesi ── */
          packagesLoading ? (
            <View style={styles.packagesLoader}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <PackageList
              subscriptionPackages={subscriptionPackages}
              oneTimePackages={oneTimePackages}
              autoRenew={autoRenew}
              setAutoRenew={setAutoRenew}
              openPayment={openPayment}
            />
          )
        )}

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
          <Text style={styles.footerText}>Güvenli ödeme</Text>
        </View>
      </ScrollView>

      {/* Toast — aynı plan engeli */}
      <Toast
        visible={bannerVisible}
        message={bannerMsg}
        variant="error"
        duration={4000}
        onClose={() => setBannerVisible(false)}
      />

      {/* Plan değiştirme / aboneliğe geçiş onay modal'ı */}
      <Modal
        visible={upgradeConfirm.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeConfirm((s) => ({ ...s, visible: false }))}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Ionicons
              name={upgradeConfirm.mode === "subscribe" ? "refresh-circle" : "swap-horizontal"}
              size={32}
              color={Colors.premium}
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.confirmTitle}>
              {upgradeConfirm.mode === "subscribe" ? "Aboneliğe Geç" : "Plan Değiştir"}
            </Text>

            {upgradeConfirm.mode === "subscribe" ? (
              <>
                <Text style={styles.confirmBody}>
                  Mevcut{upgradeConfirm.currentExpiry ? ` ${upgradeConfirm.currentExpiry}` : ""} tarihine kadar olan premium süreniz korunur.
                </Text>
                <Text style={styles.confirmBody}>
                  Bir sonraki dönemden itibaren{upgradeConfirm.pkg?.subscriptionDiscountPercent ? ` %${upgradeConfirm.pkg.subscriptionDiscountPercent} indirimli` : ""}{" "}
                  <Text style={{ fontWeight: "700" }}>{upgradeConfirm.pkg?.priceTL} TL</Text> otomatik çekim yapılır.
                </Text>
                <Text style={styles.confirmHint}>İstediğiniz zaman iptal edebilirsiniz.</Text>
              </>
            ) : (
              <>
                <Text style={styles.confirmBody}>
                  Mevcut aboneliğiniz{upgradeConfirm.currentExpiry ? ` ${upgradeConfirm.currentExpiry}` : ""} tarihine kadar geçerli.
                </Text>
                <Text style={styles.confirmBody}>
                  <Text style={{ fontWeight: "700" }}>{upgradeConfirm.pkg?.name}</Text> alırsanız mevcut süre sıfırlanır ve{" "}
                  <Text style={{ fontWeight: "700" }}>{upgradeConfirm.newExpiry}</Text> tarihine kadar premium olursunuz.
                </Text>
                {upgradeConfirm.applyAutoRenew && (
                  <Text style={styles.confirmHint}>Otomatik yenileme açık — süre dolunca otomatik yenilenecek.</Text>
                )}
              </>
            )}

            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setUpgradeConfirm((s) => ({ ...s, visible: false }))}
              >
                <Text style={styles.confirmCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmOkBtn} onPress={handleUpgradeConfirm}>
                <Text style={styles.confirmOkText}>
                  {upgradeConfirm.mode === "subscribe" ? "Abone Ol" : "Devam Et"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Durum Detay Modal */}
      <PremiumStatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        isPremium={premiumStatus.isPremium}
        premiumUntil={premiumStatus.premiumUntil}
        autoRenew={premiumStatus.autoRenew}
        token={token ?? ""}
        onCancelled={() => {
          setPremiumStatus({ isPremium: false, premiumUntil: undefined, premiumPlanId: undefined, autoRenew: false });
          refreshUser().catch(() => {});
        }}
        onBuyPress={() => navigation.goBack()}
      />
    </View>
  );
}

// ─── Alt bileşen: tam paket listesi ─────────────────────────────────────────

interface PackageListProps {
  subscriptionPackages: PremiumPackage[];
  oneTimePackages: PremiumPackage[];
  autoRenew: boolean;
  setAutoRenew: (v: boolean) => void;
  openPayment: (pkg: PremiumPackage, autoRenew: boolean) => void;
}

function PackageList({ subscriptionPackages, oneTimePackages, autoRenew, setAutoRenew, openPayment }: PackageListProps) {
  return (
    <>
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
                      {discount > 0 && <Text style={styles.priceOld}>{pkg.priceTL} TL</Text>}
                      <Text style={styles.premiumPrice}>{finalPrice} TL / {pkg.days} gün</Text>
                    </View>
                    {discount > 0 && (
                      <Text style={styles.discountChip}>%{discount} indirim uygulandı</Text>
                    )}
                  </View>
                </View>
                <View style={styles.premiumFeatures}>
                  {(pkg.features ?? []).map((f) => (
                    <FeatureRow key={f} text={f} />
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
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name="checkmark-circle" size={18} color={Colors.surface} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: Colors.background },
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

  // ── Hero (aktif premium) ──
  premiumHero: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.premium,
  },
  heroIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  heroPlanBadge: {
    backgroundColor: Colors.premium,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 8,
  },
  heroPlanBadgeText: { color: Colors.surface, fontSize: 13, fontWeight: "700" },
  heroSubscriberRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  heroSubscriberText: { fontSize: 13, color: Colors.secondary, fontWeight: "600" },

  // ── Yönet butonu ──
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
  },
  manageBtnText: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.primary },

  // ── Abone ol önerisi (State 2) ──
  subscribeSectionCard: {
    backgroundColor: "#FFF7ED",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  subscribeIconRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  subscribeSectionTitle: { fontSize: 15, fontWeight: "700", color: "#92400E", flex: 1, flexWrap: "wrap" },
  subscribeSectionDesc: { fontSize: 13, color: "#78350F", lineHeight: 19, marginBottom: 14 },
  subscribeHighlightBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.premium,
    borderRadius: Radius.md,
    padding: 14,
    gap: 12,
  },
  subscribeHighlightName: { color: Colors.surface, fontSize: 15, fontWeight: "700" },
  subscribeHighlightPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 6, marginTop: 2 },
  subscribeHighlightOld: { color: "#C4B5FD", fontSize: 12, textDecorationLine: "line-through" },
  subscribeHighlightPrice: { color: Colors.surface, fontSize: 14, fontWeight: "600" },
  subscribeHighlightDiscount: {
    color: "#FDE68A",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  subscribeHighlightArrow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    gap: 4,
  },
  subscribeHighlightArrowText: { color: Colors.surface, fontSize: 13, fontWeight: "700" },

  // ── Planları Görüntüle toggle ──
  expandPlansBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  expandPlansBtnText: { fontSize: 14, fontWeight: "600", color: Colors.primary },

  // ── Packages (paylaşılan stiller) ──
  packagesLoader: { paddingVertical: Spacing.lg, alignItems: "center" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.body, fontWeight: "600" as const, color: Colors.textPrimary, marginBottom: 12 },
  sectionHint: { ...Typography.small, color: Colors.premium, fontWeight: "600" },
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
  priceOld: { ...Typography.small, color: "#C4B5FD", textDecorationLine: "line-through" },
  premiumPrice: { ...Typography.label, color: "#EDE9FE" },
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

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: 6,
  },
  footerText: { ...Typography.small, color: Colors.textSecondary },

  // ── Upgrade confirm modal ──
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  confirmBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  confirmBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 8,
  },
  confirmHint: {
    fontSize: 12,
    color: Colors.premium,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmBtns: { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary },
  confirmOkBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: Colors.premium,
    alignItems: "center",
  },
  confirmOkText: { fontSize: 15, fontWeight: "700", color: Colors.surface },
});
