import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { HTTPException } from 'hono/http-exception';
import { env } from './env.ts';
import type { HistoryItem } from '../shared/schemas.ts';

/** Dev-login stand-in for Google Drive: one folder per user under LOCAL_DATA_DIR, with a JSON sidecar per image. */
const ID = /^[0-9a-f-]{36}\.(png|jpg)$/;

const userDir = (userId: string) => join(resolve(env.LOCAL_DATA_DIR), userId.replace(/[^a-z0-9-]/gi, '_'));

function filePath(userId: string, id: string) {
  if (!ID.test(id)) throw new HTTPException(404, { message: 'File not found' });
  return join(userDir(userId), id);
}

export async function uploadImage(userId: string, name: string, base64: string, mimeType: string) {
  const dir = userDir(userId);
  await mkdir(dir, { recursive: true });
  const id = `${randomUUID()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
  await writeFile(join(dir, id), Buffer.from(base64, 'base64'));
  await writeFile(join(dir, `${id}.json`), JSON.stringify({ name, createdTime: new Date().toISOString() }));
  return { id };
}

export async function listImages(userId: string): Promise<HistoryItem[]> {
  const dir = userDir(userId);
  const entries = await readdir(dir).catch(() => [] as string[]);
  const items = await Promise.all(
    entries
      .filter((f) => ID.test(f))
      .map(async (id) => {
        const meta = JSON.parse(await readFile(join(dir, `${id}.json`), 'utf8').catch(() => '{}')) as { name?: string; createdTime?: string };
        const url = `/api/history/${id}/thumbnail`;
        return { id, name: meta.name ?? id, createdTime: meta.createdTime ?? new Date(0).toISOString(), webViewLink: url, hasThumbnail: true };
      }),
  );
  return items.sort((a, b) => b.createdTime.localeCompare(a.createdTime)).slice(0, 50);
}

export async function fetchThumbnail(userId: string, id: string): Promise<Response> {
  const data = await readFile(filePath(userId, id)).catch(() => {
    throw new HTTPException(404, { message: 'File not found' });
  });
  return new Response(data, { headers: { 'Content-Type': id.endsWith('.png') ? 'image/png' : 'image/jpeg' } });
}

export async function deleteImage(userId: string, id: string) {
  const path = filePath(userId, id);
  await rm(path, { force: true });
  await rm(`${path}.json`, { force: true });
}
