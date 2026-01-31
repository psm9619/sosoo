'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { VoiceCloneStatus as VoiceCloneStatusType } from '@/types/api';

interface VoiceCloneStatusProps {
  status: VoiceCloneStatusType;
  voiceName?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function VoiceCloneStatus({
  status,
  voiceName = '내 목소리',
  errorMessage,
  onRetry,
  onDelete,
  isDeleting = false,
}: VoiceCloneStatusProps) {
  const [dots, setDots] = useState('');

  // 처리 중 애니메이션
  useEffect(() => {
    if (status !== 'processing') return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="space-y-4">
      {/* 처리 중 */}
      {status === 'processing' && (
        <div className="bg-teal-light/30 border border-teal/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <svg
              className="animate-spin h-8 w-8 text-teal"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-charcoal mb-2">
            음성 클론 생성 중{dots}
          </h3>
          <p className="text-sm text-gray-warm">
            AI가 당신의 목소리를 학습하고 있습니다.
            <br />
            보통 1-2분 정도 소요됩니다.
          </p>
        </div>
      )}

      {/* 완료 */}
      {status === 'ready' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green-600"
              >
                <path
                  d="M9 12l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-charcoal mb-1">{voiceName}</h3>
              <p className="text-sm text-gray-warm mb-3">
                음성 클론이 준비되었습니다! 이제 개선된 스피치를 나의 목소리로 들을 수 있습니다.
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                  사용 가능
                </span>
              </div>
            </div>
          </div>

          {/* 삭제 버튼 */}
          {onDelete && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="text-gray-warm hover:text-destructive hover:border-destructive/30"
              >
                {isDeleting ? '삭제 중...' : '음성 클론 삭제'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 실패 */}
      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-red-600"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M15 9l-6 6M9 9l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-charcoal mb-1">생성 실패</h3>
              <p className="text-sm text-gray-warm mb-3">
                {errorMessage || '음성 클론 생성 중 문제가 발생했습니다.'}
              </p>
              {onRetry && (
                <Button
                  size="sm"
                  onClick={onRetry}
                  className="bg-teal hover:bg-teal-dark"
                >
                  다시 시도
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
