import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
function key() {
  const k = process.env.ENCRYPTION_KEY;
  if (!k || k.length !== 64) throw new Error("ENCRYPTION_KEY must be 64 hex chars (openssl rand -hex 32)");
  return Buffer.from(k, "hex");
}
export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(payload: string): string {
  const [iv, tag, enc] = payload.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
