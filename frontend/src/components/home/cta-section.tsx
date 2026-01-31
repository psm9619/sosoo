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
        <h2 className="text-3xl md:text-5xl font-bold mb-8">
          지금 시작하세요
        </h2>

        <Link href="/studio">
          <Button
            size="lg"
            className="bg-coral hover:bg-coral/90 text-white px-10 py-7 text-lg rounded-xl shadow-2xl shadow-black/20 hover:-translate-y-1 transition-all"
          >
            무료로 시작하기
          </Button>
        </Link>
      </div>
    </section>
  );
}
