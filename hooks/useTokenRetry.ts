import { useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';

export const useTokenRetry = () => {
  const { token, refreshToken } = useAuth();

  const withTokenRetry = useCallback(
    async <T>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
      const accessToken = token?.access_token || (typeof token === 'string' ? token : null);
      if (!accessToken) throw new Error('No access token available');

      try {
        return await fn(accessToken);
      } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('invalid authentication')) {
          if (typeof token !== 'string' && token?.refresh_token) {
            const newToken = await refreshToken();
            if (newToken) return await fn(newToken);
          }
        }
        throw error;
      }
    },
    [token, refreshToken]
  );

  return { withTokenRetry, hasToken: !!token?.access_token };
};
