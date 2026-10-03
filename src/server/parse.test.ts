import { describe, expect, it } from 'vitest';
import { cleanMermaid, extractSources } from './parse.ts';

describe('cleanMermaid', () => {
  it('strips code fences', () => {
    expect(cleanMermaid('```mermaid\nmindmap\n  root((A))\n```')).toBe('mindmap\n  root((A))');
  });

  it('leaves clean code untouched', () => {
    expect(cleanMermaid('mindmap\n  root((A))')).toBe('mindmap\n  root((A))');
  });
});

describe('extractSources', () => {
  it('collects annotation and tool-result urls, deduplicated', () => {
    const interaction = {
      steps: [
        { type: 'url_context_result', result: [{ url: 'https://a.dev/post', status: 'success' }] },
        {
          type: 'model_output',
          content: [{ type: 'text', annotations: [{ uri: 'https://a.dev/post', title: 'Post' }, { uri: 'https://b.dev', title: 'B' }] }],
        },
      ],
    };
    expect(extractSources(interaction)).toEqual([
      { url: 'https://a.dev/post', title: undefined },
      { url: 'https://b.dev', title: 'B' },
    ]);
  });

  it('ignores non-http values and missing steps', () => {
    expect(extractSources({ steps: [{ result: [{ url: 'javascript:alert(1)' }] }] })).toEqual([]);
    expect(extractSources({})).toEqual([]);
  });
});
