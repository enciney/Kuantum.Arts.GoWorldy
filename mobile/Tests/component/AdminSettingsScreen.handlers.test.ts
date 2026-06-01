/**
 * Component Handler Testleri — AdminSettingsScreen
 *
 * React render gerektirmez. Admin uygulama ayarları yönetim mantığını test eder:
 * ayarları yükleme, kaydetme (PATCH) ve hata toleransı.
 */

import { ApiError } from "../../src/services/api";
import {
  loadAdminSettings,
  saveSettingsHandler,
} from "../../src/screens/admin/adminSettingsHandlers";

const MOCK_SETTINGS = {
  forumCreateTopicCost: 5,
  forumCommentAccessCost: 1,
  commentEditWindowMinutes: 10,
  commentDeleteWindowMinutes: 30,
  guideEnableNotifications: true,
  guideEnableRecommendations: true,
  notificationsEnableEmail: false,
  notificationsEnableInApp: true,
};

// ── loadAdminSettings() ───────────────────────────────────────────────────────

describe("loadAdminSettings() — admin ayarlarını yükleme", () => {
  it("AS-01: token varsa getSettings API çağrılır", async () => {
    const mockGetSettings = jest.fn().mockResolvedValue(MOCK_SETTINGS);
    await loadAdminSettings("admin-tok-123", {
      getSettings: mockGetSettings,
    } as any);
    expect(mockGetSettings).toHaveBeenCalledWith("admin-tok-123");
  });

  it("AS-02: API başarılıysa result.settings eksiksiz döner", async () => {
    const mockGetSettings = jest.fn().mockResolvedValue(MOCK_SETTINGS);
    const result = await loadAdminSettings("admin-tok-123", {
      getSettings: mockGetSettings,
    } as any);
    expect(result.settings).not.toBeNull();
    expect(result.settings!.forumCreateTopicCost).toBe(5);
    expect(result.settings!.notificationsEnableInApp).toBe(true);
    expect(result.error).toBeNull();
  });

  it("AS-03: token yoksa API çağrılmaz ve settings null döner", async () => {
    const mockGetSettings = jest.fn();
    const result = await loadAdminSettings("", {
      getSettings: mockGetSettings,
    } as any);
    expect(mockGetSettings).not.toHaveBeenCalled();
    expect(result.settings).toBeNull();
    expect(result.error).toBeNull();
  });

  it("AS-04: API hata verirse settings null, error dolu döner", async () => {
    const mockGetSettings = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadAdminSettings("admin-tok-123", {
      getSettings: mockGetSettings,
    } as any);
    expect(result.settings).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("AS-05: ağ hatasında da settings null döner", async () => {
    const mockGetSettings = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await loadAdminSettings("admin-tok-123", {
      getSettings: mockGetSettings,
    } as any);
    expect(result.settings).toBeNull();
  });
});

// ── saveSettingsHandler() ─────────────────────────────────────────────────────

describe("saveSettingsHandler() — admin ayarlarını kaydetme", () => {
  it("AS-06: partial data ile updateSettings API çağrılır", async () => {
    const mockUpdateSettings = jest.fn().mockResolvedValue({ ok: true });
    const partialData = { forumCreateTopicCost: 10 };
    await saveSettingsHandler(partialData, "admin-tok-123", {
      updateSettings: mockUpdateSettings,
    } as any);
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      partialData,
      "admin-tok-123"
    );
  });

  it("AS-07: API başarılıysa true döner", async () => {
    const mockUpdateSettings = jest.fn().mockResolvedValue({ ok: true });
    const result = await saveSettingsHandler(
      { notificationsEnableEmail: true },
      "admin-tok-123",
      { updateSettings: mockUpdateSettings } as any
    );
    expect(result).toBe(true);
  });

  it("AS-08: birden fazla alan güncellenmesi desteklenir", async () => {
    const mockUpdateSettings = jest.fn().mockResolvedValue({ ok: true });
    const partialData = {
      forumCreateTopicCost: 3,
      commentEditWindowMinutes: 15,
      notificationsEnableEmail: true,
    };
    const result = await saveSettingsHandler(partialData, "admin-tok-123", {
      updateSettings: mockUpdateSettings,
    } as any);
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      partialData,
      "admin-tok-123"
    );
    expect(result).toBe(true);
  });

  it("AS-09: API hata verirse false döner", async () => {
    const mockUpdateSettings = jest
      .fn()
      .mockRejectedValue(new ApiError("Yetkisiz", 403));
    const result = await saveSettingsHandler(
      { forumCreateTopicCost: 10 },
      "admin-tok-123",
      { updateSettings: mockUpdateSettings } as any
    );
    expect(result).toBe(false);
  });

  it("AS-10: ağ hatasında da false döner", async () => {
    const mockUpdateSettings = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await saveSettingsHandler(
      { notificationsEnableEmail: false },
      "admin-tok-123",
      { updateSettings: mockUpdateSettings } as any
    );
    expect(result).toBe(false);
  });
});
