'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function SamplePreview() {
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
            Before & <span className="text-coral">After</span>
          </h2>
          <p className="text-gray-warm">
            개선된 버전을 <span className="text-teal font-medium">내 목소리</span>로 들어보세요
          </p>
        </div>

        {/* Preview Card */}
        <Card className="p-8 md:p-12 bg-warm-white border-none shadow-xl">
          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-secondary rounded-xl">
              <button
                onClick={() => setActiveTab('before')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'before'
                    ? 'bg-charcoal text-white shadow-md'
                    : 'text-gray-warm hover:text-charcoal'
                }`}
              >
                Before
              </button>
              <button
                onClick={() => setActiveTab('after')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'after'
                    ? 'bg-teal text-white shadow-md'
                    : 'text-gray-warm hover:text-charcoal'
                }`}
              >
                After
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
              <div className="bg-secondary/50 rounded-2xl p-6 mb-6">
                <p className="text-charcoal leading-relaxed text-lg">
                  "음... 저희 회사는요, 그러니까 AI를 활용해서, 뭐랄까,
                  사람들이 말을 더 잘 할 수 있게, 그런 거를 도와주는
                  서비스를 만들고 있습니다. 네..."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 rounded-xl py-6"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  원본 듣기
                </Button>
                <span className="text-sm text-gray-soft">0:12</span>
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
                <p className="text-charcoal leading-relaxed text-lg">
                  "저희 회사는 AI 기반 발화 코칭 서비스를 만들고 있습니다.
                  누구나 자신감 있게 말할 수 있도록, 발화 패턴을 분석하고
                  개선된 버전을 제안해드립니다."
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2 rounded-xl py-6 bg-teal hover:bg-teal-dark"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  내 목소리로 듣기
                </Button>
                <span className="text-sm text-teal font-medium">0:08</span>
              </div>
            </div>
          </div>

          {/* Improvement indicator */}
          {activeTab === 'after' && (
            <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-4 justify-center">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                불필요한 추임새 제거
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                문장 구조 명확화
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-teal-light/50 text-teal-dark text-sm rounded-full">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                33% 시간 단축
              </span>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
