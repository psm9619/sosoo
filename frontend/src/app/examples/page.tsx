'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const categories = ['전체', '발표', '면접', '영상', '강의'];

const examples = [
  {
    id: 1,
    category: '발표',
    title: '스타트업 피칭',
    before: '음... 저희 회사는요, 그러니까 AI를 활용해서, 뭐랄까, 사람들이 말을 더 잘 할 수 있게, 그런 거를 도와주는 서비스를 만들고 있습니다. 네...',
    after: '저희 회사는 AI 기반 발화 코칭 서비스를 만들고 있습니다. 누구나 자신감 있게 말할 수 있도록, 발화 패턴을 분석하고 개선된 버전을 제안해드립니다.',
    improvements: ['불필요한 추임새 제거', '문장 구조 명확화', '33% 시간 단축'],
    duration: { before: '12초', after: '8초' },
  },
  {
    id: 2,
    category: '면접',
    title: '자기소개',
    before: '안녕하세요, 저는 그, 개발자로 일하고 있는, 음, 3년차 프론트엔드 개발자인데요, 리액트랑 타입스크립트를 주로 쓰고, 그래서 이번에 지원하게 됐습니다.',
    after: '안녕하세요, 3년차 프론트엔드 개발자입니다. React와 TypeScript를 주력으로 사용하며, 사용자 경험을 개선하는 일에 관심이 많아 지원하게 되었습니다.',
    improvements: ['어순 정리', '전문성 강조', '명확한 지원 동기'],
    duration: { before: '10초', after: '9초' },
  },
  {
    id: 3,
    category: '영상',
    title: '유튜브 인트로',
    before: '안녕하세요 여러분~ 오늘은요, 제가 그 뭐냐, 요즘 핫한 AI 서비스들 있잖아요, 그거에 대해서 좀 얘기해볼까 해요.',
    after: '안녕하세요 여러분! 오늘은 요즘 주목받고 있는 AI 서비스들을 소개해드릴게요. 직접 써보고 솔직하게 리뷰해보겠습니다.',
    improvements: ['간결한 인트로', '시청자 기대감 유발', '전문성 어필'],
    duration: { before: '8초', after: '7초' },
  },
  {
    id: 4,
    category: '강의',
    title: '개념 설명',
    before: '자, 여기서 중요한 게 뭐냐면요, 그러니까 변수라는 건요, 쉽게 말해서, 값을 저장하는 공간이라고 생각하시면 되는데, 그냥 그릇이라고 생각하시면 돼요.',
    after: '변수는 값을 저장하는 공간입니다. 그릇에 물건을 담듯이, 변수에 데이터를 담아 사용합니다. 예시를 통해 직접 확인해볼까요?',
    improvements: ['반복 표현 제거', '비유 활용', '참여 유도'],
    duration: { before: '11초', after: '8초' },
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
    category: '면접',
    title: '프로젝트 경험',
    before: '제가 했던 프로젝트 중에서, 그게 뭐냐면 쇼핑몰 만드는 거였는데, 거기서 결제 부분을 담당했어요. 좀 어려웠는데 잘 해결했습니다.',
    after: '쇼핑몰 구축 프로젝트에서 결제 시스템을 담당했습니다. PG사 연동 과정에서 보안 이슈가 있었는데, 토큰 기반 인증을 도입해 해결했습니다.',
    improvements: ['구체적 역할 명시', '문제-해결 구조', '기술적 디테일'],
    duration: { before: '8초', after: '9초' },
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
