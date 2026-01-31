'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { VoiceWave } from './voice-wave';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden noise-bg">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-teal/10 rounded-full blur-3xl animate-breathe" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-coral/10 rounded-full blur-3xl animate-breathe delay-500" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-light/50 text-teal-dark text-sm font-medium mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          AI 발화 코칭 서비스
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-charcoal mb-6 animate-fade-in animation-delay-100">
          당신의 말,
          <br />
          <span className="text-gradient">AI가 다듬어</span>드립니다
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-gray-warm max-w-2xl mx-auto mb-8 animate-fade-in animation-delay-200">
          발표, 면접, 영상 촬영 전에 연습하세요.
          <br className="hidden md:block" />
          AI가 더 명확하고 자신감 있는 발화로 개선해드립니다.
        </p>

        {/* Voice Wave Visualization */}
        <div className="mb-10 animate-fade-in animation-delay-300">
          <VoiceWave className="mx-auto" />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animation-delay-400">
          <Link href="/studio">
            <Button
              size="lg"
              className="bg-coral hover:bg-coral/90 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-coral/25 hover:shadow-xl hover:shadow-coral/30 transition-all hover:-translate-y-0.5"
            >
              무료로 시작하기
            </Button>
          </Link>
          <Link href="/examples">
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-secondary"
            >
              예시 듣기
            </Button>
          </Link>
        </div>

        {/* Trust indicator */}
        <p className="mt-8 text-sm text-gray-soft animate-fade-in animation-delay-500">
          회원가입 없이 바로 체험 가능 · 5분 내 결과 확인
        </p>
      </div>
    </section>
  );
}
