import crypto from "node:crypto";

export const generateStreamToken = (secret: string, ttlSeconds: number) => {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = JSON.stringify({ expiresAt });
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
};

export const verifyStreamToken = (token: string, secret: string, ttlSeconds: number) => {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature) return false;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (expected !== signature) return false;
    const data = JSON.parse(payload) as { expiresAt: number };
    const now = Math.floor(Date.now() / 1000);
    if (data.expiresAt < now) return false;
    if (data.expiresAt > now + ttlSeconds + 5) return false;
    return true;
  } catch {
    return false;
  }
};
