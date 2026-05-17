import { api, ApiError, setOn401Handler } from "../../src/services/api";
import { mockOk, mockErr } from "./setup";

const fetchMock = jest.fn();
global.fetch = fetchMock;
beforeEach(() => fetchMock.mockReset());

// ── A-01/A-06: Başarılı register + login ────────────────────────────────────
describe("POST /auth/register", () => {
  it("A-01: başarılı kayıt → user + token döner", async () => {
    const payload = { user: { id: "1", email: "alice@test.com", displayName: "Alice", role: "user" as const }, token: "tok" };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.register({ email: "alice@test.com", password: "pass123", displayName: "Alice" });

    expect(res.token).toBe("tok");
    expect(res.user.email).toBe("alice@test.com");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("A-02: var olan email → ApiError fırlatır", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Email already exists" }, 400));

    await expect(api.auth.register({ email: "dup@test.com", password: "pass123", displayName: "Dup" }))
      .rejects.toThrow(ApiError);
  });

  it("A-04: eksik alan → ApiError fırlatır", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Missing fields" }, 400));

    await expect(api.auth.register({ email: "", password: "", displayName: "" }))
      .rejects.toThrow(ApiError);
  });
});

// ── A-06/A-07/A-08: Login ───────────────────────────────────────────────────
describe("POST /auth/login", () => {
  it("A-06: başarılı giriş → user + token", async () => {
    const payload = { user: { id: "1", email: "a@b.com", displayName: "A", role: "user" as const }, token: "jwt" };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.login({ email: "a@b.com", password: "pass" });
    expect(res.token).toBe("jwt");
  });

  it("A-07: hatalı şifre → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Invalid credentials" }, 401));

    const err = await api.auth.login({ email: "a@b.com", password: "wrong" }).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(401);
  });

  it("A-08: olmayan email → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Invalid credentials" }, 401));

    await expect(api.auth.login({ email: "noone@x.com", password: "x" })).rejects.toThrow(ApiError);
  });
});

// ── A-10/A-11: Google auth ──────────────────────────────────────────────────
describe("POST /auth/google", () => {
  it("A-10: geçerli Google token → user + token", async () => {
    const payload = { user: { id: "g1", email: "g@google.com", displayName: "G", role: "user" as const }, token: "gtok" };
    fetchMock.mockResolvedValueOnce(mockOk(payload));

    const res = await api.auth.google("valid-google-id-token");
    expect(res.user.email).toBe("g@google.com");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.idToken).toBe("valid-google-id-token");
  });

  it("A-11: geçersiz Google token → 401 ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Invalid token" }, 401));

    await expect(api.auth.google("fake")).rejects.toThrow(ApiError);
  });
});

// ── A-12/A-13/A-14: Forgot password ────────────────────────────────────────
describe("POST /auth/forgot-password", () => {
  it("A-12: kayıtlı email → 200 ok:true", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true, message: "Sent" }));

    const res = await api.auth.forgotPassword("alice@test.com");
    expect(res.ok).toBe(true);
  });

  it("A-13: kayıtsız email → yine 200 (bilgi sızdırma engeli)", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true, message: "Sent" }));

    const res = await api.auth.forgotPassword("nobody@x.com");
    expect(res.ok).toBe(true);
  });
});

// ── A-15/A-16/A-17: Reset password ─────────────────────────────────────────
describe("POST /auth/reset-password", () => {
  it("A-15: geçerli token → 200 ok:true", async () => {
    fetchMock.mockResolvedValueOnce(mockOk({ ok: true, message: "Reset" }));

    const res = await api.auth.resetPassword("valid-token", "newpass123");
    expect(res.ok).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.token).toBe("valid-token");
    expect(body.newPassword).toBe("newpass123");
  });

  it("A-16: süresi dolmuş token → ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Token expired" }, 400));

    const err = await api.auth.resetPassword("old-token", "newpass").catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
  });

  it("A-17: geçersiz token → ApiError", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Invalid token" }, 400));

    await expect(api.auth.resetPassword("fake", "pass")).rejects.toThrow(ApiError);
  });
});

// ── SEC-01: 401 handler ─────────────────────────────────────────────────────
describe("401 handler", () => {
  it("SEC-01: 401 yanıtında kayıtlı handler çağrılır", async () => {
    const handler = jest.fn();
    setOn401Handler(handler);
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Unauthorized" }, 401));

    await api.auth.login({ email: "x", password: "y" }).catch(() => {});
    expect(handler).toHaveBeenCalledTimes(1);

    setOn401Handler(() => {}); // temizle
  });
});

// ── ApiError ─────────────────────────────────────────────────────────────────
describe("ApiError", () => {
  it("hata mesajı ve status alanını taşır", async () => {
    fetchMock.mockResolvedValueOnce(mockErr({ error: "Not found" }, 404));

    const err = await api.auth.login({ email: "x", password: "y" }).catch(e => e);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("ApiError");
  });
});


