import request from "supertest";
import type { Express } from "express";
import { db } from "../lib/db.js";

/** Remove all rows in the correct FK order before/after tests. */
export async function cleanDb() {
  await db.transaction.deleteMany();
  await db.member.deleteMany();
  await db.user.deleteMany();
}

/** Register a user and return their JWT token + userId. */
export async function createTestUser(
  app: Express,
  email = "user@test.com",
  password = "Password123",
) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password });
  return {
    token: res.body.token as string,
    userId: res.body.user?.id as string,
  };
}

/** Create a member via the API and return its id. */
export async function createTestMember(
  app: Express,
  token: string,
  name = "Test Member",
) {
  const res = await request(app)
    .post("/api/members")
    .set("Authorization", `Bearer ${token}`)
    .send({ name });
  return res.body as { id: string; name: string };
}

/** Create a transaction via the API. */
export async function createTestTransaction(
  app: Express,
  token: string,
  memberId: string,
  overrides: Partial<{
    amountMinor: number;
    direction: string;
    title: string;
    transactionDate: string;
    type: string;
  }> = {},
) {
  const body = {
    memberId,
    amountMinor: 5000,
    direction: "member_owes_user",
    title: "Test transaction",
    transactionDate: "2026-01-01",
    type: "manual",
    ...overrides,
  };
  const res = await request(app)
    .post("/api/transactions")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
  return res;
}

