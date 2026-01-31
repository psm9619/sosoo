'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VoiceClonePolicy } from './VoiceClonePolicy';
import { VoiceCloneRecorder, type VoiceCloneConsentData } from './VoiceCloneRecorder';
import { VoiceCloneStatus } from './VoiceCloneStatus';
import { useUserStore } from '@/lib/stores/user-store';
import { createVoiceClone, pollVoiceCloneStatus } from '@/lib/api/voice-clone';
import type { VoiceCloneStatus as VoiceCloneStatusType } from '@/types/api';

interface VoiceCloneOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type OnboardingStep = 'intro' | 'policy' | 'record' | 'processing' | 'complete';

export function VoiceCloneOnboarding({
  isOpen,
  onClose,
  onComplete,
}: VoiceCloneOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<VoiceCloneStatusType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    setVoiceCloneConsent,
    setVoiceCloneFromResponse,
    setHasSeenOnboarding,
    voiceClone,
  } = useUserStore();

  // 모달이 닫힐 때 온보딩 확인
  const handleClose = useCallback(() => {
    setHasSeenOnboarding(true);
    onClose();
  }, [setHasSeenOnboarding, onClose]);

  // 정책 동의
  const handlePolicyAccept = useCallback(() => {
    setVoiceCloneConsent(true);
    setStep('record');
  }, [setVoiceCloneConsent]);

  // 녹음 완료 및 업로드
  const handleRecordingComplete = useCallback(async (
    audioBlob: Blob,
    durationSeconds: number,
    consentData: VoiceCloneConsentData
  ) => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await createVoiceClone({
        audioBlob,
        voiceName: '내 목소리',
        consentGiven: true,
        consentData, // 동의 기록 데이터 전달
      });

      setVoiceCloneFromResponse({
        voiceCloneId: response.voiceCloneId,
        voiceName: response.voiceName,
        status: response.status,
      });

      setStatus(response.status);
      setStep('processing');

      // 상태 폴링 시작
      if (response.status === 'processing') {
        pollVoiceCloneStatus(response.voiceCloneId, {
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
          },
          onReady: (data) => {
            setVoiceCloneFromResponse({
              voiceCloneId: data.voiceCloneId,
              voiceName: data.voiceName,
              status: 'ready',
              sampleAudioUrl: data.sampleAudioUrl,
            });
            setStep('complete');
          },
          onError: (err) => {
            setError(err.message);
            setStatus('failed');
          },
        });
      } else if (response.status === 'ready') {
        setStep('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [setVoiceCloneFromResponse]);

  // 완료
  const handleComplete = useCallback(() => {
    setHasSeenOnboarding(true);
    onComplete?.();
    onClose();
  }, [setHasSeenOnboarding, onComplete, onClose]);

  // 다시 시도
  const handleRetry = useCallback(() => {
    setError(null);
    setStatus(null);
    setStep('record');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 모달 - 데스크탑에서 더 넓게 */}
      <Card className="relative z-10 w-full max-w-lg lg:max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-warm-white border-none shadow-2xl">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-soft hover:text-charcoal transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-5 pb-3">
          {/* 인트로 */}
          {step === 'intro' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">
                  나의 목소리로 듣기
                </h2>
                <p className="text-gray-warm">
                  AI가 개선한 스피치를
                  <br />
                  <strong className="text-charcoal">나의 목소리</strong>로 들어보세요.
                </p>
              </div>

              <div className="bg-cream rounded-xl p-4 text-left">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal text-sm">1</span>
                    </span>
                    <span className="text-sm text-charcoal">
                      30초-1분 분량의 샘플 텍스트를 읽어주세요
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal text-sm">2</span>
                    </span>
                    <span className="text-sm text-charcoal">
                      AI가 당신의 목소리를 학습합니다
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal text-sm">3</span>
                    </span>
                    <span className="text-sm text-charcoal">
                      개선된 스피치를 나의 목소리로 들을 수 있어요
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setStep('policy')}
                  className="w-full bg-teal hover:bg-teal-dark py-6"
                >
                  시작하기
                </Button>
                <button
                  onClick={handleClose}
                  className="text-sm text-gray-soft hover:text-gray-warm"
                >
                  나중에 하기
                </button>
              </div>
            </div>
          )}

          {/* 정책 동의 */}
          {step === 'policy' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-charcoal mb-2">
                  음성 데이터 보호 정책
                </h2>
                <p className="text-sm text-gray-warm">
                  녹음을 시작하기 전에 정책을 확인해 주세요.
                </p>
              </div>
              <VoiceClonePolicy
                onAccept={handlePolicyAccept}
                onDecline={handleClose}
              />
            </div>
          )}

          {/* 녹음 */}
          {step === 'record' && (
            <div className="space-y-2">
              <div className="text-center">
                <h2 className="text-base font-bold text-charcoal">
                  음성 샘플 녹음
                </h2>
              </div>
              <VoiceCloneRecorder
                onRecordingComplete={handleRecordingComplete}
                onCancel={handleClose}
                isUploading={isUploading}
              />
            </div>
          )}

          {/* 처리 중 */}
          {step === 'processing' && status && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-charcoal mb-2">
                  음성 클론 생성
                </h2>
                <p className="text-sm text-gray-warm">
                  잠시만 기다려 주세요.
                </p>
              </div>
              <VoiceCloneStatus
                status={status}
                errorMessage={error}
                onRetry={handleRetry}
              />
              {status === 'processing' && (
                <button
                  onClick={handleClose}
                  className="w-full text-center text-sm text-gray-soft hover:text-gray-warm"
                >
                  백그라운드에서 계속 진행
                </button>
              )}
            </div>
          )}

          {/* 완료 */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
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

              <div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">
                  준비 완료!
                </h2>
                <p className="text-gray-warm">
                  이제 개선된 스피치를
                  <br />
                  나의 목소리로 들을 수 있어요.
                </p>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full bg-teal hover:bg-teal-dark py-6"
              >
                시작하기
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
