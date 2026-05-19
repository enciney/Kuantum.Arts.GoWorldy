import { hasActivePremium } from "../../src/utils/premium";

describe("hasActivePremium()", () => {
  it("PRM-A-01: isPremium=true, premiumUntil future → true", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(hasActivePremium({ isPremium: true, premiumUntil: future })).toBe(true);
  });

  it("PRM-A-02: isPremium=true, premiumUntil past → false", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(hasActivePremium({ isPremium: true, premiumUntil: past })).toBe(false);
  });

  it("PRM-A-03: isPremium=true, premiumUntil null → true (sınırsız premium)", () => {
    expect(hasActivePremium({ isPremium: true, premiumUntil: null })).toBe(true);
  });

  it("PRM-A-04: isPremium=true, premiumUntil undefined → true", () => {
    expect(hasActivePremium({ isPremium: true })).toBe(true);
  });

  it("PRM-A-05: isPremium=false → false", () => {
    expect(hasActivePremium({ isPremium: false })).toBe(false);
  });

  it("PRM-A-06: isPremium=false ama premiumUntil future olsa bile → false", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(hasActivePremium({ isPremium: false, premiumUntil: future })).toBe(false);
  });

  it("PRM-A-07: user=null → false", () => {
    expect(hasActivePremium(null)).toBe(false);
  });

  it("PRM-A-08: user=undefined → false", () => {
    expect(hasActivePremium(undefined)).toBe(false);
  });

  it("PRM-A-09: premiumUntil geçersiz string → false (güvenli taraf)", () => {
    expect(hasActivePremium({ isPremium: true, premiumUntil: "not-a-date" })).toBe(false);
  });

  it("PRM-A-10: isPremium undefined → false", () => {
    expect(hasActivePremium({})).toBe(false);
  });
});
