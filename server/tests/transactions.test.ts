import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../lib/app.js";
import { db } from "../lib/db.js";
import {
  cleanDb,
  createTestUser,
  createTestMember,
  createTestTransaction,
} from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await db.$disconnect();
});

describe("POST /api/transactions", () => {
  it("creates a valid transaction", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await createTestTransaction(app, token, member.id, {
      amountMinor: 10000,
      direction: "member_owes_user",
      title: "ארוחת צהריים",
      transactionDate: "2026-05-01",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.amountMinor).toBe(10000);
    expect(res.body.direction).toBe("member_owes_user");
    expect(res.body.title).toBe("ארוחת צהריים");
    expect(res.body.type).toBe("manual");
  });

  it("rejects a zero amount", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await createTestTransaction(app, token, member.id, {
      amountMinor: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a negative amount", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await createTestTransaction(app, token, member.id, {
      amountMinor: -500,
    });

    expect(res.status).toBe(400);
  });

  it("rejects a missing title", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        memberId: member.id,
        amountMinor: 5000,
        direction: "member_owes_user",
        title: "",
        transactionDate: "2026-05-01",
        type: "manual",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects an invalid direction", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        memberId: member.id,
        amountMinor: 5000,
        direction: "wrong_direction",
        title: "Test",
        transactionDate: "2026-05-01",
        type: "manual",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a missing date", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        memberId: member.id,
        amountMinor: 5000,
        direction: "member_owes_user",
        title: "Test",
        type: "manual",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a transaction for a nonexistent member", async () => {
    const { token } = await createTestUser(app);

    const res = await createTestTransaction(app, token, "nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a transaction for another user's member", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1);

    // user2 tries to create a transaction against user1's member
    const res = await createTestTransaction(app, token2, member.id);

    expect(res.status).toBe(404);
  });
});

describe("GET /api/members/:memberId/transactions", () => {
  it("returns transactions for a member sorted newest-first", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    await createTestTransaction(app, token, member.id, {
      transactionDate: "2026-01-01",
      title: "First",
    });
    await createTestTransaction(app, token, member.id, {
      transactionDate: "2026-06-01",
      title: "Second",
    });

    const res = await request(app)
      .get(`/api/members/${member.id}/transactions`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("Second");
    expect(res.body[1].title).toBe("First");
  });

  it("returns 404 for another user's member", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1);

    const res = await request(app)
      .get(`/api/members/${member.id}/transactions`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });
});

