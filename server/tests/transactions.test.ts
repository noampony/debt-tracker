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

describe("PATCH /api/transactions/:id", () => {
  it("updates editable fields of a transaction", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);
    const createRes = await createTestTransaction(app, token, member.id, {
      amountMinor: 5000,
      title: "Original title",
      transactionDate: "2026-01-01",
    });
    const txId = createRes.body.id as string;

    const res = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amountMinor: 9999,
        direction: "user_owes_member",
        title: "Updated title",
        transactionDate: "2026-06-01",
      });

    expect(res.status).toBe(200);
    expect(res.body.amountMinor).toBe(9999);
    expect(res.body.direction).toBe("user_owes_member");
    expect(res.body.title).toBe("Updated title");
    expect(res.body.transactionDate).toBe("2026-06-01");
    // type and memberId remain unchanged
    expect(res.body.type).toBe("manual");
    expect(res.body.memberId).toBe(member.id);
  });

  it("rejects an invalid update (zero amount)", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);
    const createRes = await createTestTransaction(app, token, member.id);
    const txId = createRes.body.id as string;

    const res = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amountMinor: 0,
        direction: "member_owes_user",
        title: "Test",
        transactionDate: "2026-01-01",
      });

    expect(res.status).toBe(400);
  });

  it("returns 404 when updating another user's transaction", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1);
    const createRes = await createTestTransaction(app, token1, member.id);
    const txId = createRes.body.id as string;

    const res = await request(app)
      .patch(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({
        amountMinor: 1000,
        direction: "member_owes_user",
        title: "Hack",
        transactionDate: "2026-01-01",
      });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/transactions/:id", () => {
  it("deletes a transaction", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);
    const createRes = await createTestTransaction(app, token, member.id);
    const txId = createRes.body.id as string;

    const res = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    // Confirm transaction is gone
    const listRes = await request(app)
      .get(`/api/members/${member.id}/transactions`)
      .set("Authorization", `Bearer ${token}`);
    expect(listRes.body).toHaveLength(0);
  });

  it("returns 404 when deleting another user's transaction", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1);
    const createRes = await createTestTransaction(app, token1, member.id);
    const txId = createRes.body.id as string;

    const res = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });
});

describe("Security — backend stores HTML-like content as plain text", () => {
  it("accepts an HTML-like transaction title and returns it as a plain JSON string", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token);
    const htmlTitle = '<script>alert("xss")</script>';

    const res = await createTestTransaction(app, token, member.id, { title: htmlTitle });

    expect(res.status).toBe(201);
    // The title is stored and returned as-is — the backend does not execute or transform HTML
    expect(res.body.title).toBe(htmlTitle);
    // The response is JSON (not HTML), so no rendering happens at this layer
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });

  it("accepts an HTML-like member name and returns it as a plain JSON string", async () => {
    const { token } = await createTestUser(app);
    const htmlName = "<img src=x onerror=alert(1)>";

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: htmlName });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(htmlName);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
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

