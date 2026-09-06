import { timingSafeEqual, verifySessionPassword } from '../auth';
import type { Profile } from './types';

export const COOKIE = 'scatos_session';
export const SESSION_AGE = 60 * 60 * 24 * 90;
const profiles = new Set(['stephen', 'madeleine']);
export const isProfile = (value: unknown): value is Profile => typeof value === 'string' && profiles.has(value);
function password() { return import.meta.env.SCATOS_PASSWORD || process.env.SCATOS_PASSWORD; }
function sessionSecret() { return import.meta.env.SCATOS_SESSION_SECRET || process.env.SCATOS_SESSION_SECRET; }
export function hasScatosPassword() { return Boolean(password() && sessionSecret()); }

async function sign(value: string): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error('ScatosSwip access is not configured');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function createSession(submitted: unknown, profile: unknown): Promise<string | null> {
  const code = typeof submitted === 'string' ? submitted.toLowerCase() : submitted;
  if (!isProfile(profile) || !sessionSecret() || !await verifySessionPassword(code, password()?.toLowerCase())) return null;
  const payload = `${profile}.${Math.floor(Date.now() / 1000) + SESSION_AGE}`;
  return `${payload}.${await sign(payload)}`;
}
export async function getSession(request: Request): Promise<Profile | null> {
  const cookie = (request.headers.get('cookie') || '').split(';')
    .map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!cookie || !hasScatosPassword()) return null;
  const parts = cookie.split('.');
  if (parts.length !== 3 || !isProfile(parts[0]) || !/^\d+$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return null;
  const expiry = Number(parts[1]);
  if (expiry < Date.now() / 1000 || expiry > Date.now() / 1000 + SESSION_AGE + 60) return null;
  return timingSafeEqual(parts[2], await sign(`${parts[0]}.${parts[1]}`)) ? parts[0] : null;
}
export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin;
}
