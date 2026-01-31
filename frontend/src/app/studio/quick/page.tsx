'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VoiceWave } from '@/components/home';
import { useAudioRecorder } from '@/hooks';
import { analyzeAudio, PROGRESS_MESSAGES, type AnalyzeResult } from '@/lib/api/analyze';

// 기본 면접 질문들
const DEFAULT_INTERVIEW_QUESTIONS = [
  '간단하게 자기소개 부탁드립니다.',
  '본인의 강점과 약점에 대해 말씀해주세요.',
  '왜 이 직무에 관심을 가지게 되셨나요?',
  '팀에서 갈등이 있었던 경험과 어떻게 해결했는지 알려주세요.',
  '5년 후 본인의 모습을 어떻게 그리고 계신가요?',
];

type Step = 'select' | 'ready' | 'recording' | 'processing' | 'result';

function QuickStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'interview';

  const [step, setStep] = useState<Step>(type === 'free_speech' ? 'ready' : 'select');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const currentQuestion = type === 'interview' ? DEFAULT_INTERVIEW_QUESTIONS[currentQuestionIndex] : null;

  // 페이지 마운트 또는 type 변경 시 상태 초기화
  useEffect(() => {
    reset();
    setStep(type === 'free_speech' ? 'ready' : 'select');
    setAnalysisResult(null);
    setError(null);
    setProcessingProgress(0);
    setProgressMessage('');
  }, [type, reset]);

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

  // 녹음 중지 시 processing 상태로 전환
  const handleStopRecording = useCallback(() => {
    stop();
    setStep('processing');
    setError(null);
    setProcessingProgress(0);
    setProgressMessage(PROGRESS_MESSAGES.start);
  }, [stop]);

  // audioBlob이 생성되면 분석 시작
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // 이미 분석 중이거나, processing 상태가 아니거나, audioBlob이 없으면 스킵
    if (isAnalyzing || step !== 'processing' || !audioBlob) return;

    const runAnalysis = async () => {
      setIsAnalyzing(true);

      try {
        await analyzeAudio(
          {
            audioBlob,
            question: currentQuestion || undefined,
            mode: 'quick',
            projectType: type === 'free_speech' ? 'free_speech' : 'interview',
          },
          {
            onProgress: (progress) => {
              setProcessingProgress(progress.progress);
              setProgressMessage(
                PROGRESS_MESSAGES[progress.step] || progress.message
              );
            },
            onComplete: (result) => {
              setAnalysisResult(result);
              setProcessingProgress(100);
              setStep('result');
              setIsAnalyzing(false);
            },
            onError: (err) => {
              console.error('Analysis error:', err);
              setError(err.message);
              setStep('ready');
              setIsAnalyzing(false);
            },
          }
        );
      } catch (err) {
        console.error('Analysis exception:', err);
        setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
        setStep('ready');
        setIsAnalyzing(false);
      }
    };

    runAnalysis();
  }, [step, audioBlob, currentQuestion, isAnalyzing]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < DEFAULT_INTERVIEW_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      reset();
      setStep('ready');
      setProcessingProgress(0);
      setProgressMessage('');
      setAnalysisResult(null);
      setError(null);
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    reset();
    setStep('ready');
    setProcessingProgress(0);
    setProgressMessage('');
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Question Selection (Interview only) */}
          {step === 'select' && type === 'interview' && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-light/50 text-teal-dark rounded-full text-sm font-medium mb-4">
                  💼 면접 연습
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-charcoal mb-2">
                  연습할 질문을 선택하세요
                </h1>
                <p className="text-gray-warm">
                  기본 면접 질문 {DEFAULT_INTERVIEW_QUESTIONS.length}개가 준비되어 있어요.
                </p>
              </div>

              <div className="space-y-2 mb-8">
                {DEFAULT_INTERVIEW_QUESTIONS.map((question, index) => (
                  <Card
                    key={index}
                    className={`p-3 border-none cursor-pointer transition-all ${
                      currentQuestionIndex === index
                        ? 'bg-teal-light/30 ring-2 ring-teal'
                        : 'bg-warm-white hover:shadow-md'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                        currentQuestionIndex === index
                          ? 'bg-teal text-white'
                          : 'bg-secondary text-gray-warm'
                      }`}>
                        <span className="font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal font-medium text-sm line-clamp-2">
                          {question}
                        </p>
                        <p className="text-xs text-gray-soft mt-0.5">
                          기본 면접 질문
                        </p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft flex-shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => setStep('ready')}
                className="w-full py-6 bg-teal hover:bg-teal-dark"
              >
                선택한 질문으로 시작하기
              </Button>
            </div>
          )}

          {/* Ready State */}
          {step === 'ready' && (
            <div className="text-center animate-fade-in">
              {type === 'interview' && currentQuestion && (
                <div className="mb-8">
                  <span className="text-sm text-gray-warm">
                    질문 {currentQuestionIndex + 1} / {DEFAULT_INTERVIEW_QUESTIONS.length}
                  </span>
                  <Card className="mt-3 p-6 bg-warm-white border-none">
                    <p className="text-lg text-charcoal font-medium">{currentQuestion}</p>
                  </Card>
                </div>
              )}

              {type === 'free_speech' && (
                <div className="mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-coral-light/50 text-coral rounded-full text-sm font-medium mb-4">
                    🎙️ 자유 스피치
                  </span>
                  <h2 className="text-xl font-semibold text-charcoal">
                    자유롭게 말씀해주세요
                  </h2>
                  <p className="text-gray-warm mt-2">
                    주제 제한 없이 연습하고 AI 피드백을 받아보세요.
                  </p>
                </div>
              )}

              <button
                onClick={handleStartRecording}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-coral to-coral/80 text-white shadow-xl shadow-coral/30 hover:shadow-2xl hover:shadow-coral/40 hover:scale-105 transition-all flex items-center justify-center mx-auto mb-6"
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" />
                  <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" />
                </svg>
              </button>

              <p className="text-sm text-gray-soft">버튼을 눌러 녹음을 시작하세요</p>

              {type === 'interview' && (
                <button
                  onClick={() => setStep('select')}
                  className="mt-6 text-sm text-teal hover:text-teal-dark"
                >
                  ← 다른 질문 선택하기
                </button>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Recording State */}
          {step === 'recording' && (
            <div className="text-center animate-fade-in">
              {currentQuestion && (
                <Card className="mb-6 p-4 bg-warm-white border-none">
                  <p className="text-charcoal">{currentQuestion}</p>
                </Card>
              )}

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
              <p className="text-gray-warm mb-8">{progressMessage || '발화 패턴을 분석하고 개선 버전을 만들고 있어요.'}</p>

              <div className="max-w-sm mx-auto">
                <Progress value={processingProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-soft">{Math.round(processingProgress)}%</p>
              </div>
            </div>
          )}

          {/* Result State */}
          {step === 'result' && analysisResult && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal text-white flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">분석 완료!</h2>
              </div>

              {currentQuestion && (
                <Card className="mb-4 p-4 bg-secondary/50 border-none">
                  <p className="text-sm text-gray-warm mb-1">질문</p>
                  <p className="text-charcoal">{currentQuestion}</p>
                </Card>
              )}

              {/* After-First UX: 개선 버전을 먼저 보여줌 */}
              <div className="space-y-4 mb-8">
                <Card className="p-6 bg-teal-light/20 border border-teal/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-teal uppercase">개선 버전</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal text-xs rounded-full">
                      ✨ 나와 같은 목소리
                    </span>
                  </div>
                  <p className="text-charcoal mb-4 leading-relaxed">
                    {analysisResult.improvedScript}
                  </p>
                  {analysisResult.improvedAudioUrl && (
                    <audio controls className="w-full" src={analysisResult.improvedAudioUrl}>
                      <track kind="captions" />
                    </audio>
                  )}
                </Card>

                <Card className="p-6 bg-warm-white border-none">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-soft uppercase">원본</span>
                    <span className="text-sm text-gray-soft">{formatDuration(duration)}</span>
                  </div>
                  <p className="text-charcoal/70 mb-4 leading-relaxed">
                    {analysisResult.transcript}
                  </p>
                  {audioUrl && (
                    <audio controls className="w-full" src={audioUrl} preload="metadata">
                      <track kind="captions" />
                    </audio>
                  )}
                </Card>
              </div>

              {/* Priority Ranking (자유스피치 전용) */}
              {type === 'free_speech' && analysisResult.analysisResult?.priorityRanking && (
                <Card className="p-4 bg-coral-light/10 border border-coral/20 mb-4">
                  {/* 상황 분류 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-coral text-lg">🎯</span>
                      <h3 className="font-semibold text-charcoal">맞춤 피드백</h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-charcoal/10 text-charcoal rounded-full">
                      {analysisResult.analysisResult.priorityRanking.situationLabel}
                    </span>
                  </div>

                  {/* 분류 근거 */}
                  <p className="text-xs text-gray-warm mb-2">
                    {analysisResult.analysisResult.priorityRanking.situationDescription}
                  </p>

                  {/* 포커스 메시지 */}
                  <p className="text-sm text-charcoal mb-4 font-medium">
                    {analysisResult.analysisResult.priorityRanking.focusMessage}
                  </p>

                  {/* Category Scores */}
                  <div className="space-y-3">
                    {analysisResult.analysisResult.priorityRanking.weightedScores
                      .sort((a, b) => {
                        // 균등 가중치면 점수 낮은 순, 아니면 우선순위 순
                        if (analysisResult.analysisResult?.priorityRanking?.isEqualWeight) {
                          return a.rawScore - b.rawScore; // 낮은 점수가 먼저
                        }
                        const order = analysisResult.analysisResult?.priorityRanking?.priorityFeedbackOrder || [];
                        return order.indexOf(a.category) - order.indexOf(b.category);
                      })
                      .map((score, idx) => (
                        <div key={score.category} className="p-3 bg-white rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {/* 균등 가중치가 아닐 때만 최우선 표시 */}
                              {idx === 0 && !analysisResult.analysisResult?.priorityRanking?.isEqualWeight && (
                                <span className="text-xs px-2 py-0.5 bg-coral/20 text-coral rounded-full">최우선</span>
                              )}
                              <span className="font-medium text-charcoal">{score.category}</span>
                              {/* 가중치 표시 (균등이 아닐 때) */}
                              {!analysisResult.analysisResult?.priorityRanking?.isEqualWeight && score.weight !== 1.0 && (
                                <span className={`text-xs ${score.weight > 1 ? 'text-coral' : 'text-gray-soft'}`}>
                                  (x{score.weight.toFixed(1)})
                                </span>
                              )}
                            </div>
                            <span className={`text-lg font-bold ${score.rawScore >= 70 ? 'text-teal' : score.rawScore >= 50 ? 'text-amber-500' : 'text-coral'}`}>
                              {score.rawScore}점
                            </span>
                          </div>
                          {score.issues.length > 0 && (
                            <div className="text-sm text-gray-warm">
                              {score.issues.slice(0, 2).map((issue, i) => (
                                <p key={i} className="flex items-start gap-1">
                                  <span className="text-coral">•</span> {issue}
                                </p>
                              ))}
                            </div>
                          )}
                          {score.strengths.length > 0 && score.issues.length === 0 && (
                            <div className="text-sm text-teal-dark">
                              {score.strengths.slice(0, 1).map((strength, i) => (
                                <p key={i} className="flex items-start gap-1">
                                  <span>✓</span> {strength}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-coral/10">
                    <p className="text-sm text-gray-warm text-center">
                      종합 점수: <span className="font-semibold text-charcoal">{analysisResult.analysisResult.priorityRanking.totalWeightedScore.toFixed(1)}점</span>
                    </p>
                  </div>
                </Card>
              )}

              {/* Analysis Summary */}
              {analysisResult.analysisResult && (
                <Card className="p-4 bg-warm-white border-none mb-8">
                  <h3 className="font-semibold text-charcoal mb-3">
                    {type === 'free_speech' ? '기본 지표' : '분석 결과'}
                  </h3>

                  {/* Scores */}
                  {analysisResult.analysisResult.scores && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-gray-warm mb-1">논리 구조</p>
                        <p className="text-lg font-semibold text-charcoal">{analysisResult.analysisResult.scores.logicStructure}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-gray-warm mb-1">추임새</p>
                        <p className="text-lg font-semibold text-charcoal">{analysisResult.analysisResult.scores.fillerWords}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-gray-warm mb-1">말하기 속도</p>
                        <p className="text-lg font-semibold text-charcoal">{analysisResult.analysisResult.scores.speakingPace}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-gray-warm mb-1">자신감</p>
                        <p className="text-lg font-semibold text-teal">{analysisResult.analysisResult.scores.confidenceTone}</p>
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {analysisResult.analysisResult.metrics && (
                    <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-gray-warm mb-2">상세 지표</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-charcoal">
                          <strong>{analysisResult.analysisResult.metrics.wordsPerMinute}</strong> WPM
                        </span>
                        <span className="text-charcoal">
                          추임새 <strong>{analysisResult.analysisResult.metrics.fillerCount}</strong>회
                        </span>
                        <span className="text-charcoal">
                          총 <strong>{analysisResult.analysisResult.metrics.totalWords}</strong>단어
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {analysisResult.analysisResult.suggestions && analysisResult.analysisResult.suggestions.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium text-charcoal mb-2">개선 포인트</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysisResult.suggestions.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                            {item.suggestion}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleRetry} variant="outline" className="flex-1 py-6">
                  다시 녹음하기
                </Button>
                {type === 'interview' && currentQuestionIndex < DEFAULT_INTERVIEW_QUESTIONS.length - 1 && (
                  <Button onClick={handleNextQuestion} className="flex-1 py-6 bg-teal hover:bg-teal-dark">
                    다음 질문으로
                  </Button>
                )}
              </div>

              <p className="mt-6 text-center text-sm text-gray-soft">
                <Link href="/login" className="text-teal hover:text-teal-dark">
                  로그인하면 연습 기록을 저장할 수 있어요 →
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QuickStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <QuickStudioContent />
    </Suspense>
  );
}
