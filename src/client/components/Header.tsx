import { History, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';
import { ASPECT_RATIOS, IMAGE_SIZES, type AspectRatio, type ImageSize } from '../../shared/schemas.ts';

interface Props {
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  onImageSize(size: ImageSize): void;
  onAspectRatio(ratio: AspectRatio): void;
  onOpenHistory(): void;
}

export function Header({ imageSize, aspectRatio, onImageSize, onAspectRatio, onOpenHistory }: Props) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-indigo-600 text-white shadow-[0_0_16px_rgba(79,70,229,0.45)]">
            <Sparkles className="size-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            Content Visualizer <span className="text-indigo-600">AI</span>
          </h1>
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              Size
              <select className="select" value={imageSize} onChange={(e) => onImageSize(e.target.value as ImageSize)}>
                {IMAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s === '512' ? '512px' : s}
                  </option>
                ))}
              </select>
            </label>
            <label className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              Ratio
              <select className="select" value={aspectRatio} onChange={(e) => onAspectRatio(e.target.value as AspectRatio)}>
                {ASPECT_RATIOS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>

            <button className="btn-ghost" onClick={onOpenHistory} title="Generation history" aria-label="Generation history">
              <History className="size-5" />
            </button>

            <details className="relative">
              <summary className="list-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 [&::-webkit-details-marker]:hidden">
                {user.picture ? (
                  <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="size-9 cursor-pointer rounded-full" />
                ) : (
                  <span className="grid size-9 cursor-pointer place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
                    {user.name[0]}
                  </span>
                )}
              </summary>
              <div className="card absolute right-0 mt-2 w-56 overflow-hidden py-1 text-sm">
                <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <button onClick={signOut} className="flex w-full items-center gap-2 px-4 py-2 text-left text-indigo-600 hover:bg-slate-50 dark:text-indigo-400 dark:hover:bg-slate-800">
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Image settings remain reachable on small screens. */}
      {user && (
        <div className="flex gap-2 border-t border-slate-100 px-4 py-2 sm:hidden dark:border-slate-800">
          <select className="select flex-1" value={imageSize} onChange={(e) => onImageSize(e.target.value as ImageSize)} aria-label="Image size">
            {IMAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s === '512' ? '512px' : s}
              </option>
            ))}
          </select>
          <select className="select flex-1" value={aspectRatio} onChange={(e) => onAspectRatio(e.target.value as AspectRatio)} aria-label="Aspect ratio">
            {ASPECT_RATIOS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      )}
    </header>
  );
}
