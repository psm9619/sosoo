import { toClient } from './transform';
import type { SSEProgressEvent, SSECompleteEvent, SSEErrorEvent } from '@/types/api';

export type SSEEventHandler = {
  onProgress?: (data: SSEProgressEvent) => void;
  onComplete?: (data: SSECompleteEvent) => void;
  onError?: (data: SSEErrorEvent) => void;
  onHeartbeat?: () => void;
};

export function createSSEConnection(
  sessionId: string,
  handlers: SSEEventHandler,
  signal?: AbortSignal
): () => void {
  const eventSource = new EventSource(`/api/sessions/${sessionId}/stream`);

  eventSource.addEventListener('progress', (event) => {
    const data = toClient<SSEProgressEvent>(JSON.parse(event.data));
    handlers.onProgress?.(data);
  });

  eventSource.addEventListener('complete', (event) => {
    const data = toClient<SSECompleteEvent>(JSON.parse(event.data));
    handlers.onComplete?.(data);
    eventSource.close();
  });

  eventSource.addEventListener('error', (event) => {
    // EventSource error (connection issue)
    if (event instanceof MessageEvent) {
      const data = toClient<SSEErrorEvent>(JSON.parse(event.data));
      handlers.onError?.(data);
    } else {
      // Connection error
      handlers.onError?.({
        code: 'CONNECTION_ERROR',
        message: '서버 연결이 끊어졌습니다',
      });
    }
    eventSource.close();
  });

  eventSource.addEventListener('heartbeat', () => {
    handlers.onHeartbeat?.();
  });

  // Handle abort signal
  if (signal) {
    signal.addEventListener('abort', () => {
      eventSource.close();
    });
  }

  // Return cleanup function
  return () => {
    eventSource.close();
  };
}
