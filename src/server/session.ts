import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { OAuth2Client } from 'google-auth-library';
import { env, isProd } from './env.ts';
import { createSealer } from './crypto.ts';
import type { User } from '../shared/schemas.ts';

export type SessionUser = User;

/** Everything lives server-side in an encrypted httpOnly cookie; the browser never sees Google tokens. */
export interface Session {
  user: SessionUser;
  refreshToken?: string;
  /** Empty for dev-login sessions. */
  accessToken: string;
  /** Epoch ms when accessToken expires. */
  expiresAt: number;
}

export type AppEnv = { Variables: { session: Session } };

export const sealer = createSealer(env.SESSION_SECRET);

// __Host- prefix forbids Domain and requires Secure + Path=/, which pins the cookie to this origin.
const COOKIE = isProd ? '__Host-cv_session' : 'cv_session';
const MAX_AGE_S = 60 * 60 * 24 * 30;
const REFRESH_MARGIN_MS = 60_000;

export const oauthClient = () =>
  // 'postmessage' is the redirect URI used by the Google Identity Services popup code flow.
  new OAuth2Client({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, redirectUri: 'postmessage' });

export function writeSession(c: Context, session: Session) {
  setCookie(c, COOKIE, sealer.seal(session), {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: session.refreshToken || session.user.local ? MAX_AGE_S : Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
  });
}

export function readSession(c: Context): Session | null {
  const raw = getCookie(c, COOKIE);
  return raw ? sealer.unseal<Session>(raw) : null;
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE, { path: '/', secure: isProd });
}

async function refresh(session: Session): Promise<Session | null> {
  if (!session.refreshToken) return null;
  try {
    const client = oauthClient();
    client.setCredentials({ refresh_token: session.refreshToken });
    const { credentials } = await client.refreshAccessToken();
    if (!credentials.access_token) return null;
    return {
      ...session,
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ?? Date.now() + 3_000_000,
      refreshToken: credentials.refresh_token ?? session.refreshToken,
    };
  } catch (err) {
    console.warn('Token refresh failed:', (err as Error).message);
    return null;
  }
}

/** Rejects unauthenticated requests and transparently refreshes the Google access token when it's about to expire. */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  let session = readSession(c);
  if (!session) throw new HTTPException(401, { message: 'Not signed in' });

  if (!session.user.local && session.expiresAt - REFRESH_MARGIN_MS < Date.now()) {
    session = await refresh(session);
    if (!session) {
      clearSession(c);
      throw new HTTPException(401, { message: 'Session expired' });
    }
    writeSession(c, session);
  }

  c.set('session', session);
  await next();
};
