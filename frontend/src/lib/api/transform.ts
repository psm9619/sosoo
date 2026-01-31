import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

/**
 * API 응답 (snake_case) → 클라이언트 (camelCase) 변환
 */
export function toClient<T>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T;
  }
  return camelcaseKeys(data as Record<string, unknown>, { deep: true }) as T;
}

/**
 * 클라이언트 (camelCase) → API 요청 (snake_case) 변환
 */
export function toServer<T>(data: T): unknown {
  if (data === null || data === undefined) {
    return data;
  }
  return snakecaseKeys(data as Record<string, unknown>, { deep: true });
}
