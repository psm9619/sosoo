import { Header, Footer } from '@/components/layout';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <article className="py-16 px-6">
          <div className="max-w-3xl mx-auto prose prose-stone">
            <h1 className="text-3xl font-bold text-charcoal mb-2">개인정보처리방침</h1>
            <p className="text-gray-warm mb-8">최종 수정일: 2025년 1월 31일</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">1. 개인정보의 수집 및 이용 목적</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                VoiceUp(이하 "서비스")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li>회원 가입 및 관리: 회원제 서비스 이용에 따른 본인확인, 서비스 부정이용 방지</li>
                <li>서비스 제공: 음성 녹음 분석 및 개선된 발화 제공, 콘텐츠 제공</li>
                <li>서비스 품질 관리: 시스템 안정성 확보 및 오류 대응</li>
              </ul>
              <p className="text-gray-warm leading-relaxed mt-4 p-3 bg-teal-light/20 rounded-lg border border-teal/20">
                <strong className="text-charcoal">참고:</strong> 이용자의 음성 데이터는 AI 모델 학습에 절대 사용되지 않습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">2. 수집하는 개인정보 항목</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                서비스는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li><strong>필수 항목:</strong> 이메일 주소, 비밀번호 (소셜 로그인 시 해당 플랫폼 제공 정보)</li>
                <li><strong>서비스 이용 시:</strong> 음성 녹음 파일, 변환된 텍스트, 분석 결과</li>
                <li><strong>자동 수집:</strong> 접속 로그, 쿠키, 접속 IP, 서비스 이용 기록</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li><strong>비회원(게스트):</strong> 음성 데이터 24시간 후 자동 삭제</li>
                <li><strong>회원(동의 없음):</strong> 음성 데이터 24시간 후 자동 삭제, 분석 결과 텍스트만 보관</li>
                <li><strong>회원(동의 있음):</strong> 회원 탈퇴 또는 삭제 요청 시까지 보관</li>
                <li><strong>회원 탈퇴 시:</strong> 즉시 삭제 (단, 법령에 따라 보존 필요 시 해당 기간 보관)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">4. 개인정보의 제3자 제공</h2>
              <p className="text-gray-warm leading-relaxed">
                서비스는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2 mt-4">
                <li>정보주체로부터 별도의 동의를 받은 경우</li>
                <li>법률에 특별한 규정이 있는 경우</li>
                <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">5. 개인정보의 파기</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
              </p>
              <p className="text-gray-warm leading-relaxed mb-4">
                전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
              </p>
              <div className="p-3 bg-teal-light/20 rounded-lg border border-teal/20">
                <p className="text-sm text-gray-warm">
                  <strong className="text-charcoal">즉시 삭제:</strong> 이용자가 마이페이지에서 데이터 삭제를 요청하면 화면에서 즉시 삭제되며, 서버에서도 지체 없이 영구 삭제 처리됩니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
              <p className="text-gray-warm leading-relaxed mb-4">
                정보주체는 서비스에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
              </p>
              <ul className="list-disc pl-6 text-gray-warm space-y-2">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
              <p className="text-gray-warm leading-relaxed mt-4">
                위 권리 행사는 마이페이지 또는 개인정보 보호책임자에게 서면, 전자우편 등을 통하여 하실 수 있으며, 서비스는 이에 대해 지체없이 조치하겠습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-charcoal mb-4">7. 개인정보 보호책임자</h2>
              <p className="text-gray-warm leading-relaxed">
                서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
              </p>
              <div className="bg-secondary/50 p-4 rounded-lg mt-4">
                <p className="text-charcoal"><strong>개인정보 보호책임자</strong></p>
                <p className="text-gray-warm">성명: Sosoo 개인정보보호팀</p>
                <p className="text-gray-warm">이메일: privacy@sosoo.io</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-charcoal mb-4">8. 개인정보처리방침 변경</h2>
              <p className="text-gray-warm leading-relaxed">
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
