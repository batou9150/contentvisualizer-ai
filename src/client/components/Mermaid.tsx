import { useEffect, useId, useState } from 'react';

// Loaded lazily: mermaid is large and only needed once there is a result.
const loadMermaid = () =>
  import('mermaid').then(({ default: mermaid }) => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 'strict' blocks click handlers and HTML labels: the diagram comes from model output, which can be influenced by web content.
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'neutral' });
    return mermaid;
  });

export function Mermaid({ code }: { code: string }) {
  const id = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Debounce so typing in the code editor doesn't re-render on every keystroke.
    const timer = setTimeout(async () => {
      try {
        const mermaid = await loadMermaid();
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message.split('\n')[0] ?? 'Invalid diagram');
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, id]);

  return (
    <div>
      {error && <p className="mb-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Diagram error: {error}</p>}
      {/* Mermaid output in strict mode is sanitized with DOMPurify. */}
      <div className="flex justify-center overflow-x-auto [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
