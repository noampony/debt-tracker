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

describe("POST /api/members/:memberId/reset", () => {
  it("returns 204 (no-op) when balance is already zero", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    const res = await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("creates a user_owes_member reset transaction for a positive balance", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    // member_owes_user → balance = +7500
    await createTestTransaction(app, token, member.id, {
      amountMinor: 7500,
      direction: "member_owes_user",
      title: "הלוואה",
    });

    const res = await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.amountMinor).toBe(7500);
    expect(res.body.direction).toBe("user_owes_member");
    expect(res.body.title).toBe("איפוס חוב");
    expect(res.body.type).toBe("reset_adjustment");
  });

  it("creates a member_owes_user reset transaction for a negative balance", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    // user_owes_member → balance = -3000
    await createTestTransaction(app, token, member.id, {
      amountMinor: 3000,
      direction: "user_owes_member",
      title: "החזרה",
    });

    const res = await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.amountMinor).toBe(3000);
    expect(res.body.direction).toBe("member_owes_user");
    expect(res.body.title).toBe("איפוס חוב");
    expect(res.body.type).toBe("reset_adjustment");
  });

  it("results in exactly zero balance after reset", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    await createTestTransaction(app, token, member.id, {
      amountMinor: 10000,
      direction: "member_owes_user",
      title: "עסקה 1",
    });
    await createTestTransaction(app, token, member.id, {
      amountMinor: 3000,
      direction: "user_owes_member",
      title: "עסקה 2",
    });
    // net balance = +7000

    await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token}`);

    // Verify by listing transactions and summing
    const txRes = await request(app)
      .get(`/api/members/${member.id}/transactions`)
      .set("Authorization", `Bearer ${token}`);

    const balance = txRes.body.reduce(
      (sum: number, t: { amountMinor: number; direction: string }) =>
        sum + (t.direction === "member_owes_user" ? t.amountMinor : -t.amountMinor),
      0,
    );
    expect(balance).toBe(0);
  });

  it("preserves original transactions after reset", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);

    await createTestTransaction(app, token, member.id, {
      amountMinor: 5000,
      direction: "member_owes_user",
      title: "מקורי",
    });

    await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token}`);

    const txRes = await request(app)
      .get(`/api/members/${member.id}/transactions`)
      .set("Authorization", `Bearer ${token}`);

    expect(txRes.body).toHaveLength(2);
    const titles = txRes.body.map((t: { title: string }) => t.title);
    expect(titles).toContain("מקורי");
    expect(titles).toContain("איפוס חוב");
  });

  it("returns 404 when resetting another user's member", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1);

    await createTestTransaction(app, token1, member.id, {
      amountMinor: 5000,
      direction: "member_owes_user",
      title: "Test",
    });

    const res = await request(app)
      .post(`/api/members/${member.id}/reset`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });
});

