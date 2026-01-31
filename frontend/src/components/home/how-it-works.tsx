'use client';

import { Card } from '@/components/ui/card';

const steps = [
  {
    number: '01',
    title: '녹음하기',
    description: '면접 답변, 발표 스크립트 등 개선하고 싶은 발화를 녹음하세요.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path
          d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
          fill="currentColor"
        />
        <path
          d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI 분석',
    description: 'AI가 문장 구조, 말 속도, 필러워드를 분석합니다. 연습할수록 AI가 성장 패턴을 파악해 맞춤 피드백을 제공해요.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: '03',
    title: '개선 버전 먼저 듣기',
    description: '개선된 발화를 나와 같은 목소리로 먼저 들어보세요. 어떻게 바뀌었는지 바로 확인할 수 있어요.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path
          d="M9 18V5L21 3V16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    note: '음성 데이터는 암호화 저장되며, 언제든 삭제할 수 있어요.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-teal-light/40">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            간단한 <span className="text-teal">3단계</span>로 시작하세요
          </h2>
          <p className="text-gray-warm text-lg max-w-xl mx-auto">
            복잡한 설정 없이, 녹음만 하면 AI가 알아서 분석하고 개선해드립니다.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className="relative p-8 bg-cream border-none shadow-lg hover:shadow-xl transition-shadow group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step Number */}
              <span className="absolute top-6 right-6 text-6xl font-display font-bold text-teal/10 group-hover:text-teal/20 transition-colors">
                {step.number}
              </span>

              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-teal-light/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {step.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-charcoal mb-3">
                {step.title}
              </h3>
              <p className="text-gray-warm leading-relaxed">
                {step.description}
              </p>

              {/* Security Note */}
              {'note' in step && step.note && (
                <p className="mt-4 text-xs text-teal flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  {step.note}
                </p>
              )}

              {/* Connector line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-teal/30 to-transparent" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
