'use client';

import { useState, Suspense, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAuth } from '@/lib/auth/hooks';
import { createProject, createQuestions } from '@/lib/supabase/projects';
import { INTERVIEW_CATEGORY_LABELS, type InterviewCategory, type Project, type Question } from '@/types';
import type { DBInterviewCategory } from '@/lib/supabase/types';

type Step = 'info' | 'context' | 'analyzing' | 'creating';

// 로딩 중 표시할 격려 문구들
const ENCOURAGING_QUOTES = [
  { text: "완벽한 준비란 없습니다. 시작하는 것 자체가 이미 절반의 성공입니다.", author: "파블로 피카소" },
  { text: "당신이 할 수 있다고 믿든, 할 수 없다고 믿든, 당신 말이 맞습니다.", author: "헨리 포드" },
  { text: "성공은 매일 반복한 작은 노력들의 합입니다.", author: "로버트 콜리어" },
  { text: "실패는 성공의 어머니입니다. 연습할수록 더 나아집니다.", author: "토마스 에디슨" },
  { text: "긴장은 당신이 이것을 중요하게 생각한다는 증거입니다.", author: "unknown" },
  { text: "두려움을 느끼면서도 행동하는 것, 그것이 진정한 용기입니다.", author: "넬슨 만델라" },
  { text: "당신의 이야기는 누군가에게 영감이 됩니다. 자신있게 말해보세요.", author: "VoiceUp" },
  { text: "오늘의 연습이 내일의 자신감이 됩니다.", author: "VoiceUp" },
  { text: "면접관도 한때 지원자였습니다. 진정성 있게 대화하세요.", author: "VoiceUp" },
  { text: "완벽하지 않아도 괜찮아요. 진심은 언제나 통합니다.", author: "VoiceUp" },
];

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

function NewProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') as 'interview' | 'presentation' || 'interview';

  const { addProject } = useProjectStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>('info');
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [context, setContext] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<InterviewCategory[]>([
    'basic',
    'motivation',
    'competency',
    'technical',
    'situation',
  ]);
  const [targetDate, setTargetDate] = useState('');

  // File upload states
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);
  const [presentationFile, setPresentationFile] = useState<UploadedFile | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // 로딩 중 격려 문구
  const [showQuote, setShowQuote] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(ENCOURAGING_QUOTES[0]);

  // 면접/발표 프로젝트는 로그인 필수 - 미로그인 시 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated && (type === 'interview' || type === 'presentation')) {
      // 로그인 후 복귀할 URL 저장
      const returnUrl = `/studio/new?type=${type}`;
      router.push(`/login?next=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, isAuthenticated, type, router]);

  // 10초 이상 로딩 시 격려 문구 표시
  useEffect(() => {
    let quoteTimer: NodeJS.Timeout;
    let rotateTimer: NodeJS.Timeout;

    if (step === 'analyzing') {
      quoteTimer = setTimeout(() => {
        setShowQuote(true);
        setCurrentQuote(ENCOURAGING_QUOTES[Math.floor(Math.random() * ENCOURAGING_QUOTES.length)]);
      }, 10000);

      rotateTimer = setInterval(() => {
        if (showQuote) {
          setCurrentQuote(ENCOURAGING_QUOTES[Math.floor(Math.random() * ENCOURAGING_QUOTES.length)]);
        }
      }, 8000);
    } else {
      setShowQuote(false);
    }

    return () => {
      clearTimeout(quoteTimer);
      clearInterval(rotateTimer);
    };
  }, [step, showQuote]);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  const isInterview = type === 'interview';

  // 인증 로딩 중이거나 로그인 필요한데 미인증이면 로딩 표시
  if (authLoading || (!isAuthenticated && (type === 'interview' || type === 'presentation'))) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-teal-light/50 flex items-center justify-center animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-gray-warm">로그인 확인 중...</p>
          </div>
        </main>
      </div>
    );
  }

  const handleCategoryToggle = (category: InterviewCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: UploadedFile | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    }
  };

  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      }));
      setAdditionalFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAdditionalFile = (index: number) => {
    setAdditionalFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleNextStep = () => {
    if (step === 'info') {
      setStep('context');
    }
  };

  const handleAnalyzeAndCreate = async () => {
    setStep('analyzing');
    setAnalyzeProgress(0);

    let questions: Question[] = [];
    let contextAnalysis: {
      summary?: string;
      keywords?: string[];
      experiences?: unknown[];
      strengths?: string[];
      potentialQuestionAreas?: string[];
    } | null = null;

    try {
      const primaryFile = isInterview ? resumeFile : presentationFile;
      console.log('[DEBUG] primaryFile:', primaryFile);

      // Step 1: 파일이 있으면 컨텍스트 분석 실행
      if (primaryFile && primaryFile.file) {
        setAnalyzeProgress(10);
        console.log('[DEBUG] Starting context analysis...', {
          fileName: primaryFile.file.name,
          fileSize: primaryFile.file.size,
          fileType: primaryFile.file.type,
        });

        const formData = new FormData();
        formData.append('file', primaryFile.file);
        formData.append('documentType', isInterview ? 'resume' : 'presentation');
        formData.append('projectType', isInterview ? 'interview' : 'presentation');
        if (company) formData.append('company', company);
        if (position) formData.append('position', position);

        try {
          const contextResponse = await fetch('/api/context/analyze', {
            method: 'POST',
            body: formData,
          });

          setAnalyzeProgress(40);

          const contextData = await contextResponse.json();
          console.log('[DEBUG] Context analysis response:', {
            status: contextResponse.status,
            ok: contextResponse.ok,
            data: contextData
          });

          if (contextResponse.ok && contextData.success && contextData.data) {
            contextAnalysis = contextData.data;
            console.log('[DEBUG] Context analysis successful:', contextAnalysis);
          } else {
            console.warn('[DEBUG] Context analysis failed:', contextData.error || 'Unknown error');
          }
        } catch (fetchError) {
          console.error('[DEBUG] Context analysis fetch error:', fetchError);
        }
      }

      setAnalyzeProgress(50);

      // Step 2: 질문 생성
      if (contextAnalysis) {
        console.log('[DEBUG] Starting question generation with context:', contextAnalysis);

        try {
          const questionsResponse = await fetch('/api/questions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectType: isInterview ? 'interview' : 'presentation',
              context: contextAnalysis,
              company: isInterview ? company : undefined,
              position: isInterview ? position : undefined,
              questionsPerCategory: isInterview
                ? selectedCategories.reduce(
                    (acc, cat) => ({
                      ...acc,
                      [cat]: cat === 'competency' || cat === 'technical' ? 4 : cat === 'motivation' ? 2 : 1,
                    }),
                    {}
                  )
                : undefined,
              presentationQuestionCount: !isInterview ? 10 : undefined,
            }),
          });

          setAnalyzeProgress(80);

          const questionsData = await questionsResponse.json();
          console.log('[DEBUG] Question generation response:', {
            status: questionsResponse.status,
            ok: questionsResponse.ok,
            data: questionsData
          });

          if (questionsResponse.ok && questionsData.success && questionsData.data?.questions) {
            // 임시 ID로 질문 생성 (DB 저장 후 실제 ID로 교체됨)
            questions = questionsData.data.questions.map(
              (q: { text: string; category?: InterviewCategory }, index: number) => ({
                id: `temp-q-${index + 1}`,
                projectId: 'temp',
                category: q.category,
                text: q.text,
                order: index + 1,
                attempts: [],
                createdAt: new Date().toISOString(),
              })
            );
            console.log('[DEBUG] Generated questions:', questions.length);
          } else {
            console.warn('[DEBUG] Question generation failed:', questionsData.error || 'Unknown error');
          }
        } catch (fetchError) {
          console.error('[DEBUG] Question generation fetch error:', fetchError);
        }
      } else {
        console.log('[DEBUG] No context analysis, skipping question generation');
      }

      // 질문이 생성되지 않았으면 기본 질문 사용
      if (questions.length === 0) {
        questions = isInterview
          ? [
              { id: 'temp-q-1', projectId: 'temp', category: 'basic' as InterviewCategory, text: '간단하게 자기소개 부탁드립니다.', order: 1, attempts: [], createdAt: new Date().toISOString() },
              { id: 'temp-q-2', projectId: 'temp', category: 'motivation' as InterviewCategory, text: '왜 이 회사에 지원하셨나요?', order: 2, attempts: [], createdAt: new Date().toISOString() },
              { id: 'temp-q-3', projectId: 'temp', category: 'competency' as InterviewCategory, text: '가장 성공적으로 완수한 프로젝트에 대해 말씀해주세요.', order: 3, attempts: [], createdAt: new Date().toISOString() },
            ]
          : [
              { id: 'temp-q-1', projectId: 'temp', text: '이번 발표의 핵심 메시지는 무엇인가요?', order: 1, attempts: [], createdAt: new Date().toISOString() },
              { id: 'temp-q-2', projectId: 'temp', text: '가장 큰 성과나 인사이트를 설명해주세요.', order: 2, attempts: [], createdAt: new Date().toISOString() },
              { id: 'temp-q-3', projectId: 'temp', text: '예상되는 질문이나 반론에 어떻게 대응하시겠어요?', order: 3, attempts: [], createdAt: new Date().toISOString() },
            ];
      }
    } catch (error) {
      console.error('[DEBUG] Error in handleAnalyzeAndCreate:', error);
      // API 실패 시 기본 질문 사용
      questions = isInterview
        ? [
            { id: 'temp-q-1', projectId: 'temp', category: 'basic' as InterviewCategory, text: '간단하게 자기소개 부탁드립니다.', order: 1, attempts: [], createdAt: new Date().toISOString() },
            { id: 'temp-q-2', projectId: 'temp', category: 'motivation' as InterviewCategory, text: '왜 이 회사에 지원하셨나요?', order: 2, attempts: [], createdAt: new Date().toISOString() },
            { id: 'temp-q-3', projectId: 'temp', category: 'competency' as InterviewCategory, text: '가장 성공적으로 완수한 프로젝트에 대해 말씀해주세요.', order: 3, attempts: [], createdAt: new Date().toISOString() },
          ]
        : [
            { id: 'temp-q-1', projectId: 'temp', text: '이번 발표의 핵심 메시지는 무엇인가요?', order: 1, attempts: [], createdAt: new Date().toISOString() },
            { id: 'temp-q-2', projectId: 'temp', text: '가장 큰 성과나 인사이트를 설명해주세요.', order: 2, attempts: [], createdAt: new Date().toISOString() },
            { id: 'temp-q-3', projectId: 'temp', text: '예상되는 질문이나 반론에 어떻게 대응하시겠어요?', order: 3, attempts: [], createdAt: new Date().toISOString() },
          ];
    }

    setAnalyzeProgress(100);
    setStep('creating');

    // 프로젝트 생성
    await new Promise((resolve) => setTimeout(resolve, 500));

    const projectTitle = title || (isInterview ? `${company} ${position} 면접` : '발표 연습');

    // 로그인 사용자: Supabase DB에 저장
    if (isAuthenticated && user) {
      try {
        // 1. 프로젝트 생성
        const dbProject = await createProject({
          user_id: user.id,
          type,
          title: projectTitle,
          company: isInterview ? company : null,
          position: isInterview ? position : null,
          description: !isInterview ? context : null,
          context_summary: contextAnalysis?.summary || null,
          context_keywords: contextAnalysis?.keywords || null,
          context_experiences: contextAnalysis?.experiences?.map((exp: unknown) => {
            const e = exp as { title?: string; role?: string; achievements?: string[]; skills?: string[] };
            return {
              title: e.title || '',
              role: e.role || '',
              achievements: e.achievements || [],
              skills: e.skills,
            };
          }) || null,
          target_date: targetDate || null,
        });

        // 2. 질문 일괄 생성
        const dbQuestions = await createQuestions(
          dbProject.id,
          questions.map((q) => ({
            text: q.text,
            category: q.category as DBInterviewCategory | null || null,
            order: q.order,
            is_ai_generated: true,
          }))
        );

        // 3. 로컬 스토어에도 추가 (캐시 역할)
        const project: Project = {
          ...dbProject,
          questions: dbQuestions.map((q) => ({ ...q, attempts: [] })),
        };
        addProject(project);

        router.push(`/studio/${dbProject.id}`);
      } catch (error) {
        console.error('[DB Save Error]', error);
        // DB 저장 실패 시 로컬에만 저장 (fallback)
        const localProjectId = `proj-${Date.now()}`;
        const project: Project = {
          id: localProjectId,
          userId: user.id,
          type,
          title: projectTitle,
          company: isInterview ? company : undefined,
          position: isInterview ? position : undefined,
          context: !isInterview ? context : undefined,
          contextSummary: contextAnalysis?.summary,
          contextKeywords: contextAnalysis?.keywords,
          contextExperiences: contextAnalysis?.experiences as Project['contextExperiences'],
          contextStrengths: contextAnalysis?.strengths,
          targetDate: targetDate || undefined,
          questions: questions.map((q, i) => ({
            ...q,
            id: `q-${Date.now()}-${i + 1}`,
            projectId: localProjectId,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addProject(project);
        router.push(`/studio/${localProjectId}`);
      }
    } else {
      // 비로그인 사용자: localStorage에만 저장 (기존 방식)
      const localProjectId = `proj-${Date.now()}`;
      const project: Project = {
        id: localProjectId,
        userId: 'guest',
        type,
        title: projectTitle,
        company: isInterview ? company : undefined,
        position: isInterview ? position : undefined,
        context: !isInterview ? context : undefined,
        contextSummary: contextAnalysis?.summary,
        contextKeywords: contextAnalysis?.keywords,
        contextExperiences: contextAnalysis?.experiences as Project['contextExperiences'],
        contextStrengths: contextAnalysis?.strengths,
        targetDate: targetDate || undefined,
        questions: questions.map((q, i) => ({
          ...q,
          id: `q-${Date.now()}-${i + 1}`,
          projectId: localProjectId,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addProject(project);
      router.push(`/studio/${localProjectId}`);
    }
  };

  const canProceedToContext = isInterview
    ? company && position
    : title;

  const canStartAnalysis = isInterview
    ? resumeFile !== null
    : presentationFile !== null;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
              isInterview
                ? 'bg-teal-light/50 text-teal-dark'
                : 'bg-coral-light/50 text-coral'
            }`}>
              {isInterview ? '💼' : '🎤'} {isInterview ? '면접' : '발표'} 프로젝트
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal">
              새 프로젝트 만들기
            </h1>
          </div>

          {/* Progress Indicator */}
          {(step === 'info' || step === 'context') && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className={`w-3 h-3 rounded-full ${step === 'info' ? 'bg-teal' : 'bg-teal/30'}`} />
              <div className={`w-12 h-0.5 ${step === 'context' ? 'bg-teal' : 'bg-teal/30'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'context' ? 'bg-teal' : 'bg-teal/30'}`} />
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 'info' && (
            <div className="animate-fade-in">
              <Card className="p-6 bg-warm-white border-none mb-6">
                <h3 className="font-semibold text-charcoal mb-4">기본 정보</h3>
                <div className="space-y-4">
                  {isInterview ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          회사명 *
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="예: 패스트캠퍼스"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          포지션 *
                        </label>
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="예: 비즈니스 애널리스트"
                          className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">
                            프로젝트 제목 (선택)
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`자동: ${company || '회사'} ${position || '포지션'}`}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">
                            면접 예정일 (선택)
                          </label>
                          <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">
                            프로젝트 제목 *
                          </label>
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: Q4 사업 성과 발표"
                            className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-coral"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal mb-2">
                            발표 예정일 (선택)
                          </label>
                          <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-coral"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          발표 개요 (선택)
                        </label>
                        <textarea
                          value={context}
                          onChange={(e) => setContext(e.target.value)}
                          placeholder="발표 내용을 간단히 설명해주세요."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-coral resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {/* Category Selection (Interview only) */}
              {isInterview && (
                <Card className="p-6 bg-warm-white border-none mb-6">
                  <h3 className="font-semibold text-charcoal mb-4">질문 카테고리 선택</h3>
                  <p className="text-sm text-gray-warm mb-4">
                    연습하고 싶은 카테고리를 선택하세요. 역량/기술은 3~5개, 그 외는 1~2개의 맞춤 질문이 생성됩니다.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(INTERVIEW_CATEGORY_LABELS) as InterviewCategory[]).map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategories.includes(category)
                            ? 'bg-teal text-white'
                            : 'bg-secondary text-gray-warm hover:bg-secondary/80'
                        }`}
                      >
                        {INTERVIEW_CATEGORY_LABELS[category]}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              <Button
                onClick={handleNextStep}
                disabled={!canProceedToContext}
                className={`w-full py-6 ${
                  isInterview
                    ? 'bg-teal hover:bg-teal-dark'
                    : 'bg-coral hover:bg-coral/90'
                }`}
              >
                다음: 자료 업로드
              </Button>
            </div>
          )}

          {/* Step 2: Context Upload */}
          {step === 'context' && (
            <div className="animate-fade-in">
              <Card className="p-6 bg-warm-white border-none mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal">
                    {isInterview ? '면접 준비 자료' : '발표 자료'}
                  </h3>
                  <button
                    onClick={() => setStep('info')}
                    className="text-sm text-gray-warm hover:text-charcoal"
                  >
                    ← 이전
                  </button>
                </div>

                <p className="text-sm text-gray-warm mb-6">
                  {isInterview
                    ? 'AI가 레주메를 분석해 예상 질문을 생성하고, 답변 피드백 시 맥락을 반영합니다.'
                    : 'AI가 발표 자료를 분석해 예상 질문을 생성하고, 발표 연습 피드백에 활용합니다.'}
                </p>

                {/* Primary File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    {isInterview ? '레주메 *' : '발표 자료 *'}
                    <span className="text-gray-soft font-normal ml-2">
                      (PDF, DOCX, PPTX)
                    </span>
                  </label>
                  <input
                    ref={isInterview ? resumeInputRef : presentationInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        isInterview ? setResumeFile : setPresentationFile
                      )
                    }
                    className="hidden"
                  />
                  {(isInterview ? resumeFile : presentationFile) ? (
                    <div className="flex items-center justify-between p-4 bg-teal-light/30 rounded-xl border border-teal/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-charcoal">
                            {(isInterview ? resumeFile : presentationFile)?.name}
                          </p>
                          <p className="text-xs text-gray-soft">
                            {formatFileSize((isInterview ? resumeFile : presentationFile)?.size || 0)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          isInterview ? setResumeFile(null) : setPresentationFile(null)
                        }
                        className="text-gray-soft hover:text-destructive"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        isInterview
                          ? resumeInputRef.current?.click()
                          : presentationInputRef.current?.click()
                      }
                      className="w-full p-8 border-2 border-dashed border-border rounded-xl hover:border-teal hover:bg-teal-light/10 transition-colors"
                    >
                      <div className="text-center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-3 text-gray-soft">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p className="text-sm text-gray-warm">
                          클릭하여 파일 업로드
                        </p>
                      </div>
                    </button>
                  )}
                </div>

                {/* Additional Files */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    {isInterview ? '성과 증명 자료 (선택)' : '참고 자료 (선택)'}
                    <span className="text-gray-soft font-normal ml-2">
                      포트폴리오, 프로젝트 문서 등
                    </span>
                  </label>
                  <input
                    ref={additionalInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    multiple
                    onChange={handleMultipleFileUpload}
                    className="hidden"
                  />

                  {additionalFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {additionalFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            <span className="text-sm text-charcoal">{file.name}</span>
                            <span className="text-xs text-gray-soft">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            onClick={() => removeAdditionalFile(index)}
                            className="text-gray-soft hover:text-destructive"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => additionalInputRef.current?.click()}
                    className="w-full p-4 border border-dashed border-border rounded-xl hover:border-gray-soft transition-colors text-sm text-gray-warm"
                  >
                    + 파일 추가하기
                  </button>
                </div>
              </Card>

              {/* Privacy Notice */}
              <Card className="p-4 bg-teal-light/20 border border-teal/20 mb-6">
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal flex-shrink-0 mt-0.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <p className="text-sm text-teal-dark font-medium">데이터 보안 안내</p>
                    <p className="text-xs text-gray-warm mt-1">
                      업로드된 자료는 암호화되어 저장되며, AI 학습에 사용되지 않습니다.
                      언제든 마이페이지에서 삭제할 수 있습니다.
                    </p>
                  </div>
                </div>
              </Card>

              <Button
                onClick={handleAnalyzeAndCreate}
                disabled={!canStartAnalysis}
                className={`w-full py-6 ${
                  isInterview
                    ? 'bg-teal hover:bg-teal-dark'
                    : 'bg-coral hover:bg-coral/90'
                }`}
              >
                AI 분석 시작하기
              </Button>
            </div>
          )}

          {/* Step 3: Analyzing */}
          {step === 'analyzing' && (
            <div className="text-center animate-fade-in py-12">
              <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center animate-breathe ${
                isInterview ? 'bg-teal-light/50' : 'bg-coral-light/50'
              }`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className={isInterview ? 'text-teal' : 'text-coral'}>
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">AI가 자료를 분석 중이에요</h2>
              <p className="text-gray-warm mb-8">
                {analyzeProgress < 30 && '자료를 읽고 있어요...'}
                {analyzeProgress >= 30 && analyzeProgress < 60 && '핵심 내용을 파악하고 있어요...'}
                {analyzeProgress >= 60 && analyzeProgress < 90 && '맞춤 질문을 생성하고 있어요...'}
                {analyzeProgress >= 90 && '거의 완료됐어요!'}
              </p>
              <div className="max-w-sm mx-auto mb-8">
                <Progress value={analyzeProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-soft">{analyzeProgress}%</p>
              </div>

              {/* 10초 이상 로딩 시 격려 문구 표시 */}
              {showQuote && (
                <div className="animate-fade-in max-w-md mx-auto mt-8 p-6 bg-warm-white/80 rounded-2xl border border-border/50">
                  <svg
                    className="w-8 h-8 mx-auto mb-4 text-teal/60"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-charcoal font-medium mb-2 leading-relaxed">
                    &ldquo;{currentQuote.text}&rdquo;
                  </p>
                  <p className="text-sm text-gray-soft">
                    — {currentQuote.author}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Creating */}
          {step === 'creating' && (
            <div className="text-center animate-fade-in py-12">
              <div className={`w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center animate-breathe ${
                isInterview ? 'bg-teal-light/50' : 'bg-coral-light/50'
              }`}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isInterview ? 'text-teal' : 'text-coral'}>
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">프로젝트 생성 완료!</h2>
              <p className="text-gray-warm">
                잠시 후 연습 화면으로 이동합니다...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <NewProjectContent />
    </Suspense>
  );
}
