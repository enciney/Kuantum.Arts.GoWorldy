import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  FlatList,
} from "react-native";
import { useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { AdminStackParamList, AdminTopicsTab } from "../../navigation/AdminNavigator";
import { useAuth } from "../../context/AuthContext";
import { api, AdminTopic, DeletionRequest, EditRequest } from "../../services/api";
import { Colors } from "../../theme";
import {
  loadPendingTopics,
  approveTopicHandler,
  rejectTopicHandler,
  loadDeletionRequests,
  resolveDeletionRequestHandler,
} from "./adminTopicsHandlers";
import { AdminLayout } from "./AdminLayout";

type Tab = AdminTopicsTab;

export function AdminTopicsScreen() {
  const { token } = useAuth();
  const route = useRoute<RouteProp<AdminStackParamList, "AdminTopics">>();
  const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? "pending");

  // Ekran zaten mount'luyken yeni params gelirse tab'ı güncelle
  React.useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Pending topics
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  // Edit requests
  const [editReqs, setEditReqs] = useState<EditRequest[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Deletion requests
  const [deletions, setDeletions] = useState<DeletionRequest[]>([]);
  const [deletionsLoading, setDeletionsLoading] = useState(false);

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string; reason: string; mode: "topic" | "edit" | "deletion" }>({
    open: false, id: "", reason: "", mode: "topic",
  });

  const loadTopics = useCallback(async () => {
    if (!token) return;
    setTopicsLoading(true);
    setTopicsError(null);
    const result = await loadPendingTopics(token, api.admin);
    setTopics(result.topics);
    setTopicsError(result.error);
    setTopicsLoading(false);
  }, [token]);

  const loadEditReqs = useCallback(async () => {
    if (!token) return;
    setEditLoading(true);
    try {
      const data = await api.admin.getEditRequests(token);
      setEditReqs(data);
    } catch (e: unknown) {
      setTopicsError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setEditLoading(false);
    }
  }, [token]);

  const loadDeletionReqs = useCallback(async () => {
    if (!token) return;
    setDeletionsLoading(true);
    const result = await loadDeletionRequests(token, api.admin);
    setDeletions(result.requests);
    setDeletionsLoading(false);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadTopics();
      loadEditReqs();
      loadDeletionReqs();
    }, [loadTopics, loadEditReqs, loadDeletionReqs])
  );

  // ── Topic actions ────────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    if (!token) return;
    const ok = await approveTopicHandler(id, token, api.admin);
    if (ok) setTopics((prev) => prev.filter((t) => t.id !== id));
    else Alert.alert("Hata", "Konu onaylanamadı");
  };

  const openRejectTopic = (id: string) =>
    setRejectModal({ open: true, id, reason: "", mode: "topic" });
  const openRejectEdit = (id: string) =>
    setRejectModal({ open: true, id, reason: "", mode: "edit" });
  const openRejectDeletion = (id: string) =>
    setRejectModal({ open: true, id, reason: "", mode: "deletion" });

  const handleConfirmReject = async () => {
    const { id, reason, mode } = rejectModal;
    setRejectModal((p) => ({ ...p, open: false }));
    if (!token) return;
    if (mode === "topic") {
      const ok = await rejectTopicHandler(id, reason, token, api.admin);
      if (ok) setTopics((prev) => prev.filter((t) => t.id !== id));
      else Alert.alert("Hata", "Konu reddedilemedi");
    } else if (mode === "edit") {
      try {
        await api.admin.resolveEditRequest(id, "rejected", token, reason);
        setEditReqs((prev) => prev.filter((r) => r.id !== id));
      } catch {
        Alert.alert("Hata", "Düzenleme talebi reddedilemedi");
      }
    } else {
      const ok = await resolveDeletionRequestHandler(id, "rejected", token, api.admin);
      if (ok) setDeletions((prev) => prev.filter((r) => r.id !== id));
      else Alert.alert("Hata", "Silme talebi reddedilemedi");
    }
  };

  // ── Edit request actions ─────────────────────────────────────────────────────
  const handleApproveEdit = async (id: string) => {
    if (!token) return;
    try {
      await api.admin.resolveEditRequest(id, "approved", token);
      setEditReqs((prev) => prev.filter((r) => r.id !== id));
    } catch {
      Alert.alert("Hata", "Düzenleme talebi onaylanamadı");
    }
  };

  // ── Deletion request actions ─────────────────────────────────────────────────
  const handleApproveDeletion = async (id: string) => {
    if (!token) return;
    const ok = await resolveDeletionRequestHandler(id, "approved", token, api.admin);
    if (ok) setDeletions((prev) => prev.filter((r) => r.id !== id));
    else Alert.alert("Hata", "Silme talebi onaylanamadı");
  };

  const tabLabel = (t: Tab): string => {
    if (t === "pending") return `Bekleyen (${topics.length})`;
    if (t === "editRequests") return `Düzenleme (${editReqs.length})`;
    return `Silme (${deletions.length})`;
  };

  const renderTopic = ({ item }: { item: AdminTopic }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardMeta}>{item.authorDisplayName ?? item.authorId}</Text>
      {item.countryName ? <Text style={styles.cardMeta}>{item.countryName}</Text> : null}
      <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleApprove(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Onayla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => openRejectTopic(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEditReq = ({ item }: { item: EditRequest }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Mevcut Başlık</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.topicTitle}</Text>
      <Text style={styles.cardLabel}>Yeni Başlık</Text>
      <Text style={[styles.cardTitle, { color: "#3B82F6" }]} numberOfLines={2}>{item.newTitle}</Text>
      <Text style={styles.cardMeta}>Talep: {item.requesterName} · {new Date(item.createdAt).toLocaleDateString("tr-TR")}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleApproveEdit(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Onayla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => openRejectEdit(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDeletion = ({ item }: { item: DeletionRequest }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.topicTitle}</Text>
      <Text style={styles.cardMeta}>Talep: {item.requesterName}</Text>
      <Text style={styles.cardMeta}>Sebep: {item.reason}</Text>
      <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={() => handleApproveDeletion(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Sil (Onayla)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={() => openRejectDeletion(item.id)} activeOpacity={0.7}>
          <Text style={styles.btnText}>Reddet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isLoading = tab === "pending" ? topicsLoading : tab === "editRequests" ? editLoading : deletionsLoading;

  return (
    <AdminLayout title="Forum Moderasyonu">
      {/* Tabs */}
      <View style={styles.tabs}>
        {(["pending", "editRequests", "deletionRequests"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{tabLabel(t)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {topicsError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{topicsError}</Text>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : tab === "pending" ? (
        <FlatList
          data={topics}
          keyExtractor={(item) => item.id}
          renderItem={renderTopic}
          scrollEnabled={false}
          ListEmptyComponent={<EmptyState message="Onay bekleyen konu yok" />}
        />
      ) : tab === "editRequests" ? (
        <FlatList
          data={editReqs}
          keyExtractor={(item) => item.id}
          renderItem={renderEditReq}
          scrollEnabled={false}
          ListEmptyComponent={<EmptyState message="Bekleyen düzenleme talebi yok" />}
        />
      ) : (
        <FlatList
          data={deletions}
          keyExtractor={(item) => item.id}
          renderItem={renderDeletion}
          scrollEnabled={false}
          ListEmptyComponent={<EmptyState message="Bekleyen silme talebi yok" />}
        />
      )}

      {/* Reject modal */}
      <Modal visible={rejectModal.open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {rejectModal.mode === "topic"
                ? "Konuyu Reddet"
                : rejectModal.mode === "edit"
                ? "Düzenleme Talebini Reddet"
                : "Silme Talebini Reddet"}
            </Text>
            <Text style={styles.modalDesc}>Reddetme sebebini girin:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Sebep girin..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={rejectModal.reason}
              onChangeText={(r) => setRejectModal((p) => ({ ...p, reason: r }))}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModal((p) => ({ ...p, open: false }))}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmReject} activeOpacity={0.7}>
                <Text style={styles.modalConfirmText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AdminLayout>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: "#3B82F6" },
  tabText: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },
  loader: { marginTop: 32 },
  errorBox: { alignItems: "center", padding: 24 },
  errorText: { fontSize: 13, color: "#DC2626", textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "600", marginBottom: 2, marginTop: 6, textTransform: "uppercase" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#1E293B", marginBottom: 4 },
  cardMeta: { fontSize: 12, color: "#64748B", marginBottom: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveBtn: { backgroundColor: "#10B981" },
  rejectBtn: { backgroundColor: "#EF4444" },
  btnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center" },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 420,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B", marginBottom: 6 },
  modalDesc: { fontSize: 13, color: "#64748B", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1E293B",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  modalCancelBtn: {
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalCancelText: { color: "#374151", fontSize: 14 },
  modalConfirmBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalConfirmText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
