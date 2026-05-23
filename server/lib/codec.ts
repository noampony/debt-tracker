/**
 * Simple deterministic obfuscation for sensitive text fields (member names,
 * transaction titles/notes). This is NOT cryptographically secure — it is a
 * first-pass mitigation so plain user data is not trivially readable in the DB
 * or server logs by a developer. Replace encode/decode with a keyed cipher
 * (e.g. AES-GCM) for stronger protection.
 */

export function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

export function decode(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

