import { useState } from 'react';
import { ChevronsDownUp, Download, ExternalLink, Expand, Loader2, Wand2 } from 'lucide-react';
import type { VisualResponse } from '../../shared/schemas.ts';

const PRESETS = [
  { label: 'Elaborate', icon: Expand, instruction: 'Make the image more detailed, with richer visual elements.' },
  { label: 'Clean up', icon: ChevronsDownUp, instruction: 'Simplify the image with a cleaner, more minimal design.' },
];

interface Props {
  visual: VisualResponse;
  refining: boolean;
  onRefine(instruction: string): void;
  fileName: string;
}

export function VisualPanel({ visual, refining, onRefine, fileName }: Props) {
  const [instruction, setInstruction] = useState('');

  const refine = (text: string) => {
    if (!text.trim() || refining) return;
    onRefine(text.trim());
    setInstruction('');
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-lg dark:border-slate-700">
        {refining && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/40">
            <Loader2 className="size-8 animate-spin text-white" />
          </div>
        )}
        <img src={visual.image} alt="Generated slide visual" className="h-auto w-full" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {visual.drive?.webViewLink && (
          <a href={visual.drive.webViewLink} target="_blank" rel="noopener noreferrer" className="btn-primary">
            <ExternalLink className="size-4" /> Open in Drive
          </a>
        )}
        <a href={visual.image} download={`${fileName}.${visual.image.startsWith('data:image/png') ? 'png' : 'jpg'}`} className="btn-secondary">
          <Download className="size-4" /> Download
        </a>
        {PRESETS.map(({ label, icon: Icon, instruction: preset }) => (
          <button key={label} className="btn-secondary" disabled={refining} onClick={() => refine(preset)}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          refine(instruction);
        }}
      >
        <input className="input py-2" placeholder="Edit this image… e.g. “translate to French”, “use a dark background”" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        <button className="btn-secondary shrink-0" disabled={refining || !instruction.trim()}>
          <Wand2 className="size-4" /> Apply
        </button>
      </form>

      {visual.driveError && <p className="text-sm text-amber-700 dark:text-amber-400">{visual.driveError}. You can still download the image.</p>}
    </div>
  );
}
