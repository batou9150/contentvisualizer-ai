import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { csrf } from 'hono/csrf';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { ZodError } from 'zod';
import { env, isProd } from './env.ts';
import { auth } from './auth.ts';
import { api } from './api.ts';
import { DriveError } from './drive.ts';
import type { AppEnv } from './session.ts';

const app = new Hono<AppEnv>();

app.use(logger());
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      // Google Identity Services popup + script.
      scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client'],
      frameSrc: ['https://accounts.google.com/gsi/'],
      connectSrc: ["'self'", 'https://accounts.google.com/gsi/'],
      // Mermaid injects inline styles into its SVG output.
      styleSrc: ["'self'", "'unsafe-inline'", 'https://accounts.google.com/gsi/style', 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
    // GIS popup needs to postMessage back to the opener.
    crossOriginOpenerPolicy: 'same-origin-allow-popups',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

// Same-origin API: reject cross-site form posts (Origin check) and require a custom header that
// cross-site requests can't set without a CORS preflight we never grant.
app.use('/api/*', csrf());
app.use('/api/*', async (c, next) => {
  if (c.req.method !== 'GET' && c.req.header('x-requested-with') !== 'XMLHttpRequest') {
    throw new HTTPException(403, { message: 'Missing X-Requested-With header' });
  }
  await next();
});
app.use('/api/*', async (c, next) => {
  // The analyze route sets its own larger limit for file uploads.
  if (c.req.path === '/api/analyze') return next();
  return bodyLimit({ maxSize: 1024 * 1024 })(c, next);
});

app.route('/api', auth);
app.route('/api', api);
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

if (isProd) {
  app.use('/assets/*', serveStatic({ root: './dist', onFound: (_p, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable') }));
  app.use('*', serveStatic({ root: './dist' }));
  app.get('*', serveStatic({ path: './dist/index.html' }));
}

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message || (err.status === 403 ? 'Forbidden' : 'Request failed') }, err.status);
  if (err instanceof ZodError) return c.json({ error: 'Invalid request', issues: err.issues }, 400);
  if (err instanceof DriveError) {
    console.warn('Drive error:', err.status, err.message);
    return c.json({ error: `Google Drive: ${err.message}` }, err.status === 401 || err.status === 403 ? 403 : 502);
  }
  // Errors from the Gemini SDK carry the upstream HTTP status and the API's own message.
  const upstream = (err as { status?: unknown }).status;
  if (typeof upstream === 'number') {
    const detail = (err as { error?: { message?: string } }).error?.message ?? err.message;
    console.error(`Gemini API error ${upstream} on ${c.req.method} ${c.req.path}: ${detail}`);
  } else {
    console.error(err);
  }
  if (upstream === 429) return c.json({ error: 'Gemini is rate limiting requests, please retry in a minute' }, 429);
  if (typeof upstream === 'number') return c.json({ error: 'The AI model could not process this request' }, 502);
  return c.json({ error: 'Something went wrong, please try again' }, 500);
});

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server listening on http://localhost:${info.port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
