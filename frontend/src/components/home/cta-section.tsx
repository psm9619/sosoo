import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-teal to-teal-dark text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          지금 바로 시작하세요
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
          회원가입 없이 무료로 체험해보세요.
          <br />
          당신의 첫 번째 발화가 어떻게 변하는지 확인하세요.
        </p>

        <Link href="/studio">
          <Button
            size="lg"
            className="bg-coral hover:bg-coral/90 text-white px-10 py-7 text-lg rounded-xl shadow-2xl shadow-black/20 hover:-translate-y-1 transition-all"
          >
            무료로 시작하기
          </Button>
        </Link>

        <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            신용카드 불필요
          </span>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            5분 내 결과
          </span>
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            데이터 안전 보장
          </span>
        </div>
      </div>
    </section>
  );
}
