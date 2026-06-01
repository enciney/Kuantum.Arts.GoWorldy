/**
 * Component Handler Testleri — AdminPremiumScreen
 *
 * React render gerektirmez. Admin premium plan yönetim mantığını test eder:
 * plan listeleme, oluşturma, güncelleme, silme ve hata toleransı.
 */

import { ApiError } from "../../src/services/api";
import {
  loadPremiumPlans,
  createPlanHandler,
  updatePlanHandler,
  deletePlanHandler,
} from "../../src/screens/admin/adminPremiumHandlers";

const MOCK_PLANS = [
  {
    id: "plan-1",
    name: "Aylık",
    price: 29.99,
    durationDays: 30,
    isActive: true,
  },
  {
    id: "plan-2",
    name: "Yıllık",
    price: 249.99,
    durationDays: 365,
    isActive: true,
  },
];

const MOCK_NEW_PLAN = {
  id: "plan-3",
  name: "3 Aylık",
  price: 79.99,
  durationDays: 90,
  isActive: true,
};

// ── loadPremiumPlans() ────────────────────────────────────────────────────────

describe("loadPremiumPlans() — premium plan listesi yükleme", () => {
  it("AP-01: token varsa getPremiumPlans API çağrılır ve result.plans döner", async () => {
    const mockGetPremiumPlans = jest.fn().mockResolvedValue(MOCK_PLANS);
    const result = await loadPremiumPlans("admin-tok-123", {
      getPremiumPlans: mockGetPremiumPlans,
    } as any);
    expect(mockGetPremiumPlans).toHaveBeenCalledWith("admin-tok-123");
    expect(result.plans).toHaveLength(2);
    expect(result.plans[0].id).toBe("plan-1");
  });

  it("AP-02: API başarılıysa plan verileri eksiksiz döner", async () => {
    const mockGetPremiumPlans = jest.fn().mockResolvedValue(MOCK_PLANS);
    const result = await loadPremiumPlans("admin-tok-123", {
      getPremiumPlans: mockGetPremiumPlans,
    } as any);
    expect(result.plans[1].name).toBe("Yıllık");
    expect(result.plans[1].durationDays).toBe(365);
  });

  it("AP-03: API hata verirse plans boş array döner", async () => {
    const mockGetPremiumPlans = jest
      .fn()
      .mockRejectedValue(new ApiError("Sunucu hatası", 500));
    const result = await loadPremiumPlans("admin-tok-123", {
      getPremiumPlans: mockGetPremiumPlans,
    } as any);
    expect(result.plans).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("AP-04: ağ hatasında da plans boş array döner", async () => {
    const mockGetPremiumPlans = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await loadPremiumPlans("admin-tok-123", {
      getPremiumPlans: mockGetPremiumPlans,
    } as any);
    expect(result.plans).toEqual([]);
  });
});

// ── createPlanHandler() ───────────────────────────────────────────────────────

describe("createPlanHandler() — yeni premium plan oluşturma", () => {
  it("AP-05: data ve token ile createPremiumPlan API çağrılır", async () => {
    const mockCreatePremiumPlan = jest.fn().mockResolvedValue(MOCK_NEW_PLAN);
    const planData = { name: "3 Aylık", price: 79.99, durationDays: 90 };
    await createPlanHandler(planData, "admin-tok-123", {
      createPremiumPlan: mockCreatePremiumPlan,
    } as any);
    expect(mockCreatePremiumPlan).toHaveBeenCalledWith(planData, "admin-tok-123");
  });

  it("AP-06: API başarılıysa oluşturulan plan döner", async () => {
    const mockCreatePremiumPlan = jest.fn().mockResolvedValue(MOCK_NEW_PLAN);
    const planData = { name: "3 Aylık", price: 79.99, durationDays: 90 };
    const result = await createPlanHandler(planData, "admin-tok-123", {
      createPremiumPlan: mockCreatePremiumPlan,
    } as any);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("plan-3");
    expect(result!.name).toBe("3 Aylık");
  });

  it("AP-07: API hata verirse null döner", async () => {
    const mockCreatePremiumPlan = jest
      .fn()
      .mockRejectedValue(new ApiError("Geçersiz veri", 400));
    const planData = { name: "", price: -1, durationDays: 0 };
    const result = await createPlanHandler(planData, "admin-tok-123", {
      createPremiumPlan: mockCreatePremiumPlan,
    } as any);
    expect(result).toBeNull();
  });
});

// ── updatePlanHandler() ───────────────────────────────────────────────────────

describe("updatePlanHandler() — premium plan güncelleme", () => {
  it("AP-08: id ve partial data ile updatePremiumPlan API çağrılır", async () => {
    const mockUpdatePremiumPlan = jest.fn().mockResolvedValue({ ok: true });
    const partialData = { price: 34.99 };
    await updatePlanHandler("plan-1", partialData, "admin-tok-123", {
      updatePremiumPlan: mockUpdatePremiumPlan,
    } as any);
    expect(mockUpdatePremiumPlan).toHaveBeenCalledWith(
      "plan-1",
      partialData,
      "admin-tok-123"
    );
  });

  it("AP-09: API başarılıysa true döner", async () => {
    const mockUpdatePremiumPlan = jest.fn().mockResolvedValue({ ok: true });
    const result = await updatePlanHandler(
      "plan-1",
      { price: 34.99 },
      "admin-tok-123",
      { updatePremiumPlan: mockUpdatePremiumPlan } as any
    );
    expect(result).toBe(true);
  });

  it("AP-10: API hata verirse false döner", async () => {
    const mockUpdatePremiumPlan = jest
      .fn()
      .mockRejectedValue(new ApiError("Kayıt bulunamadı", 404));
    const result = await updatePlanHandler(
      "plan-99",
      { price: 34.99 },
      "admin-tok-123",
      { updatePremiumPlan: mockUpdatePremiumPlan } as any
    );
    expect(result).toBe(false);
  });
});

// ── deletePlanHandler() ───────────────────────────────────────────────────────

describe("deletePlanHandler() — premium plan silme", () => {
  it("AP-11: id ile deletePremiumPlan API çağrılır", async () => {
    const mockDeletePremiumPlan = jest.fn().mockResolvedValue({ ok: true });
    await deletePlanHandler("plan-1", "admin-tok-123", {
      deletePremiumPlan: mockDeletePremiumPlan,
    } as any);
    expect(mockDeletePremiumPlan).toHaveBeenCalledWith("plan-1", "admin-tok-123");
  });

  it("AP-12: API başarılıysa true döner", async () => {
    const mockDeletePremiumPlan = jest.fn().mockResolvedValue({ ok: true });
    const result = await deletePlanHandler("plan-1", "admin-tok-123", {
      deletePremiumPlan: mockDeletePremiumPlan,
    } as any);
    expect(result).toBe(true);
  });

  it("AP-13: API hata verirse false döner", async () => {
    const mockDeletePremiumPlan = jest
      .fn()
      .mockRejectedValue(new ApiError("Kayıt bulunamadı", 404));
    const result = await deletePlanHandler("plan-99", "admin-tok-123", {
      deletePremiumPlan: mockDeletePremiumPlan,
    } as any);
    expect(result).toBe(false);
  });

  it("AP-14: ağ hatasında da false döner", async () => {
    const mockDeletePremiumPlan = jest
      .fn()
      .mockRejectedValue(new Error("network error"));
    const result = await deletePlanHandler("plan-1", "admin-tok-123", {
      deletePremiumPlan: mockDeletePremiumPlan,
    } as any);
    expect(result).toBe(false);
  });
});
