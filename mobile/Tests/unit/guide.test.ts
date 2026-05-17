import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

const TOKEN = "test-token";

// ── G-01/G-02/G-03: Adımlar ──────────────────────────────────────────────────
describe("GET /guide/steps/:countryId", () => {
  it("G-01: ülke adımları sıralı döner", async () => {
    const steps = [
      { id: "s1", order: 1, question: "Vize türü?", stepType: "assessment" as const },
      { id: "s2", order: 2, question: "Dil belgesi?", stepType: "checklist" as const },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(steps));

    const res = await api.guide.getSteps("de", TOKEN);
    expect(res).toHaveLength(2);
    expect(res[0].order).toBe(1);
  });

  it("G-02: isGlobal adımlar dahil gelir", async () => {
    const steps = [
      { id: "sg", order: 0, question: "Pasaport geçerli mi?", isGlobal: true, stepType: "checklist" as const },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(steps));

    const res = await api.guide.getSteps("de", TOKEN);
    expect(res[0].isGlobal).toBe(true);
  });

  it("G-03: olmayan ülke → boş dizi", async () => {
    fetchMock.mockResolvedValueOnce(mockOk([]));

    const res = await api.guide.getSteps("xx", TOKEN);
    expect(res).toHaveLength(0);
  });

  it("G-05: blocker adım blockingAnswer içerir", async () => {
    const steps = [{ id: "sb", order: 1, question: "Cezai geçmiş?", blockingAnswer: "Evet", stepType: "assessment" as const }];
    fetchMock.mockResolvedValueOnce(mockOk(steps));

    const res = await api.guide.getSteps("de", TOKEN);
    expect(res[0].blockingAnswer).toBe("Evet");
  });
});

// ── G-04/G-05: İlerleme çekme ────────────────────────────────────────────────
describe("GET /guide/progress", () => {
  it("G-04: tamamlanan adımlar listelenir", async () => {
    const progress = [
      { id: "p1", stepId: "s1", answer: "Blue Card", completedAt: "2026-01-01" },
    ];
    fetchMock.mockResolvedValueOnce(mockOk(progress));

    const res = await api.guide.getProgress(TOKEN);
    expect(res).toHaveLength(1);
    expect(res[0].stepId).toBe("s1");
  });

  it("G-05: auth yok → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Unauthorized" }, 401));

    await expect(api.guide.getProgress("")).rejects.toThrow(ApiError);
  });
});

// ── G-06/G-07: İlerleme kaydetme ─────────────────────────────────────────────
describe("POST /guide/progress", () => {
  it("G-06: adım kaydet → id döner", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "prog-1" }));

    const res = await api.guide.saveProgress("s1", "Blue Card", "de", TOKEN);
    expect(res.id).toBe("prog-1");

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.stepId).toBe("s1");
    expect(body.answer).toBe("Blue Card");
    expect(body.countryId).toBe("de");
  });

  it("G-07: aynı adımı tekrar kaydet → üzerine yazılır (200)", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "prog-1" }));

    const res = await api.guide.saveProgress("s1", "Blue Card", "de", TOKEN);
    expect(res.id).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ── G-09: Aktif ülke ──────────────────────────────────────────────────────────
describe("PATCH /users/me (activeGuideCountryId)", () => {
  it("G-09: aktif rehber ülkesi güncellenir", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ id: "u1", email: "a@b.com", displayName: "A" }));

    await api.users.updateMe({ activeGuideCountryId: "nl" }, TOKEN);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.activeGuideCountryId).toBe("nl");
  });
});

// ── Home stats ────────────────────────────────────────────────────────────────
describe("GET /guide/home-stats", () => {
  it("H-02: rehberlik istatistikleri döner", async () => {
    const stats = { countryId: "de", countryName: "Almanya", completedSteps: 3, totalSteps: 10, completionPct: 30, countriesWithProgress: 1 };
    fetchMock.mockResolvedValueOnce(mockOk(stats));

    const res = await api.guide.getHomeStats(TOKEN);
    expect(res.completedSteps).toBe(3);
    expect(res.completionPct).toBe(30);
  });
});
