import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

const TOKEN = "test-token";

// ── NO-01/NO-02: Bildirim listesi ────────────────────────────────────────────
describe("GET /notifications", () => {
  it("NO-01: bildirimler listelenir, okunmamış işaretli", async () => {
    const notifications = [
      { id: "n1", type: "topic_approved" as const, title: "Konu onaylandı", message: "...", targetType: "forum_topic" as const, targetId: "t1", read: false, createdAt: "2026-01-01" },
      { id: "n2", type: "system" as const, title: "Hoşgeldiniz", message: "...", targetType: null, targetId: null, read: true, createdAt: "2026-01-02" },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(notifications));

    const res = await api.notifications.getAll(TOKEN);
    expect(res).toHaveLength(2);
    expect(res[0].read).toBe(false);
    expect(res[1].read).toBe(true);
  });

  it("N-04: boş liste → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.notifications.getAll(TOKEN);
    expect(res).toHaveLength(0);
  });

  it("NO-01: Authorization header gönderilir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    await api.notifications.getAll(TOKEN);
    expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe(`Bearer ${TOKEN}`);
  });
});

// ── NO-03: Okunmamış sayı ────────────────────────────────────────────────────
describe("GET /notifications/unread-count", () => {
  it("NO-03: okunmamış sayı döner", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ count: 5 }));

    const res = await api.notifications.getUnreadCount(TOKEN);
    expect(res.count).toBe(5);
  });

  it("N-06: okunmamış yok → count: 0", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ count: 0 }));

    const res = await api.notifications.getUnreadCount(TOKEN);
    expect(res.count).toBe(0);
  });
});

// ── NO-04/NO-05: Bildirimi okundu işaretle ───────────────────────────────────
describe("PATCH /notifications/:id/read", () => {
  it("NO-04: kendi bildirimi → okundu işaretlenir (ok:true)", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true }));

    const res = await api.notifications.markRead("n1", TOKEN);
    expect(res.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain("/n1/read");
  });

  it("NO-05: başka kullanıcı bildirimi → 403 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Forbidden" }, 403));

    const err = await api.notifications.markRead("other-notif", TOKEN).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
  });
});

// ── NO-06: Tümünü okundu işaretle ───────────────────────────────────────────
describe("PATCH /notifications/read-all", () => {
  it("NO-06: tüm bildirimler okundu olur", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true }));

    const res = await api.notifications.markAllRead(TOKEN);
    expect(res.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain("/read-all");
  });
});

// ── NO-07/NO-08/NO-09: Abonelikler ──────────────────────────────────────────
describe("GET /notifications/subscriptions", () => {
  it("NO-07: abonelik listesi döner", async () => {
    const subs = [
      { countryId: "de", countryName: "Almanya", countryCode: "DE", subscribed: true },
      { countryId: "nl", countryName: "Hollanda", countryCode: "NL", subscribed: false },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(subs));

    const res = await api.notifications.getSubscriptions(TOKEN);
    expect(res).toHaveLength(2);
    expect(res[0].subscribed).toBe(true);
  });
});

describe("PATCH /notifications/subscriptions/:countryId", () => {
  it("NO-08: ülkeye abone ol → ok:true", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true }));

    const res = await api.notifications.setSubscription("de", true, TOKEN);
    expect(res.ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subscribed).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toContain("/de");
  });

  it("NO-09: abonelikten çık → ok:true", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true }));

    const res = await api.notifications.setSubscription("de", false, TOKEN);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.subscribed).toBe(false);
    expect(res.ok).toBe(true);
  });
});


