'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VoiceWave } from '@/components/home';
import { useAudioRecorder } from '@/hooks';
import { useProjectStore } from '@/lib/stores/project-store';
import { INTERVIEW_CATEGORY_LABELS, type Attempt } from '@/types';

type Step = 'ready' | 'recording' | 'processing' | 'result';

export default function QuestionRecordingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const questionId = params.questionId as string;

  const { projects, addAttempt } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);
  const question = project?.questions.find((q) => q.id === questionId);
  const questionIndex = project?.questions.findIndex((q) => q.id === questionId) ?? 0;

  const [step, setStep] = useState<Step>('ready');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentAttempt, setCurrentAttempt] = useState<Attempt | null>(null);

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
    onMaxDurationReached: () => stop(),
  });

  useEffect(() => {
    if (isRecording) {
      setStep('recording');
    }
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      await start();
    } catch (error) {
      alert('마이크 권한이 필요합니다.');
    }
  };

  const handleStopRecording = useCallback(() => {
    stop();
    setStep('processing');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        // Create mock attempt result
        const attempt: Attempt = {
          id: `att-${Date.now()}`,
          questionId,
          createdAt: new Date().toISOString(),
          duration,
          originalText: '음... 안녕하세요, 저는 그, 개발자로 일하고 있는데요...',
          improvedText: '안녕하세요, 3년차 프론트엔드 개발자입니다. React와 TypeScript를 주력으로 사용하며...',
          improvements: ['추임새 제거', '문장 구조화', '전문성 강조'],
          score: Math.floor(Math.random() * 20) + 75, // 75-95
        };

        setCurrentAttempt(attempt);
        addAttempt(projectId, questionId, attempt);

        setTimeout(() => setStep('result'), 500);
      }
      setProcessingProgress(progress);
    }, 500);
  }, [stop, duration, questionId, projectId, addAttempt]);

  const handleRetry = () => {
    reset();
    setStep('ready');
    setProcessingProgress(0);
    setCurrentAttempt(null);
  };

  const handleNextQuestion = () => {
    if (!project) return;
    const nextIndex = questionIndex + 1;
    if (nextIndex < project.questions.length) {
      router.push(`/studio/${projectId}/q/${project.questions[nextIndex].id}`);
      reset();
      setStep('ready');
      setProcessingProgress(0);
      setCurrentAttempt(null);
    } else {
      router.push(`/studio/${projectId}`);
    }
  };

  const handlePrevQuestion = () => {
    if (!project || questionIndex === 0) return;
    const prevIndex = questionIndex - 1;
    router.push(`/studio/${projectId}/q/${project.questions[prevIndex].id}`);
    reset();
    setStep('ready');
    setProcessingProgress(0);
    setCurrentAttempt(null);
  };

  if (!project || !question) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal mb-4">질문을 찾을 수 없어요</h1>
            <Button onClick={() => router.push('/studio')}>스튜디오로 돌아가기</Button>
          </div>
        </main>
      </div>
    );
  }

  const isInterview = project.type === 'interview';
  const isLastQuestion = questionIndex === project.questions.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href={`/studio/${projectId}`}
              className="inline-flex items-center gap-1 text-sm text-gray-warm hover:text-charcoal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {project.title}
            </Link>
            <span className="text-sm text-gray-warm">
              {questionIndex + 1} / {project.questions.length}
            </span>
          </div>

          {/* Question Card */}
          <Card className="p-6 bg-warm-white border-none mb-8">
            {question.category && (
              <span className="inline-block px-2 py-0.5 bg-teal-light/50 text-teal-dark text-xs rounded-full mb-3">
                {INTERVIEW_CATEGORY_LABELS[question.category]}
              </span>
            )}
            <p className="text-lg text-charcoal font-medium">{question.text}</p>
            {question.attempts.length > 0 && step === 'ready' && (
              <p className="text-sm text-gray-warm mt-3">
                이전 {question.attempts.length}회 연습 · 최고 점수{' '}
                {Math.max(...question.attempts.map((a) => a.score || 0))}점
              </p>
            )}
          </Card>

          {/* Ready State */}
          {step === 'ready' && (
            <div className="text-center animate-fade-in">
              <button
                onClick={handleStartRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-coral to-coral/80 text-white shadow-xl shadow-coral/30 hover:shadow-2xl hover:shadow-coral/40 hover:scale-105 transition-all flex items-center justify-center mx-auto mb-6"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" />
                  <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" />
                </svg>
              </button>
              <p className="text-sm text-gray-soft mb-8">버튼을 눌러 녹음을 시작하세요</p>

              {/* Question Navigation */}
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={questionIndex === 0}
                >
                  ← 이전 질문
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextQuestion}
                  disabled={isLastQuestion}
                >
                  다음 질문 →
                </Button>
              </div>
            </div>
          )}

          {/* Recording State */}
          {step === 'recording' && (
            <div className="text-center animate-fade-in">
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-coral/10 text-coral rounded-full text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-coral animate-pulse" />
                  녹음 중
                </span>
              </div>

              <div className="text-6xl font-mono font-bold text-charcoal mb-8">
                {formatDuration(duration)}
              </div>

              <div className="mb-12">
                <VoiceWave isAnimating={!isPaused} barCount={50} className="h-32" />
              </div>

              <div className="flex items-center justify-center gap-4">
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

                <button
                  onClick={handleStopRecording}
                  className="w-20 h-20 rounded-full bg-coral hover:bg-coral/90 text-white shadow-lg shadow-coral/30 flex items-center justify-center transition-all"
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>

                <button
                  onClick={handleRetry}
                  className="w-14 h-14 rounded-full bg-secondary hover:bg-secondary/80 text-charcoal flex items-center justify-center transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {step === 'processing' && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-teal-light/50 flex items-center justify-center animate-breathe">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-teal">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">AI가 분석 중이에요</h2>
              <p className="text-gray-warm mb-8">발화 패턴을 분석하고 개선 버전을 만들고 있어요.</p>

              <div className="max-w-sm mx-auto">
                <Progress value={processingProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-soft">{Math.round(processingProgress)}%</p>
              </div>
            </div>
          )}

          {/* Result State */}
          {step === 'result' && currentAttempt && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal text-white flex items-center justify-center">
                  <span className="text-2xl font-bold">{currentAttempt.score}</span>
                </div>
                <h2 className="text-2xl font-bold text-charcoal mb-1">분석 완료!</h2>
                <p className="text-gray-warm">이번 연습 점수: {currentAttempt.score}점</p>
              </div>

              <div className="space-y-4 mb-8">
                <Card className="p-6 bg-warm-white border-none">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-soft uppercase">원본</span>
                    <span className="text-sm text-gray-soft">{formatDuration(currentAttempt.duration)}</span>
                  </div>
                  <p className="text-charcoal/70 mb-4 leading-relaxed">
                    {currentAttempt.originalText}
                  </p>
                  {audioUrl && (
                    <audio controls className="w-full" src={audioUrl}>
                      <track kind="captions" />
                    </audio>
                  )}
                </Card>

                <Card className="p-6 bg-teal-light/20 border border-teal/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-teal uppercase">개선 버전</span>
                  </div>
                  <p className="text-charcoal mb-4 leading-relaxed">
                    {currentAttempt.improvedText}
                  </p>
                  <audio controls className="w-full">
                    <track kind="captions" />
                  </audio>
                </Card>
              </div>

              <Card className="p-4 bg-warm-white border-none mb-8">
                <h3 className="font-semibold text-charcoal mb-3">개선된 점</h3>
                <div className="flex flex-wrap gap-2">
                  {currentAttempt.improvements.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleRetry} variant="outline" className="flex-1 py-6">
                  다시 녹음하기
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  className="flex-1 py-6 bg-teal hover:bg-teal-dark"
                >
                  {isLastQuestion ? '프로젝트로 돌아가기' : '다음 질문으로'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
