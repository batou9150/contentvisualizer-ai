import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Palette, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../lib/api.ts';
import type { BrandingsApi } from '../lib/brandings.ts';
import type { Branding } from '../../shared/schemas.ts';

export function BrandingPicker({ brandings }: { brandings: BrandingsApi }) {
  const [editing, setEditing] = useState<Branding | null>(null);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Palette className="size-4 text-indigo-500" /> Visual style
        </h3>
        <button className="btn-ghost py-1 text-xs" onClick={() => setEditing({ id: crypto.randomUUID(), name: '', prompt: '' })}>
          <Plus className="size-4" /> New
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {brandings.brandings.map((b) => {
          const active = b.id === brandings.selected.id;
          return (
            <div
              key={b.id}
              className={`group flex items-center rounded-lg border text-sm transition ${
                active ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700'
              }`}
            >
              <button className="py-1.5 pr-1 pl-3 font-medium" onClick={() => brandings.select(b.id)} aria-pressed={active} title={b.prompt}>
                {b.name}
              </button>
              <button className="p-1.5 text-slate-400 hover:text-indigo-600" onClick={() => setEditing(b)} aria-label={`Edit ${b.name}`}>
                <Pencil className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {editing && (
        <BrandingDialog
          branding={editing}
          isNew={!brandings.brandings.some((b) => b.id === editing.id)}
          canDelete={brandings.brandings.length > 1}
          onClose={() => setEditing(null)}
          onSave={(b) => {
            brandings.save(b);
            setEditing(null);
          }}
          onDelete={() => {
            brandings.remove(editing.id);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

interface DialogProps {
  branding: Branding;
  isNew: boolean;
  canDelete: boolean;
  onClose(): void;
  onSave(b: Branding): void;
  onDelete(): void;
}

function BrandingDialog({ branding, isNew, canDelete, onClose, onSave, onDelete }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(branding.name);
  const [prompt, setPrompt] = useState(branding.prompt);

  useEffect(() => ref.current?.showModal(), []);

  const improve = useMutation({
    mutationFn: () => api<{ prompt: string }>('/brandings/improve', { json: { name, prompt } }),
    onSuccess: (data) => setPrompt(data.prompt),
  });

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="card m-auto w-[min(42rem,calc(100vw-2rem))] p-0 text-inherit backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm"
    >
      <form
        method="dialog"
        className="space-y-4 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ id: branding.id, name: name.trim(), prompt: prompt.trim() });
        }}
      >
        <h2 className="text-lg font-bold">{isNew ? 'New visual style' : 'Edit visual style'}</h2>

        <label className="block space-y-1.5 text-sm font-medium">
          <span>Name</span>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Corporate dark, Sketch notes" />
        </label>

        <label className="block space-y-1.5 text-sm font-medium">
          <span className="flex items-center justify-between">
            Style prompt
            <button type="button" className="btn-ghost py-1 text-xs text-indigo-600 dark:text-indigo-400" disabled={improve.isPending || (!name && !prompt)} onClick={() => improve.mutate()}>
              {improve.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Improve with AI
            </button>
          </span>
          <textarea className="input h-56 resize-y" required value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the aesthetic, colors, typography and layout…" />
        </label>
        {improve.isError && <p className="text-sm text-red-600">{improve.error.message}</p>}

        <div className="flex items-center justify-between gap-2 pt-2">
          {!isNew && canDelete ? (
            <button type="button" className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => ref.current?.close()}>
              Cancel
            </button>
            <button className="btn-primary">Save</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
