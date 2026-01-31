'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SamplePreview() {
  // 샘플에서는 Before → After 변화를 보여줌 (실제 결과 페이지에서는 After가 디폴트)
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Before → <span className="text-teal">After</span>
          </h2>
          <p className="text-gray-warm">
            같은 내용이 <span className="text-teal font-medium">내 목소리</span>로 어떻게 달라지는지 확인해보세요
          </p>
        </div>

        {/* Preview Card */}
        <Card className="p-8 md:p-12 bg-warm-white border-none shadow-xl">
          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1.5 bg-secondary rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('before')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'before'
                    ? 'bg-coral text-white shadow-md'
                    : 'text-gray-warm hover:text-charcoal hover:bg-secondary/80'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => setActiveTab('after')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'after'
                    ? 'bg-teal text-white shadow-md'
                    : 'text-gray-warm hover:text-charcoal hover:bg-secondary/80'
                }`}
              >
                After ✨
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative min-h-[200px]">
            {/* Before */}
            <div
              className={`transition-all duration-300 ${
                activeTab === 'before'
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 absolute inset-0'
              }`}
            >
              <div className="bg-coral-light/30 rounded-2xl p-6 mb-6 border border-coral/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-coral uppercase tracking-wide">Original</span>
                  <span className="text-xs text-gray-soft">• 필러워드 5개 • 12초</span>
                </div>
                <p className="text-charcoal leading-relaxed text-lg">
                  "<span className="text-coral/70">음...</span> 저희 회사는요, <span className="text-coral/70">그러니까</span> AI를 활용해서, <span className="text-coral/70">뭐랄까,</span>
                  사람들이 말을 더 잘 할 수 있게, 그런 거를 도와주는
                  서비스를 만들고 있습니다. <span className="text-coral/70">네...</span>"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 rounded-xl py-6 border-coral/30 text-coral hover:bg-coral-light/20"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  원본 듣기
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2 rounded-xl py-6 bg-teal hover:bg-teal-dark"
                  onClick={() => setActiveTab('after')}
                >
                  개선 버전 보기
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* After */}
            <div
              className={`transition-all duration-300 ${
                activeTab === 'after'
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 absolute inset-0'
              }`}
            >
              <div className="bg-teal-light/30 rounded-2xl p-6 mb-6 border border-teal/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-teal uppercase tracking-wide">Improved</span>
                  <span className="text-xs text-teal">• 필러워드 0개 • 8초 (-33%)</span>
                </div>
                <p className="text-charcoal leading-relaxed text-lg">
                  "저희 회사는 AI 기반 발화 코칭 서비스를 만들고 있습니다.
                  누구나 자신감 있게 말할 수 있도록, 발화 패턴을 분석하고
                  개선된 버전을 제안해드립니다."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 rounded-xl py-6"
                  onClick={() => setActiveTab('before')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  원본 보기
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2 rounded-xl py-6 bg-teal hover:bg-teal-dark"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  내 목소리로 듣기
                </Button>
              </div>
            </div>
          </div>

          {/* Improvement indicator - always visible */}
          <div className={`mt-6 pt-6 border-t border-border transition-all duration-300 ${
            activeTab === 'after' ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className="flex flex-wrap gap-3 justify-center">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeTab === 'after'
                  ? 'bg-teal-light/50 text-teal-dark'
                  : 'bg-secondary text-gray-warm'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                필러워드 5개 → 0개
              </span>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeTab === 'after'
                  ? 'bg-teal-light/50 text-teal-dark'
                  : 'bg-secondary text-gray-warm'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                문장 구조 명확화
              </span>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeTab === 'after'
                  ? 'bg-teal-light/50 text-teal-dark'
                  : 'bg-secondary text-gray-warm'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                12초 → 8초 (33% 단축)
              </span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
