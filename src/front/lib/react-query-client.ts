import { QueryClient } from '@tanstack/react-query';

/**
 * React Query クライアントの設定
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分間はデータを新鮮とみなす
      retry: 1, // 失敗時のリトライ回数
    },
  },
});
