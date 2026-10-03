export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Fetch wrapper for our same-origin API. The custom header is required by the server's CSRF check. */
export async function api<T>(path: string, init: { method?: string; json?: unknown; body?: BodyInit } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Requested-With': 'XMLHttpRequest' };
  let body = init.body;
  if (init.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.json);
  }

  const res = await fetch(`/api${path}`, { method: init.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin' });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const message = data.error && !/^[a-z_]+$/.test(data.error) ? data.error : `Request failed (${res.status})`;
    if (res.status === 401) window.dispatchEvent(new Event('cv:unauthorized'));
    throw new ApiError(res.status, message, data.error);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
