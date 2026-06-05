import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { useNotificationCount } from "../../context/NotificationContext";
import { api } from "../../services/api";
import { Colors, Typography, Spacing, Radius, MinTapTarget } from "../../theme";

type NotifType =
  | "topic_approved"
  | "topic_rejected"
  | "comment_reply"
  | "comment_like"
  | "topic_new"
  | "new_comment"
  | "admin_new_pending"
  | "admin_deletion_request"
  | "admin_new_report"
  | "deletion_approved"
  | "deletion_rejected"
  | "edit_request"
  | "edit_approved"
  | "edit_rejected"
  | "system";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  targetType?: "forum_topic" | "admin_queue" | "forum_comment" | null;
  targetId?: string | null;
  read: boolean;
  createdAt: string;
}

interface CountrySub {
  countryId: string;
  countryName: string;
  countryCode: string;
  subscribed: boolean;
}

const FLAG_MAP: Record<string, string> = {
  US: "🇺🇸", DE: "🇩🇪", CA: "🇨🇦", GB: "🇬🇧",
  AU: "🇦🇺", NL: "🇳🇱", CH: "🇨🇭", SE: "🇸🇪",
};

export function NotificationsScreen() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const { refreshCount } = useNotificationCount();
  const [tab, setTab] = useState<"feed" | "settings">("feed");
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [subs, setSubs] = useState<CountrySub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.notifications.getAll(token);
      setNotifs(data);
    } catch {
      // ağ hatası sessizce yoksay
    }
  }, [token]);

  const loadSubs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.notifications.getSubscriptions(token);
      setSubs(data);
    } catch {
      // ağ hatası sessizce yoksay
    }
  }, [token]);

  // NTF-EVT-001..005: ekran her odaklandığında bildirimleri yenile —
  // useEffect sadece mount'ta çalıştığı için yeni bildirimler eskiden görünmüyordu.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (!active) return;
        setLoading(true);
        await Promise.all([loadFeed(), loadSubs()]);
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [loadFeed, loadSubs])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadFeed(), loadSubs()]);
    setRefreshing(false);
  }, [loadFeed, loadSubs]);

  const markAllRead = async () => {
    if (!token) return;
    await api.notifications.markAllRead(token).catch((e) => console.warn("notification read error:", e));
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    refreshCount();
  };

  // Bildirim tipi → AdminTopics tab eşlemesi
  const ADMIN_TAB_MAP: Partial<Record<NotifType, "pending" | "editRequests" | "deletionRequests">> = {
    admin_new_pending: "pending",
    edit_request: "editRequests",
    admin_deletion_request: "deletionRequests",
  };

  const handleNotifPress = async (notif: Notif) => {
    if (!token) return;
    if (!notif.read) {
      await api.notifications.markRead(notif.id, token).catch((e) => console.warn("notification read error:", e));
      setNotifs((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
      refreshCount();
    }

    if (notif.targetType === "forum_topic" && notif.targetId) {
      // Normal forum konusu → Forum tab
      navigation.getParent()?.navigate("Forum", {
        openTopicId: notif.targetId,
        openTopicTitle: notif.title,
      });
    } else if (notif.targetType === "admin_queue") {
      // Admin onay kuyruğu → Admin tab > AdminTopics (doğru sekmeyle)
      const initialTab = ADMIN_TAB_MAP[notif.type];
      navigation.getParent()?.navigate("Admin", {
        screen: "AdminTopics",
        params: initialTab ? { initialTab } : undefined,
      });
    }
  };

  const toggleSub = async (countryId: string, current: boolean) => {
    if (!token || togglingId === countryId) return;
    setTogglingId(countryId);
    setSubs((prev) =>
      prev.map((s) =>
        s.countryId === countryId ? { ...s, subscribed: !current } : s
      )
    );
    try {
      await api.notifications.setSubscription(countryId, !current, token);
    } catch {
      setSubs((prev) =>
        prev.map((s) =>
          s.countryId === countryId ? { ...s, subscribed: current } : s
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bildirimler</Text>
        <View style={styles.headerRight}>
          {tab === "feed" && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={styles.markRead}>Tümünü Okundu İşaretle</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "feed" && styles.tabActive]}
          onPress={() => setTab("feed")}
        >
          <Text style={[styles.tabText, tab === "feed" && styles.tabTextActive]}>
            Akış
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "settings" && styles.tabActive]}
          onPress={() => setTab("settings")}
        >
          <Text style={[styles.tabText, tab === "settings" && styles.tabTextActive]}>
            Takip Ettiklerim
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : tab === "feed" ? (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
              <Text style={styles.emptyText}>
                Takip ettiğin gruplardan yeni içerik geldiğinde burada görünecek.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotifRow notif={item} onPress={() => handleNotifPress(item)} />
          )}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>Takip ettiğin gruplar</Text>
          {subs.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="earth-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz ülke yok</Text>
            </View>
          )}
          {subs.map((s) => (
            <View key={s.countryId} style={styles.groupRow}>
              <Text style={styles.groupEmoji}>
                {FLAG_MAP[s.countryCode] ?? "🌍"}
              </Text>
              <Text style={styles.groupName}>{s.countryName}</Text>
              <Switch
                value={s.subscribed}
                onValueChange={() => toggleSub(s.countryId, s.subscribed)}
                disabled={togglingId === s.countryId}
                trackColor={{ false: Colors.borderStrong, true: "#93C5FD" }}
                thumbColor={s.subscribed ? Colors.primary : Colors.surface}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

const ICON_MAP: Record<NotifType, { name: React.ComponentProps<typeof Ionicons>["name"]; color: string }> = {
  topic_approved: { name: "checkmark-circle", color: Colors.secondary },
  topic_rejected: { name: "close-circle", color: Colors.danger },
  comment_reply: { name: "chatbubble", color: Colors.primary },
  comment_like: { name: "heart", color: Colors.danger },
  topic_new: { name: "newspaper", color: Colors.primary },
  new_comment: { name: "chatbubbles", color: Colors.primary },
  admin_new_pending: { name: "shield-checkmark", color: Colors.warning },
  admin_deletion_request: { name: "trash", color: Colors.warning },
  admin_new_report: { name: "flag", color: Colors.danger },
  deletion_approved: { name: "checkmark-done-circle", color: Colors.secondary },
  deletion_rejected: { name: "close-circle", color: Colors.textMuted },
  edit_request: { name: "create", color: Colors.warning },
  edit_approved: { name: "checkmark-circle", color: Colors.secondary },
  edit_rejected: { name: "close-circle", color: Colors.danger },
  system: { name: "megaphone", color: Colors.warning },
};

function NotifRow({
  notif,
  onPress,
}: {
  notif: Notif;
  onPress: () => void;
}) {
  const ic = ICON_MAP[notif.type] ?? ICON_MAP.system;
  return (
    <TouchableOpacity
      style={[styles.notif, !notif.read && styles.notifUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.notifIcon, { backgroundColor: ic.color + "20" }]}>
        <Ionicons name={ic.name} size={20} color={ic.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.notifTitle}>{notif.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>
          {notif.message}
        </Text>
        <Text style={styles.notifTime}>{formatRelativeTime(notif.createdAt)}</Text>
      </View>
      {!notif.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { ...Typography.h1, color: Colors.textPrimary },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  markRead: { ...Typography.caption, color: Colors.primary, fontWeight: "500" },
  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: Radius.sm, minHeight: MinTapTarget, justifyContent: "center" },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: "500" },
  tabTextActive: { color: Colors.primary, fontWeight: "600" },
  list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  sectionLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: "500" },
  notif: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    overflow: "hidden",
  },
  notifUnread: {
    backgroundColor: Colors.primaryLight,
    borderColor: "#BFDBFE",
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  notifTitle: { ...Typography.label, fontWeight: "600", color: Colors.textPrimary, marginBottom: 2 },
  notifMessage: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  notifTime: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    minHeight: MinTapTarget,
  },
  groupEmoji: { fontSize: 24 },
  groupName: { flex: 1, fontSize: 15, fontWeight: "500", color: Colors.textPrimary },
  empty: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary, marginTop: 12 },
  emptyText: { ...Typography.caption, color: Colors.textSecondary, textAlign: "center", marginTop: 6, lineHeight: 18 },
});
