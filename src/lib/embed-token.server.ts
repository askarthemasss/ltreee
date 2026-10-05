import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const MAX_AGE_MS = 30 * 60 * 1000;

function sign(payload: string) {
  const secret = process.env["EMBED_TRACK_SECRET"];
  if (!secret) throw new Error("Embed tracking is not configured.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Issues a short-lived signed token tied to one embed render of one profile. */
export function issueEmbedToken(profileId: string) {
  const payload = `${profileId}.${Date.now()}.${randomUUID()}`;
  return `${payload}.${sign(payload)}`;
}

/** Returns { profileId, nonce } when the token is authentic and fresh, else null. */
export function verifyEmbedToken(token: unknown): { profileId: string; nonce: string } | null {
  if (typeof token !== "string" || token.length > 300) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [profileId, issued, nonce, sig] = parts as [string, string, string, string];
  const payload = `${profileId}.${issued}.${nonce}`;
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const age = Date.now() - Number(issued);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return null;
  return { profileId, nonce };
}
