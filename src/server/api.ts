import { Hono, type MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';
import { stream } from 'hono/streaming';
import {
  ACCEPTED_FILE_TYPES,
  AnalyzeJsonBody,
  ImprovePromptBody,
  MAX_FILE_BYTES,
  RefineBody,
  VisualBody,
  type VisualResponse,
} from '../shared/schemas.ts';
import * as gemini from './gemini.ts';
import * as drive from './drive.ts';
import * as localStore from './local-store.ts';
import { requireAuth, sealer, type AppEnv, type Session } from './session.ts';

/** Simple fixed-window limiter keyed by user id. One Cloud Run instance → good enough; use Redis if you scale out. */
function rateLimit(name: string, limit: number, windowMs: number): MiddlewareHandler<AppEnv> {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return async (c, next) => {
    const key = c.get('session').user.id;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) hits.set(key, { count: 1, resetAt: now + windowMs });
    else if (++entry.count > limit) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      throw new HTTPException(429, { message: `Too many ${name} requests, try again later` });
    }
    await next();
  };
}

const HOUR = 60 * 60 * 1000;
const textLimit = rateLimit('analysis', 60, HOUR);
const imageLimit = rateLimit('image', 40, HOUR);

/** Google Drive for signed-in users, the local disk for dev-login sessions. Same shape either way. */
function storage(session: Session) {
  const { local, id } = session.user;
  return {
    upload: (name: string, data: string, mimeType: string) =>
      local ? localStore.uploadImage(id, name, data, mimeType) : drive.uploadImage(session.accessToken, name, data, mimeType),
    list: () => (local ? localStore.listImages(id) : drive.listImages(session.accessToken)),
    thumbnail: (fileId: string) => (local ? localStore.fetchThumbnail(id, fileId) : drive.fetchThumbnail(session.accessToken, fileId)),
    remove: (fileId: string) => (local ? localStore.deleteImage(id, fileId) : drive.deleteImage(session.accessToken, fileId)),
  };
}

async function saveToDrive(session: Session, title: string | undefined, image: gemini.GeneratedImage) {
  const safeTitle = (title ?? 'Visual').replace(/[\\/:*?"<>|]+/g, ' ').slice(0, 80).trim();
  const name = `${safeTitle} - ${new Date().toISOString().slice(0, 16).replace('T', ' ')}.${image.mimeType === 'image/png' ? 'png' : 'jpg'}`;
  try {
    return { drive: await storage(session).upload(name, image.data, image.mimeType) };
  } catch (err) {
    // The image is still useful without Drive; report the failure instead of failing the request.
    console.warn('Drive upload failed:', (err as Error).message);
    return { driveError: session.user.local ? 'Could not save the image locally' : 'Could not save to Google Drive' };
  }
}

function toVisualResponse(session: Session, image: gemini.GeneratedImage, saved: Awaited<ReturnType<typeof saveToDrive>>): VisualResponse {
  return {
    image: `data:${image.mimeType};base64,${image.data}`,
    ref: sealer.sign(image.interactionId, session.user.id),
    ...saved,
  };
}

export const api = new Hono<AppEnv>()
  .use(requireAuth)

  .post('/analyze', textLimit, bodyLimit({ maxSize: MAX_FILE_BYTES + 1024 * 1024 }), async (c) => {
    if (c.req.header('content-type')?.startsWith('multipart/form-data')) {
      const form = await c.req.parseBody();
      const file = form.file;
      if (!(file instanceof File)) throw new HTTPException(400, { message: 'Missing file' });
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) throw new HTTPException(415, { message: `Unsupported file type: ${file.type || 'unknown'}` });
      if (file.size > MAX_FILE_BYTES) throw new HTTPException(413, { message: 'File too large (max 20 MB)' });
      const data = Buffer.from(await file.arrayBuffer()).toString('base64');
      return c.json(await gemini.analyze({ mode: 'file', data, mimeType: file.type }));
    }
    const body = AnalyzeJsonBody.parse(await c.req.json());
    return c.json(await gemini.analyze(body));
  })

  .post('/brandings/improve', textLimit, async (c) => {
    const { name, prompt } = ImprovePromptBody.parse(await c.req.json());
    return c.json({ prompt: await gemini.improveBrandingPrompt(name, prompt) });
  })

  .post('/visuals', imageLimit, async (c) => {
    const session = c.get('session');
    const body = VisualBody.parse(await c.req.json());
    const image = await gemini.generateVisual(body.source, body.content, body.brandingPrompt, body);
    return c.json(toVisualResponse(session, image, await saveToDrive(session, body.title, image)));
  })

  .post('/visuals/refine', imageLimit, async (c) => {
    const session = c.get('session');
    const body = RefineBody.parse(await c.req.json());
    const previousId = sealer.verify(body.ref, session.user.id);
    if (!previousId) throw new HTTPException(400, { message: 'Invalid image reference' });
    const image = await gemini.refineVisual(previousId, body.instruction, body);
    return c.json(toVisualResponse(session, image, await saveToDrive(session, body.title, image)));
  })

  .get('/history', async (c) => c.json(await storage(c.get('session')).list()))

  .get('/history/:id/thumbnail', async (c) => {
    const res = await storage(c.get('session')).thumbnail(c.req.param('id'));
    c.header('Content-Type', res.headers.get('content-type') ?? 'image/jpeg');
    c.header('Cache-Control', 'private, max-age=3600');
    return stream(c, (s) => s.pipe(res.body!));
  })

  .delete('/history/:id', async (c) => {
    await storage(c.get('session')).remove(c.req.param('id'));
    return c.body(null, 204);
  });
