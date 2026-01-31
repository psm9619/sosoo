import { Header, Footer } from '@/components/layout';
import { Card } from '@/components/ui/card';

export default function DataPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <article className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-charcoal mb-2">음성 데이터 정책</h1>
            <p className="text-gray-warm mb-8">최종 수정일: 2025년 1월 31일</p>

            <p className="text-lg text-gray-warm mb-12 leading-relaxed">
              VoiceUp은 이용자의 음성 데이터를 소중히 다룹니다. 이 문서는 음성 데이터가 어떻게 처리되고 보관되는지 명확하게 설명합니다.
            </p>

            {/* Data Flow Diagram */}
            <Card className="p-8 bg-warm-white border-none mb-12">
              <h2 className="text-xl font-semibold text-charcoal mb-6 text-center">데이터 처리 흐름</h2>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
                <div className="flex-1 p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-light/50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
                      <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor" />
                      <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" fill="currentColor" />
                    </svg>
                  </div>
                  <p className="font-medium text-charcoal">녹음</p>
                  <p className="text-sm text-gray-warm">암호화 전송</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-soft hidden md:block">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-light/50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" />
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" />
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="font-medium text-charcoal">AI 분석</p>
                  <p className="text-sm text-gray-warm">서버 내 처리</p>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-soft hidden md:block">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 p-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-teal-light/50 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal">
                      <path d="M9 18V5L21 3V16" stroke="currentColor" strokeWidth="2" />
                      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <p className="font-medium text-charcoal">결과 제공</p>
                  <p className="text-sm text-gray-warm">암호화 저장</p>
                </div>
              </div>
            </Card>

            {/* Retention Policy by User Type */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-charcoal mb-6">이용자 유형별 데이터 보관 정책</h2>

              <div className="space-y-4">
                {/* Guest */}
                <Card className="p-6 bg-coral-light/20 border border-coral/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal mb-2">비회원 (게스트)</h3>
                      <ul className="text-sm text-gray-warm space-y-1">
                        <li>• 음성 파일: <strong className="text-coral">24시간 후 자동 삭제</strong></li>
                        <li>• 분석 결과: <strong className="text-coral">24시간 후 자동 삭제</strong></li>
                        <li>• 세션 데이터: 브라우저 종료 시 삭제</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Member without consent */}
                <Card className="p-6 bg-secondary/50 border-none">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🔐</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal mb-2">회원 (기본)</h3>
                      <ul className="text-sm text-gray-warm space-y-1">
                        <li>• 음성 파일: <strong>24시간 후 자동 삭제</strong></li>
                        <li>• 분석 결과 텍스트: <strong className="text-teal">영구 보관</strong> (삭제 요청 시까지)</li>
                        <li>• 합성 음성: <strong className="text-teal">영구 보관</strong> (삭제 요청 시까지)</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Member with consent */}
                <Card className="p-6 bg-teal-light/20 border border-teal/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-light/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-charcoal mb-2">회원 (데이터 보관 동의)</h3>
                      <ul className="text-sm text-gray-warm space-y-1">
                        <li>• 음성 파일: <strong className="text-teal">영구 보관</strong> (삭제 요청 시까지)</li>
                        <li>• 분석 결과 텍스트: <strong className="text-teal">영구 보관</strong></li>
                        <li>• 합성 음성: <strong className="text-teal">영구 보관</strong></li>
                        <li>• 마이페이지에서 개별 삭제 가능</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* AI Learning */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-charcoal mb-6">AI 학습 활용</h2>
              <Card className="p-6 bg-warm-white border-none">
                <p className="text-gray-warm leading-relaxed mb-4">
                  이용자의 음성 데이터는 <strong>별도 동의 없이 AI 학습에 사용되지 않습니다.</strong>
                </p>
                <p className="text-gray-warm leading-relaxed mb-4">
                  마이페이지 설정에서 "AI 학습 동의"를 활성화한 경우에만, 익명화된 형태로 서비스 품질 개선을 위한 AI 모델 학습에 활용될 수 있습니다.
                </p>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-gray-warm">
                    <strong>익명화 처리:</strong> AI 학습에 활용되는 데이터는 개인을 식별할 수 없도록 처리됩니다.
                    이메일, IP 주소 등 식별 정보는 제거되며, 음성의 고유한 특성(음색, 억양 등)도 변환 처리됩니다.
                  </p>
                </div>
              </Card>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-charcoal mb-6">데이터 보안</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-3">전송 보안</h3>
                  <ul className="text-sm text-gray-warm space-y-2">
                    <li className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      TLS 1.3 암호화 통신
                    </li>
                    <li className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      HTTPS 전용 접속
                    </li>
                  </ul>
                </Card>
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-3">저장 보안</h3>
                  <ul className="text-sm text-gray-warm space-y-2">
                    <li className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      AES-256 암호화 저장
                    </li>
                    <li className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                      접근 권한 분리
                    </li>
                  </ul>
                </Card>
              </div>
            </section>

            {/* User Rights */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-charcoal mb-6">이용자 권리</h2>
              <Card className="p-6 bg-warm-white border-none">
                <p className="text-gray-warm leading-relaxed mb-4">
                  이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
                </p>
                <ul className="text-gray-warm space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal text-white text-sm flex items-center justify-center flex-shrink-0">1</span>
                    <span><strong>데이터 열람:</strong> 저장된 음성 및 분석 결과를 마이페이지에서 확인</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal text-white text-sm flex items-center justify-center flex-shrink-0">2</span>
                    <span><strong>개별 삭제:</strong> 특정 프로젝트의 모든 데이터를 즉시 삭제</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal text-white text-sm flex items-center justify-center flex-shrink-0">3</span>
                    <span><strong>전체 삭제:</strong> 계정 삭제 시 모든 데이터 영구 삭제</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal text-white text-sm flex items-center justify-center flex-shrink-0">4</span>
                    <span><strong>동의 철회:</strong> AI 학습 동의를 언제든 철회 가능</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal text-white text-sm flex items-center justify-center flex-shrink-0">5</span>
                    <span><strong>데이터 이동:</strong> 저장된 데이터를 다운로드 받을 수 있음</span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-charcoal mb-6">문의</h2>
              <Card className="p-6 bg-teal-light/20 border border-teal/20">
                <p className="text-gray-warm mb-4">
                  데이터 정책에 관한 문의사항이 있으시면 아래로 연락해주세요.
                </p>
                <p className="text-charcoal">
                  <strong>이메일:</strong> privacy@sosoo.io
                </p>
              </Card>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
