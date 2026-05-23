import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long")
    .transform((s) => s.trim()),
});

export const updateMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(200, "Name is too long")
    .transform((s) => s.trim()),
});

const VALID_DIRECTIONS = ["member_owes_user", "user_owes_member"] as const;
const VALID_TYPES = ["manual", "reset_adjustment"] as const;

export const createTransactionSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  amountMinor: z
    .number()
    .int("Amount must be a whole number")
    .positive("Amount must be greater than zero"),
  direction: z.enum(VALID_DIRECTIONS, {
    error: "Direction must be member_owes_user or user_owes_member",
  }),
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title is too long"),
  notes: z.string().max(2000, "Notes are too long").optional(),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.enum(VALID_TYPES).default("manual"),
});


