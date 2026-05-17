/**
 * Component Handler Testleri — NotificationsScreen
 *
 * React render gerektirmez. Bildirimler ekranındaki tüm aksiyon mantığını test eder:
 * feed yükleme, abonelik, okundu işaretleme, toggle.
 */

import { ApiError } from "../../src/services/api";
import {
  loadNotifications,
  loadSubscriptions,
  markAllNotificationsRead,
  markNotificationRead,
  toggleCountrySubscription,
} from "../../src/screens/main/notificationsHandlers";

const MOCK_NOTIFS = [
  {
    id: "n-1",
    type: "topic_approved" as const,
    title: "Konunuz yayınlandı",
    message: "Almanya vize süreci konunuz onaylandı.",
    targetType: "forum_topic" as const,
    targetId: "topic-1",
    read: false,
    createdAt: "2024-01-20T10:00:00Z",
  },
  {
    id: "n-2",
    type: "comment_reply" as const,
    title: "Yorum aldınız",
    message: "Konunuza yeni bir yorum yapıldı.",
    targetType: null,
    targetId: null,
    read: true,
    createdAt: "2024-01-21T12:00:00Z",
  },
];

const MOCK_SUBS = [
  { countryId: "de", countryName: "Almanya", countryCode: "DE", subscribed: true },
  { countryId: "nl", countryName: "Hollanda", countryCode: "NL", subscribed: false },
];

// ── loadNotifications() ───────────────────────────────────────────────────────

describe("loadNotifications() — bildirim feed yükleme", () => {
  it("NF-01: token varsa getAll çağrılır ve bildirimler iletilir", async () => {
    const mockGetAll = jest.fn().mockResolvedValue(MOCK_NOTIFS);
    const result = await loadNotifications("tok123", { getAll: mockGetAll } as any);
    expect(mockGetAll).toHaveBeenCalledWith("tok123");
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("topic_approved");
  });

  it("NF-02: token yoksa getAll çağrılmaz ve boş dizi döner", async () => {
    const mockGetAll = jest.fn();
    const result = await loadNotifications("", { getAll: mockGetAll } as any);
    expect(mockGetAll).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("NF-03: okunmamış bildirim (read=false) verisi olduğu gibi aktarılır", async () => {
    const mockGetAll = jest.fn().mockResolvedValue(MOCK_NOTIFS);
    const result = await loadNotifications("tok123", { getAll: mockGetAll } as any);
    const unread = result.filter((n) => !n.read);
    expect(unread).toHaveLength(1);
    expect(unread[0].id).toBe("n-1");
  });
});

// ── loadSubscriptions() ───────────────────────────────────────────────────────

describe("loadSubscriptions() — ülke abonelikleri yükleme", () => {
  it("NF-04: token varsa getSubscriptions çağrılır", async () => {
    const mockGetSubs = jest.fn().mockResolvedValue(MOCK_SUBS);
    const result = await loadSubscriptions("tok123", { getSubscriptions: mockGetSubs } as any);
    expect(mockGetSubs).toHaveBeenCalledWith("tok123");
    expect(result).toHaveLength(2);
    expect(result[0].countryCode).toBe("DE");
  });

  it("NF-05: token yoksa getSubscriptions çağrılmaz ve boş dizi döner", async () => {
    const mockGetSubs = jest.fn();
    const result = await loadSubscriptions("", { getSubscriptions: mockGetSubs } as any);
    expect(mockGetSubs).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

// ── markAllNotificationsRead() ────────────────────────────────────────────────

describe("markAllNotificationsRead() — tümünü okundu işaretle", () => {
  it("NF-06: token varsa markAllRead çağrılır", async () => {
    const mockMarkAll = jest.fn().mockResolvedValue({ ok: true });
    await markAllNotificationsRead("tok123", { markAllRead: mockMarkAll } as any);
    expect(mockMarkAll).toHaveBeenCalledWith("tok123");
  });

  it("NF-07: token yoksa markAllRead hiç çağrılmaz", async () => {
    const mockMarkAll = jest.fn();
    await markAllNotificationsRead("", { markAllRead: mockMarkAll } as any);
    expect(mockMarkAll).not.toHaveBeenCalled();
  });

  it("NF-08: API hata verince fırlatır", async () => {
    const mockMarkAll = jest.fn().mockRejectedValue(new ApiError("Hata", 500));
    await expect(
      markAllNotificationsRead("tok123", { markAllRead: mockMarkAll } as any)
    ).rejects.toBeInstanceOf(ApiError);
  });
});

// ── markNotificationRead() ────────────────────────────────────────────────────

describe("markNotificationRead() — tek bildirim okundu", () => {
  it("NF-09: doğru notifId ve token ile markRead çağrılır", async () => {
    const mockMarkRead = jest.fn().mockResolvedValue({ ok: true });
    await markNotificationRead("n-1", "tok123", { markRead: mockMarkRead } as any);
    expect(mockMarkRead).toHaveBeenCalledWith("n-1", "tok123");
  });

  it("NF-10: token yoksa markRead çağrılmaz", async () => {
    const mockMarkRead = jest.fn();
    await markNotificationRead("n-1", "", { markRead: mockMarkRead } as any);
    expect(mockMarkRead).not.toHaveBeenCalled();
  });
});

// ── toggleCountrySubscription() ───────────────────────────────────────────────

describe("toggleCountrySubscription() — ülke bildirimi toggle", () => {
  it("NF-11: mevcut değerin tersini setSubscription'a gönderir (abone → iptal)", async () => {
    const mockSetSub = jest.fn().mockResolvedValue({ ok: true });
    const result = await toggleCountrySubscription("de", true, "tok123", { setSubscription: mockSetSub } as any);
    expect(mockSetSub).toHaveBeenCalledWith("de", false, "tok123");
    expect(result.success).toBe(true);
    expect(result.rolledBack).toBe(false);
  });

  it("NF-12: mevcut değerin tersini gönderir (iptal → abone)", async () => {
    const mockSetSub = jest.fn().mockResolvedValue({ ok: true });
    const result = await toggleCountrySubscription("nl", false, "tok123", { setSubscription: mockSetSub } as any);
    expect(mockSetSub).toHaveBeenCalledWith("nl", true, "tok123");
    expect(result.success).toBe(true);
  });

  it("NF-13: API hata verince rolledBack=true döner — ekran state'i geri alır", async () => {
    const mockSetSub = jest.fn().mockRejectedValue(new ApiError("Bağlantı hatası", 503));
    const result = await toggleCountrySubscription("de", true, "tok123", { setSubscription: mockSetSub } as any);
    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(true);
  });

  it("NF-14: token yoksa setSubscription çağrılmaz", async () => {
    const mockSetSub = jest.fn();
    const result = await toggleCountrySubscription("de", true, "", { setSubscription: mockSetSub } as any);
    expect(mockSetSub).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.rolledBack).toBe(false);
  });
});
