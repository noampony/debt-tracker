import { PrismaClient } from "@prisma/client";

// Singleton Prisma client shared across the server
export const db = new PrismaClient();

