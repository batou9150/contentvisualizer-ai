import type { Source } from '../shared/schemas.ts';

/** Strips code fences the model sometimes adds despite instructions. */
export function cleanMermaid(code: string): string {
  return code
    .replace(/^\s*```(?:mermaid)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/** Collects citations from model output annotations and URL-context / search result steps. */
export function extractSources(interaction: unknown): Source[] {
  const found = new Map<string, Source>();
  const add = (url: unknown, title: unknown) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url) && !found.has(url)) {
      found.set(url, { url, title: typeof title === 'string' && title ? title : undefined });
    }
  };

  const steps = (interaction as { steps?: unknown[] }).steps ?? [];
  for (const step of steps as Record<string, unknown>[]) {
    for (const content of (step.content as Record<string, unknown>[] | undefined) ?? []) {
      for (const a of (content.annotations as Record<string, unknown>[] | undefined) ?? []) add(a.uri ?? a.url, a.title);
    }
    for (const r of (step.result as Record<string, unknown>[] | undefined) ?? []) add(r.url ?? r.uri, r.title);
  }
  return [...found.values()];
}
