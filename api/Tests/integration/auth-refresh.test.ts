/**
 * Integration tests — AUTH-LOG-005: JWT Refresh Token
 * POST /api/auth/refresh
 *
 * Senaryolar:
 *  - register/login refreshToken döndürür
 *  - geçerli refresh → yeni access + refresh token
 *  - expire olmuş refresh → 401
 *  - geçersiz / bozuk token → 401
 *  - access token ile refresh deneme → 401 (type check)
 *  - eksik body → 400
 *  - yeni token ile korumalı endpoint erişimi çalışmalı
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");
});

afterAll(async () => {
  await closeDbConnection();
});

// ── Register + Login refreshToken dönüşü ────────────────────────────────────

describe("POST /api/auth/register — refreshToken", () => {
  it("register yanıtında refreshToken olmalı", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "refresh_reg@test.com",
      password: "pass1234",
      displayName: "RefreshReg",
      userType: "emigrant",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    // refreshToken access token'dan farklı olmalı
    expect(res.body.token).not.toBe(res.body.refreshToken);
  });

  it("register'daki refreshToken geçerli JWT olmalı", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "refresh_valid@test.com",
      password: "pass1234",
      displayName: "RefreshValid",
      userType: "emigrant",
    });
    const { refreshToken } = res.body;
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { type: string; id: string };
    expect(decoded.type).toBe("refresh");
    expect(decoded.id).toBeDefined();
  });
});

describe("POST /api/auth/login — refreshToken", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "refresh_login@test.com",
      password: "loginpass",
      displayName: "RefreshLogin",
      userType: "emigrant",
    });
  });

  it("login yanıtında refreshToken olmalı", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "refresh_login@test.com",
      password: "loginpass",
    });
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).toBeDefined();
  });
});

// ── POST /api/auth/refresh ───────────────────────────────────────────────────

describe("POST /api/auth/refresh — happy path", () => {
  let userId: string;
  let validRefreshToken: string;

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "refresh_happy@test.com",
      password: "happypass",
      displayName: "RefreshHappy",
      userType: "emigrant",
    });
    userId = res.body.user.id;
    validRefreshToken = res.body.refreshToken;
  });

  it("geçerli refresh token → 200 + yeni token + yeni refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it("yeni access token geçerli JWT olmalı (doğru userId)", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });
    const decoded = jwt.verify(res.body.token, JWT_SECRET) as { id: string };
    expect(decoded.id).toBe(userId);
  });

  it("refresh sonrası yeni token ile korumalı endpoint erişilebilmeli", async () => {
    const refreshRes = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });
    const newToken = refreshRes.body.token;

    const meRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${newToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe("refresh_happy@test.com");
  });

  it("dönülen refreshToken da tekrar kullanılabilmeli (token rotation)", async () => {
    const res1 = await request(app).post("/api/auth/refresh").send({
      refreshToken: validRefreshToken,
    });
    const newRefreshToken = res1.body.refreshToken;

    const res2 = await request(app).post("/api/auth/refresh").send({
      refreshToken: newRefreshToken,
    });
    expect(res2.status).toBe(200);
    expect(res2.body.token).toBeDefined();
  });
});

// ── POST /api/auth/refresh — hata senaryoları ────────────────────────────────

describe("POST /api/auth/refresh — hata senaryoları", () => {
  it("body yoksa → 400", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("bozuk token string → 401", async () => {
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: "tamamen.gecersiz.token",
    });
    expect(res.status).toBe(401);
  });

  it("expire olmuş refresh token → 401", async () => {
    const expiredRefresh = jwt.sign(
      { id: "someuserid", role: "user", type: "refresh" },
      REFRESH_SECRET,
      { expiresIn: -1 } // already expired
    );
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: expiredRefresh,
    });
    expect(res.status).toBe(401);
  });

  it("access token type ile refresh deneme → 401 (type: 'access' değil 'refresh')", async () => {
    // access token tipini simüle et (type field yok, normal login token gibi)
    const accessToken = jwt.sign(
      { id: "someuserid", role: "user" }, // type: "refresh" yok
      REFRESH_SECRET,
      { expiresIn: "1h" }
    );
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: accessToken,
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/geçersiz token tipi/i);
  });

  it("yanlış secret ile imzalanmış token → 401", async () => {
    const wrongSecretToken = jwt.sign(
      { id: "someuserid", role: "user", type: "refresh" },
      "completelywrongsecret",
      { expiresIn: "30d" }
    );
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: wrongSecretToken,
    });
    expect(res.status).toBe(401);
  });

  it("var olmayan kullanıcı ID ile geçerli refresh token → 404", async () => {
    const ghostToken = jwt.sign(
      { id: "000000000000000000000001", role: "user", type: "refresh" },
      REFRESH_SECRET,
      { expiresIn: "30d" }
    );
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: ghostToken,
    });
    // kullanıcı bulunamazsa 404
    expect(res.status).toBe(404);
  });
});

// ── Süre dolmuş access token → refresh akışı ────────────────────────────────

describe("Expire olmuş access token + geçerli refresh → yeni token alınabilmeli", () => {
  it("expire access token ile /users/me → 401; refresh ile yeni token → /users/me 200", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      email: "refresh_expire@test.com",
      password: "expirepass",
      displayName: "RefreshExpire",
      userType: "emigrant",
    });
    const { refreshToken } = regRes.body;

    // Expire olmuş access token oluştur (gerçek login token değil, -1 expire)
    const expiredAccess = jwt.sign(
      { id: regRes.body.user.id, role: "user" },
      JWT_SECRET,
      { expiresIn: -1 }
    );

    // Expire access ile /users/me → 401
    const failRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredAccess}`);
    expect(failRes.status).toBe(401);

    // Refresh ile yeni token al
    const refreshRes = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    const newToken = refreshRes.body.token;

    // Yeni token ile /users/me → 200
    const okRes = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${newToken}`);
    expect(okRes.status).toBe(200);
    expect(okRes.body.email).toBe("refresh_expire@test.com");
  });
});
