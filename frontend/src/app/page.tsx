import { Header, Footer } from '@/components/layout';
import {
  HeroSection,
  HowItWorks,
  SamplePreview,
  CTASection,
} from '@/components/home';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <HeroSection />
        <HowItWorks />
        <SamplePreview />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
