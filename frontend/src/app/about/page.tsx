import { Header, Footer } from '@/components/layout';
import { Card } from '@/components/ui/card';

const features = [
  {
    title: 'STT 기반 음성 인식',
    description: '최신 AI 음성인식 기술로 발화 내용을 정확하게 텍스트로 변환합니다.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor" />
        <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'LLM 발화 분석',
    description: '대규모 언어 모델이 문장 구조, 명확성, 전달력을 분석합니다.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '보이스 클로닝',
    description: '개선된 발화를 나와 같은 목소리로 들어볼 수 있습니다.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-coral">
        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.54 8.46C16.48 9.4 17 10.67 17 12C17 13.33 16.48 14.6 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.07 5.93C19.54 7.4 20.37 9.4 20.37 11.5C20.37 13.6 19.54 15.6 18.07 17.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '반복 개선',
    description: '피드백을 반영해 더 나은 버전으로 계속 다듬을 수 있습니다.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal">
        <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M23 20V14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const useCases = [
  {
    title: '면접 연습',
    description: '자기소개, 질문 답변을 자신감 있게 표현하는 방법을 연습하세요.',
    emoji: '💼',
  },
  {
    title: '발표 준비',
    description: '중요한 프레젠테이션 전, 발표 내용을 더 명확하게 다듬으세요.',
    emoji: '🎤',
  },
  {
    title: '자유스피치',
    description: '일상적인 의견 전달이나 스피치 연습에 활용하세요.',
    emoji: '🎙️',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-20 px-6 bg-cream noise-bg">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral-light text-coral text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-coral" />
              Voice Cloning 기술 적용
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-6">
              <span className="text-teal">내 목소리</span>로 듣는 AI 코칭
            </h1>
            <p className="text-lg text-gray-warm max-w-2xl mx-auto">
              VoiceUp은 AI가 개선한 발화를 <strong className="text-charcoal">당신의 목소리로 클로닝</strong>해서 들려드립니다.
              <br />
              마치 내가 직접 말한 것처럼, 더 나은 버전의 나를 만나보세요.
            </p>
          </div>
        </section>

        {/* How it Works Detail */}
        <section className="py-20 px-6 bg-warm-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-charcoal text-center mb-12">
              어떻게 작동하나요?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 bg-cream border-none hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-teal-light/50 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-charcoal mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-warm text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Process Flow */}
        <section className="py-20 px-6 bg-cream">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-charcoal text-center mb-12">
              상세 프로세스
            </h2>
            <div className="space-y-8">
              {[
                { step: '1', title: '음성 녹음', desc: '마이크 버튼을 누르고 개선하고 싶은 내용을 말해주세요. 최대 5분까지 녹음 가능합니다.' },
                { step: '2', title: '음성 → 텍스트 변환', desc: 'AI가 녹음된 음성을 정확한 텍스트로 변환합니다. 이 과정에서 어조, 속도 등의 특성도 함께 분석됩니다.' },
                { step: '3', title: '발화 분석 및 개선', desc: '문장 구조, 불필요한 추임새, 반복되는 표현 등을 분석하고 더 명확한 버전을 제안합니다.' },
                { step: '4', title: '내 목소리로 합성', desc: '개선된 텍스트를 나와 같은 목소리로 합성해 들어볼 수 있습니다. (회원가입 필요)' },
                { step: '5', title: '피드백 반영', desc: '원하는 부분을 추가로 수정 요청하면, AI가 피드백을 반영해 다시 개선합니다.' },
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal text-white font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-charcoal mb-2">{item.title}</h3>
                    <p className="text-gray-warm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-6 bg-warm-white">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-charcoal text-center mb-4">
              이런 분들께 추천해요
            </h2>
            <p className="text-gray-warm text-center mb-12">
              다양한 상황에서 VoiceUp을 활용해보세요.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <Card key={index} className="p-6 bg-cream border-none text-center hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="text-4xl mb-4">{useCase.emoji}</div>
                  <h3 className="text-lg font-semibold text-charcoal mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-warm text-sm">
                    {useCase.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
