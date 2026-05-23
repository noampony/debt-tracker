import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Use fewer rounds in test for performance
const SALT_ROUNDS = process.env.NODE_ENV === "test" ? 1 : 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(userId: string, tokenVersion: number): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ userId, tokenVersion }, secret, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string; tokenVersion: number } {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const payload = jwt.verify(token, secret);
  if (
    typeof payload === "string" ||
    !("userId" in payload) ||
    !("tokenVersion" in payload)
  ) {
    throw new Error("Invalid token payload");
  }
  return {
    userId: payload.userId as string,
    tokenVersion: payload.tokenVersion as number,
  };
}


