import { validateLoginForm, validateRegisterForm } from "../../src/screens/auth/authHandlers";

// ── validateLoginForm() ───────────────────────────────────────────────────────

describe("validateLoginForm()", () => {
  it("AU-01: email ve şifre doluysa geçerli döner", () => {
    expect(validateLoginForm("user@test.com", "pass123")).toEqual({ valid: true });
  });

  it("AU-02: email boşsa hata döner", () => {
    const r = validateLoginForm("", "pass123");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("AU-03: şifre boşsa hata döner", () => {
    const r = validateLoginForm("user@test.com", "");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("AU-04: sadece boşluktan oluşan email geçersizdir", () => {
    const r = validateLoginForm("   ", "pass123");
    expect(r.valid).toBe(false);
  });

  it("AU-05: ikisi de boşsa hata döner", () => {
    const r = validateLoginForm("", "");
    expect(r.valid).toBe(false);
  });
});

// ── validateRegisterForm() ────────────────────────────────────────────────────

describe("validateRegisterForm()", () => {
  it("AU-06: tüm alanlar doluysa ve şifre ≥6 ise geçerli döner", () => {
    expect(validateRegisterForm("Ali", "ali@test.com", "secure1")).toEqual({ valid: true });
  });

  it("AU-07: displayName boşsa hata döner", () => {
    const r = validateRegisterForm("", "ali@test.com", "secure1");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("AU-08: email boşsa hata döner", () => {
    const r = validateRegisterForm("Ali", "", "secure1");
    expect(r.valid).toBe(false);
  });

  it("AU-09: şifre boşsa hata döner", () => {
    const r = validateRegisterForm("Ali", "ali@test.com", "");
    expect(r.valid).toBe(false);
  });

  it("AU-10: şifre 5 karakter — çok kısa hatası", () => {
    const r = validateRegisterForm("Ali", "ali@test.com", "12345");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/6/);
  });

  it("AU-11: şifre tam 6 karakter — geçerli", () => {
    expect(validateRegisterForm("Ali", "ali@test.com", "123456")).toEqual({ valid: true });
  });

  it("AU-12: sadece boşluktan oluşan displayName geçersizdir", () => {
    const r = validateRegisterForm("   ", "ali@test.com", "secure1");
    expect(r.valid).toBe(false);
  });
});
