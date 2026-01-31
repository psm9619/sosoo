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
    title: 'AI 발화 분석',
    description: 'AI가 문장 구조, 말 속도, 필러워드(어, 음...)를 분석하고 구체적인 개선점을 알려드립니다.',
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
    title: '맞춤 재요청',
    description: '결과가 마음에 들지 않으면 의도를 전달해 최대 3회까지 다시 생성할 수 있습니다.',
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
    title: '면접이 코앞이라면',
    description: 'D-Day 카운트다운과 함께 핵심 질문에 집중하세요. AI가 매 연습마다 성장을 추적해 자신감을 높여드립니다.',
    emoji: '💼',
    highlight: true,
  },
  {
    title: '중요한 발표가 있다면',
    description: '프레젠테이션 스크립트를 더 명확하고 설득력 있게 다듬으세요. 이전 연습 기록을 바탕으로 개선점을 제안합니다.',
    emoji: '🎤',
  },
  {
    title: '말하기 실력을 키우고 싶다면',
    description: '일상적인 스피치 연습으로 꾸준히 실력을 쌓으세요. AI가 성장 패턴을 분석해 맞춤 코칭을 제공합니다.',
    emoji: '🎙️',
  },
];

// 현실적 기대효과
const expectedBenefits = [
  {
    title: '객관적인 피드백',
    problem: '친구나 가족에게 피드백을 부탁하면 예의상 "괜찮아"라는 말만 듣기 쉽습니다.',
    solution: 'AI는 감정 없이 솔직하게 개선점을 짚어줍니다. 실제로 뭐가 부족한지 알 수 있어요.',
    icon: '🎯',
  },
  {
    title: '내 상황에 맞는 질문',
    problem: '인터넷 "면접 예상 질문"은 범용적이라 내 상황과 맞지 않습니다.',
    solution: '이력서/발표자료를 분석해 "이 프로젝트에서 가장 어려웠던 점은?" 같은 맞춤 질문을 생성합니다.',
    icon: '📋',
  },
  {
    title: '컨텍스트 기반 답변 분석',
    problem: '일반 분석은 "구체성이 부족해요"라는 추상적 피드백만 줍니다.',
    solution: '내 이력서를 알기에 "OO 프로젝트의 성과 수치를 언급하면 더 설득력 있어요"처럼 맞춤 조언을 제공합니다.',
    icon: '🔍',
  },
  {
    title: '"나도 할 수 있다"는 자신감',
    problem: '다른 사람의 발표를 보면 "저 사람이니까 가능하지"라고 생각하기 쉽습니다.',
    solution: '내 목소리로 개선된 버전을 들으면 "나도 이렇게 말할 수 있구나"를 직접 체감합니다.',
    icon: '💪',
  },
  {
    title: '막연한 불안 → 구체적 준비',
    problem: '면접 전날, "잘할 수 있을까?" 막연한 걱정만 반복됩니다.',
    solution: '"전달력은 좋으니 내용 구체성만 보완하면 돼"처럼 명확한 액션 아이템을 얻습니다.',
    icon: '✅',
  },
  {
    title: '성장의 연속성',
    problem: '다른 앱들은 매번 처음부터 시작. 어제 받은 피드백을 기억 못 합니다.',
    solution: 'AI가 이전 연습을 기억하고 "저번보다 속도가 좋아졌어요"처럼 성장을 인정해줍니다.',
    icon: '🔄',
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
                { step: '2', title: '음성 → 텍스트 변환', desc: 'AI가 녹음된 음성을 정확한 텍스트로 변환합니다. 말 속도(WPM)와 어조도 함께 분석됩니다.' },
                { step: '3', title: '발화 분석 및 개선', desc: '문장 구조, 말 속도, 필러워드(어, 음...) 등을 분석하고 더 명확한 버전을 제안합니다. 개선된 버전을 먼저 보여드려 학습 효과를 높입니다.' },
                { step: '4', title: '내 목소리로 합성', desc: '개선된 텍스트를 나와 같은 목소리로 합성해 들어볼 수 있습니다. (회원가입 및 본인인증 필요)' },
                { step: '5', title: '맞춤 재요청', desc: '결과가 마음에 들지 않으면 의도를 전달해 최대 3회까지 다시 생성할 수 있습니다. AI가 이전 피드백을 기억해 점점 더 나은 결과를 제안합니다.' },
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
                <Card
                  key={index}
                  className={`p-6 border-none text-center hover:shadow-lg hover:-translate-y-1 transition-all ${
                    'highlight' in useCase && useCase.highlight
                      ? 'bg-coral-light/30 border-2 border-coral/20 ring-2 ring-coral/10'
                      : 'bg-cream'
                  }`}
                >
                  <div className="text-4xl mb-4">{useCase.emoji}</div>
                  {'highlight' in useCase && useCase.highlight && (
                    <span className="inline-block px-2 py-1 bg-coral text-white text-xs font-medium rounded-full mb-2">
                      추천
                    </span>
                  )}
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

        {/* Expected Benefits - 현실적 기대효과 */}
        <section className="py-20 px-6 bg-cream">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-charcoal text-center mb-4">
              실제로 어떤 변화가 있을까요?
            </h2>
            <p className="text-gray-warm text-center mb-12">
              VoiceUp 사용 전/후의 현실적인 차이를 비교해보세요.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {expectedBenefits.map((benefit, index) => (
                <Card key={index} className="p-6 bg-warm-white border-none hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{benefit.icon}</span>
                    <h3 className="text-lg font-semibold text-charcoal">{benefit.title}</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-coral-light/20 rounded-lg">
                      <p className="text-xs font-medium text-coral mb-1">😣 기존 방식</p>
                      <p className="text-sm text-gray-warm">{benefit.problem}</p>
                    </div>
                    <div className="p-3 bg-teal-light/30 rounded-lg">
                      <p className="text-xs font-medium text-teal mb-1">✨ VoiceUp 사용 시</p>
                      <p className="text-sm text-charcoal">{benefit.solution}</p>
                    </div>
                  </div>
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
