import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api.ts';
import type { User } from '../../shared/schemas.ts';

interface CodeClient {
  requestCode(): void;
}
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode: 'popup';
            prompt?: string;
            select_account?: boolean;
            include_granted_scopes?: boolean;
            callback: (res: { code?: string; error?: string }) => void;
            error_callback?: (err: { type: string }) => void;
          }): CodeClient;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | undefined;
/** Loads Google Identity Services once, on demand. */
function loadGis(): Promise<void> {
  gisPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = undefined;
      reject(new Error('Could not load Google Sign-In'));
    };
    document.head.append(script);
  });
  return gisPromise;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signIn(): Promise<void>;
  devSignIn(name: string): Promise<void>;
  signOut(): Promise<void>;
  signInError: string | null;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [signInError, setSignInError] = useState<string | null>(null);

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ user: User | null }>('/auth/me'),
    staleTime: Infinity,
  });

  // Any 401 from the API means the session is gone (revoked, expired): drop back to the sign-in screen.
  useEffect(() => {
    const onUnauthorized = () => queryClient.setQueryData(['me'], { user: null });
    window.addEventListener('cv:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cv:unauthorized', onUnauthorized);
  }, [queryClient]);

  const requestCode = useCallback(async (prompt: string) => {
    const [{ clientId, scopes }] = await Promise.all([api<{ clientId: string; scopes: string[] }>('/config'), loadGis()]);
    return new Promise<string>((resolve, reject) => {
      window
        .google!.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: scopes.join(' '),
          ux_mode: 'popup',
          prompt,
          include_granted_scopes: true,
          callback: (res) => (res.code ? resolve(res.code) : reject(new Error(res.error ?? 'Sign-in cancelled'))),
          error_callback: (err) => reject(new Error(err.type === 'popup_closed' ? 'Sign-in cancelled' : 'Sign-in failed')),
        })
        .requestCode();
    });
  }, []);

  const signIn = useCallback(async () => {
    setSignInError(null);
    try {
      let prompt = 'select_account';
      for (let attempt = 0; attempt < 2; attempt++) {
        const code = await requestCode(prompt);
        try {
          const { user } = await api<{ user: User }>('/auth/google', { json: { code } });
          queryClient.setQueryData(['me'], { user });
          return;
        } catch (err) {
          // Google only issues a refresh token on explicit consent; retry once asking for it.
          if (err instanceof ApiError && err.code === 'consent_required') {
            prompt = 'consent';
            continue;
          }
          if (err instanceof ApiError && err.code === 'drive_scope_required') {
            throw new Error('Google Drive access is needed to save your visuals. Please allow it when signing in.');
          }
          throw err;
        }
      }
    } catch (err) {
      setSignInError((err as Error).message);
    }
  }, [queryClient, requestCode]);

  const devSignIn = useCallback(
    async (name: string) => {
      setSignInError(null);
      try {
        const { user } = await api<{ user: User }>('/auth/dev', { json: { name } });
        queryClient.setQueryData(['me'], { user });
      } catch (err) {
        setSignInError((err as Error).message);
      }
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    queryClient.clear();
    queryClient.setQueryData(['me'], { user: null });
  }, [queryClient]);

  return (
    <AuthContext value={{ user: me.data?.user ?? null, isLoading: me.isPending, signIn, devSignIn, signOut, signInError }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
