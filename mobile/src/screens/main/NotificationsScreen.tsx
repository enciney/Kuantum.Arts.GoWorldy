import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface Notification {
  id: string;
  type: "topic" | "comment" | "system";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFS: Notification[] = [
  {
    id: "1",
    type: "system",
    title: "Hoş geldin!",
    message: "GoWorldy'ye katıldığın için teşekkürler. İlk rehber adımını tamamlayarak başla.",
    time: "Az önce",
    read: false,
  },
];

const FOLLOWED_GROUPS = [
  { id: "1", name: "ABD Vizesi", emoji: "🇺🇸", subscribed: true },
  { id: "2", name: "Almanya Çalışma Vizesi", emoji: "🇩🇪", subscribed: true },
  { id: "3", name: "Kanada Express Entry", emoji: "🇨🇦", subscribed: false },
];

export function NotificationsScreen() {
  const [tab, setTab] = useState<"feed" | "settings">("feed");
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [groups, setGroups] = useState(FOLLOWED_GROUPS);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleGroup = (id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, subscribed: !g.subscribed } : g))
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bildirimler</Text>
        {tab === "feed" && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markRead}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
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

      {tab === "feed" ? (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
              <Text style={styles.emptyText}>
                Takip ettiğin gruplardan yeni içerik geldiğinde burada görünecek.
              </Text>
            </View>
          }
          renderItem={({ item }) => <NotifRow notif={item} />}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionLabel}>Takip ettiğin gruplar</Text>
          {groups.map((g) => (
            <View key={g.id} style={styles.groupRow}>
              <Text style={styles.groupEmoji}>{g.emoji}</Text>
              <Text style={styles.groupName}>{g.name}</Text>
              <Switch
                value={g.subscribed}
                onValueChange={() => toggleGroup(g.id)}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={g.subscribed ? "#2563EB" : "#fff"}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function NotifRow({ notif }: { notif: Notification }) {
  const iconMap = {
    topic: { name: "document-text" as const, color: "#2563EB" },
    comment: { name: "chatbubble" as const, color: "#10B981" },
    system: { name: "megaphone" as const, color: "#F59E0B" },
  };
  const ic = iconMap[notif.type];
  return (
    <TouchableOpacity style={[styles.notif, !notif.read && styles.notifUnread]}>
      <View style={[styles.notifIcon, { backgroundColor: ic.color + "20" }]}>
        <Ionicons name={ic.name} size={20} color={ic.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.notifTitle}>{notif.title}</Text>
        <Text style={styles.notifMessage} numberOfLines={2}>
          {notif.message}
        </Text>
        <Text style={styles.notifTime}>{notif.time}</Text>
      </View>
      {!notif.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  markRead: { fontSize: 13, color: "#2563EB", fontWeight: "500" },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#EFF6FF" },
  tabText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  tabTextActive: { color: "#2563EB", fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 13, color: "#6B7280", marginBottom: 8, fontWeight: "500" },
  notif: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  notifUnread: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  notifIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  notifTitle: { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  notifMessage: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  notifTime: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB", marginTop: 6 },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  groupEmoji: { fontSize: 24 },
  groupName: { flex: 1, fontSize: 15, fontWeight: "500", color: "#111827" },
  empty: { alignItems: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginTop: 12 },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 6, lineHeight: 18 },
});
