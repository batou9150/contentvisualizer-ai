import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { env, googleLogin, isUserAllowed } from './env.ts';
import { clearSession, oauthClient, readSession, writeSession, type AppEnv, type Session } from './session.ts';

/** Only files this app creates are visible to it; no access to the rest of the user's Drive. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const SCOPES = ['openid', 'email', 'profile', DRIVE_SCOPE];

export const auth = new Hono<AppEnv>()
  .get('/config', (c) => c.json({ clientId: googleLogin ? env.GOOGLE_CLIENT_ID : null, scopes: SCOPES, devLogin: env.DEV_LOGIN }))

  .post('/auth/google', async (c) => {
    if (!googleLogin) throw new HTTPException(404, { message: 'Google sign-in is not configured' });
    const { code } = z.object({ code: z.string().min(1) }).parse(await c.req.json());
    const client = oauthClient();

    let tokens;
    try {
      ({ tokens } = await client.getToken(code));
    } catch (err) {
      console.warn('Code exchange failed:', (err as Error).message);
      throw new HTTPException(400, { message: 'Invalid authorization code' });
    }
    if (!tokens.id_token || !tokens.access_token) throw new HTTPException(400, { message: 'Incomplete token response' });

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new HTTPException(403, { message: 'A verified Google email is required' });
    }
    if (!isUserAllowed(payload.email)) throw new HTTPException(403, { message: 'This account is not allowed' });

    // With granular consent the user can untick Drive; history and saving need it.
    if (!tokens.scope?.split(' ').includes(DRIVE_SCOPE)) {
      return c.json({ error: 'drive_scope_required' }, 403);
    }

    // Google only returns a refresh token on first consent. Without it the session would die after an hour,
    // so ask the client to re-run the flow with prompt=consent.
    if (!tokens.refresh_token) return c.json({ error: 'consent_required' }, 409);

    const session: Session = {
      user: { id: payload.sub, name: payload.name ?? payload.email, email: payload.email, picture: payload.picture },
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt: tokens.expiry_date ?? Date.now() + 3_000_000,
    };
    writeSession(c, session);
    return c.json({ user: session.user });
  })

  /** Local development only: sign in as any name, no OAuth client needed. */
  .post('/auth/dev', async (c) => {
    if (!env.DEV_LOGIN) throw new HTTPException(404, { message: 'Not found' });
    const { name } = z.object({ name: z.string().trim().min(1).max(40) }).parse(await c.req.json());
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'dev';
    const session: Session = {
      user: { id: `dev-${slug}`, name, email: `${slug}@dev.local`, local: true },
      accessToken: '',
      expiresAt: 0,
    };
    writeSession(c, session);
    return c.json({ user: session.user });
  })

  .get('/auth/me', (c) => {
    const session = readSession(c);
    return session ? c.json({ user: session.user }) : c.json({ user: null });
  })

  .post('/auth/logout', async (c) => {
    const session = readSession(c);
    clearSession(c);
    if (session?.refreshToken && googleLogin) {
      await oauthClient().revokeToken(session.refreshToken).catch(() => {});
    }
    return c.body(null, 204);
  });
