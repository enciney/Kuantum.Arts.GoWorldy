/**
 * Integration Testleri — Auth yanıtı tam kullanıcı alanları
 *
 * Bug fix: /auth/register, /auth/login, /auth/google endpoint'leri önceden
 * sadece { id, email, displayName, role } döndürüyordu.
 * Düzeltme sonrası: isPremium, premiumUntil, userType de eklendi.
 *
 * Bu testler o fix'in geriye dönük kırılmadığını garantiler.
 */

import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection } from "../../src/repositories/mongodb/db";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");
});

afterAll(async () => {
  await closeDbConnection();
});

// ── POST /api/auth/register ──────────────────────────────────────────────────

describe("USR-FLD register — tam user alanları", () => {
  it("USR-FLD-01: register → isPremium:false, premiumUntil:null, userType döner", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_reg1@test.com",
      password: "pass12345",
      displayName: "FldUser1",
      userType: "emigrant",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.isPremium).toBe(false);
    expect(res.body.user.premiumUntil).toBeNull();
    expect(res.body.user.userType).toBe("emigrant");
  });

  it("USR-FLD-02: register consultant → userType:consultant", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_consultant@test.com",
      password: "pass12345",
      displayName: "FldConsultant",
      userType: "consultant",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.userType).toBe("consultant");
  });

  it("USR-FLD-03: register diaspora → userType:diaspora", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_diaspora@test.com",
      password: "pass12345",
      displayName: "FldDiaspora",
      userType: "diaspora",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.userType).toBe("diaspora");
  });

  it("USR-FLD-04: userType eksikse default emigrant döner", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_default@test.com",
      password: "pass12345",
      displayName: "FldDefault",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.userType).toBe("emigrant");
  });

  it("USR-FLD-05: register yanıtında passwordHash sızmaz", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_hash@test.com",
      password: "pass12345",
      displayName: "FldHash",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("USR-FLD-06: register yanıtında id, email, displayName, role, token var", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "fld_fields@test.com",
      password: "pass12345",
      displayName: "FldFields",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.id).toBeTruthy();
    expect(res.body.user.email).toBe("fld_fields@test.com");
    expect(res.body.user.displayName).toBe("FldFields");
    expect(res.body.user.role).toBe("user");
  });
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────

describe("USR-FLD login — tam user alanları", () => {
  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({
      email: "fld_login@test.com",
      password: "loginpass123",
      displayName: "FldLogin",
      userType: "diaspora",
    });
  });

  it("USR-FLD-07: login → isPremium:false, premiumUntil:null, userType döner", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "fld_login@test.com",
      password: "loginpass123",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.isPremium).toBe(false);
    expect(res.body.user.premiumUntil).toBeNull();
    expect(res.body.user.userType).toBe("diaspora");
  });

  it("USR-FLD-08: login yanıtında token ve user.id var", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "fld_login@test.com",
      password: "loginpass123",
    });
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.id).toBeTruthy();
  });

  it("USR-FLD-09: login yanıtında passwordHash sızmaz", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "fld_login@test.com",
      password: "loginpass123",
    });
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});

// ── POST /api/auth/google ─────────────────────────────────────────────────────

describe("USR-FLD google — Google servis kapalıysa 503", () => {
  it("USR-FLD-10: Google env yapılandırılmamışsa → 503 anlamlı hata", async () => {
    // Test ortamında Google env var'ları yoktur → 503 beklenir
    const res = await request(app)
      .post("/api/auth/google")
      .send({ idToken: "fake-google-token" });

    // Servis yapılandırılmamışsa 503, yapılandırılmışsa 401 (geçersiz token)
    expect([401, 503]).toContain(res.status);
    expect(res.body.error).toBeTruthy();
  });
});
