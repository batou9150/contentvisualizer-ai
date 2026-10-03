import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from './lib/auth.tsx';
import { api } from './lib/api.ts';
import { useBrandings } from './lib/brandings.ts';
import { useStoredState } from './lib/storage.ts';
import { Header } from './components/Header.tsx';
import { SignIn } from './components/SignIn.tsx';
import { InputPanel, type AnalyzeRequest } from './components/InputPanel.tsx';
import { BrandingPicker } from './components/BrandingPicker.tsx';
import { ResultCard } from './components/ResultCard.tsx';
import { Mermaid } from './components/Mermaid.tsx';
import { HistoryDrawer } from './components/HistoryDrawer.tsx';
import { AspectRatio, ImageSize, type AnalyzeResponse, type VisualResponse } from '../shared/schemas.ts';

type VisualSource = 'summary' | 'mindmap';

export function App() {
  const { user, isLoading } = useAuth();
  const [imageSize, setImageSize] = useStoredState('cv.imageSize', ImageSize, '2K');
  const [aspectRatio, setAspectRatio] = useStoredState('cv.aspectRatio', AspectRatio, '16:9');
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="min-h-dvh pb-20">
      <Header imageSize={imageSize} aspectRatio={aspectRatio} onImageSize={setImageSize} onAspectRatio={setAspectRatio} onOpenHistory={() => setHistoryOpen(true)} />
      <main className="mx-auto max-w-6xl px-4 pt-8">
        {isLoading ? (
          <Loader2 className="mx-auto mt-24 size-8 animate-spin text-slate-400" />
        ) : user ? (
          <Workspace imageSize={imageSize} aspectRatio={aspectRatio} />
        ) : (
          <SignIn />
        )}
      </main>
      {user && <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}

function Workspace({ imageSize, aspectRatio }: { imageSize: ImageSize; aspectRatio: AspectRatio }) {
  const queryClient = useQueryClient();
  const brandings = useBrandings();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [summary, setSummary] = useState('');
  const [mindmap, setMindmap] = useState('');
  const [visuals, setVisuals] = useState<Partial<Record<VisualSource, VisualResponse>>>({});

  const analyze = useMutation({
    mutationFn: (req: AnalyzeRequest) => {
      if (req.mode !== 'file') return api<AnalyzeResponse>('/analyze', { json: req });
      const form = new FormData();
      form.append('file', req.file);
      return api<AnalyzeResponse>('/analyze', { body: form });
    },
    onSuccess: (data) => {
      setResult(data);
      setSummary(data.summary);
      setMindmap(data.mindmap);
      setVisuals({});
    },
  });

  const onVisual = (source: VisualSource) => (visual: VisualResponse) => {
    setVisuals((v) => ({ ...v, [source]: visual }));
    if (visual.drive) queryClient.invalidateQueries({ queryKey: ['history'] });
  };

  const generate = useMutation({
    mutationFn: (source: VisualSource) =>
      api<VisualResponse>('/visuals', {
        json: { source, content: source === 'summary' ? summary : mindmap, brandingPrompt: brandings.selected.prompt, title: result?.title, imageSize, aspectRatio },
      }),
    onSuccess: (visual, source) => onVisual(source)(visual),
  });

  const refine = useMutation({
    mutationFn: ({ source, instruction }: { source: VisualSource; instruction: string }) =>
      api<VisualResponse>('/visuals/refine', { json: { ref: visuals[source]!.ref, instruction, title: result?.title, imageSize, aspectRatio } }),
    onSuccess: (visual, { source }) => onVisual(source)(visual),
  });

  const error = analyze.error ?? generate.error ?? refine.error;
  const fileBase = (result?.title ?? 'visual').replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 60);

  const cardProps = (source: VisualSource) => ({
    visual: visuals[source] ?? null,
    generating: generate.isPending && generate.variables === source,
    refining: refine.isPending && refine.variables?.source === source,
    onGenerate: () => generate.mutate(source),
    onRefine: (instruction: string) => refine.mutate({ source, instruction }),
    fileName: `${fileBase}_${source}`,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <InputPanel pending={analyze.isPending} onSubmit={(req) => analyze.mutate(req)} />
        <BrandingPicker brandings={brandings} />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error.message}
        </div>
      )}

      {analyze.isPending && (
        <div className="card grid h-64 animate-pulse place-items-center text-sm text-slate-400">Reading and summarizing your content…</div>
      )}

      {result && !analyze.isPending ? (
        <>
          <ResultCard
            title="Executive summary"
            code={summary}
            onCodeChange={setSummary}
            preview={
              <div className="prose-summary">
                <Markdown remarkPlugins={[remarkGfm]}>{summary}</Markdown>
              </div>
            }
            footer={
              result.sources.length > 0 && (
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h3 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Sources</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="btn-secondary max-w-xs truncate py-1 text-xs font-medium">
                        {s.title ?? new URL(s.url).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )
            }
            {...cardProps('summary')}
          />
          <ResultCard title="Mindmap" code={mindmap} onCodeChange={setMindmap} preview={<Mermaid code={mindmap} />} {...cardProps('mindmap')} />
        </>
      ) : (
        !analyze.isPending && (
          <div className="grid h-64 place-items-center rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400 dark:border-slate-800">
            <div className="space-y-2">
              <Sparkles className="mx-auto size-8" />
              <p>Analyze a URL, some text or a file to start visualizing.</p>
            </div>
          </div>
        )
      )}
    </div>
  );
}
