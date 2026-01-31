'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { refinePreview, refineFinal, REFINE_PROGRESS_MESSAGES } from '@/lib/api/refine';
import type { AnalysisResult } from '@/types/api';

interface RefinementPanelProps {
  sessionId: string;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinementCount: number;
  maxRefinements?: number;
  voiceType?: 'default_male' | 'default_female' | 'cloned';
  voiceCloneId?: string;
  onRefinementComplete?: (newScript: string, newAudioUrl: string) => void;
  onClose?: () => void;
}

type RefinementStep = 'input' | 'preview' | 'processing' | 'complete';

export function RefinementPanel({
  sessionId,
  originalTranscript,
  currentScript,
  analysisResult,
  refinementCount,
  maxRefinements = 3,
  voiceType = 'default_male',
  voiceCloneId,
  onRefinementComplete,
  onClose,
}: RefinementPanelProps) {
  const [step, setStep] = useState<RefinementStep>('input');
  const [userIntent, setUserIntent] = useState('');
  const [previewScript, setPreviewScript] = useState('');
  const [changesSummary, setChangesSummary] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canRefine = refinementCount < maxRefinements;
  const remainingRefinements = maxRefinements - refinementCount;

  // Stage 1: 프리뷰 요청
  const handlePreviewRequest = useCallback(async () => {
    if (!userIntent.trim() || userIntent.length < 10) {
      setError('수정 방향을 최소 10자 이상 입력해주세요.');
      return;
    }

    if (userIntent.length > 200) {
      setError('수정 방향은 200자 이내로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
    setProgressMessage(REFINE_PROGRESS_MESSAGES.start);

    try {
      const result = await refinePreview(
        {
          sessionId,
          userIntent,
          originalTranscript,
          currentScript,
          analysisResult,
          voiceType,
          voiceCloneId,
        },
        {
          onProgress: (p) => {
            setProgress(p.progress);
            setProgressMessage(REFINE_PROGRESS_MESSAGES[p.step] || p.message);
          },
          onComplete: (data) => {
            setPreviewScript(data.refinedScript);
            setChangesSummary(data.changesSummary);
            setStep('preview');
            setIsLoading(false);
          },
          onError: (err) => {
            setError(err.message);
            setStep('input');
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
      setStep('input');
      setIsLoading(false);
    }
  }, [sessionId, userIntent, originalTranscript, currentScript, analysisResult, voiceType, voiceCloneId]);

  // Stage 2: 최종 생성 (TTS 포함)
  const handleFinalRequest = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStep('processing');
    setProgress(0);
    setProgressMessage('음성을 생성합니다...');

    try {
      const result = await refineFinal(
        {
          sessionId,
          userIntent,
          originalTranscript,
          currentScript,
          analysisResult,
          refinedScript: previewScript,
          voiceType,
          voiceCloneId,
        },
        {
          onProgress: (p) => {
            setProgress(p.progress);
            setProgressMessage(REFINE_PROGRESS_MESSAGES[p.step] || p.message);
          },
          onComplete: (data) => {
            setStep('complete');
            setIsLoading(false);
            onRefinementComplete?.(previewScript, data.improvedAudioUrl);
          },
          onError: (err) => {
            setError(err.message);
            setStep('preview');
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '음성 생성에 실패했습니다.');
      setStep('preview');
      setIsLoading(false);
    }
  }, [sessionId, userIntent, originalTranscript, currentScript, analysisResult, previewScript, voiceType, voiceCloneId, onRefinementComplete]);

  // 수정 취소
  const handleCancel = () => {
    setStep('input');
    setUserIntent('');
    setPreviewScript('');
    setChangesSummary('');
    setError(null);
    onClose?.();
  };

  // 다른 방향으로 수정
  const handleEditIntent = () => {
    setStep('input');
    setPreviewScript('');
    setChangesSummary('');
    setError(null);
  };

  if (!canRefine) {
    return (
      <Card className="p-4 bg-secondary/50 border-none">
        <p className="text-sm text-gray-warm text-center">
          재생성 횟수를 모두 사용했습니다. ({maxRefinements}/{maxRefinements})
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-warm-white border-none">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-charcoal">스크립트 수정</h3>
          <p className="text-xs text-gray-warm">
            남은 횟수: <span className="text-teal font-medium">{remainingRefinements}회</span>
          </p>
        </div>
        {onClose && (
          <button
            onClick={handleCancel}
            className="p-1.5 text-gray-soft hover:text-charcoal transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              어떤 방향으로 수정할까요?
            </label>
            <textarea
              value={userIntent}
              onChange={(e) => setUserIntent(e.target.value)}
              placeholder="예: 좀 더 자신감 있게 표현해주세요 / STAR 구조를 더 명확하게 해주세요 / 결론을 강조해주세요"
              className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-soft">10-200자</p>
              <p className={`text-xs ${userIntent.length > 200 ? 'text-destructive' : 'text-gray-soft'}`}>
                {userIntent.length}/200
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handlePreviewRequest}
              disabled={!userIntent.trim() || userIntent.length < 10 || isLoading}
              className="flex-1 bg-teal hover:bg-teal-dark"
            >
              방향 확인
            </Button>
          </div>
        </div>
      )}

      {/* Step: Processing */}
      {step === 'processing' && (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <svg
              className="animate-spin h-6 w-6 text-teal"
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
          <p className="text-charcoal font-medium mb-2">{progressMessage}</p>
          <div className="max-w-xs mx-auto">
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* 변경 요약 */}
          {changesSummary && (
            <div className="p-3 bg-teal-light/20 rounded-lg border border-teal/20">
              <p className="text-sm font-medium text-teal-dark mb-1">변경 방향</p>
              <p className="text-sm text-charcoal">{changesSummary}</p>
            </div>
          )}

          {/* 수정된 스크립트 프리뷰 */}
          <div className="p-4 bg-cream rounded-xl">
            <p className="text-sm font-medium text-charcoal mb-2">수정된 스크립트</p>
            <p className="text-charcoal leading-relaxed whitespace-pre-line">
              {previewScript}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleEditIntent}
              disabled={isLoading}
              className="flex-1"
            >
              다른 방향으로
            </Button>
            <Button
              onClick={handleFinalRequest}
              disabled={isLoading}
              className="flex-1 bg-teal hover:bg-teal-dark"
            >
              이대로 확정
            </Button>
          </div>

          <p className="text-xs text-center text-gray-soft">
            확정하면 음성이 생성됩니다
          </p>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
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
          <p className="text-charcoal font-medium">수정 완료!</p>
          <p className="text-sm text-gray-warm mt-1">
            새로운 스크립트와 음성이 적용되었습니다.
          </p>
        </div>
      )}
    </Card>
  );
}
