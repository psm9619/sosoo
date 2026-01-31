import { Header, Footer } from '@/components/layout';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <article className="py-16 px-6">
          <div className="max-w-3xl mx-auto prose prose-stone">
            <h1 className="text-3xl font-bold text-charcoal mb-2">이용약관</h1>
            <p className="text-gray-warm mb-8">최종 수정일: 2025년 1월 31일</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제1조 (목적)</h2>
              <p className="text-gray-warm leading-relaxed">
                이 약관은 Sosoo(이하 "회사")가 제공하는 VoiceUp 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제2조 (정의)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>"서비스"란 회사가 제공하는 AI 기반 발화 코칭 서비스를 말합니다.</li>
                <li>"이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li>"회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                <li>"비회원(게스트)"이란 회원에 가입하지 않고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제3조 (약관의 효력 및 변경)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
                <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
                <li>회사가 약관을 변경할 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제4조 (서비스의 제공)</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                회사는 다음과 같은 서비스를 제공합니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li>음성 녹음 및 텍스트 변환 서비스</li>
                <li>AI 기반 발화 분석 및 개선 제안 서비스</li>
                <li>개선된 발화의 음성 합성 서비스</li>
                <li>발화 연습 이력 관리 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제5조 (서비스 이용)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.</li>
                <li>비회원(게스트)은 제한된 기능의 서비스를 이용할 수 있으며, 데이터는 24시간 후 자동 삭제됩니다.</li>
                <li>회사는 서비스 개선, 시스템 점검 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제6조 (이용자의 의무)</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                이용자는 다음 행위를 하여서는 안 됩니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 음성이나 기타 공서양속에 반하는 내용의 녹음</li>
                <li>불법적인 목적을 위한 서비스 이용</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제7조 (저작권의 귀속)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>서비스에 의해 생성된 콘텐츠(개선된 텍스트, 합성 음성 등)에 대한 저작권은 이용자에게 귀속됩니다.</li>
                <li>이용자가 녹음한 원본 음성에 대한 권리는 이용자에게 있습니다.</li>
                <li>서비스의 UI, 기술, 알고리즘 등에 대한 지적재산권은 회사에 귀속됩니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제8조 (면책조항)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                <li>AI가 생성한 개선 제안은 참고용이며, 최종 사용 여부는 이용자의 판단에 따릅니다.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">제9조 (분쟁해결)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
                <li>회사와 이용자 간에 발생한 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-charcoal mb-4">제10조 (준거법 및 관할법원)</h2>
              <ul className="list-decimal pl-6 text-gray-warm space-y-2">
                <li>이 약관의 해석 및 회사와 이용자 간의 분쟁에 대하여는 대한민국의 법을 적용합니다.</li>
                <li>서비스 이용 중 발생한 분쟁에 대한 소송은 회사의 본사 소재지를 관할하는 법원을 합의 관할로 합니다.</li>
              </ul>
            </section>

            <div className="mt-12 p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-gray-warm">
                <strong>부칙</strong><br />
                이 약관은 2025년 1월 31일부터 시행됩니다.
              </p>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
