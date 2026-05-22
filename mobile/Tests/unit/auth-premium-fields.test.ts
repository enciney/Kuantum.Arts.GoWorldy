/**
 * Unit Testleri — Auth yanıtı isPremium / userType / premiumUntil alanları
 *
 * Bug fix: auth endpoint'leri artık tam user nesnesi döndürür.
 * Bu testler api.auth.login/register/google mock yanıtlarında
 * isPremium, premiumUntil, userType alanlarının doğru taşındığını doğrular.
 */

import { api, ApiError } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

// ── api.auth.register — premium alanları ────────────────────────────────────

describe("api.auth.register — isPremium / userType alanları", () => {
  it("USR-FLD-M01: register yanıtında isPremium:false, premiumUntil:null, userType döner", async () => {
    const payload = {
      user: {
        id: "u1",
        email: "alice@test.com",
        displayName: "Alice",
        role: "user" as const,
        userType: "emigrant" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "tok",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.register({
      email: "alice@test.com",
      password: "pass123",
      displayName: "Alice",
    });

    expect(res.user.isPremium).toBe(false);
    expect(res.user.premiumUntil).toBeNull();
    expect(res.user.userType).toBe("emigrant");
  });

  it("USR-FLD-M02: consultant userType yanıtta korunur", async () => {
    const payload = {
      user: {
        id: "u2",
        email: "cons@test.com",
        displayName: "Consultant",
        role: "user" as const,
        userType: "consultant" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "tok2",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.register({
      email: "cons@test.com",
      password: "pass123",
      displayName: "Consultant",
      userType: "consultant",
    });

    expect(res.user.userType).toBe("consultant");
  });

  it("USR-FLD-M03: diaspora userType yanıtta korunur", async () => {
    const payload = {
      user: {
        id: "u3",
        email: "dias@test.com",
        displayName: "Diaspora",
        role: "user" as const,
        userType: "diaspora" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "tok3",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.register({
      email: "dias@test.com",
      password: "pass123",
      displayName: "Diaspora",
      userType: "diaspora",
    });

    expect(res.user.userType).toBe("diaspora");
  });
});

// ── api.auth.login — premium alanları ───────────────────────────────────────

describe("api.auth.login — isPremium / premiumUntil alanları", () => {
  it("USR-FLD-M04: non-premium login → isPremium:false, premiumUntil:null", async () => {
    const payload = {
      user: {
        id: "u4",
        email: "bob@test.com",
        displayName: "Bob",
        role: "user" as const,
        userType: "emigrant" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "tok4",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.login({ email: "bob@test.com", password: "pass" });

    expect(res.user.isPremium).toBe(false);
    expect(res.user.premiumUntil).toBeNull();
  });

  it("USR-FLD-M05: premium kullanıcı login → isPremium:true, premiumUntil tarih string", async () => {
    const payload = {
      user: {
        id: "u5",
        email: "prem@test.com",
        displayName: "Premium",
        role: "user" as const,
        userType: "emigrant" as const,
        isPremium: true,
        premiumUntil: "2026-06-01T00:00:00Z",
      },
      token: "tok5",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.login({ email: "prem@test.com", password: "pass" });

    expect(res.user.isPremium).toBe(true);
    expect(res.user.premiumUntil).toBe("2026-06-01T00:00:00Z");
  });

  it("USR-FLD-M06: diaspora tipi kullanıcı login → userType:diaspora korunur", async () => {
    const payload = {
      user: {
        id: "u6",
        email: "carol@test.com",
        displayName: "Carol",
        role: "user" as const,
        userType: "diaspora" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "tok6",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.login({ email: "carol@test.com", password: "pass" });

    expect(res.user.userType).toBe("diaspora");
  });
});

// ── api.auth.google — premium alanları ──────────────────────────────────────

describe("api.auth.google — isPremium / userType alanları", () => {
  it("USR-FLD-M07: Google login → isPremium ve userType yanıtta var", async () => {
    const payload = {
      user: {
        id: "g1",
        email: "google@test.com",
        displayName: "Google User",
        role: "user" as const,
        userType: "emigrant" as const,
        isPremium: false,
        premiumUntil: null,
      },
      token: "gtok",
    };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.google("valid-google-id-token");

    expect(res.user.isPremium).toBe(false);
    expect(res.user.userType).toBe("emigrant");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.idToken).toBe("valid-google-id-token");
  });

  it("USR-FLD-M08: Google servis kapalıysa → ApiError fırlatır", async () => {
    fetchMock.mockResolvedValueOnce(
      mockErr({ error: "Google Sign-In henüz yapılandırılmadı." }, 503)
    );

    const err = await api.auth.google("any-token").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(503);
  });
});
