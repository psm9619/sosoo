'use client';

import { useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useProjectStore } from '@/lib/stores/project-store';
import { INTERVIEW_CATEGORY_LABELS, type InterviewCategory, type Project } from '@/types';

type Step = 'info' | 'context' | 'analyzing' | 'creating';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

function NewProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') as 'interview' | 'presentation' || 'interview';

  const { addProject, generateInterviewQuestions } = useProjectStore();

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

  // File upload states
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [additionalFiles, setAdditionalFiles] = useState<UploadedFile[]>([]);
  const [presentationFile, setPresentationFile] = useState<UploadedFile | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  const isInterview = type === 'interview';

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

    // Simulate AI analysis progress
    const stages = [
      { progress: 20, delay: 800 },
      { progress: 45, delay: 1000 },
      { progress: 70, delay: 1200 },
      { progress: 90, delay: 800 },
      { progress: 100, delay: 500 },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, stage.delay));
      setAnalyzeProgress(stage.progress);
    }

    setStep('creating');

    // Simulate project creation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const projectId = `proj-${Date.now()}`;
    const questions = isInterview
      ? generateInterviewQuestions(projectId).filter((q) =>
          q.category ? selectedCategories.includes(q.category) : true
        )
      : [
          {
            id: `q-${Date.now()}-1`,
            projectId,
            text: '이번 발표의 핵심 메시지는 무엇인가요?',
            order: 1,
            attempts: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: `q-${Date.now()}-2`,
            projectId,
            text: '가장 큰 성과나 인사이트를 설명해주세요.',
            order: 2,
            attempts: [],
            createdAt: new Date().toISOString(),
          },
          {
            id: `q-${Date.now()}-3`,
            projectId,
            text: '예상되는 질문이나 반론에 어떻게 대응하시겠어요?',
            order: 3,
            attempts: [],
            createdAt: new Date().toISOString(),
          },
        ];

    const project: Project = {
      id: projectId,
      userId: 'user-1',
      type,
      title: title || (isInterview ? `${company} ${position} 면접` : '발표 연습'),
      company: isInterview ? company : undefined,
      position: isInterview ? position : undefined,
      context: !isInterview ? context : undefined,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProject(project);
    router.push(`/studio/${projectId}`);
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
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          프로젝트 제목 (선택)
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={`자동 생성: ${company || '패스트캠퍼스'} ${position || '비즈니스 애널리스트'} 면접`}
                          className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                      </div>
                    </>
                  ) : (
                    <>
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
              <div className="max-w-sm mx-auto">
                <Progress value={analyzeProgress} className="h-2 mb-2" />
                <p className="text-sm text-gray-soft">{analyzeProgress}%</p>
              </div>
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
