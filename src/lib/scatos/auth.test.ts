import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COOKIE, createSession, getSession } from './auth';

const requestFor = (token: string) => new Request('https://stanwood.dev/lg', {
  headers: { cookie: `${COOKIE}=${token}` },
});
beforeEach(() => {
  vi.stubEnv('SCATOS_PASSWORD', 'MyCode');
  vi.stubEnv('SCATOS_SESSION_SECRET', 'random-session-key-for-tests-only');
});
afterEach(() => vi.unstubAllEnvs());

describe('ScatosSwip access codes', () => {
  it('accepts every capitalization and preserves the selected profile', async () => {
    for (const code of ['MyCode', 'mycode', 'MYCODE', 'mYcOdE']) {
      const token = await createSession(code, 'madeleine');
      expect(token).not.toBeNull();
      expect(await getSession(requestFor(token!))).toBe('madeleine');
    }
  });

  it('rejects incorrect codes and invalid profiles', async () => {
    expect(await createSession('different', 'stephen')).toBeNull();
    expect(await createSession(null, 'stephen')).toBeNull();
    expect(await createSession('mycode', 'someone-else')).toBeNull();
  });

  it('keeps existing sessions valid when only the access code changes', async () => {
    const token = await createSession('mycode', 'stephen');
    vi.stubEnv('SCATOS_PASSWORD', 'NewCode');
    expect(await getSession(requestFor(token!))).toBe('stephen');
    expect(await createSession('mycode', 'stephen')).toBeNull();
  });

  it('rejects profile tampering and fails closed without a signing secret', async () => {
    const token = await createSession('mycode', 'stephen');
    expect(await getSession(requestFor(token!.replace('stephen.', 'madeleine.')))).toBeNull();
    vi.stubEnv('SCATOS_SESSION_SECRET', '');
    expect(await createSession('mycode', 'stephen')).toBeNull();
    expect(await getSession(requestFor(token!))).toBeNull();
  });
});
