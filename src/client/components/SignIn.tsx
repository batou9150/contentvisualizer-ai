import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../lib/auth.tsx';

export function SignIn() {
  const { signIn, signInError } = useAuth();
  const [pending, setPending] = useState(false);

  return (
    <div className="card mx-auto mt-16 max-w-md p-10 text-center">
      <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
        <LockKeyhole className="size-7" />
      </div>
      <h2 className="text-2xl font-bold">Sign in to get started</h2>
      <p className="mt-2 text-sm text-slate-500">
        Turn articles, notes and documents into executive summaries, mindmaps and branded slide visuals. Generated visuals are saved to a
        dedicated folder in your Google Drive.
      </p>
      <button
        className="btn-secondary mt-8 w-full py-3"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await signIn();
          setPending(false);
        }}
      >
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
        {pending ? 'Waiting for Google…' : 'Sign in with Google'}
      </button>
      {signInError && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{signInError}</p>}
    </div>
  );
}
