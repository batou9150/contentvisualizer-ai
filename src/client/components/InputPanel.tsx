import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FileText, Globe, Loader2, Type, Upload } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, MAX_FILE_BYTES } from '../../shared/schemas.ts';

export type AnalyzeRequest = { mode: 'url'; url: string } | { mode: 'text'; text: string } | { mode: 'file'; file: File };

const TABS = [
  { mode: 'url', label: 'Website URL', icon: Globe },
  { mode: 'text', label: 'Text', icon: Type },
  { mode: 'file', label: 'File', icon: FileText },
] as const;

interface Props {
  pending: boolean;
  onSubmit(req: AnalyzeRequest): void;
}

export function InputPanel({ pending, onSubmit }: Props) {
  const [mode, setMode] = useState<AnalyzeRequest['mode']>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED_FILE_TYPES.includes(f.type)) return setFileError('Please choose a PDF or an image (PNG, JPEG, WebP, HEIC).');
    if (f.size > MAX_FILE_BYTES) return setFileError(`File is too large (${(f.size / 1048576).toFixed(1)} MB, max 20 MB).`);
    setFileError(null);
    setFile(f);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url.trim()) onSubmit({ mode, url: url.trim() });
    if (mode === 'text' && text.trim()) onSubmit({ mode, text });
    if (mode === 'file' && file) onSubmit({ mode, file });
  };

  const canSubmit = !pending && ((mode === 'url' && url.trim()) || (mode === 'text' && text.trim()) || (mode === 'file' && file));
  const preview = useMemo(() => (file?.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div role="tablist" className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {TABS.map(({ mode: m, label, icon: Icon }) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
              mode === m ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {mode === 'url' && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="url" className="input" placeholder="https://example.com/blog-post" value={url} onChange={(e) => setUrl(e.target.value)} required />
          <SubmitButton pending={pending} disabled={!canSubmit} label="Analyze URL" />
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-3">
          <textarea className="input h-44 resize-y" placeholder="Paste an article, notes, or a Mermaid diagram…" value={text} onChange={(e) => setText(e.target.value)} />
          <SubmitButton pending={pending} disabled={!canSubmit} label="Analyze text" full />
        </div>
      )}

      {mode === 'file' && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm transition ${
              dragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700'
            }`}
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-40 rounded-lg" />
            ) : (
              <Upload className="size-8 text-slate-400" />
            )}
            <span className="font-medium">{file ? file.name : 'Click or drop a file here'}</span>
            <span className="text-xs text-slate-500">{file ? `${(file.size / 1048576).toFixed(1)} MB · click to change` : 'PDF or image, up to 20 MB'}</span>
          </button>
          <input ref={inputRef} type="file" hidden accept={ACCEPTED_FILE_TYPES.join(',')} onChange={(e) => pickFile(e.target.files?.[0])} />
          {fileError && <p className="text-sm text-red-600 dark:text-red-400">{fileError}</p>}
          <SubmitButton pending={pending} disabled={!canSubmit} label="Analyze file" full />
        </div>
      )}
    </form>
  );
}

function SubmitButton({ pending, disabled, label, full }: { pending: boolean; disabled: boolean; label: string; full?: boolean }) {
  return (
    <button type="submit" disabled={disabled} className={`btn-primary px-6 py-3 ${full ? 'w-full' : 'shrink-0'}`}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? 'Analyzing…' : label}
    </button>
  );
}
