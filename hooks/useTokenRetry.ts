import { useCallback } from 'react';
import { useAuth, AuthTokens } from '../contexts/useAuth';

export const useTokenRetry = () => {
  const { token, refreshToken } = useAuth();

  const getAccessToken = (): string | null => {
    if (typeof token === 'string') return token;
    if (token && typeof token === 'object') return token.access_token;
    return null;
  };

  const canRefresh = (): boolean => {
    return typeof token === 'object' && token !== null && !!token.refresh_token;
  };

  const withTokenRetry = useCallback(
    async <T>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('No access token available');

      try {
        return await fn(accessToken);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('401') || message.includes('invalid authentication')) {
          if (canRefresh()) {
            const newToken = await refreshToken();
            if (newToken) return await fn(newToken);
          }
        }
        throw error;
      }
    },
    [token, refreshToken]
  );

  return { withTokenRetry, hasToken: !!getAccessToken() };
};
