'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const categories = ['전체', '면접', '발표', '자유스피치'];

const examples = [
  {
    id: 1,
    category: '면접',
    title: '자기소개',
    before: '안녕하세요, 저는 그, 개발자로 일하고 있는, 음, 3년차 프론트엔드 개발자인데요, 리액트랑 타입스크립트를 주로 쓰고, 그래서 이번에 지원하게 됐습니다.',
    after: '안녕하세요, 3년차 프론트엔드 개발자입니다. React와 TypeScript를 주력으로 사용하며, 사용자 경험을 개선하는 일에 관심이 많아 지원하게 되었습니다.',
    improvements: ['어순 정리', '전문성 강조', '명확한 지원 동기'],
    duration: { before: '10초', after: '9초' },
  },
  {
    id: 2,
    category: '면접',
    title: '프로젝트 경험',
    before: '제가 했던 프로젝트 중에서, 그게 뭐냐면 쇼핑몰 만드는 거였는데, 거기서 결제 부분을 담당했어요. 좀 어려웠는데 잘 해결했습니다.',
    after: '쇼핑몰 구축 프로젝트에서 결제 시스템을 담당했습니다. PG사 연동 과정에서 보안 이슈가 있었는데, 토큰 기반 인증을 도입해 해결했습니다.',
    improvements: ['구체적 역할 명시', '문제-해결 구조', '기술적 디테일'],
    duration: { before: '8초', after: '9초' },
  },
  {
    id: 3,
    category: '면접',
    title: '지원 동기',
    before: '음, 이 회사가 좀 좋아 보여서요, 그러니까 성장하고 있고, 뭔가 배울 수 있을 것 같아서, 그래서 지원했습니다.',
    after: '귀사의 데이터 기반 의사결정 문화에 매력을 느꼈습니다. 특히 최근 출시한 AI 추천 시스템 사례를 보고, 제 분석 역량을 발휘할 수 있겠다고 확신했습니다.',
    improvements: ['구체적 회사 언급', '역량 연결', '진정성 표현'],
    duration: { before: '7초', after: '9초' },
  },
  {
    id: 4,
    category: '발표',
    title: '스타트업 피칭',
    before: '음... 저희 회사는요, 그러니까 AI를 활용해서, 뭐랄까, 사람들이 말을 더 잘 할 수 있게, 그런 거를 도와주는 서비스를 만들고 있습니다. 네...',
    after: '저희 회사는 AI 기반 발화 코칭 서비스를 만들고 있습니다. 누구나 자신감 있게 말할 수 있도록, 발화 패턴을 분석하고 개선된 버전을 제안해드립니다.',
    improvements: ['불필요한 추임새 제거', '문장 구조 명확화', '33% 시간 단축'],
    duration: { before: '12초', after: '8초' },
  },
  {
    id: 5,
    category: '발표',
    title: '분기 실적 보고',
    before: '이번 분기 매출이요, 그게 작년 대비해서 한 15% 정도 올랐고요, 비용은 뭐 비슷한 수준이고, 그래서 영업이익이 좀 좋아졌습니다.',
    after: '이번 분기 매출은 전년 대비 15% 성장했습니다. 비용은 동일 수준으로 유지하면서 영업이익이 크게 개선되었습니다. 주요 성장 동력은 다음과 같습니다.',
    improvements: ['수치 명확화', '구조적 전달', '후속 내용 연결'],
    duration: { before: '9초', after: '10초' },
  },
  {
    id: 6,
    category: '자유스피치',
    title: '일상 대화 연습',
    before: '그래서 제 생각에는, 뭐랄까, 이게 좀 그런 것 같은데, 아 뭐지, 그러니까 좀 더 효율적으로 할 수 있지 않을까 싶어요.',
    after: '제 생각에는 이 프로세스를 자동화하면 효율성을 높일 수 있을 것 같습니다. 구체적인 방안을 말씀드리면요.',
    improvements: ['모호한 표현 제거', '핵심 의견 명확화', '구조적 전달'],
    duration: { before: '8초', after: '6초' },
  },
];

export default function ExamplesPage() {
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredExamples = selectedCategory === '전체'
    ? examples
    : examples.filter((e) => e.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-16 px-6 bg-cream noise-bg">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
              Before & <span className="text-teal">After</span>
            </h1>
            <p className="text-lg text-gray-warm">
              실제 사용 예시를 통해 AI가 어떻게 발화를 개선하는지 확인해보세요.
            </p>
          </div>
        </section>

        {/* Filter */}
        <section className="py-8 px-6 bg-warm-white border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-teal text-white'
                      : 'bg-secondary text-gray-warm hover:bg-secondary/80'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Examples Grid */}
        <section className="py-12 px-6 bg-warm-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredExamples.map((example) => (
                <Card
                  key={example.id}
                  className="p-6 bg-cream border-none hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-teal-light/50 text-teal-dark text-xs font-medium rounded-full">
                      {example.category}
                    </span>
                    <h3 className="font-semibold text-charcoal">{example.title}</h3>
                  </div>

                  {/* Before */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-soft uppercase">Before</span>
                      <span className="text-xs text-gray-soft">{example.duration.before}</span>
                    </div>
                    <p className="text-charcoal/70 text-sm leading-relaxed bg-secondary/50 p-3 rounded-lg">
                      {expandedId === example.id
                        ? example.before
                        : example.before.slice(0, 80) + '...'}
                    </p>
                  </div>

                  {/* After */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-teal uppercase">After</span>
                      <span className="text-xs text-teal">{example.duration.after}</span>
                    </div>
                    <p className="text-charcoal text-sm leading-relaxed bg-teal-light/30 p-3 rounded-lg border border-teal/10">
                      {expandedId === example.id
                        ? example.after
                        : example.after.slice(0, 80) + '...'}
                    </p>
                  </div>

                  {/* Improvements */}
                  {expandedId === example.id && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {example.improvements.map((improvement, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-teal-light/50 text-teal-dark text-xs rounded-full"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                          {improvement}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => setExpandedId(expandedId === example.id ? null : example.id)}
                      className="text-sm text-teal hover:text-teal-dark font-medium"
                    >
                      {expandedId === example.id ? '접기' : '자세히 보기'}
                    </button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        원본 듣기
                      </Button>
                      <Button size="sm" className="text-xs bg-teal hover:bg-teal-dark">
                        개선 듣기
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-cream">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal mb-4">
              직접 체험해보세요
            </h2>
            <p className="text-gray-warm mb-8">
              예시만 보지 말고, 당신의 발화가 어떻게 변하는지 직접 확인해보세요.
            </p>
            <Link href="/studio">
              <Button size="lg" className="bg-coral hover:bg-coral/90 text-white px-8">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
