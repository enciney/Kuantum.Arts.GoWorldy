/**
 * Component Handler Testleri — AdminDashboardScreen
 *
 * React render gerektirmez. Admin dashboard veri yükleme mantığını test eder:
 * token kontrolü, istatistik yükleme ve hata toleransı.
 */

import { ApiError } from "../../src/services/api";
import { loadAdminDashboard } from "../../src/screens/admin/adminDashboardHandlers";

const MOCK_STATS = {
  totalUsers: 1250,
  totalTopics: 320,
  totalComments: 4800,
  totalCountries: 12,
};

// ── loadAdminDashboard() ──────────────────────────────────────────────────────

describe("loadAdminDashboard() — admin dashboard veri yükleme", () => {
  it("AD-01: token varsa getDashboard API çağrılır", async () => {
    const mockGetDashboard = jest.fn().mockResolvedValue({ stats: MOCK_STATS });
    await loadAdminDashboard("admin-tok-123", {
      getDashboard: mockGetDashboard,
    } as any);
    expect(mockGetDashboard).toHaveBeenCalledWith("admin-tok-123");
  });

  it("AD-02: API başarılıysa result.stats eksiksiz döner", async () => {
    const mockGetDashboard = jest.fn().mockResolvedValue({ stats: MOCK_STATS });
    const result = await loadAdminDashboard("admin-tok-123", {
      getDashboard: mockGetDashboard,
    } as any);
    expect(result.error).toBeNull();
    expect(result.stats).not.toBeNull();
    expect(result.stats!.totalUsers).toBe(1250);
    expect(result.stats!.totalTopics).toBe(320);
  });

  it("AD-03: token yoksa API çağrılmaz ve default stats döner", async () => {
    const mockGetDashboard = jest.fn();
    const result = await loadAdminDashboard("", {
      getDashboard: mockGetDashboard,
    } as any);
    expect(mockGetDashboard).not.toHaveBeenCalled();
    expect(result.error).toBeNull();
    expect(result.stats!.totalUsers).toBe(0);
  });

  it("AD-04: API hata verirse error dolu, stats default döner, exception fırlatılmaz", async () => {
    const mockGetDashboard = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadAdminDashboard("admin-tok-123", {
      getDashboard: mockGetDashboard,
    } as any);
    expect(result.error).toBeTruthy();
    expect(result.stats!.totalUsers).toBe(0);
  });

  it("AD-05: ağ hatasında da error dolu döner", async () => {
    const mockGetDashboard = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await loadAdminDashboard("admin-tok-123", {
      getDashboard: mockGetDashboard,
    } as any);
    expect(result.error).toContain("network error");
    expect(result.stats).toBeDefined();
  });
});
