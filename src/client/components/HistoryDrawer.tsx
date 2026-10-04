import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, ImageOff, Loader2, Trash2, X } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useAuth } from '../lib/auth.tsx';
import type { HistoryItem } from '../../shared/schemas.ts';

export function HistoryDrawer({ open, onClose }: { open: boolean; onClose(): void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();
  const local = useAuth().user?.local;

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  const history = useQuery({
    queryKey: ['history'],
    queryFn: () => api<HistoryItem[]>('/history'),
    enabled: open,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/history/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: (_d, id) => queryClient.setQueryData<HistoryItem[]>(['history'], (items) => items?.filter((i) => i.id !== id)),
  });

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="ml-auto h-dvh max-h-none w-full max-w-md bg-white p-0 text-inherit shadow-2xl backdrop:bg-slate-950/40 dark:bg-slate-900"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold">History</h2>
            <p className="text-xs text-slate-500">{local ? 'Saved on this machine (dev login)' : 'Saved in the “Content Visualizer AI” folder of your Drive'}</p>
          </div>
          <button className="btn-ghost" onClick={() => ref.current?.close()} aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {history.isPending && <Loader2 className="mx-auto mt-10 size-6 animate-spin text-slate-400" />}
          {history.isError && <p className="text-sm text-red-600">{history.error.message}</p>}
          {history.data?.length === 0 && <p className="mt-10 text-center text-sm text-slate-500">No visuals yet.</p>}

          <ul className="grid grid-cols-2 gap-3">
            {history.data?.map((item) => (
              <li key={item.id} className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" className="block">
                  {item.hasThumbnail ? (
                    <img src={`/api/history/${encodeURIComponent(item.id)}/thumbnail`} alt={item.name} loading="lazy" className="aspect-video w-full bg-slate-100 object-cover dark:bg-slate-800" />
                  ) : (
                    <div className="grid aspect-video place-items-center bg-slate-100 dark:bg-slate-800">
                      <ImageOff className="size-6 text-slate-400" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{item.name.replace(/\.(png|jpe?g)$/, '')}</p>
                    <p className="text-[11px] text-slate-500">{new Date(item.createdTime).toLocaleString()}</p>
                  </div>
                  <ExternalLink className="absolute top-2 right-2 size-6 rounded bg-white/90 p-1 text-slate-600 opacity-0 transition group-hover:opacity-100" />
                </a>
                <button
                  className="absolute top-2 left-2 rounded bg-white/90 p-1 text-red-600 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                  onClick={() => remove.mutate(item.id)}
                  disabled={remove.isPending && remove.variables === item.id}
                  aria-label={local ? `Delete ${item.name}` : `Move ${item.name} to Drive trash`}
                  title={local ? 'Delete' : 'Move to Drive trash'}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
