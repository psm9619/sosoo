'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VoiceWave } from '@/components/home';
import { useAudioRecorder } from '@/hooks';
import { useSessionStore } from '@/lib/stores/session-store';

type StudioStep = 'ready' | 'recording' | 'uploading' | 'processing' | 'result';

export default function StudioPage() {
  const [step, setStep] = useState<StudioStep>('ready');
  const [processingProgress, setProcessingProgress] = useState(0);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    start,
    stop,
    pause,
    resume,
    reset,
    formatDuration,
  } = useAudioRecorder({
    maxDuration: 300,
    onMaxDurationReached: () => {
      stop();
    },
  });

  const { uiStatus, setUIStatus, setProgress } = useSessionStore();

  // Sync recorder state with step
  useEffect(() => {
    if (isRecording) {
      setStep('recording');
    }
  }, [isRecording]);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      await start();
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.');
    }
  };

  // Handle recording stop and upload
  const handleStopRecording = useCallback(() => {
    stop();
    setStep('uploading');

    // Simulate upload and processing
    setTimeout(() => {
      setStep('processing');

      // Simulate processing progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => setStep('result'), 500);
        }
        setProcessingProgress(progress);
      }, 500);
    }, 1000);
  }, [stop]);

  // Reset everything
  const handleReset = () => {
    reset();
    setStep('ready');
    setProcessingProgress(0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Ready State */}
          {step === 'ready' && (
            <div className="text-center animate-fade-in">
              <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                발화 코칭 <span className="text-teal">스튜디오</span>
              </h1>
              <p className="text-gray-warm mb-12">
                마이크 버튼을 누르고 개선하고 싶은 내용을 말해주세요.
              </p>

              {/* Record Button */}
              <button
                onClick={handleStartRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-coral to-coral/80 text-white shadow-xl shadow-coral/30 hover:shadow-2xl hover:shadow-coral/40 hover:scale-105 transition-all flex items-center justify-center mx-auto mb-8"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" />
                  <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" />
                </svg>
              </button>

              <p className="text-sm text-gray-soft">최대 5분까지 녹음 가능합니다</p>

              {/* Tips */}
              <Card className="mt-12 p-6 bg-warm-white border-none text-left">
                <h3 className="font-semibold text-charcoal mb-3">녹음 팁</h3>
                <ul className="space-y-2 text-sm text-gray-warm">
                  <li className="flex items-start gap-2">
                    <span className="text-teal mt-1">•</span>
                    조용한 환경에서 녹음하면 더 정확한 분석이 가능해요.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal mt-1">•</span>
                    평소 말하듯 자연스럽게 녹음해주세요.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal mt-1">•</span>
                    발표, 면접, 영상 대본 등 어떤 내용이든 괜찮아요.
                  </li>
                </ul>
              </Card>
            </div>
          )}

          {/* Recording State */}
          {step === 'recording' && (
            <div className="text-center animate-fade-in">
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                  녹음 중
                </span>
              </div>

              {/* Timer */}
              <div className="text-6xl font-mono font-bold text-charcoal mb-8">
                {formatDuration(duration)}
              </div>

              {/* Wave visualization */}
              <div className="mb-12">
                <VoiceWave isAnimating={!isPaused} barCount={50} className="h-32" />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {/* Pause/Resume */}
                <button
                  onClick={isPaused ? resume : pause}
                  className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-charcoal flex items-center justify-center transition-colors"
                >
                  {isPaused ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  )}
                </button>

                {/* Stop */}
                <button
                  onClick={handleStopRecording}
                  className="w-20 h-20 rounded-full bg-coral hover:bg-coral/90 text-white shadow-lg shadow-coral/30 flex items-center justify-center transition-all"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>

                {/* Cancel */}
                <button
                  onClick={handleReset}
                  className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-charcoal flex items-center justify-center transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="mt-8 text-sm text-gray-soft">
                {isPaused ? '일시정지됨' : '녹음을 마치려면 정지 버튼을 누르세요'}
              </p>
            </div>
          )}

          {/* Uploading State */}
          {step === 'uploading' && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-teal-light/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-teal animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">업로드 중...</h2>
              <p className="text-gray-warm">녹음 파일을 서버로 전송하고 있어요.</p>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-teal-light/50 flex items-center justify-center animate-breathe">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">AI가 분석 중이에요</h2>
              <p className="text-gray-warm mb-8">발화 패턴을 분석하고 개선 버전을 만들고 있어요.</p>

              <div className="max-w-sm mx-auto">
                <Progress value={processingProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-soft">{Math.round(processingProgress)}%</p>
              </div>

              <div className="mt-8 space-y-2 text-sm text-gray-warm">
                <p className={processingProgress > 20 ? 'text-teal' : ''}>
                  {processingProgress > 20 ? '✓' : '○'} 음성 인식 완료
                </p>
                <p className={processingProgress > 50 ? 'text-teal' : ''}>
                  {processingProgress > 50 ? '✓' : '○'} 발화 분석 중
                </p>
                <p className={processingProgress > 80 ? 'text-teal' : ''}>
                  {processingProgress > 80 ? '✓' : '○'} 개선 버전 생성
                </p>
              </div>
            </div>
          )}

          {/* Result State */}
          {step === 'result' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal text-white flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">분석 완료!</h2>
                <p className="text-gray-warm">AI가 더 명확한 발화로 개선했어요.</p>
              </div>

              {/* Results Cards */}
              <div className="space-y-4 mb-8">
                {/* Original */}
                <Card className="p-6 bg-warm-white border-none">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-soft uppercase">원본</span>
                    <span className="text-sm text-gray-soft">{formatDuration(duration)}</span>
                  </div>
                  <p className="text-charcoal/70 mb-4 leading-relaxed">
                    음... 저희 회사는요, 그러니까 AI를 활용해서, 뭐랄까,
                    사람들이 말을 더 잘 할 수 있게, 그런 거를 도와주는 서비스를 만들고 있습니다.
                  </p>
                  {audioUrl && (
                    <audio controls className="w-full" src={audioUrl}>
                      <track kind="captions" />
                    </audio>
                  )}
                </Card>

                {/* Improved */}
                <Card className="p-6 bg-teal-light/20 border border-teal/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-teal uppercase">개선 버전</span>
                    <span className="text-sm text-teal">0:08</span>
                  </div>
                  <p className="text-charcoal mb-4 leading-relaxed">
                    저희 회사는 AI 기반 발화 코칭 서비스를 만들고 있습니다.
                    누구나 자신감 있게 말할 수 있도록, 발화 패턴을 분석하고 개선된 버전을 제안해드립니다.
                  </p>
                  <audio controls className="w-full">
                    <track kind="captions" />
                  </audio>
                </Card>
              </div>

              {/* Improvements */}
              <Card className="p-6 bg-warm-white border-none mb-8">
                <h3 className="font-semibold text-charcoal mb-4">개선된 점</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    불필요한 추임새 제거
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    문장 구조 명확화
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                    33% 시간 단축
                  </span>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 py-6"
                >
                  새로 녹음하기
                </Button>
                <Button
                  className="flex-1 py-6 bg-teal hover:bg-teal-dark"
                >
                  피드백 반영하기
                </Button>
              </div>

              <p className="mt-6 text-center text-sm text-gray-soft">
                <Link href="/login" className="text-teal hover:text-teal-dark">
                  로그인하면 결과를 저장할 수 있어요 →
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
