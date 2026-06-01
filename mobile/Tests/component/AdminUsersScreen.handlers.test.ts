/**
 * Component Handler Testleri — AdminUsersScreen
 *
 * React render gerektirmez. Admin kullanıcı yönetim mantığını test eder:
 * kullanıcı listeleme (arama ile), rol güncelleme, ban ve silme işlemleri.
 */

import { ApiError } from "../../src/services/api";
import {
  loadAdminUsers,
  updateUserRoleHandler,
  banUserHandler,
  deleteUserHandler,
} from "../../src/screens/admin/adminUsersHandlers";

const MOCK_USERS = [
  {
    id: "user-1",
    displayName: "Ali Veli",
    email: "ali@example.com",
    role: "user",
    isPremium: false,
    isBanned: false,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "user-2",
    displayName: "Ayşe Kaya",
    email: "ayse@example.com",
    role: "moderator",
    isPremium: true,
    isBanned: false,
    createdAt: "2024-01-12T09:00:00Z",
  },
];

// ── loadAdminUsers() ──────────────────────────────────────────────────────────

describe("loadAdminUsers() — kullanıcı listesi yükleme", () => {
  it("AU-01: search parametresiyle getUsers API çağrılır ve liste döner", async () => {
    const mockGetUsers = jest.fn().mockResolvedValue(MOCK_USERS);
    const result = await loadAdminUsers("admin-tok-123", "ali", {
      getUsers: mockGetUsers,
    } as any);
    expect(mockGetUsers).toHaveBeenCalledWith("admin-tok-123", "ali");
    expect(result.users).toHaveLength(2);
    expect(result.users[0].id).toBe("user-1");
  });

  it("AU-02: search boş string olduğunda getUsers undefined search ile çağrılır", async () => {
    const mockGetUsers = jest.fn().mockResolvedValue(MOCK_USERS);
    const result = await loadAdminUsers("admin-tok-123", "", {
      getUsers: mockGetUsers,
    } as any);
    // search || undefined → empty string maps to undefined
    expect(mockGetUsers).toHaveBeenCalledWith("admin-tok-123", undefined);
    expect(result.users).toHaveLength(2);
  });

  it("AU-03: API başarılıysa kullanıcı verileri eksiksiz döner", async () => {
    const mockGetUsers = jest.fn().mockResolvedValue(MOCK_USERS);
    const result = await loadAdminUsers("admin-tok-123", "", {
      getUsers: mockGetUsers,
    } as any);
    expect(result.users[1].role).toBe("moderator");
    expect(result.users[1].isPremium).toBe(true);
  });

  it("AU-04: API hata verirse users boş array döner", async () => {
    const mockGetUsers = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadAdminUsers("admin-tok-123", "ali", {
      getUsers: mockGetUsers,
    } as any);
    expect(result.users).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("AU-05: ağ hatasında da users boş array döner", async () => {
    const mockGetUsers = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await loadAdminUsers("admin-tok-123", "", {
      getUsers: mockGetUsers,
    } as any);
    expect(result.users).toEqual([]);
  });
});

// ── updateUserRoleHandler() ───────────────────────────────────────────────────

describe("updateUserRoleHandler() — kullanıcı rolü güncelleme", () => {
  it("AU-06: doğru userId ve role ile API çağrılır", async () => {
    const mockUpdateUserRole = jest.fn().mockResolvedValue({ success: true });
    await updateUserRoleHandler("user-1", "moderator", "admin-tok-123", {
      updateUserRole: mockUpdateUserRole,
    } as any);
    expect(mockUpdateUserRole).toHaveBeenCalledWith(
      "user-1",
      "moderator",
      "admin-tok-123"
    );
  });

  it("AU-07: API başarılıysa true döner", async () => {
    const mockUpdateUserRole = jest.fn().mockResolvedValue({ success: true });
    const result = await updateUserRoleHandler(
      "user-1",
      "moderator",
      "admin-tok-123",
      { updateUserRole: mockUpdateUserRole } as any
    );
    expect(result).toBe(true);
  });

  it("AU-08: API hata verirse false döner", async () => {
    const mockUpdateUserRole = jest
      .fn()
      .mockRejectedValue(new ApiError("Yetkisiz", 403));
    const result = await updateUserRoleHandler(
      "user-1",
      "moderator",
      "admin-tok-123",
      { updateUserRole: mockUpdateUserRole } as any
    );
    expect(result).toBe(false);
  });

  it("AU-09: ağ hatasında da false döner", async () => {
    const mockUpdateUserRole = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await updateUserRoleHandler(
      "user-1",
      "admin",
      "admin-tok-123",
      { updateUserRole: mockUpdateUserRole } as any
    );
    expect(result).toBe(false);
  });
});

// ── banUserHandler() ──────────────────────────────────────────────────────────

describe("banUserHandler() — kullanıcı askıya alma / aktif etme", () => {
  it("AU-10: ban=true ile doğru parametreler iletilir", async () => {
    const mockBanUser = jest.fn().mockResolvedValue({ ok: true });
    await banUserHandler("user-1", true, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(mockBanUser).toHaveBeenCalledWith("user-1", true, "admin-tok-123");
  });

  it("AU-11: ban=false (aktif et) ile doğru parametreler iletilir", async () => {
    const mockBanUser = jest.fn().mockResolvedValue({ ok: true });
    await banUserHandler("user-2", false, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(mockBanUser).toHaveBeenCalledWith("user-2", false, "admin-tok-123");
  });

  it("AU-12: API başarılıysa true döner", async () => {
    const mockBanUser = jest.fn().mockResolvedValue({ ok: true });
    const result = await banUserHandler("user-1", true, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(result).toBe(true);
  });

  it("AU-13: API 403 (admin ban girişimi) verirse false döner", async () => {
    const mockBanUser = jest
      .fn()
      .mockRejectedValue(new ApiError("Admin kullanıcılar banlanamaz", 403));
    const result = await banUserHandler("admin-user", true, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(result).toBe(false);
  });

  it("AU-14: API 404 (kullanıcı bulunamadı) verirse false döner", async () => {
    const mockBanUser = jest
      .fn()
      .mockRejectedValue(new ApiError("Kullanıcı bulunamadı", 404));
    const result = await banUserHandler("ghost-id", true, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(result).toBe(false);
  });

  it("AU-15: ağ hatasında da false döner", async () => {
    const mockBanUser = jest.fn().mockRejectedValue(new Error("timeout"));
    const result = await banUserHandler("user-1", true, "admin-tok-123", {
      banUser: mockBanUser,
    } as any);
    expect(result).toBe(false);
  });
});

// ── deleteUserHandler() ───────────────────────────────────────────────────────

describe("deleteUserHandler() — kullanıcı silme", () => {
  it("AU-16: doğru userId ve token ile deleteUser API çağrılır", async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue({ ok: true });
    await deleteUserHandler("user-1", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(mockDeleteUser).toHaveBeenCalledWith("user-1", "admin-tok-123");
  });

  it("AU-17: API başarılıysa true döner", async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue({ ok: true });
    const result = await deleteUserHandler("user-1", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(result).toBe(true);
  });

  it("AU-18: API 403 (admin silme girişimi) verirse false döner", async () => {
    const mockDeleteUser = jest
      .fn()
      .mockRejectedValue(new ApiError("Admin kullanıcılar silinemez", 403));
    const result = await deleteUserHandler("admin-user", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(result).toBe(false);
  });

  it("AU-19: API 404 (kullanıcı bulunamadı) verirse false döner", async () => {
    const mockDeleteUser = jest
      .fn()
      .mockRejectedValue(new ApiError("Kullanıcı bulunamadı", 404));
    const result = await deleteUserHandler("ghost-id", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(result).toBe(false);
  });

  it("AU-20: ağ hatasında da false döner", async () => {
    const mockDeleteUser = jest.fn().mockRejectedValue(new Error("network error"));
    const result = await deleteUserHandler("user-1", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(result).toBe(false);
  });

  it("AU-21: API tam olarak bir kez çağrılır", async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue({ ok: true });
    await deleteUserHandler("user-1", "admin-tok-123", {
      deleteUser: mockDeleteUser,
    } as any);
    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
  });
});
