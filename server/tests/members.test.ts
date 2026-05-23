import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../lib/app.js";
import { db } from "../lib/db.js";
import { cleanDb, createTestUser, createTestMember, createTestTransaction } from "./helpers.js";

const app = createApp();

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await db.$disconnect();
});

describe("POST /api/members", () => {
  it("creates a member with a valid name", async () => {
    const { token } = await createTestUser(app);

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "דני" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe("דני");
  });

  it("rejects an empty name", async () => {
    const { token } = await createTestUser(app);

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a whitespace-only name", async () => {
    const { token } = await createTestUser(app);

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("rejects a duplicate name within the same user", async () => {
    const { token } = await createTestUser(app);
    await createTestMember(app, token, "דני");

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "דני" });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeTruthy();
  });

  it("allows the same name across different users", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    await createTestMember(app, token1, "דוד");

    const res = await request(app)
      .post("/api/members")
      .set("Authorization", `Bearer ${token2}`)
      .send({ name: "דוד" });

    expect(res.status).toBe(201);
  });
});

describe("GET /api/members", () => {
  it("returns only the authenticated user's members", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    await createTestMember(app, token1, "Alice");
    await createTestMember(app, token2, "Bob");

    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${token1}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Alice");
  });
});

describe("DELETE /api/members/:id", () => {
  it("deletes a member and their transactions", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token, "ToDelete");
    await createTestTransaction(app, token, member.id);

    const res = await request(app)
      .delete(`/api/members/${member.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);

    // Confirm member is gone
    const listRes = await request(app).get("/api/members").set("Authorization", `Bearer ${token}`);
    expect(listRes.body).toHaveLength(0);
  });

  it("returns 404 when a user tries to delete another user's member", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1, "Alice");

    const res = await request(app)
      .delete(`/api/members/${member.id}`)
      .set("Authorization", `Bearer ${token2}`);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/members/:id", () => {
  it("renames a member", async () => {
    const { token } = await createTestUser(app);
    const member = await createTestMember(app, token, "OldName");

    const res = await request(app)
      .patch(`/api/members/${member.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "NewName" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("NewName");
  });

  it("returns 404 when a user tries to rename another user's member", async () => {
    const { token: token1 } = await createTestUser(app, "user1@test.com");
    const { token: token2 } = await createTestUser(app, "user2@test.com");

    const member = await createTestMember(app, token1, "Alice");

    const res = await request(app)
      .patch(`/api/members/${member.id}`)
      .set("Authorization", `Bearer ${token2}`)
      .send({ name: "Hacker" });

    expect(res.status).toBe(404);
  });
});

