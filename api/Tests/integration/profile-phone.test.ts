/**
 * USR-PRV-001 + USR-PRV-002: Phone number validation & normalization (TR)
 *
 * Run: npm test -- profile-phone
 */
import request from "supertest";
import { createApp } from "../../src/app";
import { closeDbConnection, resetDbConnection } from "../../src/repositories/mongodb/db";
import { normalizePhoneTR } from "../../src/routes/users";
import type { Express } from "express";

let app: Express;
let token: string;

beforeAll(async () => {
  resetDbConnection();
  app = createApp({ skipRateLimit: true });
  await request(app).get("/api/health");

  const res = await request(app).post("/api/auth/register").send({
    email: "phone@test.com",
    password: "phonepass123",
    displayName: "PhoneTester",
    userType: "emigrant",
  });
  token = res.body.token;
});

afterAll(async () => {
  await closeDbConnection();
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit-level: normalizePhoneTR helper
// ─────────────────────────────────────────────────────────────────────────────
describe("USR-PRV-002: normalizePhoneTR helper", () => {
  it("accepts +905XXXXXXXXX (E.164) → unchanged", () => {
    expect(normalizePhoneTR("+905321234567")).toBe("+905321234567");
  });

  it("accepts 05XXXXXXXXX → +905XXXXXXXXX", () => {
    expect(normalizePhoneTR("05321234567")).toBe("+905321234567");
  });

  it("accepts 5XXXXXXXXX → +905XXXXXXXXX", () => {
    expect(normalizePhoneTR("5321234567")).toBe("+905321234567");
  });

  it("accepts +90 532 123 45 67 (spaces) → +905321234567", () => {
    expect(normalizePhoneTR("+90 532 123 45 67")).toBe("+905321234567");
  });

  it("accepts 0532-123-45-67 (dashes) → +905321234567", () => {
    expect(normalizePhoneTR("0532-123-45-67")).toBe("+905321234567");
  });

  it("rejects landline (not starting with 5)", () => {
    expect(normalizePhoneTR("02121234567")).toBeNull();
  });

  it("rejects too short", () => {
    expect(normalizePhoneTR("532123")).toBeNull();
  });

  it("rejects too long", () => {
    expect(normalizePhoneTR("905321234567890")).toBeNull();
  });

  it("rejects empty", () => {
    expect(normalizePhoneTR("")).toBeNull();
  });

  it("rejects letters", () => {
    expect(normalizePhoneTR("abc532")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: PATCH /users/me with phoneNumber
// ─────────────────────────────────────────────────────────────────────────────
describe("USR-PRV-001/002: PATCH /users/me phoneNumber validation", () => {
  it("valid 05XXXXXXXXX → 200, stored as +90...", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "05321234567" });
    expect(res.status).toBe(200);
    expect(res.body.phoneNumber).toBe("+905321234567");
  });

  it("valid +90... → 200, stored as-is normalized", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "+905551234567" });
    expect(res.status).toBe(200);
    expect(res.body.phoneNumber).toBe("+905551234567");
  });

  it("valid with spaces → 200, normalized", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "0532 123 45 67" });
    expect(res.status).toBe(200);
    expect(res.body.phoneNumber).toBe("+905321234567");
  });

  it("invalid format → 400 with INVALID_PHONE code", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "abc123" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_PHONE");
  });

  it("landline → 400", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "02121234567" });
    expect(res.status).toBe(400);
  });

  it("empty string → 200, clears phoneNumber", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ phoneNumber: "" });
    expect(res.status).toBe(200);
    expect(res.body.phoneNumber).toBe("");
  });

  it("sharePhoneNumber toggle works", async () => {
    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ sharePhoneNumber: true });
    expect(res.status).toBe(200);
    expect(res.body.sharePhoneNumber).toBe(true);
  });
});
