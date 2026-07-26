import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function isSupabaseEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSecret(): string {
  return process.env.ADMIN_SECRET || "dev-secret-change-in-production";
}

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || "blh2022";
}

function createSessionToken(): string {
  const expires = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `authenticated:${expires}`;
  const signature = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}:${signature}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [status, expiresStr, signature] = parts;
  if (status !== "authenticated") return false;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() > expires) return false;
  const payload = `${status}:${expiresStr}`;
  const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function verifyPassword(password: string): boolean {
  const expected = getPassword();
  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  if (isSupabaseEnabled()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function loginLocal(password: string): Promise<boolean> {
  if (!verifyPassword(password)) return false;
  return true;
}

export { COOKIE_NAME, SESSION_MAX_AGE, createSessionToken, isSupabaseEnabled };
