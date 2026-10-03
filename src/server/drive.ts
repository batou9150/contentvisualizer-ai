import type { HistoryItem } from '../shared/schemas.ts';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'Content Visualizer AI';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
/** Tags our files so we only ever list what this app created. */
const APP_TAG = { cvApp: 'contentvisualizer-ai' };

export class DriveError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function drive<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new DriveError(res.status, body?.error?.message ?? res.statusText);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const q = (s: string) => encodeURIComponent(s);

// drive.file scope only sees files this app created, so a name match can't pick up an unrelated user folder.
async function ensureFolder(token: string): Promise<string> {
  const query = `name = '${FOLDER_NAME}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const { files } = await drive<{ files: { id: string }[] }>(token, `${API}/files?q=${q(query)}&fields=files(id)&pageSize=1`);
  if (files[0]) return files[0].id;

  const created = await drive<{ id: string }>(token, `${API}/files?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME, appProperties: APP_TAG }),
  });
  return created.id;
}

export async function uploadImage(token: string, name: string, base64: string, mimeType: string) {
  const folderId = await ensureFolder(token);
  const metadata = { name, mimeType, parents: [folderId], appProperties: APP_TAG };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([Buffer.from(base64, 'base64')], { type: mimeType }));

  return drive<{ id: string; webViewLink?: string }>(token, `${UPLOAD}/files?uploadType=multipart&fields=id,webViewLink`, {
    method: 'POST',
    body: form,
  });
}

export async function listImages(token: string): Promise<HistoryItem[]> {
  const query = `appProperties has { key='cvApp' and value='contentvisualizer-ai' } and mimeType != '${FOLDER_MIME}' and trashed = false`;
  const fields = 'files(id,name,createdTime,webViewLink,hasThumbnail)';
  const { files } = await drive<{ files: HistoryItem[] }>(
    token,
    `${API}/files?q=${q(query)}&fields=${q(fields)}&orderBy=createdTime desc&pageSize=50`,
  );
  return files;
}

/** Streams the Drive thumbnail through our server so the browser never needs a Google token. */
export async function fetchThumbnail(token: string, id: string): Promise<Response> {
  const { thumbnailLink } = await drive<{ thumbnailLink?: string }>(token, `${API}/files/${q(id)}?fields=thumbnailLink`);
  if (!thumbnailLink) throw new DriveError(404, 'No thumbnail');
  // Ask for a larger rendition than the default s220.
  const res = await fetch(thumbnailLink.replace(/=s\d+$/, '=s480'), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new DriveError(res.status, 'Thumbnail fetch failed');
  return res;
}

export async function deleteImage(token: string, id: string) {
  // Trash rather than hard-delete so the user can recover it from Drive.
  await drive(token, `${API}/files/${q(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  });
}
