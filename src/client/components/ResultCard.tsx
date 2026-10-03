import { useState, type ReactNode } from 'react';
import { Code2, Eye, ImagePlus, Loader2 } from 'lucide-react';
import { VisualPanel } from './VisualPanel.tsx';
import type { VisualResponse } from '../../shared/schemas.ts';

interface Props {
  title: string;
  /** Raw source (Markdown or Mermaid), editable in code view. */
  code: string;
  onCodeChange(code: string): void;
  preview: ReactNode;
  footer?: ReactNode;
  visual: VisualResponse | null;
  generating: boolean;
  refining: boolean;
  onGenerate(): void;
  onRefine(instruction: string): void;
  fileName: string;
}

/** One analysis output (summary or mindmap) with a code/preview toggle and its generated slide visual. */
export function ResultCard({ title, code, onCodeChange, preview, footer, visual, generating, refining, onGenerate, onRefine, fileName }: Props) {
  const [showCode, setShowCode] = useState(false);

  return (
    <section className="card p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex gap-2">
          <button className="btn-secondary py-1.5 text-xs" onClick={() => setShowCode(!showCode)}>
            {showCode ? <Eye className="size-4" /> : <Code2 className="size-4" />}
            {showCode ? 'Preview' : 'Edit code'}
          </button>
          <button className="btn-primary py-1.5 text-xs" onClick={onGenerate} disabled={generating || refining}>
            {generating ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {generating ? 'Generating…' : visual ? 'Regenerate visual' : 'Generate slide visual'}
          </button>
        </div>
      </div>

      {showCode ? (
        <textarea
          className="input min-h-80 resize-y font-mono text-xs leading-relaxed"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
        />
      ) : (
        preview
      )}

      {footer}

      {generating && !visual && (
        <div className="mt-6 grid aspect-video animate-pulse place-items-center rounded-xl bg-slate-100 text-sm text-slate-400 dark:bg-slate-800">
          Creating your visual…
        </div>
      )}
      {visual && <VisualPanel visual={visual} refining={refining || generating} onRefine={onRefine} fileName={fileName} />}
    </section>
  );
}
