-- Add tokenVersion column to User for server-side sign-out support.
-- Incrementing tokenVersion invalidates all previously issued JWTs for that user.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

