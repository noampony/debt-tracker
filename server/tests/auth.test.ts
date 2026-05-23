import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../lib/app.js";
import { db } from "../lib/db.js";
import { cleanDb, createTestUser } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await db.$disconnect();
});

describe("POST /api/auth/register", () => {
  it("registers a new user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@test.com", password: "Password123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("alice@test.com");
    expect(res.body.user.id).toBeTruthy();
  });

  it("rejects an already-registered email", async () => {
    await createTestUser(app, "alice@test.com");

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "alice@test.com", password: "Password123" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "Password123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a password shorter than 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bob@test.com", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and returns a token", async () => {
    await createTestUser(app, "alice@test.com", "Password123");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "Password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("alice@test.com");
  });

  it("rejects wrong password", async () => {
    await createTestUser(app, "alice@test.com", "Password123");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects unknown email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "Password123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("returns 204 when called with a valid token", async () => {
    const { token } = await createTestUser(app);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("invalidates the token after sign-out — old token returns 401", async () => {
    const { token } = await createTestUser(app);

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it("allows login again after sign-out and new token works", async () => {
    const { token: oldToken } = await createTestUser(app, "alice@test.com", "Password123");

    await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${oldToken}`);

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@test.com", password: "Password123" });

    expect(loginRes.status).toBe(200);
    const newToken = loginRes.body.token;

    // New token works
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${newToken}`);
    expect(res.status).toBe(200);
  });

  it("requires authentication — returns 401 without token", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });
});

describe("Protected routes — unauthenticated access", () => {
  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(app).get("/api/members");
    expect(res.status).toBe(401);
  });

  it("returns 401 when an invalid token is sent", async () => {
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});



