import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import { api, AdminUser } from "../../services/api";
import { Colors } from "../../theme";
import { loadAdminUsers, updateUserRoleHandler, banUserHandler, deleteUserHandler } from "./adminUsersHandlers";
import { AdminLayout } from "./AdminLayout";

const ROLES = ["user", "moderator", "admin"] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = { user: "Üye", moderator: "Moderatör", admin: "Admin" };
const ROLE_COLORS: Record<Role, string> = { user: "#6B7280", moderator: "#F59E0B", admin: "#3B82F6" };
const ROLE_BG: Record<Role, string> = { user: "#F1F5F9", moderator: "#FFFBEB", admin: "#EFF6FF" };

const USER_TYPE_LABELS: Record<string, string> = {
  emigrant: "Göç Etmek İstiyorum",
  consultant: "Danışman",
  diaspora: "Yurt Dışındayım",
};

export function AdminUsersScreen() {
  const { token, user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: AdminUser | null }>({
    open: false,
    user: null,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null); // userId
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    onConfirm: (() => Promise<void>) | null;
  }>({ open: false, title: "", message: "", confirmLabel: "", danger: false, onConfirm: null });

  const load = useCallback(
    async (q = search) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      const result = await loadAdminUsers(token, q, api.admin);
      setUsers(result.users);
      setError(result.error);
      setLoading(false);
    },
    [token, search]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSearch = () => load(search);

  const openRoleModal = (user: AdminUser) => {
    if (user.id === me?.id) {
      Alert.alert("Uyarı", "Kendi rolünüzü değiştiremezsiniz.");
      return;
    }
    setRoleModal({ open: true, user });
  };

  const handleRoleSelect = async (role: Role) => {
    const { user } = roleModal;
    setRoleModal({ open: false, user: null });
    if (!token || !user) return;
    const ok = await updateUserRoleHandler(user.id, role, token, api.admin);
    if (ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role } : u))
      );
    } else {
      Alert.alert("Hata", "Rol güncellenemedi. Sunucu hatası olabilir.");
    }
  };

  const closeConfirm = () =>
    setConfirmModal({ open: false, title: "", message: "", confirmLabel: "", danger: false, onConfirm: null });

  const handleToggleBan = (target: AdminUser) => {
    if (!token) return;
    const willBan = !target.isBanned;
    setConfirmModal({
      open: true,
      title: willBan ? "Kullanıcıyı Askıya Al" : "Askıyı Kaldır",
      message: willBan
        ? `${target.displayName} giriş yapamaz hale gelecek. Devam edilsin mi?`
        : `${target.displayName} tekrar giriş yapabilecek. Devam edilsin mi?`,
      confirmLabel: willBan ? "Askıya Al" : "Aktif Et",
      danger: willBan,
      onConfirm: async () => {
        setActionLoading(target.id);
        const ok = await banUserHandler(target.id, willBan, token, api.admin);
        setActionLoading(null);
        if (ok) {
          setUsers((prev) =>
            prev.map((u) => (u.id === target.id ? { ...u, isBanned: willBan } : u))
          );
        } else {
          Alert.alert("Hata", "İşlem gerçekleştirilemedi.");
        }
      },
    });
  };

  const handleDelete = (target: AdminUser) => {
    if (!token) return;
    setConfirmModal({
      open: true,
      title: "Kullanıcıyı Sil",
      message: `${target.displayName} kalıcı olarak silinecek. Bu işlem geri alınamaz!`,
      confirmLabel: "Sil",
      danger: true,
      onConfirm: async () => {
        setActionLoading(target.id);
        const ok = await deleteUserHandler(target.id, token, api.admin);
        setActionLoading(null);
        if (ok) {
          setUsers((prev) => prev.filter((u) => u.id !== target.id));
        } else {
          Alert.alert("Hata", "Kullanıcı silinemedi.");
        }
      },
    });
  };

  const renderUser = ({ item }: { item: AdminUser }) => {
    const role = item.role as Role;
    const isSelf = item.id === me?.id;
    const isActioning = actionLoading === item.id;
    const canModify = !isSelf && role !== "admin";

    return (
      <View style={[styles.card, item.isBanned && styles.cardBanned]}>
        {/* ── Üst: avatar + bilgi ── */}
        <View style={styles.cardTop}>
          <View style={[styles.avatarWrap, item.isBanned && styles.avatarBanned]}>
            <Text style={styles.avatarText}>{item.displayName[0]?.toUpperCase() ?? "?"}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, item.isBanned && styles.userNameBanned]}>
                {item.displayName}
              </Text>
              {item.isBanned && (
                <View style={styles.bannedBadge}>
                  <Text style={styles.bannedBadgeText}>Askıda</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userType}>
              {item.userType ? (USER_TYPE_LABELS[item.userType] ?? item.userType) : "—"}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: ROLE_BG[role] ?? "#F1F5F9" }]}>
                <Text style={[styles.roleText, { color: ROLE_COLORS[role] ?? "#6B7280" }]}>
                  {ROLE_LABELS[role] ?? role}
                </Text>
              </View>
              {item.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>⭐ Premium</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Alt: aksiyon butonları ── */}
        {isActioning ? (
          <View style={styles.actionRow}>
            <ActivityIndicator size="small" color="#94A3B8" />
          </View>
        ) : (
          <View style={styles.actionRow}>
            {/* Rol değiştir */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.roleBtnAction, isSelf && styles.actionBtnDisabled]}
              onPress={() => openRoleModal(item)}
              disabled={isSelf}
              activeOpacity={0.7}
            >
              <Text style={styles.roleBtnActionText}>Rol Değiştir ▾</Text>
            </TouchableOpacity>

            {canModify && (
              <>
                <View style={styles.btnDivider} />
                {/* Blokla / Aktif Et */}
                <TouchableOpacity
                  style={[styles.actionBtn, item.isBanned ? styles.unbanBtnAction : styles.banBtnAction]}
                  onPress={() => handleToggleBan(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionBtnText, { color: item.isBanned ? "#059669" : "#B45309" }]}>
                    {item.isBanned ? "✓ Aktif Et" : "⊘ Blokla"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.btnDivider} />
                {/* Sil */}
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtnAction]}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteBtnText}>🗑 Sil</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <AdminLayout title="Kullanıcılar">
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ad veya e-posta ara..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.7}>
          <Text style={styles.searchBtnText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <>
          <Text style={styles.countLabel}>{users.length} kullanıcı</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Kullanıcı bulunamadı</Text>
              </View>
            }
          />
        </>
      )}

      {/* ── Onay modal (ban / sil) ──────────────────────────────────────── */}
      <Modal
        visible={confirmModal.open}
        transparent
        animationType="fade"
        onRequestClose={closeConfirm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
            <Text style={styles.modalDesc}>{confirmModal.message}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { flex: 1 }]}
                onPress={closeConfirm}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  { flex: 1, backgroundColor: confirmModal.danger ? "#FEE2E2" : "#DBEAFE" },
                ]}
                onPress={async () => {
                  const fn = confirmModal.onConfirm;
                  closeConfirm();
                  if (fn) await fn();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalCancelText,
                    { color: confirmModal.danger ? "#DC2626" : "#1D4ED8", fontWeight: "700" },
                  ]}
                >
                  {confirmModal.confirmLabel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Rol seçim modal ─────────────────────────────────────────────── */}
      <Modal
        visible={roleModal.open}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModal({ open: false, user: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rol Değiştir</Text>
            {roleModal.user && (
              <Text style={styles.modalDesc}>
                <Text style={{ fontWeight: "700" }}>{roleModal.user.displayName}</Text>
                {" "}için yeni rol seçin:
              </Text>
            )}
            <View style={styles.modalRoles}>
              {ROLES.map((r) => {
                const isCurrent = r === roleModal.user?.role;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.modalRoleBtn,
                      { backgroundColor: ROLE_BG[r] },
                      isCurrent && styles.modalRoleBtnCurrent,
                    ]}
                    onPress={() => handleRoleSelect(r)}
                    disabled={isCurrent}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalRoleText, { color: ROLE_COLORS[r] }]}>
                      {ROLE_LABELS[r]}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.modalRoleCurrent}> (mevcut)</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setRoleModal({ open: false, user: null })}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#1E293B",
  },
  searchBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  countLabel: { fontSize: 12, color: "#64748B", marginBottom: 8 },
  loader: { marginTop: 32 },
  errorBox: { alignItems: "center", padding: 24 },
  errorText: { fontSize: 13, color: "#DC2626", textAlign: "center" },
  card: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: "hidden",
  },
  // Top section: avatar + user info
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  // Bottom action row
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
    minHeight: 44,
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  btnDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#E2E8F0" },
  actionBtnDisabled: { opacity: 0.35 },
  roleBtnAction: { backgroundColor: "#EFF6FF" },
  banBtnAction: { backgroundColor: "#FFFBEB" },
  unbanBtnAction: { backgroundColor: "#F0FDF4" },
  deleteBtnAction: { backgroundColor: "#FFF5F5" },
  roleBtnActionText: { fontSize: 12, fontWeight: "600", color: "#3B82F6" },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  deleteBtnText: { fontSize: 12, fontWeight: "600", color: "#DC2626" },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  avatarText: { color: "#1D4ED8", fontWeight: "700", fontSize: 15 },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  userEmail: { fontSize: 12, color: "#94A3B8" },
  userType: { fontSize: 12, color: "#64748B" },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  roleText: { fontSize: 11, fontWeight: "600" },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#F5F3FF",
  },
  premiumText: { fontSize: 11, fontWeight: "600", color: "#7C3AED" },
  dateText: { fontSize: 11, color: "#94A3B8" },
  roleBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 8,
  },
  roleBtnText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 14, color: "#94A3B8" },
  roleBtnDisabled: { opacity: 0.35 },

  // Name row
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },

  // Banned state
  cardBanned: { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" },
  avatarBanned: { backgroundColor: "#FEE2E2" },
  userNameBanned: { color: "#9CA3AF", textDecorationLine: "line-through" },
  bannedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bannedBadgeText: { fontSize: 10, fontWeight: "700", color: "#DC2626" },

  // Action buttons
  actionBtns: { flexDirection: "column", gap: 4, marginLeft: 6, alignItems: "center" },
  iconActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  banBtn: { backgroundColor: "#FEF3C7" },
  unbanBtn: { backgroundColor: "#D1FAE5" },
  deleteBtn: { backgroundColor: "#FEE2E2" },
  iconActionText: { fontSize: 14 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 24,
    width: "80%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#1E293B", marginBottom: 6 },
  modalDesc: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  modalRoles: { gap: 8, marginBottom: 16 },
  modalRoleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  modalRoleBtnCurrent: {
    borderColor: "#CBD5E1",
    opacity: 0.6,
  },
  modalRoleText: { fontSize: 15, fontWeight: "600" },
  modalRoleCurrent: { fontSize: 13, color: "#94A3B8", fontWeight: "400" },
  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: { fontSize: 14, color: "#475569", fontWeight: "600" },
});
