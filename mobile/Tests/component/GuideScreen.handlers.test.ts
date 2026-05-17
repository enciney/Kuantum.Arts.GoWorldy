import {
  loadCountriesAndProfile,
  loadStepsAndProgress,
  saveAnswer,
  setActiveCountry,
  isBlockingAnswer,
  computeVisibleUpTo,
} from "../../src/screens/main/guideHandlers";
import type { GuideStep, GuideProgress } from "../../src/screens/main/guideHandlers";

// ── loadCountriesAndProfile() ────────────────────────────────────────────────

describe("loadCountriesAndProfile()", () => {
  it("GS-01: ülkeler ve aktif ülke id'si döner", async () => {
    const mockGetCountries = jest.fn().mockResolvedValue([
      { id: "de", name: "Almanya", code: "DE" },
      { id: "xx", name: "Global", code: "XX" },
    ]);
    const mockMe = jest.fn().mockResolvedValue({ activeGuideCountryId: "de" });
    const result = await loadCountriesAndProfile(
      "tok",
      { getCountries: mockGetCountries } as any,
      { me: mockMe } as any
    );
    expect(result.countries).toHaveLength(1);
    expect(result.countries[0].code).toBe("DE");
    expect(result.activeCountryId).toBe("de");
  });

  it("GS-02: XX kodlu ülke filtrelenir", async () => {
    const mockGetCountries = jest.fn().mockResolvedValue([
      { id: "1", name: "Almanya", code: "DE" },
      { id: "2", name: "Global", code: "XX" },
      { id: "3", name: "Hollanda", code: "NL" },
    ]);
    const mockMe = jest.fn().mockResolvedValue({ activeGuideCountryId: null });
    const result = await loadCountriesAndProfile(
      "tok",
      { getCountries: mockGetCountries } as any,
      { me: mockMe } as any
    );
    expect(result.countries).toHaveLength(2);
    expect(result.countries.every((c) => c.code !== "XX")).toBe(true);
  });

  it("GS-03: token yoksa boş sonuç döner — API çağrılmaz", async () => {
    const mockGetCountries = jest.fn();
    const mockMe = jest.fn();
    const result = await loadCountriesAndProfile(
      "",
      { getCountries: mockGetCountries } as any,
      { me: mockMe } as any
    );
    expect(result).toEqual({ countries: [], activeCountryId: null });
    expect(mockGetCountries).not.toHaveBeenCalled();
  });

  it("GS-04: me null activeGuideCountryId döndürürse null iletilir", async () => {
    const mockGetCountries = jest.fn().mockResolvedValue([]);
    const mockMe = jest.fn().mockResolvedValue({ activeGuideCountryId: null });
    const result = await loadCountriesAndProfile(
      "tok",
      { getCountries: mockGetCountries } as any,
      { me: mockMe } as any
    );
    expect(result.activeCountryId).toBeNull();
  });
});

// ── loadStepsAndProgress() ───────────────────────────────────────────────────

describe("loadStepsAndProgress()", () => {
  it("GS-05: adımlar ve ilerleme paralel yüklenir", async () => {
    const steps = [{ id: "s1", order: 1, question: "Vize türü?" }];
    const progress = [{ id: "p1", stepId: "s1", answer: "Çalışma", completedAt: "2026-01-01" }];
    const mockGuide = {
      getSteps: jest.fn().mockResolvedValue(steps),
      getProgress: jest.fn().mockResolvedValue(progress),
    };
    const result = await loadStepsAndProgress("de", "tok", mockGuide as any);
    expect(result.steps).toHaveLength(1);
    expect(result.progress).toHaveLength(1);
  });

  it("GS-06: token yoksa boş sonuç döner — API çağrılmaz", async () => {
    const mockGuide = { getSteps: jest.fn(), getProgress: jest.fn() };
    const result = await loadStepsAndProgress("de", "", mockGuide as any);
    expect(result).toEqual({ steps: [], progress: [] });
    expect(mockGuide.getSteps).not.toHaveBeenCalled();
  });

  it("GS-07: countryId yoksa boş sonuç döner — API çağrılmaz", async () => {
    const mockGuide = { getSteps: jest.fn(), getProgress: jest.fn() };
    const result = await loadStepsAndProgress("", "tok", mockGuide as any);
    expect(result).toEqual({ steps: [], progress: [] });
    expect(mockGuide.getSteps).not.toHaveBeenCalled();
  });
});

// ── saveAnswer() ─────────────────────────────────────────────────────────────

describe("saveAnswer()", () => {
  it("GS-08: geçerli parametrelerle cevap kaydedilir", async () => {
    const mockSave = jest.fn().mockResolvedValue({ id: "pr1" });
    const result = await saveAnswer("s1", "Evet", "de", "tok", { saveProgress: mockSave } as any);
    expect(mockSave).toHaveBeenCalledWith("s1", "Evet", "de", "tok");
    expect(result.id).toBe("pr1");
  });

  it("GS-09: token yoksa fırlatır", async () => {
    const mockSave = jest.fn();
    await expect(
      saveAnswer("s1", "Evet", "de", "", { saveProgress: mockSave } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("GS-10: stepId yoksa fırlatır", async () => {
    const mockSave = jest.fn();
    await expect(
      saveAnswer("", "Evet", "de", "tok", { saveProgress: mockSave } as any)
    ).rejects.toThrow("Adım ID gerekli");
  });

  it("GS-11: countryId yoksa fırlatır", async () => {
    const mockSave = jest.fn();
    await expect(
      saveAnswer("s1", "Evet", "", "tok", { saveProgress: mockSave } as any)
    ).rejects.toThrow("Ülke gerekli");
  });
});

// ── setActiveCountry() ───────────────────────────────────────────────────────

describe("setActiveCountry()", () => {
  it("GS-12: geçerli parametrelerle aktif ülke güncellenir", async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    await setActiveCountry("de", "tok", { updateMe: mockUpdate } as any);
    expect(mockUpdate).toHaveBeenCalledWith({ activeGuideCountryId: "de" }, "tok");
  });

  it("GS-13: token yoksa fırlatır", async () => {
    const mockUpdate = jest.fn();
    await expect(
      setActiveCountry("de", "", { updateMe: mockUpdate } as any)
    ).rejects.toThrow("Token gerekli");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("GS-14: countryId yoksa fırlatır", async () => {
    const mockUpdate = jest.fn();
    await expect(
      setActiveCountry("", "tok", { updateMe: mockUpdate } as any)
    ).rejects.toThrow("Ülke ID gerekli");
  });
});

// ── isBlockingAnswer() ───────────────────────────────────────────────────────

describe("isBlockingAnswer()", () => {
  it("GS-15: cevap blocking cevapla eşleşirse true", () => {
    expect(isBlockingAnswer("hayır", "hayır")).toBe(true);
  });

  it("GS-16: büyük/küçük harf farkı gözetilmez (ASCII harfler)", () => {
    expect(isBlockingAnswer("EVET", "evet")).toBe(true);
  });

  it("GS-17: cevap eşleşmezse false", () => {
    expect(isBlockingAnswer("hayır", "evet")).toBe(false);
  });

  it("GS-18: blockingAnswer undefined ise false", () => {
    expect(isBlockingAnswer(undefined, "hayır")).toBe(false);
  });

  it("GS-19: boşluklar trim edilir", () => {
    expect(isBlockingAnswer("  hayır  ", "hayır")).toBe(true);
  });
});

// ── computeVisibleUpTo() ─────────────────────────────────────────────────────

const makeStep = (id: string, blockingAnswer?: string): GuideStep => ({
  id,
  order: 1,
  question: "Soru?",
  blockingAnswer,
  stepType: "checklist",
});

const makeProgress = (stepId: string, answer: string): GuideProgress => ({
  id: "p" + stepId,
  stepId,
  answer,
  completedAt: "2026-01-01",
});

describe("computeVisibleUpTo()", () => {
  it("GS-20: tüm adımlar tamamlanmışsa son adım görünür, bloke yok", () => {
    const steps = [makeStep("s1"), makeStep("s2")];
    const map = new Map([
      ["s1", makeProgress("s1", "evet")],
      ["s2", makeProgress("s2", "evet")],
    ]);
    const { visibleUpTo, blocked } = computeVisibleUpTo(steps, map, "checklist");
    expect(visibleUpTo).toBe(1);
    expect(blocked).toBe(false);
  });

  it("GS-21: ilk adım tamamlanmamışsa visibleUpTo:0, blocked:false", () => {
    const steps = [makeStep("s1"), makeStep("s2")];
    const map = new Map<string, GuideProgress>();
    const { visibleUpTo, blocked } = computeVisibleUpTo(steps, map, "checklist");
    expect(visibleUpTo).toBe(0);
    expect(blocked).toBe(false);
  });

  it("GS-22: blocking cevap verilince blocked:true", () => {
    const steps = [makeStep("s1", "hayır"), makeStep("s2")];
    const map = new Map([["s1", makeProgress("s1", "hayır")]]);
    const { visibleUpTo, blocked } = computeVisibleUpTo(steps, map, "checklist");
    expect(visibleUpTo).toBe(0);
    expect(blocked).toBe(true);
  });

  it("GS-23: assessment tab'ında blocking kontrol yapılmaz", () => {
    const steps = [makeStep("s1", "hayır"), makeStep("s2")];
    const map = new Map([["s1", makeProgress("s1", "hayır")]]);
    const { blocked } = computeVisibleUpTo(steps, map, "assessment");
    expect(blocked).toBe(false);
  });

  it("GS-24: adım listesi boşsa visibleUpTo:-1, blocked:false", () => {
    const { visibleUpTo, blocked } = computeVisibleUpTo([], new Map(), "checklist");
    expect(visibleUpTo).toBe(-1);
    expect(blocked).toBe(false);
  });
});
