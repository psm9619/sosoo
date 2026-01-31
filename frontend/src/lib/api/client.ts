import { toClient, toServer } from './transform';
import type { ErrorCode } from '@/types/errors';

export interface ApiError {
  code: ErrorCode;
  message: string;
  detail?: string;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public detail?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(toServer(body));
  }

  const response = await fetch(`/api${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiClientError(
      errorData.code || 'UNKNOWN_ERROR',
      errorData.message || 'An unknown error occurred',
      errorData.detail,
      response.status
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();
  return toClient<T>(data);
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
