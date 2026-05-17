/**
 * Component Handler Testleri — HomeScreen
 *
 * React render gerektirmez. Ana sayfa veri yükleme mantığını test eder:
 * guide stats ve aktivite feed paralel yükleme, hata toleransı.
 */

import { ApiError } from "../../src/services/api";
import { loadHomeData } from "../../src/screens/main/homeHandlers";

const MOCK_STATS = {
  countryId: "de",
  countryName: "Almanya",
  completedSteps: 8,
  totalSteps: 20,
  completionPct: 40,
  countriesWithProgress: 1,
};

const MOCK_ACTIVITIES = [
  {
    type: "comment" as const,
    id: "act-1",
    title: "Almanya vize süreci nasıl?",
    preview: "Çok faydalı bir konu teşekkürler.",
    targetId: "topic-1",
    createdAt: "2024-01-20T10:00:00Z",
  },
  {
    type: "guide" as const,
    id: "act-2",
    title: "Vize adımı tamamlandı",
    preview: "Almanya — Adım 3",
    targetId: null,
    createdAt: "2024-01-19T09:00:00Z",
  },
];

// ── loadHomeData() ────────────────────────────────────────────────────────────

describe("loadHomeData() — ana sayfa veri yükleme", () => {
  it("HS-01: token varsa getHomeStats ve myActivity çağrılır", async () => {
    const mockGetHomeStats = jest.fn().mockResolvedValue(MOCK_STATS);
    const mockMyActivity = jest.fn().mockResolvedValue(MOCK_ACTIVITIES);
    await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(mockGetHomeStats).toHaveBeenCalledWith("tok123");
    expect(mockMyActivity).toHaveBeenCalledWith("tok123");
  });

  it("HS-02: her iki API başarılıysa veri eksiksiz döner", async () => {
    const mockGetHomeStats = jest.fn().mockResolvedValue(MOCK_STATS);
    const mockMyActivity = jest.fn().mockResolvedValue(MOCK_ACTIVITIES);
    const result = await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(result.stats.countryName).toBe("Almanya");
    expect(result.stats.completionPct).toBe(40);
    expect(result.activities).toHaveLength(2);
    expect(result.activities[0].type).toBe("comment");
  });

  it("HS-03: token yoksa hiçbiri çağrılmaz ve default değerler döner", async () => {
    const mockGetHomeStats = jest.fn();
    const mockMyActivity = jest.fn();
    const result = await loadHomeData(
      "",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(mockGetHomeStats).not.toHaveBeenCalled();
    expect(mockMyActivity).not.toHaveBeenCalled();
    expect(result.stats.completionPct).toBe(0);
    expect(result.activities).toEqual([]);
  });

  it("HS-04: guide API hata verince default stats döner, aktiviteler yine yüklenir", async () => {
    const mockGetHomeStats = jest.fn().mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const mockMyActivity = jest.fn().mockResolvedValue(MOCK_ACTIVITIES);
    const result = await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(result.stats.completionPct).toBe(0);
    expect(result.stats.countryName).toBe("");
    expect(result.activities).toHaveLength(2);
  });

  it("HS-05: activity API hata verince boş aktivite döner, stats yine yüklenir", async () => {
    const mockGetHomeStats = jest.fn().mockResolvedValue(MOCK_STATS);
    const mockMyActivity = jest.fn().mockRejectedValue(new ApiError("Ağ hatası", 503));
    const result = await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(result.stats.countryName).toBe("Almanya");
    expect(result.activities).toEqual([]);
  });

  it("HS-06: her iki API da hata verince tüm default değerler döner", async () => {
    const mockGetHomeStats = jest.fn().mockRejectedValue(new Error("network error"));
    const mockMyActivity = jest.fn().mockRejectedValue(new Error("network error"));
    const result = await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    expect(result.stats.completedSteps).toBe(0);
    expect(result.activities).toEqual([]);
  });

  it("HS-07: aktivite tipi comment ise targetId iletilir", async () => {
    const mockGetHomeStats = jest.fn().mockResolvedValue(MOCK_STATS);
    const mockMyActivity = jest.fn().mockResolvedValue(MOCK_ACTIVITIES);
    const result = await loadHomeData(
      "tok123",
      { getHomeStats: mockGetHomeStats } as any,
      { myActivity: mockMyActivity } as any
    );
    const comment = result.activities.find((a) => a.type === "comment");
    expect(comment?.targetId).toBe("topic-1");
  });
});
